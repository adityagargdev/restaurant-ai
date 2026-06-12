import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-5 py-16"
      style={{ background: "#0e0b08" }}
    >
      <div className="grain-overlay" />

      {/* Ambient warm glow — top right */}
      <div
        className="ambient-orb-1 pointer-events-none absolute"
        style={{
          top: "-10%", right: "-8%",
          width: "620px", height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.19) 0%, rgba(234,88,12,0.07) 46%, transparent 72%)",
          filter: "blur(72px)",
        }}
      />
      {/* Ambient warm glow — bottom left */}
      <div
        className="ambient-orb-2 pointer-events-none absolute"
        style={{
          bottom: "-20%", left: "-12%",
          width: "680px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,83,9,0.14) 0%, transparent 65%)",
          filter: "blur(82px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">

        {/* Pine leaf logo mark */}
        <div className="anim-0 mb-7">
          <div
            style={{
              width: "56px", height: "56px", borderRadius: "18px",
              background: "linear-gradient(145deg, rgba(245,158,11,0.18) 0%, rgba(234,88,12,0.06) 100%)",
              border: "1px solid rgba(245,158,11,0.24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(245,158,11,0.12)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="22" x2="12" y2="8" stroke="rgba(252,211,77,0.85)" strokeWidth="1.5" />
              <path d="M12 8 C12 8 8 5.5 6 2 C9 2.5 12 5 12 8 Z" fill="rgba(252,211,77,0.28)" stroke="rgba(252,211,77,0.75)" strokeWidth="1.2" />
              <path d="M12 8 C12 8 16 5.5 18 2 C15 2.5 12 5 12 8 Z" fill="rgba(252,211,77,0.28)" stroke="rgba(252,211,77,0.75)" strokeWidth="1.2" />
              <path d="M12 13 C12 13 9 11 7 8 C9.5 9 12 11 12 13 Z" fill="rgba(252,211,77,0.18)" stroke="rgba(252,211,77,0.55)" strokeWidth="1.1" />
              <path d="M12 13 C12 13 15 11 17 8 C14.5 9 12 11 12 13 Z" fill="rgba(252,211,77,0.18)" stroke="rgba(252,211,77,0.55)" strokeWidth="1.1" />
            </svg>
          </div>
        </div>

        {/* Restaurant name */}
        <div className="anim-1 text-center mb-2">
          <h1
            style={{
              fontStyle: "italic",
              fontSize: "clamp(2.8rem, 8vw, 4.8rem)",
              fontWeight: "400",
              letterSpacing: "-0.025em",
              lineHeight: "1.05",
              background: "linear-gradient(128deg, #FCD34D 10%, #F59E0B 48%, #FB923C 88%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Pepper & Pine
          </h1>
        </div>

        {/* Tagline */}
        <p
          className="anim-2 text-center mb-10"
          style={{
            color: "rgba(255,240,210,0.4)",
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Fine Dining · Effortless Service
        </p>

        {/* Portal cards */}
        <div className="anim-3 w-full flex flex-col sm:flex-row gap-3.5 mb-12">

          {/* Guest portal */}
          <Link
            href="/login"
            className="glass-card flex-1 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 group"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                width: "46px", height: "46px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(245,158,11,0.06))",
                border: "1px solid rgba(245,158,11,0.24)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color 0.3s",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(252,211,77,0.88)">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ color: "#fff8f0", fontWeight: 500, fontSize: "0.95rem", marginBottom: "0.3rem" }}>
                I&apos;m a Guest
              </p>
              <p style={{ color: "rgba(255,240,210,0.42)", fontSize: "0.8rem", lineHeight: "1.55" }}>
                View orders, reservations & our full menu
              </p>
            </div>
            <div className="flex justify-end">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,158,11,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Staff portal */}
          <Link
            href="/admin/login"
            className="glass-card-neutral flex-1 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                width: "46px", height: "46px", borderRadius: "14px",
                background: "rgba(120,113,108,0.12)",
                border: "1px solid rgba(120,113,108,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(200,190,178,0.82)">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
              </svg>
            </div>
            <div className="flex-1">
              <p style={{ color: "#fff8f0", fontWeight: 500, fontSize: "0.95rem", marginBottom: "0.3rem" }}>
                Restaurant Staff
              </p>
              <p style={{ color: "rgba(255,240,210,0.36)", fontSize: "0.8rem", lineHeight: "1.55" }}>
                Kitchen & reservations management
              </p>
            </div>
            <div className="flex justify-end">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(160,150,140,0.42)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Call CTA */}
        <div className="anim-4 text-center flex flex-col items-center gap-3">
          <div className="warm-divider w-40 mb-1" />
          <span className="pp-badge">Available 24 / 7</span>
          <p style={{ color: "rgba(255,240,210,0.36)", fontSize: "0.78rem" }}>
            Call anytime — we&apos;re always here to take your call
          </p>
          <a
            href="tel:+18782849168"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.45rem",
              color: "rgba(252,211,77,0.65)",
              fontSize: "0.875rem",
              letterSpacing: "0.04em",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
            </svg>
            +1 (878) 284-9168
          </a>
        </div>

      </div>
    </main>
  );
}
