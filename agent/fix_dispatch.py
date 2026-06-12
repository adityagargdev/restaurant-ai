"""
fix_dispatch.py — Replace the old individual dispatch rule with a direct one
that routes every inbound call to the fixed "restaurant-call" room.

Safe to re-run. Only touches SDR_GxgQqvovKwDM (the conflicting old rule).
Run: py -3.11 fix_dispatch.py
"""

import asyncio
import os
from dotenv import load_dotenv, set_key
from livekit import api

load_dotenv()

LIVEKIT_URL     = os.environ["LIVEKIT_URL"].replace("wss://", "https://")
LIVEKIT_API_KEY = os.environ["LIVEKIT_API_KEY"]
LIVEKIT_SECRET  = os.environ["LIVEKIT_API_SECRET"]
TWILIO_NUMBER   = os.environ["TWILIO_PHONE_NUMBER"]
INBOUND_TRUNK   = "ST_Md62kY45LxMm"   # confirmed from check_sip.py
OLD_RULE        = "SDR_2rtRFM3nhihs"   # previous direct rule with bad inbound_numbers filter
ROOM_NAME       = "restaurant-call"
ENV_PATH        = os.path.join(os.path.dirname(__file__), ".env")


async def main():
    lkapi = api.LiveKitAPI(url=LIVEKIT_URL, api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_SECRET)

    # ── 1. Delete the old individual dispatch rule ─────────────────────────
    print(f"🗑️  Deleting old dispatch rule {OLD_RULE} ...")
    try:
        await lkapi.sip.delete_sip_dispatch_rule(
            api.DeleteSIPDispatchRuleRequest(sip_dispatch_rule_id=OLD_RULE)
        )
        print("   ✅ Deleted")
    except Exception as e:
        print(f"   ⚠️  Could not delete (may already be gone): {e}")

    # ── 2. Create new direct rule → "restaurant-call" ─────────────────────
    print(f"\n➕ Creating direct dispatch rule → room '{ROOM_NAME}' ...")
    dispatch = await lkapi.sip.create_sip_dispatch_rule(
        api.CreateSIPDispatchRuleRequest(
            name="Pepper & Pine Rule",
            rule=api.SIPDispatchRule(
                dispatch_rule_direct=api.SIPDispatchRuleDirect(
                    room_name=ROOM_NAME,
                    pin="",
                )
            ),
            trunk_ids=[INBOUND_TRUNK],
            inbound_numbers=[],   # empty = match all calls to this trunk regardless of number format
        )
    )
    dispatch_id = dispatch.sip_dispatch_rule_id
    print(f"   ✅ Created: {dispatch_id}")

    # ── 3. Save to .env ────────────────────────────────────────────────────
    set_key(ENV_PATH, "LIVEKIT_SIP_DISPATCH_RULE", dispatch_id)
    print(f"\n✅ Done — saved to .env as LIVEKIT_SIP_DISPATCH_RULE={dispatch_id}")
    print("\nNow test:")
    print("  Terminal 1:  py -3.11 agent.py dev")
    print("  Terminal 2:  py -3.11 call_me.py")

    await lkapi.aclose()


asyncio.run(main())
