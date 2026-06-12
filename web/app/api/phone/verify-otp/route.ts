import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  const { phone, code } = await request.json();
  if (!phone || !code) return NextResponse.json({ error: "Phone and code required" }, { status: 400 });

  const { data } = await supabase
    .from("phone_verifications")
    .select("code_hash, expires_at")
    .eq("phone", phone)
    .single();

  if (!data) return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
  }

  const hash = crypto.createHash("sha256").update(code).digest("hex");
  if (hash !== data.code_hash) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  await supabase.from("phone_verifications").delete().eq("phone", phone);

  return NextResponse.json({ success: true });
}
