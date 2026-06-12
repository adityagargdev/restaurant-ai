"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "details" | "otp";

export default function SetupProfile() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/phone/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formattedPhone }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to send OTP.");
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/phone/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formattedPhone, code: otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      name,
      phone: formattedPhone,
    });

    router.push("/dashboard");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-5 py-12"
      style={{ background: "#0e0b08" }}
    >
      <div className="grain-overlay" />

      <div
        className="ambient-orb-1 pointer-events-none absolute"
        style={{
          bottom: "-10%", right: "-8%",
          width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.14) 0%, transparent 66%)",
          filter: "blur(65px)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="anim-1 glass-card rounded-2xl p-8">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            <div
              style={{
                width: "28px", height: "5px", borderRadius: "3px",
                background: "linear-gradient(90deg, #F59E0B, #F97316)",
              }}
            />
            <div
              style={{
                width: "28px", height: "5px", borderRadius: "3px",
                background: step === "otp"
                  ? "linear-gradient(90deg, #F59E0B, #F97316)"
                  : "rgba(245,158,11,0.18)",
                transition: "background 0.3s",
              }}
            />
          </div>

          <div className="pp-badge mb-4">Almost there</div>
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
            One last step
          </h1>
          <p style={{ color: "rgba(255,240,210,0.42)", fontSize: "0.85rem", marginBottom: "1.75rem" }}>
            {step === "details"
              ? "We need your phone to link call orders to your account."
              : `Enter the 6-digit code sent to ${formattedPhone}`}
          </p>

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

          {step === "details" && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label style={{ color: "rgba(255,240,210,0.58)", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Aditya"
                  className="pp-input"
                />
              </div>
              <div>
                <label style={{ color: "rgba(255,240,210,0.58)", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                  Phone Number
                </label>
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{ background: "rgba(255,175,50,0.04)", border: "1px solid rgba(245,158,11,0.16)" }}
                >
                  <span style={{ color: "rgba(255,240,210,0.4)", padding: "0.75rem 1rem", borderRight: "1px solid rgba(245,158,11,0.14)", fontSize: "0.9rem" }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="9876543210"
                    style={{ flex: 1, background: "transparent", color: "#fff8f0", padding: "0.75rem 1rem", outline: "none", fontSize: "0.9rem" }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length < 10 || !name}
                className="pp-btn-primary mt-1"
              >
                {loading ? "Sending…" : "Send Verification Code"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="pp-input text-center"
                style={{ fontSize: "1.75rem", letterSpacing: "0.35em" }}
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="pp-btn-primary"
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("details"); setOtp(""); setError(""); }}
                className="pp-btn-ghost text-center"
              >
                ← Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
