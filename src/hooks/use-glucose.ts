import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export interface GlucoseEntry {
  id: string;
  value: number;
  timestamp: number;
}

type GlucoseRow = {
  id: string;
  value: number | string;
  measured_at: string;
};

function mapRow(row: GlucoseRow): GlucoseEntry {
  return {
    id: row.id,
    value: Number(row.value),
    timestamp: new Date(row.measured_at).getTime(),
  };
}

export function useGlucose(userId: string) {
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("glucose_entries")
      .select("id,value,measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: true });

    if (error) {
      setLoading(false);
      throw error;
    }

    setEntries((data ?? []).map(mapRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load().catch((error) => {
      console.error("Failed to load glucose entries:", error);
      setLoading(false);
    });
  }, [load]);

  const add = useCallback(
    async (value: number) => {
      const measuredAt = new Date().toISOString();
      const { data, error } = await supabase
        .from("glucose_entries")
        .insert({
          user_id: userId,
          value,
          measured_at: measuredAt,
          measurement_type: "unspecified",
        })
        .select("id,value,measured_at")
        .single();

      if (error) throw error;

      setEntries((current) => [...current, mapRow(data)].sort((a, b) => a.timestamp - b.timestamp));
    },
    [userId],
  );

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("glucose_entries").delete().eq("id", id);
    if (error) throw error;

    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  return { entries, loading, add, remove, reload: load };
}
