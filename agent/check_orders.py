"""
check_orders.py — Show recent orders and their items.
Run: py -3.11 check_orders.py
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

rows = (
    db.table("orders")
    .select("id, user_id, caller_phone, order_type, total_amount, status, created_at, order_items(item_name, variant, quantity, unit_price)")
    .order("created_at", desc=True)
    .limit(5)
    .execute()
)

if not rows.data:
    print("No orders found.")
else:
    for o in rows.data:
        print(f"Order {o['id']}")
        print(f"  caller_phone : {o['caller_phone']}")
        print(f"  order_type   : {o['order_type']}")
        print(f"  total        : ₹{o['total_amount']}")
        print(f"  status       : {o['status']}")
        print(f"  items        : {o['order_items']}")
        print()
