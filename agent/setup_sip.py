"""
setup_sip.py — One-time SIP configuration for Pepper & Pine.
Reuses existing trunks if already present (safe to re-run).
Run: py -3.11 setup_sip.py
"""

import asyncio
import os
from dotenv import load_dotenv, set_key
from livekit import api

load_dotenv()

LIVEKIT_URL     = os.environ["LIVEKIT_URL"].replace("wss://", "https://")
LIVEKIT_API_KEY = os.environ["LIVEKIT_API_KEY"]
LIVEKIT_SECRET  = os.environ["LIVEKIT_API_SECRET"]
TWILIO_SID      = os.environ["TWILIO_ACCOUNT_SID"]
TWILIO_TOKEN    = os.environ["TWILIO_AUTH_TOKEN"]
TWILIO_NUMBER   = os.environ["TWILIO_PHONE_NUMBER"]

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")


async def main():
    lkapi = api.LiveKitAPI(
        url=LIVEKIT_URL,
        api_key=LIVEKIT_API_KEY,
        api_secret=LIVEKIT_SECRET,
    )

    print("Setting up SIP for Pepper & Pine...\n")

    # ── 1. Inbound trunk — reuse if exists ─────────────────────────────────
    existing_inbound = await lkapi.sip.list_sip_inbound_trunk(
        api.ListSIPInboundTrunkRequest()
    )
    inbound_id = None
    for trunk in existing_inbound.items:
        if TWILIO_NUMBER in trunk.numbers:
            inbound_id = trunk.sip_trunk_id
            print(f"♻️  Inbound trunk already exists: {inbound_id}")
            break

    if not inbound_id:
        inbound = await lkapi.sip.create_inbound_trunk(
            api.CreateSIPInboundTrunkRequest(
                trunk=api.SIPInboundTrunkInfo(
                    name="Pepper & Pine Inbound",
                    numbers=[TWILIO_NUMBER],
                    krisp_enabled=True,
                )
            )
        )
        inbound_id = inbound.sip_trunk_id
        print(f"✅ Inbound trunk created: {inbound_id}")

    # ── 2. Outbound trunk — reuse if exists ────────────────────────────────
    existing_outbound = await lkapi.sip.list_sip_outbound_trunk(
        api.ListSIPOutboundTrunkRequest()
    )
    outbound_id = None
    for trunk in existing_outbound.items:
        if TWILIO_NUMBER in trunk.numbers:
            outbound_id = trunk.sip_trunk_id
            print(f"♻️  Outbound trunk already exists: {outbound_id}")
            break

    if not outbound_id:
        outbound = await lkapi.sip.create_outbound_trunk(
            api.CreateSIPOutboundTrunkRequest(
                trunk=api.SIPOutboundTrunkInfo(
                    name="Pepper & Pine Outbound",
                    address="pstn.twilio.com",
                    numbers=[TWILIO_NUMBER],
                    auth_username=TWILIO_SID,
                    auth_password=TWILIO_TOKEN,
                    transport=api.SIPTransport.SIP_TRANSPORT_TLS,
                )
            )
        )
        outbound_id = outbound.sip_trunk_id
        print(f"✅ Outbound trunk created: {outbound_id}")

    # ── 3. Dispatch rule — reuse if exists ─────────────────────────────────
    existing_rules = await lkapi.sip.list_sip_dispatch_rule(
        api.ListSIPDispatchRuleRequest()
    )
    dispatch_id = None
    for rule in existing_rules.items:
        if inbound_id in rule.trunk_ids:
            dispatch_id = rule.sip_dispatch_rule_id
            print(f"♻️  Dispatch rule already exists: {dispatch_id}")
            break

    if not dispatch_id:
        dispatch = await lkapi.sip.create_sip_dispatch_rule(
            api.CreateSIPDispatchRuleRequest(
                rule=api.SIPDispatchRuleInfo(
                    name="Restaurant Rule",
                    rule=api.SIPDispatchRule(
                        dispatch_rule_direct=api.SIPDispatchRuleDirect(
                            room_name="restaurant-call",
                            pin="",
                        )
                    ),
                    trunk_ids=[inbound_id],
                    inbound_numbers=[TWILIO_NUMBER],
                )
            )
        )
        dispatch_id = dispatch.sip_dispatch_rule_id
        print(f"✅ Dispatch rule created: {dispatch_id}")

    # ── 4. Save all IDs to .env ────────────────────────────────────────────
    set_key(ENV_PATH, "LIVEKIT_SIP_INBOUND_TRUNK",  inbound_id)
    set_key(ENV_PATH, "LIVEKIT_SIP_OUTBOUND_TRUNK", outbound_id)
    set_key(ENV_PATH, "LIVEKIT_SIP_DISPATCH_RULE",  dispatch_id)

    await lkapi.aclose()

    print("\n✅ Done — IDs saved to .env")
    print("\nNext steps:")
    print("  1. py -3.11 agent.py dev       (in one terminal)")
    print("  2. py -3.11 call_me.py         (in another terminal)")


asyncio.run(main())
