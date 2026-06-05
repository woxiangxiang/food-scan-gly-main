import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { giLabel, giLevel } from "@/data/foods";
import { useAuth } from "@/hooks/use-auth";
import { useFoods } from "@/hooks/use-foods";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "拍照识别 · 控糖助手" },
      { name: "description", content: "拍照或上传图片，AI 识别食物并给出升糖指数与建议。" },
    ],
  }),
  component: DetectPage,
});

const MAX_SIZE = 3 * 1024 * 1024;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:3002";

type RecognitionResult = {
  food: string;
  gi: number | null;
  diabetesFriendly: boolean | null;
  advice: string;
  portion: string;
  nutrition: {
    calories: string | number | null;
    carbohydrates: string | number | null;
    protein: string | number | null;
    fat: string | number | null;
    fiber: string | number | null;
  };
  error?: string;
};

function getApiBaseUrl() {
  if (API_BASE_URL) return API_BASE_URL;
  if (import.meta.env.DEV) return DEFAULT_LOCAL_API_BASE_URL;
  throw new Error("VITE_API_BASE_URL is not configured in Vercel");
}

function getGiType(gi: number | null): "low" | "medium" | "high" {
  if (gi == null || gi <= 55) return "low";
  if (gi <= 70) return "medium";
  return "high";
}

function createFoodItemId(name: string) {
  const slug = Array.from(name.trim().toLowerCase())
    .map((char) => (/[\w-]/.test(char) ? char : char.codePointAt(0)?.toString(36) ?? "x"))
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `user-${slug || crypto.randomUUID()}`;
}

function fileToBase64(file: File): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const str = reader.result as string;
      const [meta, b64] = str.split(",");
      const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/jpeg";
      resolve({ b64, mime });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DetectPage() {
  const auth = useAuth();
  const { foods } = useFoods();
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const autoSavingKeyRef = useRef("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoSavedKey, setAutoSavedKey] = useState("");
  const [savingHistory, setSavingHistory] = useState(false);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_SIZE) throw new Error("图片需小于 3MB");
      const { b64, mime } = await fileToBase64(file);
      setPreview(URL.createObjectURL(file));
      setSelectedFile(file);
      setAutoSavedKey("");

      const apiBaseUrl = getApiBaseUrl();
      let response: Response;

      try {
        response = await fetch(`${apiBaseUrl}/api/recognize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
        });
      } catch {
        throw new Error(
          `Cannot reach recognition API at ${apiBaseUrl}. Check VITE_API_BASE_URL and Render CORS_ORIGIN.`,
        );
      }

      const text = await response.text();
      let data: RecognitionResult;

      try {
        data = JSON.parse(text) as RecognitionResult;
      } catch {
        throw new Error(text.slice(0, 200) || "后端没有返回有效 JSON");
      }

      if (!response.ok) {
        throw new Error(data.error || "识别失败");
      }

      return data;
    },
    onError: (error: Error) => toast.error(error.message || "识别失败"),
  });

  const result = mutation.data;
  const level = result?.gi != null ? giLevel(result.gi) : null;
  const matchedFood = useMemo(() => {
    if (!result?.food) return null;
    const name = result.food.trim();
    return (
      foods.find((food) => food.name === name) ||
      foods.find((food) => name.includes(food.name) || food.name.includes(name)) ||
      null
    );
  }, [foods, result?.food]);
  const isKnownFood = Boolean(matchedFood);

  const requireLogin = () => {
    if (auth.loading) {
      toast.info("正在读取登录状态，请稍后再试");
      return false;
    }

    if (!auth.user) {
      toast.error("请先到“我的”页面登录");
      return false;
    }

    return true;
  };

  const createFoodItemFromRecognition = async () => {
    if (!result || !selectedFile || !auth.user) return null;

    const name = result.food?.trim();
    if (!name) return null;

    const { data: existingFood } = await supabase
      .from("food_items")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existingFood?.id) return existingFood as { id: string };

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const imagePath = `user-submitted/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("food-images")
      .upload(imagePath, selectedFile, {
        contentType: selectedFile.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage.from("food-images").getPublicUrl(imagePath);
    const { data: foodItem, error: foodError } = await supabase
      .from("food_items")
      .insert({
        id: createFoodItemId(name),
        name,
        gi: result.gi ?? 0,
        gi_type: getGiType(result.gi),
        description: result.advice || "",
        storage_bucket: "food-images",
        storage_object_path: imagePath,
        image_url: publicUrl.publicUrl,
      })
      .select("id")
      .single();

    if (foodError) {
      const { data: concurrentFood } = await supabase
        .from("food_items")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (concurrentFood?.id) return concurrentFood as { id: string };
      throw foodError;
    }

    return foodItem as { id: string };
  };

  const saveRecognition = async ({ quiet = false }: { quiet?: boolean } = {}) => {
    if (!result || !requireLogin()) return false;

    setSavingHistory(true);
    let foodId = matchedFood?.id ?? null;

    try {
      if (!foodId) {
        const createdFood = await createFoodItemFromRecognition();
        foodId = createdFood?.id ?? null;
      }
    } catch (error) {
      setSavingHistory(false);
      toast.error(error instanceof Error ? error.message : "图片保存失败");
      return false;
    }

    const { error } = await supabase.from("food_recognitions").insert({
      user_id: auth.user!.id,
      food_name: result.food || "未识别",
      gi: result.gi,
      diabetes_friendly: result.diabetesFriendly,
      advice: result.advice || "",
      portion: result.portion || "",
      nutrition: result.nutrition,
      is_known_food: Boolean(foodId),
      matched_food_id: foodId,
      image_bucket: null,
      image_path: null,
      image_mime_type: selectedFile?.type || null,
    });
    setSavingHistory(false);

    if (error) {
      toast.error(error.message);
      return false;
    }

    if (!quiet) toast.success(isKnownFood ? "已置顶到食物页" : "已收录到主库并置顶");
    return true;
  };

  useEffect(() => {
    if (!result || !auth.user || !selectedFile) return;
    const key = `${result.food}:${result.gi}:${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`;
    if (autoSavedKey === key || autoSavingKeyRef.current === key) return;

    autoSavingKeyRef.current = key;
    setAutoSavedKey(key);
    saveRecognition({ quiet: true }).then(() => {
      autoSavingKeyRef.current = "";
    });
  }, [auth.user, autoSavedKey, isKnownFood, result, selectedFile]);

  const onPick = (file?: File | null) => {
    if (!file) return;
    mutation.mutate(file);
  };

  return (
    <main className="flex flex-col gap-4 px-4 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">控糖助手</h1>
          <p className="text-sm text-muted-foreground">拍一拍，看看升糖指数</p>
        </div>
        <Sparkles className="size-6 text-primary" />
      </header>

      <div className="rounded-2xl border border-dashed border-border bg-card p-4">
        {preview ? (
          <div className="overflow-hidden rounded-xl">
            <img src={preview} alt="预览" className="aspect-square w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[5/3] items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
            <div className="text-center">
              <ImagePlus className="mx-auto mb-2 size-8" />
              <p className="text-sm">拍照或者从相册选择</p>
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="default" onClick={() => cameraRef.current?.click()} disabled={mutation.isPending}>
            <Camera className="size-4" /> 拍照
          </Button>
          <Button variant="secondary" onClick={() => albumRef.current?.click()} disabled={mutation.isPending}>
            <ImagePlus className="size-4" /> 相册
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => onPick(event.target.files?.[0])}
        />
        <input
          ref={albumRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onPick(event.target.files?.[0])}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">识别结果</h2>
        {mutation.isPending ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <p className="text-sm">AI 正在识别中...</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">食物</p>
                <p className="text-xl font-semibold">{result.food || "未识别"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isKnownFood ? "已在主库中，原图将置顶" : "新食物将直接收录到主库"}
                </p>
              </div>
              {result.gi != null ? (
                <div
                  className={`rounded-2xl px-4 py-2 text-right ${
                    level === "low"
                      ? "bg-gi-low-soft text-gi-low"
                      : level === "mid"
                        ? "bg-gi-mid-soft text-gi-mid"
                        : "bg-gi-high-soft text-gi-high"
                  }`}
                >
                  <p className="text-3xl font-bold leading-none">{result.gi}</p>
                  <p className="mt-1 text-xs">{giLabel(result.gi)}</p>
                </div>
              ) : (
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  无 GI 数据
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">是否适合糖尿病患者</p>
                <p className="mt-1 font-medium">
                  {result.diabetesFriendly == null
                    ? "需结合用量判断"
                    : result.diabetesFriendly
                      ? "相对适合"
                      : "不太适合"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">用量</p>
                <p className="mt-1 font-medium">{result.portion || "建议少量尝试"}</p>
              </div>
            </div>

            {result.advice && (
              <div className="rounded-xl bg-muted/60 p-3 text-sm leading-relaxed text-foreground/80">
                <p className="mb-1 text-xs text-muted-foreground">建议</p>
                <p>{result.advice}</p>
              </div>
            )}

            <div className="rounded-xl bg-muted/60 p-3">
              <p className="mb-2 text-xs text-muted-foreground">营养成分估算</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span>热量：{result.nutrition.calories ?? "未知"}</span>
                <span>碳水：{result.nutrition.carbohydrates ?? "未知"}</span>
                <span>蛋白质：{result.nutrition.protein ?? "未知"}</span>
                <span>脂肪：{result.nutrition.fat ?? "未知"}</span>
                <span>膳食纤维：{result.nutrition.fiber ?? "未知"}</span>
              </div>
            </div>

            <Button variant="secondary" onClick={() => saveRecognition()} disabled={savingHistory}>
              <Save className="size-4" />
              {savingHistory ? "保存中..." : isKnownFood ? "置顶到食物页" : "收录并置顶"}
            </Button>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            选择一张食物图片开始识别
          </p>
        )}
      </section>
    </main>
  );
}
