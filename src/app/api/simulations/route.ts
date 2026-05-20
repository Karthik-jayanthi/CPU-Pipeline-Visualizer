import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const sb = await getSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, programText, config, resultSummary } = body;

  if (!name || !programText) {
    return NextResponse.json(
      { error: "name and programText are required" },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("simulations")
    .insert({
      user_id: user.id,
      name,
      description: description ?? null,
      program_text: programText,
      config,
      result_summary: resultSummary ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ simulation: data }, { status: 201 });
}

export async function GET() {
  const sb = await getSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("simulations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ simulations: data });
}
