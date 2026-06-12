"""
check_reservations.py — Show the last 10 reservations in the DB.
Run: py -3.11 check_reservations.py
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

rows = (
    db.table("reservations")
    .select("id, user_id, caller_phone, date, meal_slot, party_size, status, created_at")
    .order("created_at", desc=True)
    .limit(10)
    .execute()
)

if not rows.data:
    print("No reservations found in DB at all.")
else:
    print(f"Found {len(rows.data)} recent reservations:\n")
    for r in rows.data:
        print(f"  ID          : {r['id']}")
        print(f"  user_id     : {r['user_id']}")
        print(f"  caller_phone: {r['caller_phone']}")
        print(f"  date        : {r['date']}  slot={r['meal_slot']}  party={r['party_size']}")
        print(f"  status      : {r['status']}")
        print(f"  created_at  : {r['created_at']}")
        print()

# Also show the logged-in user's profile
print("─" * 50)
print("Profiles with phone +919599275007:")
prof = db.table("profiles").select("id, phone, name, is_guest").eq("phone", "+919599275007").execute()
for p in prof.data:
    print(f"  {p}")
