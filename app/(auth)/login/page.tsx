"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User as UserIcon, GraduationCap } from "lucide-react";
import { FloatingNumbers } from "@/components/sense/FloatingNumbers";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";

const loginSchema = z.object({
  email: z.string().email("Use a valid email address"),
  password: z.string().min(6, "At least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(1, "Required").max(60, "Keep it under 60 characters"),
  school: z.string().min(1, "Required"),
});

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [focusField, setFocusField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  type LoginValues = z.infer<typeof loginSchema>;
  type RegisterValues = z.infer<typeof registerSchema>;

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", school: "" },
  });

  async function onLogin(values: LoginValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(values.email, values.password);
      router.replace("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegister(values: RegisterValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      await signUpWithEmail(values.email, values.password, values.name, values.school);
      router.replace("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setServerError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login-left">
        <FloatingNumbers />
        <div className="login-brand" style={{ zIndex: 2, position: "relative" }}>
          <span className="brand-name">
            <span className="brand-project">Project</span> Sense
          </span>
        </div>

        <div style={{ zIndex: 2, position: "relative" }}>
          <h1 className="login-headline">
            80 problems.
            <br />
            10 minutes.
            <br />
            <em>Go.</em>
          </h1>
          <p className="login-sub">
            Project Sense is a practice gym for UIL Number Sense. Drill the canon, race your friends, sit full AI-generated papers.
          </p>
        </div>

        <div className="login-stats-strip">
          {[
            { val: "2,400+", label: "competitors" },
            { val: "140", label: "schools" },
            { val: "1.2M", label: "problems solved" },
          ].map((s, i) => (
            <div
              key={i}
              className="login-stat-pill"
              style={{ animationDelay: `${0.6 + i * 0.12}s` }}
            >
              <span className="login-stat-val">{s.val}</span>
              <span className="login-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: 11,
            color: "color-mix(in oklab, var(--ink) 40%, transparent)",
            zIndex: 2,
            position: "relative",
            fontFamily: "var(--mono)",
            letterSpacing: "0.04em",
          }}
        >
          UIL ’26 season · pen-only · no scratch work
        </div>
      </div>

      <div className="login-right">
        <div className="login-form">
          <div className="login-form-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setServerError(null);
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setServerError(null);
              }}
            >
              Create account
            </button>
          </div>

          <h2 className="login-form-title">
            {mode === "login" ? (
              <>
                Welcome <em>back.</em>
              </>
            ) : (
              <>
                Join the <em>grind.</em>
              </>
            )}
          </h2>

          {mode === "login" ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate>
              <Field
                label="Email"
                error={loginForm.formState.errors.email?.message}
                focused={focusField === "email"}
                icon={<Mail size={16} />}
              >
                <input
                  type="email"
                  placeholder="you@school.edu"
                  autoComplete="email"
                  {...loginForm.register("email")}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                />
              </Field>

              <Field
                label="Password"
                error={loginForm.formState.errors.password?.message}
                focused={focusField === "pass"}
                icon={<Lock size={16} />}
              >
                <input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...loginForm.register("password")}
                  onFocus={() => setFocusField("pass")}
                  onBlur={() => setFocusField(null)}
                />
              </Field>

              {serverError && <div className="login-error">{serverError}</div>}

              <button
                type="submit"
                className="btn primary login-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"} <span className="kbd">↵</span>
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} noValidate>
              <Field
                label="Full name"
                error={registerForm.formState.errors.name?.message}
                focused={focusField === "name"}
                icon={<UserIcon size={16} />}
              >
                <input
                  type="text"
                  placeholder="Sam Park"
                  autoComplete="name"
                  {...registerForm.register("name")}
                  onFocus={() => setFocusField("name")}
                  onBlur={() => setFocusField(null)}
                />
              </Field>

              <Field
                label="Email"
                error={registerForm.formState.errors.email?.message}
                focused={focusField === "email"}
                icon={<Mail size={16} />}
              >
                <input
                  type="email"
                  placeholder="you@school.edu"
                  autoComplete="email"
                  {...registerForm.register("email")}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                />
              </Field>

              <Field
                label="Password"
                error={registerForm.formState.errors.password?.message}
                focused={focusField === "pass"}
                icon={<Lock size={16} />}
              >
                <input
                  type="password"
                  placeholder="•••••• (min 6)"
                  autoComplete="new-password"
                  {...registerForm.register("password")}
                  onFocus={() => setFocusField("pass")}
                  onBlur={() => setFocusField(null)}
                />
              </Field>

              <Field
                label="School"
                error={registerForm.formState.errors.school?.message}
                focused={focusField === "school"}
                icon={<GraduationCap size={16} />}
              >
                <input
                  type="text"
                  placeholder="St. Mark's"
                  autoComplete="organization"
                  {...registerForm.register("school")}
                  onFocus={() => setFocusField("school")}
                  onBlur={() => setFocusField(null)}
                />
              </Field>

              {serverError && <div className="login-error">{serverError}</div>}

              <button
                type="submit"
                className="btn primary login-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create account"} <span className="kbd">↵</span>
              </button>
            </form>
          )}

          <div className="divider">or</div>

          <button
            type="button"
            className="btn login-google-btn"
            onClick={onGoogle}
            disabled={submitting}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {mode === "login" && (
            <div className="login-footer-links">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("register");
                }}
              >
                Create an account
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  focused,
  icon,
  children,
}: {
  label: string;
  error?: string;
  focused: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="login-field">
      <label>{label}</label>
      <div className={`login-input-wrap ${focused ? "focused" : ""}`}>
        {icon}
        {children}
      </div>
      {error && <div className="login-error">{error}</div>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
