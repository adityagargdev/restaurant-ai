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
  order_items: { item_name: string; variant: string; quantity: number; unit_price: number }[];
};

type Reservation = {
  id: string;
  date: string;
  meal_slot: string;
  party_size: number;
  status: string;
  special_requests: string;
  restaurant_tables: { type: string; is_rooftop: boolean; table_number: number };
};

type MenuItem = { name: string; price: string; special?: boolean };
type MenuCategory = { category: string; items: MenuItem[] };

const MENU: MenuCategory[] = [
  {
    category: "Bar Nibbles",
    items: [
      { name: "French Fries (Salted / Peri Peri)", price: "₹330" },
      { name: "BBQ Spiced Tapioca Chips", price: "₹315" },
      { name: "Basil & Mozzarella Sourdough Fingers", price: "₹345", special: true },
      { name: "Manchego Crusted Potato Wedges", price: "₹355" },
      { name: "Fiesta Nachos — Veg / Chicken", price: "₹400 / ₹485" },
      { name: "Chicken Satay", price: "₹450" },
      { name: "Pepper & Pine Chicken Fingers", price: "₹425" },
      { name: "Sriracha Tossed Prawns Dynamite", price: "₹570" },
    ],
  },
  {
    category: "Soups & Salads",
    items: [
      { name: "Rosemary Roma Tomato Soup", price: "₹275" },
      { name: "Chicken & Lemon Soup", price: "₹355" },
      { name: "Tom Yum Soup — Veg / Chicken / Prawns", price: "₹275 / ₹355 / ₹395" },
      { name: "Paya Shorba", price: "₹370" },
      { name: "Green Garden Salad", price: "₹325" },
      { name: "Caesar Salad — Veg / Chicken", price: "₹315 / ₹370" },
      { name: "Classic Serrano Salad — Veg / Chicken", price: "₹315 / ₹370", special: true },
      { name: "Signature Salad — Veg / Chicken", price: "₹330 / ₹400", special: true },
    ],
  },
  {
    category: "Stuffed Garlic Bread",
    items: [
      { name: "Classic Garlic Bread", price: "₹340" },
      { name: "Classic Jalapeño", price: "₹365" },
      { name: "Classic Sundried Tomatoes", price: "₹375" },
      { name: "Classic Jalapeño & Blue Cheese", price: "₹410" },
      { name: "Classic Chicken Tikka", price: "₹445" },
      { name: "Classic Thai Chicken", price: "₹445" },
      { name: "Classic Pesto Chicken", price: "₹445" },
    ],
  },
  {
    category: "Quesadillas",
    items: [
      { name: "Corn Bean & Jalapeño (Veg)", price: "₹455" },
      { name: "Epazote Mushroom (Veg)", price: "₹455" },
      { name: "Chicken Con Carne", price: "₹500" },
      { name: "Chipotle Chicken", price: "₹500" },
    ],
  },
  {
    category: "Tandoor",
    items: [
      { name: "Lasooni Malai Broccoli", price: "₹375" },
      { name: "Achari Baby Potatoes", price: "₹375", special: true },
      { name: "Multani Paneer", price: "₹480" },
      { name: "Caraway Chicken Tikka", price: "₹480" },
      { name: "Curry Leaves Grilled Chicken", price: "₹480" },
      { name: "Black Sesame Chicken Tikka", price: "₹480", special: true },
      { name: "Murgh Ka Soola", price: "₹480" },
      { name: "Ajwaini Fish Tikka", price: "₹500" },
      { name: "Persian Mutton Seekh", price: "₹595" },
      { name: "Kasaundi Jhinga", price: "₹570" },
      { name: "Tandoori Pomfret", price: "₹745" },
    ],
  },
  {
    category: "Coastal Special",
    items: [
      { name: "Neer Dosa / Benne Dosa", price: "₹60 / ₹90" },
      { name: "Ghee Roast — Mushroom / Chicken / Prawn", price: "₹400 / ₹530 / ₹600" },
      { name: "Mangalorean Mushroom Sukka", price: "₹390", special: true },
      { name: "Cottage Cheese Cafreal", price: "₹480" },
      { name: "Mangalorean Chicken Sukka", price: "₹480" },
      { name: "Madekeri Pepper Fry — Chicken / Mutton", price: "₹480 / ₹595" },
      { name: "Nati Koli Vepudu", price: "₹510" },
      { name: "Jhinga Pepper Fry", price: "₹570" },
      { name: "Tawa Anjal Masala Fry", price: "₹670", special: true },
      { name: "Pomfret Tawa Fry", price: "₹745" },
      { name: "Kothu Parotta — Veg / Egg / Paneer / Chicken / Mutton", price: "₹255 / ₹285 / ₹325 / ₹325 / ₹390" },
    ],
  },
  {
    category: "Asian",
    items: [
      { name: "Crispy Salt & Pepper Corn / Mushroom", price: "₹375" },
      { name: "Crispy Dragon Paneer", price: "₹480", special: true },
      { name: "Classic Chilli Paneer", price: "₹480" },
      { name: "Sriracha Chicken Wings", price: "₹480" },
      { name: "Black Pepper Chicken", price: "₹480" },
      { name: "Spicy Lemon Chicken Coriander", price: "₹480" },
      { name: "Cantonese Fried Chicken", price: "₹480" },
      { name: "Classic Chilli Chicken", price: "₹480" },
      { name: "Thai Lemongrass Shrimp", price: "₹570" },
      { name: "Wok Tossed King Prawns", price: "₹570" },
    ],
  },
  {
    category: "Dimsum",
    items: [
      { name: "Asparagus & Lotus Stem", price: "₹360", special: true },
      { name: "Mix Vegetable Crystal", price: "₹360" },
      { name: "Chicken & Shiitake", price: "₹415", special: true },
      { name: "Chicken & Celery", price: "₹415" },
      { name: "Thai Basil Prawn", price: "₹455" },
    ],
  },
  {
    category: "Hawker's Food",
    items: [
      { name: "Palak Patta Chaat", price: "₹305" },
      { name: "Dilli 6 Aloo Tikki Chaat", price: "₹305" },
    ],
  },
  {
    category: "European & Mexican",
    items: [
      { name: "Samosette", price: "₹305" },
      { name: "Beer Battered Onion Rings", price: "₹320" },
      { name: "Chilli Cheese Toast", price: "₹345" },
      { name: "Grilled Mushrooms with Honey Chilli Glaze", price: "₹390" },
      { name: "Pesto Grilled Chicken", price: "₹480" },
      { name: "Peri Peri House Special Chicken Wings", price: "₹480", special: true },
      { name: "American BBQ Chicken Wings", price: "₹480" },
      { name: "Chimichurri Grilled Prawns (4 pcs)", price: "₹570" },
      { name: "Mezze Platter Veg / Non-Veg", price: "₹725 / ₹835" },
      { name: "Fiery Mexican Habanero — Cottage Cheese / Chicken / Prawns", price: "₹480 / ₹480 / ₹570" },
    ],
  },
  {
    category: "Firewood Pizza (12\" Neapolitan)",
    items: [
      { name: "Roasted Tomato, Garlic & Basil", price: "₹465" },
      { name: "Grilled Cottage Cheese", price: "₹570" },
      { name: "Exotic Vegetable Pizza", price: "₹545" },
      { name: "Mushroom Ragout Pizza", price: "₹520" },
      { name: "Paneer Tikka Masala Pizza", price: "₹570" },
      { name: "Quattro Formaggi with Arugula", price: "₹560", special: true },
      { name: "Thai Chicken Pizza", price: "₹600", special: true },
      { name: "Desi Chicken Tikka Masala Pizza", price: "₹600" },
      { name: "Breakfast Cocktail Chicken Pizza", price: "₹570" },
      { name: "Shrimp Saganaki Pizza", price: "₹620" },
    ],
  },
  {
    category: "Pastas & Risottos",
    items: [
      { name: "Basil Pesto Fettuccini — Veg / Chicken", price: "₹390 / ₹480" },
      { name: "Spaghetti Aglio Olio — Veg / Chicken", price: "₹390 / ₹480" },
      { name: "Spaghetti Arrabiatta with Feta — Veg / Chicken", price: "₹390 / ₹480" },
      { name: "Penne Alfredo — Veg / Chicken", price: "₹410 / ₹480" },
      { name: "Duxelle of Mushroom Risotto", price: "₹420" },
      { name: "Handmade Pappardelle — Veg / Chicken", price: "₹445 / ₹500", special: true },
      { name: "Chicken & Leek Risotto", price: "₹480" },
      { name: "Creamy Garlic Shrimps Gnocchi", price: "₹520", special: true },
    ],
  },
  {
    category: "Main Course",
    items: [
      { name: "Lasooni Tadka Dal", price: "₹320" },
      { name: "Punjabi Dal Makhani", price: "₹335" },
      { name: "Spanaki Corn Korma", price: "₹370", special: true },
      { name: "Pepper Shroom Masala", price: "₹370" },
      { name: "Amritsari Chole", price: "₹370", special: true },
      { name: "Paneer Khurchan Masala", price: "₹480" },
      { name: "Paneer Makhani", price: "₹480" },
      { name: "Mushroom Ragu Slider", price: "₹420" },
      { name: "Thai Curry — Veg / Chicken / Prawns", price: "₹455 / ₹510 / ₹550" },
      { name: "Delhi Style White Butter Chicken", price: "₹480", special: true },
      { name: "Chicken Tikka Masala", price: "₹480", special: true },
      { name: "Pulled Barbecue Chicken Slider", price: "₹500" },
      { name: "Country Style Chicken Curry", price: "₹510" },
      { name: "Prawn Malai Curry", price: "₹560" },
      { name: "Mutton Chettinad", price: "₹595" },
      { name: "Kashmiri Mutton Roganjosh", price: "₹595" },
      { name: "Fish Pulimunchi", price: "₹595" },
    ],
  },
  {
    category: "Rice & Noodles",
    items: [
      { name: "Steam Rice", price: "₹185" },
      { name: "Lemon Rice", price: "₹240" },
      { name: "Curd Rice", price: "₹240" },
      { name: "Ghee Rice", price: "₹265" },
      { name: "Veg Pulao", price: "₹285" },
      { name: "Donne Biryani — Veg / Chicken / Mutton", price: "₹420 / ₹535 / ₹635", special: true },
      { name: "Fried / Szechuan Rice — Veg / Egg / Chicken / Prawn", price: "₹350 / ₹365 / ₹415 / ₹455" },
      { name: "Chilli Garlic / Szechuan Noodles — Veg / Egg / Chicken / Prawn", price: "₹350 / ₹365 / ₹415 / ₹455" },
      { name: "Raita (Mix Veg / Bhurani)", price: "₹155" },
    ],
  },
  {
    category: "Breads",
    items: [
      { name: "Tandoori Roti / Butter Roti", price: "₹75 / ₹85" },
      { name: "Naan — Plain / Butter / Garlic / Cheese", price: "₹85 / ₹95 / ₹105 / ₹105" },
      { name: "Lachcha Paratha / Butter / Pudina", price: "₹85 / ₹90 / ₹105" },
      { name: "Malabar Paratha", price: "₹100" },
    ],
  },
  {
    category: "Desserts",
    items: [
      { name: "70% Dark Chocolate Pebble", price: "₹375" },
      { name: "Tres Leches", price: "₹375", special: true },
      { name: "Fig & Date Halwa", price: "₹385" },
      { name: "Flourless Chocolate Cake", price: "₹385", special: true },
      { name: "Caramel Popcorn Cheesecake", price: "₹405" },
      { name: "Choice of Ice Cream (2 scoops)", price: "₹155" },
    ],
  },
];

function minutesRemaining(order: Order): number {
  const created = new Date(order.created_at).getTime();
  const now = Date.now();
  const elapsedMins = (now - created) / 60000;
  const remaining = order.estimated_prep_minutes - elapsedMins;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 5) * 5;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`s-badge s-${status}`}>{status}</span>;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "reservations" | "menu">("orders");
  const [showPhone, setShowPhone] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    setUserName(profile?.name ?? "Guest");

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, order_items(item_name, variant, quantity, unit_price)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(ordersData ?? []);

    const { data: resData } = await supabase
      .from("reservations")
      .select("*, restaurant_tables(type, is_rooftop, table_number)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    setReservations(resData ?? []);

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("customer-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

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
          background: "rgba(14,11,8,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,158,11,0.12)",
        }}
      >
        <div>
          <h1
            style={{
              fontStyle: "italic",
              fontSize: "1.2rem",
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
          <p style={{ color: "rgba(255,240,210,0.38)", fontSize: "0.75rem" }}>
            Welcome, {userName}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPhone(v => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-px"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                color: "#1a0f00",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
              </svg>
              Call Us
            </button>
            {showPhone && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#1a0f00",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  whiteSpace: "nowrap",
                  zIndex: 50,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <p style={{ color: "#F59E0B", fontSize: "0.75rem", marginBottom: "4px" }}>Call us to reserve a table or place an order</p>
                <p style={{ color: "#fff8f0", fontSize: "1rem", fontWeight: 600, letterSpacing: "0.03em" }}>+1 (878) 284-9168</p>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            style={{ color: "rgba(255,240,210,0.32)", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-2xl"
          style={{ background: "rgba(255,175,50,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}
        >
          {(["orders", "reservations", "menu"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                tab === t
                  ? {
                      background: "linear-gradient(135deg, #F59E0B, #F97316)",
                      color: "#1a0f00",
                      border: "none",
                      cursor: "pointer",
                    }
                  : {
                      background: "transparent",
                      color: "rgba(255,240,210,0.45)",
                      border: "none",
                      cursor: "pointer",
                    }
              }
            >
              {t === "orders" && `My Orders (${orders.length})`}
              {t === "reservations" && `Reservations (${reservations.length})`}
              {t === "menu" && "Menu"}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="flex flex-col gap-3">
            {orders.length === 0 && (
              <div className="text-center py-16">
                <p style={{ color: "rgba(255,240,210,0.28)", fontSize: "0.9rem" }}>
                  No orders yet — call us to place a takeaway or dine-in order!
                </p>
              </div>
            )}
            {orders.map((order) => {
              const isActive = ["pending", "preparing"].includes(order.status) && order.order_type === "takeaway";
              const remaining = isActive ? minutesRemaining(order) : null;
              return (
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
                    </div>
                    <span
                      style={{
                        fontStyle: "italic",
                        fontSize: "1.25rem",
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
                        <span style={{ color: "rgba(255,240,210,0.72)" }}>
                          {item.item_name}{item.variant ? ` (${item.variant})` : ""} × {item.quantity}
                        </span>
                        <span style={{ color: "rgba(255,240,210,0.38)" }}>₹{item.unit_price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {remaining !== null && (
                    <div
                      className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: "1px solid rgba(245,158,11,0.1)" }}
                    >
                      <span style={{ color: "rgba(255,240,210,0.4)", fontSize: "0.78rem" }}>Estimated ready</span>
                      <span
                        className="text-sm font-medium px-3 py-1 rounded-full"
                        style={{
                          background: remaining === 0 ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.12)",
                          color: remaining === 0 ? "#86EFAC" : "#93C5FD",
                          border: `1px solid ${remaining === 0 ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.25)"}`,
                        }}
                      >
                        {remaining === 0 ? "Ready for pickup!" : `~${remaining} mins`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reservations tab */}
        {tab === "reservations" && (
          <div className="flex flex-col gap-3">
            {reservations.length === 0 && (
              <div className="text-center py-16">
                <p style={{ color: "rgba(255,240,210,0.28)", fontSize: "0.9rem" }}>
                  No reservations yet — call us to book a table!
                </p>
              </div>
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
                  </div>
                  <StatusBadge status={res.status} />
                </div>
                <div className="flex gap-4 text-sm" style={{ color: "rgba(255,240,210,0.45)" }}>
                  <span>{res.party_size} guests</span>
                  <span>
                    Table {res.restaurant_tables?.table_number} —{" "}
                    {res.restaurant_tables?.is_rooftop ? "Rooftop" : res.restaurant_tables?.type}
                  </span>
                </div>
                {res.special_requests && (
                  <p
                    className="mt-3 text-xs italic px-3 py-2 rounded-xl"
                    style={{
                      color: "rgba(255,240,210,0.38)",
                      background: "rgba(255,175,50,0.04)",
                      border: "1px solid rgba(245,158,11,0.1)",
                    }}
                  >
                    &quot;{res.special_requests}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Menu tab */}
        {tab === "menu" && (
          <div className="flex flex-col gap-5">
            {MENU.map((section) => (
              <div key={section.category} className="glass-card rounded-2xl overflow-hidden">
                {/* Category header */}
                <div
                  className="px-5 py-3 flex items-center gap-3"
                  style={{
                    background: "linear-gradient(90deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))",
                    borderBottom: "1px solid rgba(245,158,11,0.1)",
                  }}
                >
                  <div
                    style={{
                      width: "3px", height: "16px", borderRadius: "2px",
                      background: "linear-gradient(180deg, #F59E0B, #F97316)",
                    }}
                  />
                  <h2
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: "linear-gradient(120deg, #FCD34D, #F59E0B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {section.category}
                  </h2>
                </div>
                {/* Items */}
                <div className="px-5 py-3 flex flex-col gap-2.5">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        {item.special && (
                          <span style={{ color: "#F59E0B", fontSize: "0.65rem", marginTop: "0.28rem", lineHeight: 1, flexShrink: 0 }}>★</span>
                        )}
                        <span style={{ color: item.special ? "rgba(255,240,210,0.85)" : "rgba(255,240,210,0.65)", fontSize: "0.85rem", lineHeight: "1.5" }}>
                          {item.name}
                        </span>
                      </div>
                      <span style={{ color: "rgba(252,211,77,0.7)", fontSize: "0.82rem", flexShrink: 0, fontWeight: 500 }}>
                        {item.price}
                      </span>
                    </div>
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
