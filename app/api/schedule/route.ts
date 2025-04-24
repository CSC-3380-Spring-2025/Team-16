import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yutarvvbovvomsbtegrk.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const { data, error } = await supabase
    .from("user_transcripts")
    .select("credit")
    .eq("email", email)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const parsed = JSON.parse(data.credit || "{}");

  return NextResponse.json(parsed.Completed || []);
}
