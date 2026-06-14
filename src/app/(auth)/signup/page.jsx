"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
import MoviesPosterWall from "@/app/components/MoviePosterWall";

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

function normalizeRedirectPath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/profile";
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return "/profile";
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) return "/profile";
  return pathname;
}

function passwordInfo(pw) {
  const checks = {
    length: pw.length >= 8,
    maxLength: pw.length <= 72,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const level =
    score <= 1
      ? "Very weak"
      : score === 2
      ? "Weak"
      : score === 3
      ? "Okay"
      : score === 4
      ? "Good"
      : "Strong";

  return {
    checks,
    score,
    level,
    valid: Object.values(checks).every(Boolean),
  };
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState({
    email: "",
    name: "",
    username: "",
    password: "",
  });

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [usernameCheckError, setUsernameCheckError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState("");
  const debounceRef = useRef(null);

  const redirectTarget = useMemo(
    () => normalizeRedirectPath(searchParams?.get("from")),
    [searchParams]
  );

  const loginHref = useMemo(() => {
    if (redirectTarget === "/profile") return "/login";
    return `/login?from=${encodeURIComponent(redirectTarget)}`;
  }, [redirectTarget]);

  const username = user.username.trim().toLowerCase();
  const email = user.email.trim().toLowerCase();
  const name = user.name.trim();
  const pw = passwordInfo(user.password);
  const showPasswordFeedback = submitAttempted || user.password.length > 0;
  const passwordRequirements = useMemo(
    () => [
      { key: "length", label: "Use at least 8 characters.", met: pw.checks.length },
      { key: "maxLength", label: "Keep it at 72 characters or fewer.", met: pw.checks.maxLength },
      { key: "lower", label: "Add at least one lowercase letter.", met: pw.checks.lower },
      { key: "upper", label: "Add at least one uppercase letter.", met: pw.checks.upper },
      { key: "number", label: "Add at least one number.", met: pw.checks.number },
      { key: "symbol", label: "Add at least one symbol.", met: pw.checks.symbol },
    ],
    [pw.checks.length, pw.checks.lower, pw.checks.maxLength, pw.checks.number, pw.checks.symbol, pw.checks.upper]
  );
  const missingPasswordRequirements = passwordRequirements.filter((item) => !item.met);

  useEffect(() => {
    setAvailable(null);
    setUsernameCheckError(false);
    if (!username || !USERNAME_RE.test(username)) {
      setChecking(false);
      clearTimeout(debounceRef.current);
      return;
    }

    setChecking(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/user/check-username?u=${encodeURIComponent(username)}`
        );

        if (!res.ok) {
          setUsernameCheckError(true);
          setAvailable(null);
          return;
        }

        const data = await res.json();
        setAvailable(Boolean(data?.available));
      } catch {
        setUsernameCheckError(true);
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 450);

    return () => clearTimeout(debounceRef.current);
  }, [username]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const usernameValid = USERNAME_RE.test(username);
  const usernameReadyForSubmit =
    usernameValid &&
    !checking &&
    (available === true || usernameCheckError);
  const canSubmit =
    emailValid &&
    name.length > 0 &&
    usernameReadyForSubmit &&
    pw.valid &&
    !submitting;

  const submitDisabledReason = useMemo(() => {
    if (submitting) return "Creating your account...";
    if (!email) return "Enter your email to continue.";
    if (!emailValid) return "Enter a valid email address.";
    if (!name.length) return "Enter your full name.";
    if (!username.length) return "Choose a username.";
    if (!usernameValid) return "Username must be 3-20 chars using a-z, 0-9, _ or .";
    if (checking) return "Checking username availability...";
    if (available === false) return "That username is already taken.";
    if (!pw.valid) return "Fix the password requirements shown above.";
    return null;
  }, [available, checking, email, emailValid, name.length, pw.valid, submitting, username.length, usernameValid]);

  const userSignUp = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError("");

    if (!canSubmit) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        email,
        name,
        username,
        password: user.password,
      };

      const { data } = await axios.post("/api/signup", payload);

      const params = new URLSearchParams();
      params.set("verify_sent", "1");
      params.set("email", email);
      if (redirectTarget !== "/profile") {
        params.set("from", redirectTarget);
      }

      toast.success(
        data?.verificationSent
          ? "Account created. Verify your email to continue."
          : "Account created. Request a verification email on login."
      );
      router.replace(`/login?${params.toString()}`);
    } catch (error) {
      const message =
        error?.response?.data?.error || "Unable to create account right now.";
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const googleSignup = () => {
    setServerError("");
    setSubmitting(true);
    signIn("google", {
      callbackUrl: redirectTarget,
      redirect: true,
    }).catch(() => {
      setSubmitting(false);
      toast.error("Google sign in failed. Please try again.");
    });
  };

  const strengthBar =
    pw.score <= 1
      ? "bg-red-500 w-1/5"
      : pw.score === 2
      ? "bg-orange-500 w-2/5"
      : pw.score === 3
      ? "bg-yellow-500 w-3/5"
      : pw.score === 4
      ? "bg-green-500 w-4/5"
      : "bg-emerald-500 w-full";

  return (
    <div className="pt-20 pb-20 min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#dbb304] via-[#a99801] to-yellow-600 text-white">
      <MoviesPosterWall />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_260px_at_85%_-10%,rgba(255,200,100,.25),transparent),radial-gradient(600px_260px_at_0%_110%,rgba(70,120,255,.25),transparent)] z-10" />

      <div className="min-h-screen flex items-center justify-center px-4 relative z-20">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_50px_rgba(0,0,0,.5)]">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
            <p className="text-sm text-white/70 mt-1">
              Secure signup with strong password checks
            </p>
          </div>

          <form onSubmit={userSignUp} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                onChange={(e) => {
                  setServerError("");
                  setUser((prev) => ({ ...prev, email: e.target.value }));
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              {user.email && !emailValid && (
                <p className="mt-1 text-xs text-red-300">Enter a valid email address.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={user.name}
                onChange={(e) => {
                  setServerError("");
                  setUser((prev) => ({ ...prev, name: e.target.value }));
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
                placeholder="Aditya Jain"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-white/80 mb-1"
                >
                  Username
                </label>
                <span className="text-xs text-white/60">3-20 chars: a-z 0-9 _ .</span>
              </div>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={user.username}
                  onChange={(e) => {
                    setServerError("");
                    setUser((prev) => ({ ...prev, username: e.target.value.toLowerCase() }));
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
                  placeholder="aditya_movies"
                  autoComplete="username"
                  required
                />
                {username && (
                  <div className="absolute right-2 top-2.5 text-xs">
                    {checking ? (
                      <span className="text-white/60">Checking...</span>
                    ) : !usernameValid ? (
                      <span className="text-red-300">Invalid</span>
                    ) : available === true ? (
                      <span className="text-emerald-300">Available</span>
                    ) : available === false ? (
                      <span className="text-red-300">Taken</span>
                    ) : usernameCheckError ? (
                      <span className="text-amber-200">Check on submit</span>
                    ) : (
                      <span className="text-white/60">-</span>
                    )}
                  </div>
                )}
              </div>
              {username && usernameCheckError && (
                <p className="mt-1 text-xs text-amber-200">
                  Couldn&apos;t verify username availability right now. You can still create the account and we&apos;ll validate it on submit.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/80 mb-1"
                >
                  Password
                </label>
                <span className="text-xs text-white/60">
                  8-72 chars, upper/lower/number/symbol
                </span>
              </div>
              <input
                id="password"
                type="password"
                value={user.password}
                onChange={(e) => {
                  setServerError("");
                  setUser((prev) => ({ ...prev, password: e.target.value }));
                }}
                className={`w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ${
                  showPasswordFeedback && !pw.valid
                    ? "border border-red-300/70 focus:border-red-200"
                    : "border border-white/10 focus:border-white/30"
                }`}
                placeholder="********"
                autoComplete="new-password"
                required
              />
              <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                <div className={`h-2 rounded-full transition-all ${strengthBar}`} />
              </div>
              <p className="mt-1 text-xs text-white/70">Strength: {pw.level}</p>
              {showPasswordFeedback && !pw.valid ? (
                <div
                  className="mt-2 rounded-xl border border-red-300/30 bg-red-500/10 p-3"
                  aria-live="polite"
                >
                  <p className="text-xs font-semibold text-red-200">
                    Password still needs:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-red-100">
                    {missingPasswordRequirements.map((item) => (
                      <li key={item.key} className="flex items-start gap-2">
                        <span className="mt-0.5 text-red-300">•</span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {showPasswordFeedback && pw.valid ? (
                <p className="mt-2 text-xs font-medium text-emerald-300" aria-live="polite">
                  Password meets all signup requirements.
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                canSubmit
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/30 text-white/60 cursor-not-allowed"
              }`}
            >
              {submitting ? "Creating..." : "Create account"}
            </button>
            {serverError ? (
              <p className="text-center text-xs text-red-200" aria-live="polite">
                {serverError}
              </p>
            ) : null}
            {!canSubmit && submitDisabledReason ? (
              <p
                className={`text-center text-xs ${
                  submitAttempted ? "text-red-200" : "text-white/70"
                }`}
              >
                {submitDisabledReason}
              </p>
            ) : null}
          </form>

          <div className="my-4 text-center text-xs text-white/50">OR</div>

          <button
            onClick={googleSignup}
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm text-white hover:bg-white/15 transition ${
              submitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <FaGoogle size={18} className="text-yellow-500" />
            <span className="font-semibold">Continue with Google</span>
          </button>

          <p className="mt-6 text-sm text-center text-white/70">
            Already have an account?{" "}
            <Link href={loginHref} className="text-white hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

