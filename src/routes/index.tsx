import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Loader2, ImagePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { recognizeFood } from "@/lib/api/recognize.functions";
import { giLabel, giLevel } from "@/data/foods";
import { Button } from "@/components/ui/button";

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
  const recognize = useServerFn(recognizeFood);
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_SIZE) throw new Error("图片需小于 3MB");
      const { b64, mime } = await fileToBase64(file);
      setPreview(URL.createObjectURL(file));
      return recognize({ data: { imageBase64: b64, mimeType: mime } });
    },
    onError: (e: Error) => toast.error(e.message || "识别失败"),
  });

  const onPick = (f?: File | null) => {
    if (!f) return;
    mutation.mutate(f);
  };

  const result = mutation.data;
  const level = result?.gi != null ? giLevel(result.gi) : null;

  return (
    <main className="flex flex-col gap-4 px-4 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">控糖助手</h1>
          <p className="text-sm text-muted-foreground">拍一拍，看看升糖指数</p>
        </div>
        <Sparkles className="size-6 text-primary" />
      </header>

      {/* D-A: pick area */}
      <div className="rounded-2xl border border-dashed border-border bg-card p-4">
        {preview ? (
          <div className="overflow-hidden rounded-xl">
            <img src={preview} alt="预览" className="aspect-square w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[5/3] items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
            <div className="text-center">
              <ImagePlus className="mx-auto mb-2 size-8" />
              <p className="text-sm">拍照或者相册选择</p>
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="default"
            onClick={() => cameraRef.current?.click()}
            disabled={mutation.isPending}
          >
            <Camera className="size-4" /> 拍照
          </Button>
          <Button
            variant="secondary"
            onClick={() => albumRef.current?.click()}
            disabled={mutation.isPending}
          >
            <ImagePlus className="size-4" /> 相册
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <input
          ref={albumRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>

      {/* D-B: result */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">识别结果</h2>
        {mutation.isPending ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            <p className="text-sm">AI 正在识别中…</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">食物</p>
                <p className="text-xl font-semibold">{result.name || "未识别"}</p>
                {result.confidence > 0 && (
                  <p className="text-xs text-muted-foreground">
                    置信度 {(result.confidence * 100).toFixed(0)}%
                  </p>
                )}
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
            {result.advice && (
              <p className="rounded-xl bg-muted/60 p-3 text-sm leading-relaxed text-foreground/80">
                💡 {result.advice}
              </p>
            )}
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
