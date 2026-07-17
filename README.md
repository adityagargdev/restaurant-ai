# Pepper & Pine — AI Voice Receptionist

An AI-powered phone receptionist for Pepper & Pine restaurant. Customers call a Twilio number, get connected to **Simran** (the AI voice agent), and can reserve tables, place takeaway orders, place dine-in orders, and check order status — all over a regular phone call.

## What it does

- **Table reservations** — book by date, meal slot, and party size
- **Takeaway orders** — place and track pickup orders
- **Dine-in orders** — pre-order food linked to an existing reservation
- **Order status** — check estimated prep time for active orders
- **Customer dashboard** — web app where customers view their orders and reservations
- **Kitchen dashboard** — admin view for staff to see incoming orders

## Tech stack

| Layer | Technology |
|---|---|
| Voice agent | [LiveKit Agents](https://docs.livekit.io/agents/) |
| Telephony | [Twilio](https://www.twilio.com/) (SIP trunking) |
| STT | [Deepgram](https://deepgram.com/) (nova-2-phonecall) |
| LLM | [Groq](https://groq.com/) (llama-3.3-70b-versatile) |
| TTS | [ElevenLabs](https://elevenlabs.io/) (eleven_turbo_v2_5) |
| Database | [Supabase](https://supabase.com/) (Postgres + Auth) |
| Web app | [Next.js](https://nextjs.org/) (App Router) |
| Agent hosting | [Railway](https://railway.app/) |
| Web hosting | [Vercel](https://vercel.com/) |

## Project structure

```
restaurant-ai/
├── agent/               # Python voice agent (LiveKit)
│   ├── agent.py         # Main agent entrypoint
│   ├── prompts.py       # Simran's system prompt + menu
│   ├── db.py            # Supabase database operations
│   ├── call_me.py       # Dev utility: have Twilio call your phone
│   ├── setup_sip.py     # One-time SIP trunk + dispatch rule setup
│   └── check_sip.py     # Inspect current LiveKit SIP config
└── web/                 # Next.js customer + admin web app
    └── app/
        ├── page.tsx               # Landing page
        ├── dashboard/page.tsx     # Customer dashboard
        └── admin/dashboard/page.tsx  # Kitchen dashboard
```

## Setup

### Prerequisites
- Python 3.11
- Node.js 18+
- Accounts: LiveKit, Twilio, Deepgram, Groq, ElevenLabs, Supabase

### Agent

```bash
cd agent
pip install -r requirements.txt
cp .env.example .env
# Fill in all API keys in .env
```

Run one-time SIP setup (creates LiveKit inbound trunk + dispatch rule):
```bash
py -3.11 setup_sip.py
```

Start the agent locally (browser test mode):
```bash
py -3.11 agent.py dev
```

### Web app

```bash
cd web
npm install
cp .env.local.example .env.local
# Fill in Supabase URL and anon key
npm run dev
```

## Phone call flow

```
Customer dials +18782849168 (Twilio number)
        ↓
Twilio TwiML Bin → dials sip:pepperpine@<livekit-sip-host>
        ↓
LiveKit SIP inbound trunk → dispatch rule → "restaurant-call" room
        ↓
LiveKit agent joins room → Simran greets caller
        ↓
Deepgram STT → Groq LLM → ElevenLabs TTS
        ↓
Tool calls → Supabase (orders / reservations)
```

## Calling the restaurant

Call **+1 (878) 284-9168** from any phone. Simran will greet you and can help with:
- Checking table availability
- Booking a table
- Placing a takeaway or dine-in order
- Checking your order status
