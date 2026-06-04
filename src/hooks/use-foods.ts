import { useEffect, useState } from "react";

import { FOODS, type Food, type FoodType } from "@/data/foods";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type FoodRow = {
  id: string;
  name: string;
  gi: number;
  gi_type: FoodType;
  description: string;
  image_url: string;
};

type RecognitionRow = {
  id: string;
  food_name: string;
  gi: number | null;
  advice: string;
  image_bucket: string | null;
  image_path: string | null;
  created_at: string;
};

function mapRow(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    gi: row.gi,
    type: row.gi_type,
    description: row.description,
    image: row.image_url,
    source: "library",
  };
}

export function useFoods() {
  const auth = useAuth();
  const [foods, setFoods] = useState<Food[]>(FOODS);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("food_items")
        .select("id,name,gi,gi_type,description,image_url")
        .order("gi", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error("Failed to load food items:", error);
        setLoading(false);
        return;
      }

      const libraryFoods = data && data.length > 0 ? data.map((row) => mapRow(row as FoodRow)) : FOODS;
      let recognitionFoods: Food[] = [];

      if (auth.user) {
        const { data: recognitions, error: recognitionError } = await supabase
          .from("food_recognitions")
          .select("id,food_name,gi,advice,image_bucket,image_path,created_at")
          .eq("user_id", auth.user.id)
          .not("image_path", "is", null)
          .order("created_at", { ascending: false })
          .limit(12);

        if (recognitionError) {
          console.error("Failed to load recognition images:", recognitionError);
        } else {
          recognitionFoods = await Promise.all(
            (recognitions ?? []).map(async (row) => {
              const recognition = row as RecognitionRow;
              let image = "";

              if (recognition.image_bucket && recognition.image_path) {
                const { data: signed } = await supabase.storage
                  .from(recognition.image_bucket)
                  .createSignedUrl(recognition.image_path, 60 * 60);
                image = signed?.signedUrl ?? "";
              }

              return {
                id: `recognition-${recognition.id}`,
                name: recognition.food_name,
                gi: recognition.gi ?? 0,
                type: recognition.gi == null ? "low" : recognition.gi <= 55 ? "low" : recognition.gi <= 70 ? "medium" : "high",
                description: recognition.advice || "来自你的拍照识别记录",
                image,
                source: "recognition" as const,
              };
            }),
          );
          recognitionFoods = recognitionFoods.filter((food) => food.image);
        }
      }

      setFoods([...recognitionFoods, ...libraryFoods]);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [auth.user]);

  return { foods, loading };
}
