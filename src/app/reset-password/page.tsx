"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        setCheckingSession(false);
        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.session) {
          setHasSession(true);
        } else {
          setMessage("This password reset link is invalid or has expired. Request a new one.");
        }
      } catch (sessionError) {
        if (!active) return;
        setCheckingSession(false);
        setMessage(
          sessionError instanceof Error
            ? sessionError.message
            : "Could not verify the password reset link."
        );
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }

      setCompleted(true);
    } catch (updateError) {
      setMessage(
        updateError instanceof Error
          ? updateError.message
          : "Could not update your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold tracking-widest text-eco-primary">
          ECOTRACK ADMIN
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {completed ? "Password updated" : "Choose a new password"}
        </h1>

        {checkingSession ? (
          <p className="mt-3 text-sm text-gray-600">Verifying your reset link…</p>
        ) : completed ? (
          <>
            <p className="mt-3 text-sm text-gray-600">
              Your password has been changed. Continue to the admin dashboard.
            </p>
            <button
              type="button"
              onClick={() => {
                router.replace("/dashboard");
                router.refresh();
              }}
              className="mt-6 w-full rounded-lg bg-eco-primary px-4 py-3 text-sm font-semibold text-white hover:bg-eco-dark"
            >
              Continue to dashboard
            </button>
          </>
        ) : hasSession ? (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Enter and confirm the new password for your administrator account.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                />
              </div>
              {message && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-eco-primary px-4 py-3 text-sm font-semibold text-white hover:bg-eco-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating password…" : "Update password"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p role="alert" className="mt-3 text-sm text-red-600">
              {message ?? "Could not verify your password reset link."}
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Return to the login page and request a new reset link.
            </p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-6 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Return to ECOTRACK
            </button>
          </>
        )}
      </section>
    </main>
  );
}
