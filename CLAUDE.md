# Pepper & Pine — Claude Code Context

## What this project is
AI voice receptionist for a restaurant. Customers call a Twilio number, get connected to "Simran" (LiveKit voice agent), and can reserve tables, place takeaway/dine-in orders, and check order status over a real phone call. There's a customer web dashboard and a kitchen admin dashboard.

## Deployed infrastructure
- **Agent**: Railway (Python, LiveKit agents)
- **Web app**: Vercel (Next.js)
- **Database**: Supabase
- **Phone number**: +18782849168 (Twilio)
- **LiveKit project SIP host**: `4hpz5eqtgpm.sip.livekit.cloud`

## How inbound calls work
1. Customer calls +18782849168
2. Twilio executes a **TwiML Bin** that dials `sip:pepperpine@4hpz5eqtgpm.sip.livekit.cloud`
   - Uses alias `pepperpine` (not the phone number) to avoid FROM==TO SIP rejection loop
3. LiveKit inbound trunk `ST_Md62kY45LxMm` matches the call
4. Dispatch rule `SDR_UdKzFhJtR2qP` (alias rule) routes to room `restaurant-call`
5. Agent joins the room and Simran greets the caller

## Caller phone number detection (agent/agent.py)
For inbound calls via TwiML Bin, the SIP leg's `to` is a SIP URI (`sip:pepperpine@...`), not a phone number. The logic is:
- If `to_num` starts with `+` and isn't the Twilio number → use `to_num` (call_me.py flow)
- Otherwise → use `from_num` (inbound call flow, from=caller's number)

## Orders/reservations on dashboard (web/app/dashboard/page.tsx)
Dashboard queries by `user_id OR caller_phone` so phone-placed orders always appear even if the SIP leg couldn't resolve the profile_id. The user's phone comes from `profiles.phone`.

## LLM
Using `llama-3.3-70b-versatile` via Groq (OpenAI-compatible endpoint). `llama3-groq-70b-8192-tool-use-preview` is **decommissioned** — do not use it.

## Key files
| File | Purpose |
|---|---|
| `agent/agent.py` | Main agent, entrypoint, SIP caller detection |
| `agent/prompts.py` | Simran's system prompt and full menu |
| `agent/db.py` | All Supabase DB operations |
| `agent/call_me.py` | Dev utility: have Twilio call your phone directly |
| `agent/setup_sip.py` | One-time LiveKit SIP trunk + dispatch rule setup |
| `agent/check_sip.py` | Inspect current LiveKit SIP configuration |
| `web/app/dashboard/page.tsx` | Customer dashboard |
| `web/app/admin/dashboard/page.tsx` | Kitchen dashboard |

## Twilio trial balance note
As of this session: ~$5.74 remaining. Inbound calls (~$0.0085/min) burn 2.5x slower than outbound to India (~$0.021/min). Prefer inbound testing.

## Do not do
- Do not add `Co-Authored-By` to commit messages — user does not want Claude appearing as a GitHub contributor
- Do not use `llama3-groq-70b-8192-tool-use-preview` (decommissioned)
