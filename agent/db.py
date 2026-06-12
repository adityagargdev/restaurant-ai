"""
Supabase database operations for the voice agent.
Uses service role key — bypasses RLS since the agent is a trusted backend service.
"""

import os
import json
import math
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        _client = create_client(url, key)
    return _client


def get_or_create_guest_profile(caller_phone: str) -> str | None:
    """
    Returns the profile UUID for the given phone number.
    If no profile exists, creates a guest account that expires in 5 days.
    Returns None if caller_phone is empty.
    """
    if not caller_phone:
        return None

    db = get_client()

    result = db.table("profiles").select("id").eq("phone", caller_phone).execute()
    if result.data:
        return result.data[0]["id"]

    expires_at = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    try:
        user_resp = db.auth.admin.create_user({
            "phone": caller_phone,
            "phone_confirm": True,
        })
        user_id = user_resp.user.id
    except Exception:
        return None

    db.table("profiles").upsert({
        "id": user_id,
        "phone": caller_phone,
        "is_guest": True,
        "guest_expires_at": expires_at,
    }).execute()

    return user_id


def check_table_availability(date: str, meal_slot: str, party_size: int) -> dict:
    """
    Returns available tables for the given date, meal slot, and party size.
    date: YYYY-MM-DD
    meal_slot: breakfast | lunch | dinner
    party_size: number of guests
    """
    db = get_client()
    meal_slot = meal_slot.lower()

    booked = db.table("reservations") \
        .select("table_id") \
        .eq("date", date) \
        .eq("meal_slot", meal_slot) \
        .eq("status", "confirmed") \
        .execute()

    booked_ids = {r["table_id"] for r in booked.data}

    all_tables = db.table("restaurant_tables").select("*").execute()

    available = []
    for t in all_tables.data:
        if t["id"] in booked_ids:
            continue
        if t["capacity_max"] >= party_size and t["capacity_min"] <= party_size:
            available.append(t)
        elif t["is_rooftop"] and party_size <= t["capacity_max"]:
            available.append(t)

    return {"available": available, "booked_count": len(booked_ids)}


def book_table(
    profile_id: str | None,
    caller_phone: str,
    date: str,
    meal_slot: str,
    party_size: int,
    table_id: int,
    special_requests: str = "",
) -> dict:
    db = get_client()

    existing = db.table("reservations") \
        .select("id") \
        .eq("table_id", table_id) \
        .eq("date", date) \
        .eq("meal_slot", meal_slot) \
        .eq("status", "confirmed") \
        .execute()

    if existing.data:
        return {"success": False, "error": "Table just got booked. Please try another."}

    meal_slot = meal_slot.lower()
    row = {
        "table_id": table_id,
        "date": date,
        "meal_slot": meal_slot,
        "party_size": party_size,
        "status": "confirmed",
        "caller_phone": caller_phone,
        "special_requests": special_requests or "",
    }
    if profile_id:
        row["user_id"] = profile_id

    result = db.table("reservations").insert(row).execute()
    if result.data:
        return {"success": True, "reservation_id": result.data[0]["id"], "table_id": table_id}
    return {"success": False, "error": "Failed to create reservation."}


def get_reservation_by_phone(caller_phone: str, date: str, meal_slot: str) -> dict | None:
    if not caller_phone:
        return None
    db = get_client()
    meal_slot = meal_slot.lower()
    result = db.table("reservations") \
        .select("id, table_id, party_size, restaurant_tables(type, is_rooftop)") \
        .eq("caller_phone", caller_phone) \
        .eq("date", date) \
        .eq("meal_slot", meal_slot) \
        .eq("status", "confirmed") \
        .execute()
    if result.data:
        return result.data[0]
    return None


def get_order_status(caller_phone: str) -> dict | None:
    """
    Returns remaining prep time for the caller's most recent active takeaway order.
    Remaining time is rounded UP to the nearest 5 minutes.
    """
    if not caller_phone:
        return None

    db = get_client()
    result = db.table("orders") \
        .select("id, total_amount, estimated_prep_minutes, status, created_at") \
        .eq("caller_phone", caller_phone) \
        .eq("order_type", "takeaway") \
        .in_("status", ["pending", "preparing"]) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()

    if not result.data:
        return None

    order = result.data[0]
    created_at = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    elapsed = (now - created_at).total_seconds() / 60
    remaining = order["estimated_prep_minutes"] - elapsed

    if remaining <= 0:
        return {"order_id": order["id"], "is_ready": True, "minutes_remaining": 0}

    rounded = math.ceil(remaining / 5) * 5
    return {
        "order_id": order["id"],
        "is_ready": False,
        "minutes_remaining": rounded,
        "total_amount": order["total_amount"],
    }


def calc_prep_time(total: int) -> int:
    if total < 200:
        return 10
    if total <= 500:
        return 15
    return 22


def place_order(
    profile_id: str | None,
    caller_phone: str,
    order_type: str,
    items: list[dict],
    reservation_id: str | None = None,
) -> dict:
    """
    items: list of {item_name, variant, quantity, unit_price}
    order_type: dine_in | takeaway
    """
    db = get_client()

    # Normalize keys — LLM sometimes uses "item"/"price" instead of "item_name"/"unit_price"
    for i in items:
        if "item_name" not in i and "item" in i:
            i["item_name"] = i.pop("item")
        if "unit_price" not in i and "price" in i:
            i["unit_price"] = i.pop("price")

    total = int(sum(i["unit_price"] * i["quantity"] for i in items))
    prep = calc_prep_time(total)

    order_row = {
        "order_type": order_type,
        "status": "pending",
        "total_amount": total,
        "estimated_prep_minutes": prep,
        "caller_phone": caller_phone,
    }
    if profile_id:
        order_row["user_id"] = profile_id
    if reservation_id:
        order_row["reservation_id"] = reservation_id

    order_result = db.table("orders").insert(order_row).execute()
    if not order_result.data:
        return {"success": False, "error": "Failed to create order."}

    order_id = order_result.data[0]["id"]

    item_rows = [
        {
            "order_id": order_id,
            "item_name": i.get("item_name") or i.get("item", "Unknown item"),
            "variant": i.get("variant", ""),
            "quantity": i["quantity"],
            "unit_price": i.get("unit_price") or i.get("price", 0),
        }
        for i in items
    ]
    db.table("order_items").insert(item_rows).execute()

    return {
        "success": True,
        "order_id": order_id,
        "total": total,
        "prep_minutes": prep,
    }
