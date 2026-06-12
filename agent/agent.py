"""
Pepper & Pine — AI Voice Receptionist
Stack: LiveKit + Silero VAD + Deepgram STT + Groq LLM + ElevenLabs TTS

Run (browser test): py -3.11 agent.py dev
Run (production):   py -3.11 agent.py start
"""

import asyncio
import os
import re
from datetime import date as date_type
from typing import Annotated
from dotenv import load_dotenv
load_dotenv()

from livekit import rtc
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, ModelSettings, function_tool
from livekit.agents import llm as agents_llm
from livekit.plugins import deepgram, openai as lk_openai, silero, elevenlabs

from prompts import SYSTEM_PROMPT
import db as restaurant_db


def _split_list(s: str) -> list[str]:
    """Split on semicolons OR commas — LLMs use both."""
    return [x.strip() for x in re.split(r'[;,]', s) if x.strip()]


class RestaurantAgent(Agent):
    def __init__(self, caller_phone: str, profile_id: str | None):
        today = date_type.today().strftime("%B %d, %Y")
        instructions = SYSTEM_PROMPT + f"\n\nToday's date is {today}."
        super().__init__(instructions=instructions)
        self.caller_phone = caller_phone
        self.profile_id = profile_id

    @function_tool
    async def check_table_availability(
        self,
        date: Annotated[str, "Date to check in YYYY-MM-DD format"],
        meal_slot: Annotated[str, "Meal slot: breakfast, lunch, or dinner"],
        party_size: Annotated[int, "Number of guests"],
    ) -> str:
        """Check which tables are available for a given date, meal slot, and party size."""
        result = restaurant_db.check_table_availability(date, meal_slot, party_size)
        available = result["available"]

        if not available:
            return f"No tables are available for {meal_slot} on {date} for {party_size} guests."

        summary = []
        for t in available:
            label = t["type"].capitalize()
            cap = f"seats {t['capacity_min']} to {t['capacity_max']}"
            extra = " (rooftop, ₹500 extra)" if t["is_rooftop"] else ""
            summary.append(f"Table {t['table_number']} — {label}, {cap}{extra}")

        return f"Available tables for {meal_slot} on {date}: " + "; ".join(summary)

    @function_tool
    async def book_table(
        self,
        date: Annotated[str, "Reservation date in YYYY-MM-DD format"],
        meal_slot: Annotated[str, "Meal slot: breakfast, lunch, or dinner"],
        party_size: Annotated[int, "Number of guests"],
        table_id: Annotated[int, "Table ID to book (from check_table_availability)"],
        special_requests: Annotated[str, "Any special requests from the guest, or empty string"] = "",
    ) -> str:
        """Book a specific table for the caller."""
        result = restaurant_db.book_table(
            profile_id=self.profile_id,
            caller_phone=self.caller_phone,
            date=date,
            meal_slot=meal_slot,
            party_size=party_size,
            table_id=table_id,
            special_requests=special_requests,
        )
        if result["success"]:
            return (
                f"Table booked successfully! Reservation ID: {result['reservation_id']}. "
                f"Table {table_id} confirmed for {meal_slot} on {date} for {party_size} guests."
            )
        return f"Could not complete booking: {result['error']}"

    @function_tool
    async def get_my_reservation(
        self,
        date: Annotated[str, "Date in YYYY-MM-DD format"],
        meal_slot: Annotated[str, "Meal slot: breakfast, lunch, or dinner"],
    ) -> str:
        """Look up the caller's existing reservation for a given date and meal slot."""
        res = restaurant_db.get_reservation_by_phone(self.caller_phone, date, meal_slot)
        if not res:
            return f"No confirmed reservation found for {meal_slot} on {date} for this phone number."
        tbl = res.get("restaurant_tables", {})
        table_type = tbl.get("type", "unknown") if tbl else "unknown"
        return (
            f"Found reservation ID {res['id']} — {table_type} table for {res['party_size']} guests "
            f"at {meal_slot} on {date}."
        )

    @function_tool
    async def place_takeaway_order(
        self,
        item_names: Annotated[str, "Semicolon-separated item names exactly as on the menu, e.g. 'French Fries;Dal Makhani'"],
        quantities: Annotated[str, "Semicolon-separated quantities (integers) for each item in the same order, e.g. '1;2'"],
        unit_prices: Annotated[str, "Semicolon-separated unit prices in rupees for each item in the same order, e.g. '330;335'"],
        variants: Annotated[str, "Semicolon-separated variants (Veg/Chicken/Prawn/etc) for each item; use empty string for items with no variant, e.g. ';Chicken'"] = "",
    ) -> str:
        """Place a takeaway order. Call ONLY after the customer has told you every item they want — never call before collecting all items."""
        names = _split_list(item_names)
        if not names:
            return "No items provided. Please ask the customer what they want to order first."

        try:
            qtys = [int(q) for q in _split_list(quantities)]
            prices = [int(float(p)) for p in _split_list(unit_prices)]
        except ValueError:
            return "Invalid quantities or prices — quantities must be whole numbers and prices must be numbers."

        if len(qtys) != len(names) or len(prices) != len(names):
            return f"Mismatch: {len(names)} items but {len(qtys)} quantities and {len(prices)} prices. Please try again."

        var_list = _split_list(variants) if variants else []
        # Replace placeholder "null"/"none" with empty string
        var_list = ["" if v.lower() in ("null", "none", "-") else v for v in var_list]
        while len(var_list) < len(names):
            var_list.append("")

        items = [
            {"item_name": names[i], "variant": var_list[i], "quantity": qtys[i], "unit_price": prices[i]}
            for i in range(len(names))
        ]
        result = restaurant_db.place_order(
            profile_id=self.profile_id,
            caller_phone=self.caller_phone,
            order_type="takeaway",
            items=items,
        )
        if result["success"]:
            return (
                f"Takeaway order placed! Order ID: {result['order_id']}. "
                f"Total: ₹{result['total']}. "
                f"Ready for pickup in {result['prep_minutes']} minutes."
            )
        return f"Could not place order: {result['error']}"

    @function_tool
    async def check_order_status(self) -> str:
        """Check how much time is left for the caller's most recent active takeaway order."""
        if not self.caller_phone:
            return "I'm unable to look up your order without a phone number on file."

        status = restaurant_db.get_order_status(self.caller_phone)
        if not status:
            return "I don't see any active takeaway orders linked to your number right now."

        if status["is_ready"]:
            return (
                f"Your order is ready! You can come pick it up anytime. "
                f"Order ID: {status['order_id']}."
            )

        return (
            f"Your order should be ready in about {status['minutes_remaining']} minutes. "
            f"Order ID: {status['order_id']}."
        )

    @function_tool
    async def place_dine_in_order(
        self,
        date: Annotated[str, "Reservation date in YYYY-MM-DD format"],
        meal_slot: Annotated[str, "Meal slot of the reservation: breakfast, lunch, or dinner"],
        item_names: Annotated[str, "Semicolon-separated item names exactly as on the menu, e.g. 'Dal Makhani;Butter Naan'"],
        quantities: Annotated[str, "Semicolon-separated quantities (integers) for each item, e.g. '1;2'"],
        unit_prices: Annotated[str, "Semicolon-separated unit prices in rupees for each item, e.g. '335;95'"],
        variants: Annotated[str, "Semicolon-separated variants (Veg/Chicken/etc) for each item; use empty string for items with no variant"] = "",
    ) -> str:
        """Place a dine-in food order linked to the caller's existing reservation. Call ONLY after collecting all items."""
        res = restaurant_db.get_reservation_by_phone(self.caller_phone, date, meal_slot)
        if not res:
            return (
                "No confirmed reservation found for this phone number. "
                "A table reservation is required before placing a dine-in order."
            )

        names = _split_list(item_names)
        if not names:
            return "No items provided. Please ask the customer what they want to order first."

        try:
            qtys = [int(q) for q in _split_list(quantities)]
            prices = [int(float(p)) for p in _split_list(unit_prices)]
        except ValueError:
            return "Invalid quantities or prices."

        if len(qtys) != len(names) or len(prices) != len(names):
            return f"Mismatch: {len(names)} items but {len(qtys)} quantities and {len(prices)} prices."

        var_list = _split_list(variants) if variants else []
        var_list = ["" if v.lower() in ("null", "none", "-") else v for v in var_list]
        while len(var_list) < len(names):
            var_list.append("")

        items = [
            {"item_name": names[i], "variant": var_list[i], "quantity": qtys[i], "unit_price": prices[i]}
            for i in range(len(names))
        ]
        result = restaurant_db.place_order(
            profile_id=self.profile_id,
            caller_phone=self.caller_phone,
            order_type="dine_in",
            items=items,
            reservation_id=res["id"],
        )
        if result["success"]:
            return (
                f"Dine-in order placed! Order ID: {result['order_id']}. "
                f"Total: ₹{result['total']}. Your food will be ready when you arrive."
            )
        return f"Could not place order: {result['error']}"


async def entrypoint(ctx: JobContext):
    await ctx.connect()
    participant = await ctx.wait_for_participant()

    if participant is None:
        return

    # SIP participant kind = 3 in the protobuf enum
    is_sip = (int(participant.kind) == 3)
    caller_phone = ""

    if is_sip:
        # Primary source: phone written by call_me.py before the call
        caller_file = os.path.join(os.path.dirname(__file__), ".caller_phone")
        try:
            with open(caller_file) as f:
                caller_phone = f.read().strip()
            os.remove(caller_file)
        except Exception:
            caller_phone = ""

        # Fallback: SIP participant attributes
        if not caller_phone:
            attrs = dict(participant.attributes) if participant.attributes else {}
            caller_phone = (
                attrs.get("sip.callTo")
                or attrs.get("sip.phoneNumber")
                or attrs.get("sip.callFrom")
                or ""
            )

        print(f"[CALL] SIP call — caller_phone: {caller_phone or 'unknown'}")
    else:
        print("[CALL] Browser/playground session")

    profile_id = restaurant_db.get_or_create_guest_profile(caller_phone) if caller_phone else None

    stt_model = "nova-2-phonecall" if is_sip else "nova-2-general"

    session = AgentSession(
        stt=deepgram.STT(model=stt_model, language="en"),
        llm=lk_openai.LLM(
            model="llama-3.3-70b-versatile",
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
        ),
        tts=elevenlabs.TTS(
            model="eleven_turbo_v2_5",
            # Simran voice — replace with an Indian English female voice from elevenlabs.io/voice-library
            # Current default: "Sarah". Browse voices at elevenlabs.io and paste the voice ID here.
            voice_id=os.getenv("ELEVENLABS_VOICE_ID") or "EXAVITQu4vr4xnSDxMaL",
            api_key=os.getenv("ELEVENLABS_API_KEY"),
        ),
        vad=silero.VAD.load(
            sample_rate=8000,
            min_silence_duration=0.2,
            min_speech_duration=0.05,
        ),
        allow_interruptions=True,
        min_endpointing_delay=0.1,
        max_endpointing_delay=0.8,
    )

    agent = RestaurantAgent(caller_phone=caller_phone, profile_id=profile_id)

    await session.start(agent, room=ctx.room)
    # Wait for SIP audio track to fully establish before speaking
    await asyncio.sleep(1.5)
    await session.say(
        "Thank you for calling Pepper and Pine! This is Simran speaking. How can I help you today?"
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, num_idle_processes=1, load_threshold=0.95))
