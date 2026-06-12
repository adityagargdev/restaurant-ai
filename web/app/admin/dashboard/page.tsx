"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_type: string;
  status: string;
  total_amount: number;
  estimated_prep_minutes: number;
  created_at: string;
  caller_phone: string;
  profiles: { name: string; phone: string } | null;
  order_items: { item_name: string; variant: string; quantity: number; unit_price: number }[];
  reservations: { date: string; meal_slot: string; restaurant_tables: { table_number: number } } | null;
};

type Reservation = {
  id: string;
  date: string;
  meal_slot: string;
  party_size: number;
  status: string;
  special_requests: string;
  caller_phone: string;
  profiles: { name: string } | null;
  restaurant_tables: { type: string; is_rooftop: boolean; table_number: number };
};

const ORDER_STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"];

function StatusBadge({ status }: { status: string }) {
  return <span className={`s-badge s-${status}`}>{status}</span>;
}

const statColors: Record<string, { from: string; to: string; text: string }> = {
  pending:   { from: "rgba(234,179,8,0.15)",  to: "rgba(234,179,8,0.05)",  text: "#FCD34D" },
  preparing: { from: "rgba(59,130,246,0.15)", to: "rgba(59,130,246,0.05)", text: "#93C5FD" },
  ready:     { from: "rgba(34,197,94,0.15)",  to: "rgba(34,197,94,0.05)",  text: "#86EFAC" },
  completed: { from: "rgba(120,113,108,0.15)",to: "rgba(120,113,108,0.05)",text: "#A8A29E" },
  cancelled: { from: "rgba(239,68,68,0.15)",  to: "rgba(239,68,68,0.05)",  text: "#FCA5A5" },
  confirmed: { from: "rgba(34,197,94,0.15)",  to: "rgba(34,197,94,0.05)",  text: "#86EFAC" },
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "reservations">("orders");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/admin/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) { router.push("/"); return; }

    const { data: ordersData } = await supabase
      .from("orders")
      .select(`*, profiles(name, phone), order_items(item_name, variant, quantity, unit_price), reservations(date, meal_slot, restaurant_tables(table_number))`)
      .order("created_at", { ascending: false });
    setOrders(ordersData ?? []);

    const { data: resData } = await supabase
      .from("reservations")
      .select("*, profiles(name), restaurant_tables(type, is_rooftop, table_number)")
      .order("date", { ascending: false });
    setReservations(resData ?? []);

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  async function updateOrderStatus(orderId: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
  }

  async function updateReservationStatus(resId: string, status: string) {
    await supabase.from("reservations").update({ status }).eq("id", resId);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const activeOrders = orders.filter((o) => ["pending", "preparing"].includes(o.status));
  const todayRes = reservations.filter(
    (r) => r.date === new Date().toISOString().split("T")[0] && r.status === "confirmed"
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0e0b08" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin"
            style={{
              width: "32px", height: "32px", borderRadius: "50%",
              border: "2.5px solid rgba(245,158,11,0.15)",
              borderTopColor: "rgba(245,158,11,0.8)",
            }}
          />
          <p style={{ color: "rgba(255,240,210,0.35)", fontSize: "0.85rem" }}>Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#0e0b08" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-20 px-5 py-3.5 flex items-center justify-between"
        style={{
          background: "rgba(10,9,8,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(120,113,108,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1
                style={{
                  fontStyle: "italic",
                  fontSize: "1.15rem",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(120deg, #FCD34D, #F59E0B)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Pepper & Pine
              </h1>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  padding: "0.15rem 0.55rem",
                  borderRadius: "6px",
                  background: "rgba(120,113,108,0.15)",
                  border: "1px solid rgba(120,113,108,0.22)",
                  color: "rgba(200,190,178,0.65)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Staff
              </span>
            </div>
            <p style={{ color: "rgba(255,240,210,0.3)", fontSize: "0.72rem" }}>
              Live kitchen & reservations view
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: "7px", height: "7px",
                background: "#86EFAC",
                boxShadow: "0 0 6px rgba(134,239,172,0.6)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span style={{ color: "rgba(134,239,172,0.7)", fontSize: "0.72rem" }}>Live</span>
          </div>
          <button
            onClick={handleSignOut}
            style={{ color: "rgba(255,240,210,0.3)", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: "Active Orders", value: activeOrders.length, color: statColors.preparing },
            { label: "Today's Tables", value: todayRes.length, color: statColors.confirmed },
            { label: "Total Orders", value: orders.length, color: { from: "rgba(255,175,50,0.08)", to: "rgba(255,175,50,0.02)", text: "rgba(255,240,210,0.6)" } },
            { label: "Total Reservations", value: reservations.length, color: { from: "rgba(255,175,50,0.08)", to: "rgba(255,175,50,0.02)", text: "rgba(255,240,210,0.6)" } },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-4"
              style={{
                background: `linear-gradient(145deg, ${card.color.from}, ${card.color.to})`,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ color: "rgba(255,240,210,0.4)", fontSize: "0.72rem", marginBottom: "0.35rem", letterSpacing: "0.04em" }}>
                {card.label}
              </p>
              <p style={{ color: card.color.text, fontSize: "2rem", fontWeight: 600, lineHeight: 1 }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-2xl"
          style={{ background: "rgba(255,175,50,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}
        >
          {(["orders", "reservations"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                tab === t
                  ? { background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#1a0f00", border: "none", cursor: "pointer" }
                  : { background: "transparent", color: "rgba(255,240,210,0.42)", border: "none", cursor: "pointer" }
              }
            >
              {t === "orders" ? `All Orders (${orders.length})` : `All Reservations (${reservations.length})`}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <>
            {/* Status filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {["all", ...ORDER_STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 capitalize"
                  style={
                    statusFilter === s
                      ? { background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#1a0f00", border: "none", cursor: "pointer" }
                      : {
                          background: "rgba(255,175,50,0.04)",
                          color: "rgba(255,240,210,0.4)",
                          border: "1px solid rgba(245,158,11,0.12)",
                          cursor: "pointer",
                        }
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {filteredOrders.length === 0 && (
                <p className="text-center py-14" style={{ color: "rgba(255,240,210,0.25)", fontSize: "0.9rem" }}>
                  No orders matching this filter.
                </p>
              )}
              {filteredOrders.map((order) => (
                <div key={order.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-lg"
                          style={
                            order.order_type === "takeaway"
                              ? { background: "rgba(167,139,250,0.12)", color: "#C4B5FD", border: "1px solid rgba(167,139,250,0.22)" }
                              : { background: "rgba(20,184,166,0.12)", color: "#5EEAD4", border: "1px solid rgba(20,184,166,0.22)" }
                          }
                        >
                          {order.order_type === "takeaway" ? "Takeaway" : "Dine-In"}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p style={{ color: "rgba(255,240,210,0.35)", fontSize: "0.75rem" }}>
                        {new Date(order.created_at).toLocaleString("en-IN")}
                      </p>
                      <p style={{ color: "rgba(255,240,210,0.42)", fontSize: "0.78rem" }}>
                        {order.profiles?.name ?? "Guest"} · {order.caller_phone || order.profiles?.phone}
                      </p>
                      {order.reservations && (
                        <p style={{ color: "rgba(255,240,210,0.35)", fontSize: "0.75rem" }}>
                          Table {order.reservations.restaurant_tables?.table_number} · {order.reservations.meal_slot}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontStyle: "italic",
                        fontSize: "1.3rem",
                        fontWeight: 400,
                        background: "linear-gradient(120deg, #FCD34D, #F97316)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      ₹{order.total_amount}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4">
                    {order.order_items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span style={{ color: "rgba(255,240,210,0.65)" }}>
                          {item.item_name}{item.variant ? ` (${item.variant})` : ""} × {item.quantity}
                        </span>
                        <span style={{ color: "rgba(255,240,210,0.35)" }}>₹{item.unit_price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex gap-2 flex-wrap pt-3"
                    style={{ borderTop: "1px solid rgba(245,158,11,0.08)" }}
                  >
                    {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateOrderStatus(order.id, s)}
                        className="text-xs px-3 py-1.5 rounded-full capitalize transition-all duration-200 hover:-translate-y-px"
                        style={{
                          background: statColors[s]?.from ?? "rgba(255,175,50,0.06)",
                          color: statColors[s]?.text ?? "rgba(255,240,210,0.6)",
                          border: `1px solid ${statColors[s]?.from ?? "rgba(255,175,50,0.12)"}`,
                          cursor: "pointer",
                        }}
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reservations tab */}
        {tab === "reservations" && (
          <div className="flex flex-col gap-3">
            {reservations.length === 0 && (
              <p className="text-center py-14" style={{ color: "rgba(255,240,210,0.25)", fontSize: "0.9rem" }}>
                No reservations yet.
              </p>
            )}
            {reservations.map((res) => (
              <div key={res.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ color: "#fff8f0", fontWeight: 500, textTransform: "capitalize", marginBottom: "0.25rem" }}>
                      {res.meal_slot}
                    </p>
                    <p style={{ color: "rgba(255,240,210,0.5)", fontSize: "0.85rem" }}>
                      {new Date(res.date).toLocaleDateString("en-IN", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p style={{ color: "rgba(255,240,210,0.38)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                      {res.profiles?.name ?? "Guest"} · {res.caller_phone}
                    </p>
                  </div>
                  <StatusBadge status={res.status} />
                </div>

                <div className="flex gap-4 text-sm mb-3" style={{ color: "rgba(255,240,210,0.42)" }}>
                  <span>{res.party_size} guests</span>
                  <span>
                    Table {res.restaurant_tables?.table_number} —{" "}
                    {res.restaurant_tables?.is_rooftop ? "Rooftop (+₹500)" : res.restaurant_tables?.type}
                  </span>
                </div>

                {res.special_requests && (
                  <p
                    className="text-xs italic px-3 py-2 rounded-xl mb-3"
                    style={{
                      color: "rgba(255,240,210,0.35)",
                      background: "rgba(255,175,50,0.04)",
                      border: "1px solid rgba(245,158,11,0.1)",
                    }}
                  >
                    &quot;{res.special_requests}&quot;
                  </p>
                )}

                <div
                  className="flex gap-2 pt-3"
                  style={{ borderTop: "1px solid rgba(245,158,11,0.08)" }}
                >
                  {["confirmed", "completed", "cancelled"]
                    .filter((s) => s !== res.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => updateReservationStatus(res.id, s)}
                        className="text-xs px-3 py-1.5 rounded-full capitalize transition-all duration-200 hover:-translate-y-px"
                        style={{
                          background: statColors[s]?.from ?? "rgba(255,175,50,0.06)",
                          color: statColors[s]?.text ?? "rgba(255,240,210,0.6)",
                          border: `1px solid ${statColors[s]?.from ?? "rgba(255,175,50,0.12)"}`,
                          cursor: "pointer",
                        }}
                      >
                        → {s}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
