"""
check_sip.py — List all LiveKit SIP configuration so you can see what's active.
Run: py -3.11 check_sip.py
"""

import asyncio
import os
from dotenv import load_dotenv
from livekit import api

load_dotenv()

LIVEKIT_URL     = os.environ["LIVEKIT_URL"].replace("wss://", "https://")
LIVEKIT_API_KEY = os.environ["LIVEKIT_API_KEY"]
LIVEKIT_SECRET  = os.environ["LIVEKIT_API_SECRET"]


async def main():
    lkapi = api.LiveKitAPI(url=LIVEKIT_URL, api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_SECRET)

    print("══════════════════════  INBOUND TRUNKS  ══════════════════════")
    inbound = await lkapi.sip.list_sip_inbound_trunk(api.ListSIPInboundTrunkRequest())
    if not inbound.items:
        print("  (none)")
    for t in inbound.items:
        print(f"  {t.sip_trunk_id}  |  {t.name}  |  numbers: {list(t.numbers)}")

    print("\n══════════════════════  OUTBOUND TRUNKS  ══════════════════════")
    outbound = await lkapi.sip.list_sip_outbound_trunk(api.ListSIPOutboundTrunkRequest())
    if not outbound.items:
        print("  (none)")
    for t in outbound.items:
        print(f"  {t.sip_trunk_id}  |  {t.name}  |  numbers: {list(t.numbers)}")

    print("\n══════════════════════  DISPATCH RULES  ══════════════════════")
    rules = await lkapi.sip.list_sip_dispatch_rule(api.ListSIPDispatchRuleRequest())
    if not rules.items:
        print("  (none)")
    for r in rules.items:
        room = "?"
        kind = "?"
        dr = r.rule
        if dr and dr.HasField("dispatch_rule_direct"):
            kind = "direct"
            room = dr.dispatch_rule_direct.room_name
        elif dr and dr.HasField("dispatch_rule_individual"):
            kind = "individual"
            room = dr.dispatch_rule_individual.room_prefix + "<caller>"
        print(f"  {r.sip_dispatch_rule_id}  |  {r.name}")
        print(f"    type            : {kind}")
        print(f"    room            : {room}")
        print(f"    trunk_ids       : {list(r.trunk_ids)}")
        print(f"    inbound_numbers : {list(r.inbound_numbers)}")

    await lkapi.aclose()


asyncio.run(main())
