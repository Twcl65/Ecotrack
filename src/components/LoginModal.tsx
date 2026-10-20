"use client";

import { Eye, EyeOff, Lock, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Logo from "./Logo";
import { resolveLoginEmail } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBackToRoles?: () => void;
};

export default function LoginModal({
  isOpen,
  onClose,
  onBackToRoles,
}: LoginModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const email = await resolveLoginEmail(username);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (!rememberMe) {
      // Session persists in cookies by default; rememberMe is UI-only for now.
    }

    onClose();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 m-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:m-8">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <p className="text-xs font-semibold tracking-widest text-gray-400">
            ADMINISTRATOR LOGIN
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close login modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <Logo size="sm" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Administrator Login
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Please login to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                />
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-eco-primary focus:ring-2 focus:ring-eco-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-eco-primary focus:ring-eco-primary"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm font-medium text-eco-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-eco-primary py-3 text-sm font-semibold text-white transition hover:bg-eco-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToRoles ?? onClose}
            className="mt-4 text-sm text-gray-500 transition hover:text-eco-primary"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
}
