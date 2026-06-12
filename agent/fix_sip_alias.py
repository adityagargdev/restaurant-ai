"""
fix_sip_alias.py — Create a new inbound trunk with alias "pepperpine" so the
SIP call goes sip:pepperpine@sip.livekit.cloud instead of sip:+18782849168@...
This avoids the FROM==TO self-call loop that causes instant rejection.

Run: py -3.11 fix_sip_alias.py
"""
import asyncio, os
from dotenv import load_dotenv, set_key
from livekit import api

load_dotenv()

LIVEKIT_URL = os.environ["LIVEKIT_URL"].replace("wss://", "https://")
KEY         = os.environ["LIVEKIT_API_KEY"]
SECRET      = os.environ["LIVEKIT_API_SECRET"]
ENV_PATH    = os.path.join(os.path.dirname(__file__), ".env")
ALIAS       = "pepperpine"
ROOM        = "restaurant-call"


async def main():
    lk = api.LiveKitAPI(url=LIVEKIT_URL, api_key=KEY, api_secret=SECRET)

    # ── 1. Create inbound trunk with a non-phone alias ─────────────────────
    print(f"Creating inbound trunk with alias '{ALIAS}' ...")
    trunk = await lk.sip.create_sip_inbound_trunk(
        api.CreateSIPInboundTrunkRequest(
            trunk=api.SIPInboundTrunkInfo(
                name="Pepper & Pine Alias Trunk",
                numbers=[ALIAS],
                krisp_enabled=True,
            )
        )
    )
    trunk_id = trunk.sip_trunk_id
    print(f"  ✅ Trunk: {trunk_id}")

    # ── 2. Create dispatch rule for this trunk ─────────────────────────────
    print(f"Creating dispatch rule → room '{ROOM}' ...")
    rule = await lk.sip.create_sip_dispatch_rule(
        api.CreateSIPDispatchRuleRequest(
            name="Pepper & Pine Alias Rule",
            rule=api.SIPDispatchRule(
                dispatch_rule_direct=api.SIPDispatchRuleDirect(room_name=ROOM, pin="")
            ),
            trunk_ids=[trunk_id],
            inbound_numbers=[],
        )
    )
    rule_id = rule.sip_dispatch_rule_id
    print(f"  ✅ Rule: {rule_id}")

    set_key(ENV_PATH, "LIVEKIT_SIP_ALIAS_TRUNK", trunk_id)
    set_key(ENV_PATH, "LIVEKIT_SIP_ALIAS_RULE",  rule_id)

    await lk.aclose()
    print(f"\n✅ Done.  SIP URI to use:  sip:{ALIAS}@sip.livekit.cloud")


asyncio.run(main())
