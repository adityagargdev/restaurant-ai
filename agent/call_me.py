"""
call_me.py — Have Twilio call your phone and bridge you into LiveKit.

Usage:
  1. py -3.11 agent.py dev
  2. py -3.11 call_me.py
"""

import os, time
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

MY_NUMBER     = "+919999004907"
TWILIO_NUMBER = os.environ["TWILIO_PHONE_NUMBER"]
LIVEKIT_SIP_URI = "sip:4hpz5eqtgpm.sip.livekit.cloud"

CALLER_FILE = os.path.join(os.path.dirname(__file__), ".caller_phone")


def main():
    # Write caller's real phone to a file the agent will read
    with open(CALLER_FILE, "w") as f:
        f.write(MY_NUMBER)
    print(f"📋  Caller phone saved: {MY_NUMBER}")

    client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])
    twiml = f"<Response><Dial><Sip>{LIVEKIT_SIP_URI}</Sip></Dial></Response>"

    print(f"📞  Calling {MY_NUMBER} ...")
    call = client.calls.create(to=MY_NUMBER, from_=TWILIO_NUMBER, twiml=twiml)
    print(f"✅  Call SID: {call.sid}")
    print("    Answer your phone — Simran will greet you!")

    print("⏳  Waiting for call to complete...")
    for _ in range(40):
        time.sleep(2)
        c = client.calls(call.sid).fetch()
        if c.status in ("completed", "failed", "busy", "no-answer", "canceled"):
            print(f"\n📊  Status: {c.status}  |  Duration: {c.duration}s")
            break

    try:
        for ch in client.calls(call.sid).children.list():
            print(f"📡  SIP leg: {ch.to}  status={ch.status}  duration={ch.duration}s")
    except Exception:
        pass


main()
