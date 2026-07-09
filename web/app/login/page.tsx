"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Step = "method" | "phone-entry" | "phone-otp";

export default function CustomerLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("method");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    const urlDetails = params.get("details");
    if (urlError) {
      setError(`Auth error: ${urlError}${urlDetails ? ` — ${urlDetails}` : ""}`);
    }
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSendOtp() {
    setLoading(true);
    setError("");
    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (error) {
      setError(error.message);
    } else {
      setStep("phone-otp");
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    setLoading(true);
    setError("");
    const formatted = phone.startsWith("+") ? phone : `+91${phone}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: "sms",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.user && name) {
      await supabase.from("profiles").update({ name, phone: formatted }).eq("id", data.user.id);
    }
    router.push("/dashboard");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-5 py-12"
      style={{ background: "#0e0b08" }}
    >
      <div className="grain-overlay" />

      {/* Ambient glow */}
      <div
        className="ambient-orb-1 pointer-events-none absolute"
        style={{
          top: "-15%", right: "-10%",
          width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 68%)",
          filter: "blur(65px)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/"
          className="anim-0 inline-flex items-center gap-1.5 mb-8 text-sm transition-colors"
          style={{ color: "rgba(255,240,210,0.38)", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to home
        </Link>

        {/* Card */}
        <div className="anim-1 glass-card rounded-2xl p-8">

          {/* Header */}
          <div className="mb-7">
            <div className="pp-badge mb-4">Guest Portal</div>
            <h1
              style={{
                fontStyle: "italic",
                fontSize: "1.85rem",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                background: "linear-gradient(128deg, #FCD34D, #F59E0B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "0.35rem",
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: "rgba(255,240,210,0.42)", fontSize: "0.85rem" }}>
              {step === "method" && "Sign in to Pepper & Pine"}
              {step === "phone-entry" && "Enter your details below"}
              {step === "phone-otp" && `Verification code sent to +91 ${phone}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          {/* Step: Choose method */}
          {step === "method" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: "rgba(255,255,255,0.94)",
                  color: "#1a1a1a",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="warm-divider flex-1" />
                <span style={{ color: "rgba(255,240,210,0.28)", fontSize: "0.75rem" }}>or</span>
                <div className="warm-divider flex-1" />
              </div>

              <button
                onClick={() => setStep("phone-entry")}
                className="pp-btn-primary"
                style={{ fontSize: "0.9rem" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
                </svg>
                Continue with Phone
              </button>
            </div>
          )}

          {/* Step: Phone entry */}
          {step === "phone-entry" && (
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ color: "rgba(255,240,210,0.58)", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aditya"
                  className="pp-input"
                />
              </div>
              <div>
                <label style={{ color: "rgba(255,240,210,0.58)", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                  Phone Number
                </label>
                <div
                  className="flex items-center rounded-xl overflow-hidden transition-colors"
                  style={{
                    background: "rgba(255,175,50,0.04)",
                    border: "1px solid rgba(245,158,11,0.16)",
                  }}
                >
                  <span style={{ color: "rgba(255,240,210,0.4)", padding: "0.75rem 1rem", borderRight: "1px solid rgba(245,158,11,0.14)", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    style={{
                      flex: 1, background: "transparent", color: "#fff8f0",
                      padding: "0.75rem 1rem", outline: "none", fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                className="pp-btn-primary mt-1"
              >
                {loading ? "Sending…" : "Send Verification Code"}
              </button>
              <button onClick={() => { setStep("method"); setError(""); }} className="pp-btn-ghost text-center">
                ← Back
              </button>
            </div>
          )}

          {/* Step: OTP entry */}
          {step === "phone-otp" && (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="pp-input text-center tracking-widest"
                style={{ fontSize: "1.75rem", letterSpacing: "0.35em" }}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="pp-btn-primary"
              >
                {loading ? "Verifying…" : "Verify & Sign In"}
              </button>
              <button onClick={() => { setStep("phone-entry"); setOtp(""); setError(""); }} className="pp-btn-ghost text-center">
                ← Change number
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
