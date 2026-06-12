"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .single();

    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      setError("You do not have staff access.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-5 py-12"
      style={{ background: "#0a0908" }}
    >
      <div className="grain-overlay" />

      {/* Subtle stone glow for staff theme */}
      <div
        className="ambient-orb-2 pointer-events-none absolute"
        style={{
          top: "-15%", left: "-8%",
          width: "500px", height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,113,108,0.12) 0%, transparent 68%)",
          filter: "blur(70px)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <Link
          href="/"
          className="anim-0 inline-flex items-center gap-1.5 mb-8 text-sm transition-colors"
          style={{ color: "rgba(255,240,210,0.32)", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to home
        </Link>

        <div className="anim-1 glass-card-neutral rounded-2xl p-8">

          <div className="mb-7">
            <div
              className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(120,113,108,0.12)",
                border: "1px solid rgba(120,113,108,0.22)",
                color: "rgba(200,190,178,0.7)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              Staff Portal
            </div>
            <h1
              style={{
                fontSize: "1.85rem",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#fff8f0",
                marginBottom: "0.35rem",
              }}
            >
              Staff Login
            </h1>
            <p style={{ color: "rgba(255,240,210,0.38)", fontSize: "0.85rem" }}>
              Pepper & Pine Management
            </p>
          </div>

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

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label style={{ color: "rgba(255,240,210,0.5)", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="manager@pepperandpine.com"
                className="pp-input"
                style={{ borderColor: "rgba(120,113,108,0.22)" }}
              />
            </div>
            <div>
              <label style={{ color: "rgba(255,240,210,0.5)", fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                Password
              </label>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ background: "rgba(255,175,50,0.04)", border: "1px solid rgba(120,113,108,0.22)" }}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    flex: 1, background: "transparent", color: "#fff8f0",
                    padding: "0.75rem 1rem", outline: "none", fontSize: "0.9rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    padding: "0 1rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,240,210,0.35)",
                    transition: "color 0.2s",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-px mt-1"
              style={{
                background: loading ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)",
                color: "#1a0f00",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
