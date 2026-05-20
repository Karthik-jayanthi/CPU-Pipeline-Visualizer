"use client";

import { getSupabaseBrowserClient } from "./client";
import type { SimulationRow, SimulationConfig } from "@/types/pipeline";

export async function saveSimulation(data: {
  name: string;
  description?: string;
  programText: string;
  config: SimulationConfig;
  resultSummary?: {
    totalCycles: number;
    cpi: number;
    stallCycles: number;
  };
}): Promise<SimulationRow | null> {
  const sb = getSupabaseBrowserClient();
  const { data: session } = await sb.auth.getSession();
  if (!session.session?.user) return null;

  const { data: row, error } = await sb
    .from("simulations")
    .insert({
      user_id: session.session.user.id,
      name: data.name,
      description: data.description ?? null,
      program_text: data.programText,
      config: data.config,
      result_summary: data.resultSummary ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("saveSimulation:", error.message);
    return null;
  }
  return row as SimulationRow;
}

export async function loadSimulations(): Promise<SimulationRow[]> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("simulations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("loadSimulations:", error.message);
    return [];
  }
  return data as SimulationRow[];
}

export async function deleteSimulation(id: string): Promise<boolean> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb.from("simulations").delete().eq("id", id);
  return !error;
}

export async function updateSimulation(
  id: string,
  updates: Partial<Pick<SimulationRow, "name" | "description" | "program_text" | "config" | "result_summary">>
): Promise<boolean> {
  const sb = getSupabaseBrowserClient();
  const { error } = await sb
    .from("simulations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}
