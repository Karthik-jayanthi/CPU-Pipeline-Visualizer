"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Mail, Lock, User, AlertCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sb = getSupabaseBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: authErr } = await sb.auth.signInWithPassword({
          email,
          password,
        });
        if (authErr) throw authErr;
        router.push("/simulation");
      } else {
        const { error: authErr } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (authErr) throw authErr;
        setEmailSent(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-10 text-center max-w-sm w-full mx-4">
          <Mail size={32} className="text-accent mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-white mb-2">
            Check your inbox
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-white">{email}</span>. Click it to activate
            your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #00d4ff, transparent)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Cpu size={22} className="text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            PipelineViz
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === "login" ? "Sign in to your workspace" : "Create an account"}
          </p>
        </div>

        {/* Form */}
        <div className="glass-panel rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex rounded-lg bg-black/30 p-1 mb-6">
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  mode === m
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field
                icon={User}
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={setDisplayName}
              />
            )}
            <Field
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              required
              minLength={8}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent text-void font-semibold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processing…"
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-4">
            By continuing you agree to our Terms and Privacy Policy
          </p>
        </div>

        {/* Skip auth */}
        <p className="text-center text-sm text-gray-600 mt-4">
          No account?{" "}
          <a href="/simulation" className="text-accent hover:underline">
            Try the simulator without signing in →
          </a>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="relative">
      <Icon
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full bg-black/30 border border-white/8 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent/40 transition-colors"
      />
    </div>
  );
}
