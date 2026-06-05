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
  matched_food_id: string | null;
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
      let pinnedFoodIds: string[] = [];

      if (auth.user) {
        const { data: recognitions, error: recognitionError } = await supabase
          .from("food_recognitions")
          .select("matched_food_id")
          .eq("user_id", auth.user.id)
          .not("matched_food_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(20);

        if (recognitionError) {
          console.error("Failed to load recognition pins:", recognitionError);
        } else {
          const libraryFoodIds = new Set(libraryFoods.map((food) => food.id));
          const seenPinnedFoodIds = new Set<string>();
          const userRecognitions = (recognitions ?? []).map((row) => row as RecognitionRow);

          pinnedFoodIds = userRecognitions
            .map((recognition) => recognition.matched_food_id)
            .filter((id): id is string => typeof id === "string" && libraryFoodIds.has(id))
            .filter((id) => {
              if (seenPinnedFoodIds.has(id)) return false;
              seenPinnedFoodIds.add(id);
              return true;
            });
        }
      }

      const pinnedFoodIdSet = new Set(pinnedFoodIds);
      const pinnedLibraryFoods = pinnedFoodIds
        .map((id) => libraryFoods.find((food) => food.id === id))
        .filter((food): food is Food => Boolean(food));
      const unpinnedLibraryFoods = libraryFoods.filter((food) => !pinnedFoodIdSet.has(food.id));

      setFoods([...pinnedLibraryFoods, ...unpinnedLibraryFoods]);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [auth.user]);

  return { foods, loading };
}
