"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowRight, ChevronDown } from "react-feather";
import Button from "@/components/Button";
import StickyActions from "@/components/StickyActions";
import type { MoveArea, MoveBranch, MoveInput } from "@/hooks/useBorrowerMove";

interface MoveFormValues {
  branch: string;
  area: string;
  subArea: string;
  reason: string;
}

interface MoveFormProps {
  destinations: MoveBranch[];
  fetchAreas: (branchSubId: number, signal?: AbortSignal) => Promise<MoveArea[]>;
  /** Resolves to null when done, or the sentence saying why not. */
  onSubmit: (input: MoveInput) => Promise<string | null>;
  /** What the button does: Move (in place) or Copy (a buyout, a new borrower there). */
  verb: "Move" | "Copy";
  /** Told the chosen branch, so the slip above can fill in its "Moving to" end. */
  onTargetChange: (branch: MoveBranch | null) => void;
  cancelHref: string;
}

// 500: the server's cap on a reason.
const REASON_MAX = 500;

const FIELD =
  "h-12 w-full appearance-none rounded-lg border border-field bg-white pl-4 pr-10 text-sm text-black transition-colors " +
  "hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-whiten " +
  "dark:border-field-dark dark:bg-form-input dark:text-white lg:h-11";
const LABEL = "mb-1.5 block text-sm font-semibold text-black dark:text-white";
const ERROR = "mt-1.5 text-sm text-danger";

/**
 * A native select (the phone's own picker), with the chevron the appearance-none removes. Forwards
 * its ref: react-hook-form's register() reads the value through it.
 */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ invalid, className = "", children, ...rest }, ref) => (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={`${FIELD} ${invalid ? "border-danger" : ""} ${className}`} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body" />
    </div>
  ),
);
Select.displayName = "Select";

/** Destinations grouped by funding company (FA, FB, FC, FD), each group in the server's order. */
const byGroup = (branches: MoveBranch[]): Array<[string, MoveBranch[]]> => {
  const groups = new Map<string, MoveBranch[]>();
  branches.forEach((b) => {
    const key = b.group_name ?? "Other";
    groups.set(key, [...(groups.get(key) ?? []), b]);
  });
  return Array.from(groups.entries());
};

/** The areas of the chosen branch, fetched when it changes; a stale answer is dropped. */
const useAreas = (branchId: number | null, fetchAreas: MoveFormProps["fetchAreas"]) => {
  const [areas, setAreas] = useState<MoveArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAreas([]);
    setError(null);
    if (branchId === null) return;
    const controller = new AbortController();
    setLoading(true);
    fetchAreas(branchId, controller.signal)
      .then(setAreas)
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("[MoveForm] the areas did not load", { branchId, e });
        setError(e instanceof Error ? e.message : "The areas did not load. Choose the branch again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [branchId, fetchAreas]);

  return { areas, loading, error };
};

/**
 * Where to, the area and sub-area there (an area belongs to one branch), and why. The move button
 * names the branch ("Move to FC Balibago"), so what it does is said on it; Cancel goes back to the
 * borrower and changes nothing.
 */
const MoveForm: React.FC<MoveFormProps> = ({ destinations, fetchAreas, onSubmit, verb, onTargetChange, cancelHref }) => {
  const id = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState } = useForm<MoveFormValues>({
    defaultValues: { branch: "", area: "", subArea: "", reason: "" },
  });
  const { errors, isSubmitting, isDirty } = formState;

  const branchId = watch("branch") ? Number(watch("branch")) : null;
  const target = useMemo(() => destinations.find((d) => d.id === branchId) ?? null, [destinations, branchId]);
  const { areas, loading: areasLoading, error: areasError } = useAreas(branchId, fetchAreas);
  const area = areas.find((a) => a.id === Number(watch("area"))) ?? null;
  const reasonLength = watch("reason").length;

  useEffect(() => onTargetChange(target), [target, onTargetChange]);
  // A new branch, a new area list: the old choice is never sent with it.
  useEffect(() => setValue("area", ""), [branchId, setValue]);
  useEffect(() => setValue("subArea", ""), [area?.id, setValue]);

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const refusal = await onSubmit({
      branch_sub_id: Number(values.branch),
      area_id: Number(values.area),
      sub_area_id: values.subArea ? Number(values.subArea) : null,
      reason: values.reason,
    });
    if (refusal) setServerError(refusal);
  });

  return (
    <form onSubmit={submit} noValidate aria-describedby={serverError ? `${id}-server` : undefined}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-branch`} className={LABEL}>{verb} to</label>
          <Select id={`${id}-branch`} invalid={Boolean(errors.branch)} {...register("branch", { required: "Choose the branch that will fund the release." })}>
            <option value="">Choose a branch</option>
            {byGroup(destinations).map(([group, branches]) => (
              <optgroup key={group} label={group}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </optgroup>
            ))}
          </Select>
          {errors.branch && <p className={ERROR}>{errors.branch.message}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-area`} className={LABEL}>Area in the new branch</label>
          <Select
            id={`${id}-area`}
            disabled={branchId === null || areasLoading}
            invalid={Boolean(errors.area)}
            {...register("area", { required: "Choose an area of the new branch." })}
          >
            <option value="">{branchId === null ? "Choose a branch first" : areasLoading ? "Loading areas…" : "Choose an area"}</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          {(errors.area || areasError) && <p className={ERROR}>{areasError ?? errors.area?.message}</p>}
          {branchId !== null && !areasLoading && !areasError && areas.length === 0 && (
            <p className={ERROR}>This branch has no areas yet. Ask an admin to add one under Areas.</p>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-sub`} className={LABEL}>Sub-area</label>
          <Select
            id={`${id}-sub`}
            disabled={!area || area.sub_areas.length === 0}
            invalid={Boolean(errors.subArea)}
            {...register("subArea", { validate: (v) => !area || area.sub_areas.length === 0 || v !== "" || "Choose a sub-area of that area." })}
          >
            <option value="">{area && area.sub_areas.length === 0 ? "This area has none" : "Choose a sub-area"}</option>
            {area?.sub_areas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {errors.subArea && <p className={ERROR}>{errors.subArea.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${id}-reason`} className={LABEL}>{verb === "Copy" ? "Why is the borrower being copied?" : "Why is the borrower moving?"}</label>
          <textarea
            id={`${id}-reason`}
            rows={3}
            maxLength={REASON_MAX}
            placeholder="For example: FC will fund the release"
            aria-invalid={Boolean(errors.reason) || undefined}
            aria-describedby={`${id}-reason-count`}
            className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-black transition-colors placeholder:text-body/70 hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-form-input dark:text-white ${errors.reason ? "border-danger" : "border-field dark:border-field-dark"}`}
            {...register("reason", { validate: (v) => v.trim() !== "" || "Write why the borrower is moving." })}
          />
          <div className="mt-1 flex justify-between gap-3">
            {errors.reason ? <p className={ERROR}>{errors.reason.message}</p> : <span />}
            <span id={`${id}-reason-count`} className="mt-1.5 shrink-0 text-xs text-body dark:text-bodydark">
              {reasonLength}/{REASON_MAX}
            </span>
          </div>
        </div>
      </div>

      {serverError && (
        <p id={`${id}-server`} role="alert" className="mt-4 rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          {serverError}
        </p>
      )}

      <StickyActions dirty={isDirty && !isSubmitting}>
        <Link
          href={cancelHref}
          className="inline-flex min-h-12 items-center justify-center rounded border border-field bg-white px-4 text-sm font-semibold text-black hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-boxdark dark:text-white lg:min-h-10"
        >
          Cancel
        </Link>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (verb === "Copy" ? "Copying…" : "Moving…") : target ? `${verb} to ${target.name}` : `${verb} borrower`}
          {!isSubmitting && <ArrowRight aria-hidden="true" size={16} />}
        </Button>
      </StickyActions>
    </form>
  );
};

export default MoveForm;
