"use client";
import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, RotateCw } from "react-feather";
import useLogin from "@/hooks/useLogin";
import withAuth from "@/hoc/withAuth";
import { Card } from "@/components/Card";
import Button from "@/components/Button";

const INPUT =
  "h-12 w-full border border-field bg-white px-4 text-sm text-black placeholder:text-body focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 lg:h-10 dark:border-field-dark dark:bg-form-input dark:text-white aria-[invalid=true]:border-danger";
const LABEL = "mb-1.5 block text-sm font-semibold text-black dark:text-white";

/**
 * Sign-in form. Failures are said inline in an aria-live region (a toast times out and covered
 * the card's corner). On failure the email stays, only the password clears (GOV.UK) and focus
 * moves to it. The message never says which of the two was wrong.
 */
const LoginForm = () => {
  const { email, setEmail, password, setPassword, submit, loginLoading } = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await submit({ email, password });
    // On success the hook redirects, so the form simply stays as it is.
    if (!result.success) {
      setError(result.error ?? "Could not sign in. Please try again.");
      setPassword("");
    }
  };

  // Back to the password once the form is enabled again: focusing it while it is
  // still disabled (loginLoading clears in the hook's finally) silently does nothing.
  useEffect(() => {
    if (error && !loginLoading) passwordRef.current?.focus();
  }, [error, loginLoading]);

  const trackCaps = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  const invalid = error ? true : undefined;
  const describedBy = [error ? "login-error" : "", capsLock ? "login-caps" : ""].filter(Boolean).join(" ") || undefined;

  return (
    <Card as="div" className="w-full max-w-[520px] p-6 sm:p-10">
      <h1 className="font-display text-3xl text-black dark:text-white">Sign in</h1>
      <p className="mt-2 text-sm text-body dark:text-bodydark">
        Use the email and password your administrator gave you.
      </p>

      <form onSubmit={handleSubmit} aria-busy={loginLoading} className="mt-8">
        <div className="mb-5">
          <label htmlFor="login-email" className={LABEL}>
            Email
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            autoComplete="username"
            autoFocus
            required
            value={email}
            disabled={loginLoading}
            aria-invalid={invalid}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
          />
        </div>

        <div className="mb-5">
          <label htmlFor="login-password" className={LABEL}>
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              type={revealed ? "text" : "password"}
              id="login-password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={loginLoading}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={trackCaps}
              onKeyDown={trackCaps}
              className={`${INPUT} pr-24`}
            />
            <button
              type="button"
              onClick={() => setRevealed((on) => !on)}
              disabled={loginLoading}
              aria-pressed={revealed}
              aria-controls="login-password"
              className="absolute inset-y-0 right-0 inline-flex min-w-12 items-center gap-1.5 px-3 text-sm font-semibold text-primary hover:text-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 dark:text-olive-300"
            >
              {revealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              <span>{revealed ? "Hide" : "Show"}</span>
            </button>
          </div>
          {capsLock && (
            <p id="login-caps" className="mt-1.5 text-xs font-semibold text-black dark:text-white">
              Caps Lock is on
            </p>
          )}
        </div>

        <div aria-live="polite" data-testid="login-live" className="empty:hidden">
          {error && (
            <div
              id="login-error"
              className="mb-5 flex gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-black dark:border-danger/60 dark:bg-danger/20 dark:text-white"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger dark:text-[#F2988E]" aria-hidden="true" />
              <p className="min-w-0 flex-1">{error}</p>
            </div>
          )}
        </div>

        <Button type="submit" variant="primary" disabled={loginLoading} className="w-full">
          {loginLoading && <RotateCw size={16} className="animate-spin" aria-hidden="true" />}
          <span>{loginLoading ? "Signing in…" : "Sign in"}</span>
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-body dark:text-bodydark">
        Forgot your password? Ask your branch administrator.
      </p>
    </Card>
  );
};

export default withAuth(LoginForm);
