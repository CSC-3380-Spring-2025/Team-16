import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_transcripts")
    .select("credit")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const credit = JSON.parse(data.credit || "{}");
  const schedule = Object.entries(credit.Completed || {}).map(([term, courses]) => ({
    term: `Semester ${term}`,
    courses: courses.map((code: string) => ({
      code,
      title: "", // placeholder: optionally fetch from course catalog
      credits: 3, // placeholder
    }))
  }));

  return NextResponse.json(schedule);
}
