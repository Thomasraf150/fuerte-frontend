import { MIN_BUSINESS_DATE, maxBusinessDate } from '@/constants/dateBounds';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CollectionFormValues } from '@/utils/DataTypes';
import { formatToTwoDecimalPlaces, formatNumberComma } from '@/utils/helper';
import { collectionSplit, penaltyAllowedNow, penaltyAboveAllowed } from '@/utils/paymentSplit';
import { Save, RotateCw } from 'react-feather';
import PesoSign from '@/components/PesoSign';
import moment from 'moment';
import FormInput from '@/components/FormInput';
import Button from '@/components/Button';
import { Card, CardHeader, CardBody } from '@/components/Card';

interface OMProps {
  selectedMoSched: any;
  selectedUdiSched: any;
  setSelectedMoSched: (data: any) => void;
  onSubmitCollectionPayment: (d: CollectionFormValues, l: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  paymentLoading: boolean;
  /** Collect a paid installment's penalty charged at the last due: Collection = Penalty = this amount. */
  prefillPenalty?: string;
}

const PaymentCollectionForm: React.FC<OMProps> = ({ selectedMoSched, setSelectedMoSched, selectedUdiSched, onSubmitCollectionPayment, paymentLoading, prefillPenalty }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CollectionFormValues>();

  const handleDecimal = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    const numericValue = value.replace(/,/g, '');
    const formattedValue = formatToTwoDecimalPlaces(numericValue);

    // AP Refund (net above the remaining due), UA/SP (shortfall) and pro-rata Interest, in exact
    // decimals (utils/paymentSplit): the server books these as sent. The remaining UDI is
    // floored at zero there, because the server refuses a negative interest box (2026-10-29).
    const split = collectionSplit({
      collection: type === 'collection' ? numericValue : watch('collection'),
      bankCharge: type === 'bank_charge' ? numericValue : watch('bank_charge'),
      penalty: type === 'penalty' ? numericValue : watch('penalty'),
      remainingDue: selectedMoSched?.amount,
      remainingUdi: selectedUdiSched?.amount,
    });
    setValue('ap_refund', split.ap_refund);
    setValue('ua_sp', split.ua_sp);
    setValue('interest', split.interest);

    setValue(type, formattedValue);
  };

  const handleDate = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, type: any) => {
    const { value } = event.target;
    setValue(type, value);
  };

  // The cash pays the installment first (Heidi 2026-11-23): only what is left of it can be penalty
  // now; the rest of the penalty is charged at the loan's last due.
  const penaltyMax = penaltyAllowedNow({
    collection: watch('collection'),
    bankCharge: watch('bank_charge'),
    remainingDue: selectedMoSched?.amount,
  });
  const penaltyTooBig = penaltyAboveAllowed(watch('penalty'), penaltyMax);

  const onSubmit = async (data: CollectionFormValues) => {
    if (penaltyTooBig) {
      return;
    }

    const result = await onSubmitCollectionPayment(data, selectedMoSched?.loan_id) as { success: boolean; error?: string; data?: any };

    // Only close form on successful submission
    if (result.success) {
      setSelectedMoSched('');
    }
    // Form stays open on errors for user to fix and retry
  }

  useEffect(() => {
    setValue('loan_schedule_id', selectedMoSched?.id);
    setValue('loan_udi_schedule_id', selectedUdiSched?.id);
  }, [selectedMoSched, selectedUdiSched]);

  // "Collect penalty" on a paid installment: the cash is the penalty and all of it is penalty, so the
  // installment stays paid (interest 0.00, no UA/SP) and the server books it as penalty income.
  useEffect(() => {
    if (!prefillPenalty) {
      return;
    }
    const split = collectionSplit({
      collection: prefillPenalty, bankCharge: '0', penalty: prefillPenalty,
      remainingDue: selectedMoSched?.amount, remainingUdi: selectedUdiSched?.amount,
    });
    setValue('bank_charge', '0.00');
    setValue('collection', prefillPenalty);
    setValue('penalty', prefillPenalty);
    setValue('ap_refund', split.ap_refund);
    setValue('ua_sp', split.ua_sp);
    setValue('interest', split.interest);
  }, [prefillPenalty, selectedMoSched, selectedUdiSched, setValue]);

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader title="Process Payment" />
          <CardBody>
            <div className="space-y-1">

            {/* Due Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Due Date:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {moment(selectedMoSched?.due_date).format('YYYY-MM-DD')}
              </div>
            </div>

            {/* Remaining Due */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Remaining Due:
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white text-center 2xl:text-left text-xs sm:text-sm">
                {formatNumberComma(Number(selectedMoSched?.amount))}
              </div>
            </div>

            {/* Bank Charges */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Bank Charges
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="bank_charge"
                  type="text"
                  icon={PesoSign}
                  register={register('bank_charge', { required: "Bank Charge is required!" })}
                  value={prefillPenalty ? '0.00' : undefined}
                  error={errors.bank_charge?.message}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                  onChange={(e) => handleDecimal(e, 'bank_charge')}
                />
              </div>
            </div>

            {/* Collection */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Collection
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="collection"
                  type="text"
                  icon={PesoSign}
                  register={register('collection', { required: "Collection is required!" })}
                  value={prefillPenalty}
                  error={errors.collection?.message}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                  onChange={(e) => handleDecimal(e, 'collection')}
                />
              </div>
            </div>

            {/* Interest */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Interest
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-center text-sm text-black placeholder:text-body read-only:bg-whiten focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white dark:read-only:bg-meta-4"
                  type="text"
                  id="udi"
                  placeholder="0.00"
                  readOnly={true}
                  value={`${Number(watch('interest') ?? 0).toFixed(2)}`}
                />
              </div>
            </div>

            {/* Penalty */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Penalty
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="penalty"
                  type="text"
                  icon={PesoSign}
                  register={register('penalty')}
                  value={prefillPenalty}
                  error={penaltyTooBig ? `The cash pays the installment first: at most ₱${formatNumberComma(Number(penaltyMax))} can be penalty now. The rest is charged at the last due.` : undefined}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                  onChange={(e) => handleDecimal(e, 'penalty')}
                />
              </div>
            </div>

            {/* AP Refund */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                AP Refund
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-center text-sm text-black placeholder:text-body read-only:bg-whiten focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white dark:read-only:bg-meta-4"
                  type="text"
                  id="ap_refund"
                  placeholder="0.00"
                  readOnly={true}
                  {...register('ap_refund')}
                />
              </div>
            </div>

            {/* Commission */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Commission
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <FormInput
                  label=""
                  id="commission_fee"
                  type="text"
                  icon={PesoSign}
                  register={register('commission_fee')}
                  placeholder="0.00"
                  formatType="number"
                  className="text-center"
                />
              </div>
            </div>

            {/* UA/SP */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                UA/SP
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-center text-sm text-black placeholder:text-body read-only:bg-whiten focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white dark:read-only:bg-meta-4"
                  type="text"
                  id="ua_sp"
                  placeholder="0.00"
                  readOnly={true}
                  {...register('ua_sp')}
                />
              </div>
            </div>

            {/* Collection Date */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-1 sm:px-4 text-sm font-semibold text-black dark:text-white">
                Collection Date
              </div>
              <div className="2xl:w-3/5 px-2 py-1 sm:px-4 sm:py-2 text-black dark:text-white">
                <input
                  className="h-12 md:h-11 w-full rounded-lg border border-field bg-white px-4 text-center text-sm text-black placeholder:text-body read-only:bg-whiten focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-field-dark dark:bg-form-input dark:text-white dark:read-only:bg-meta-4"
                  type="date"
                  id="collection_date"
                  placeholder="mm/dd/YYYY"
                  // A real gate, not decoration: a native date input commits a
                  // zero-padded partial year on the first year keystroke (0026-01-15,
                  // reported as valid), and with min/max the browser blocks the submit
                  // before any request. This is the Cash Receipts path that produced 43
                  // of the 67 corrupt journal_dates.
                  min={MIN_BUSINESS_DATE}
                  max={maxBusinessDate()}
                  {...register('collection_date', { required: "Collection Date is required!" })}
                  onBlur={(e: any) => { return handleDate(e, 'collection_date'); }}
                />
                {errors.collection_date && (
                  <p className="mt-2 text-sm font-medium text-center" style={{ color: '#DC2626' }}>{errors.collection_date.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center">
              <div className="2xl:w-2/5 px-2 py-2 sm:px-4 sm:py-2"></div>
              <div className="2xl:w-3/5 px-2 py-2 sm:px-4 sm:py-2 text-black dark:text-white">
                <Button
                  variant="primary"
                  className="w-full 2xl:w-auto 2xl:float-right"
                  type="submit"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <RotateCw size={17} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      <span>Pay Now</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
          </CardBody>

        </form>
      </Card>
    </>
  );
};

export default PaymentCollectionForm;