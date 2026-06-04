import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { FOODS } from "@/data/foods";

const Input = z.object({
  imageBase64: z.string().min(20),
  mimeType: z.string().default("image/jpeg"),
});

export const recognizeFood = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("缺少 LOVABLE_API_KEY");

    const foodList = FOODS.map((f) => f.name).join("、");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              `你是一名营养识别助手。识别图片中的主要食物，并尽量从下列已知食物清单中匹配最接近的一个名称：${foodList}。` +
              `严格只输出 JSON，无任何解释、无 markdown 代码块。格式：{"name":"中文菜名","confidence":0~1,"matchedId":"如能匹配则填食物id否则空字符串","gi":数字或null,"advice":"一句控糖建议"}。`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "请识别这张图片中的食物。" },
              {
                type: "image_url",
                image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("识别请求过于频繁，请稍后再试");
      if (res.status === 402) throw new Error("AI 额度已用完，请联系管理员");
      throw new Error(`识别失败：${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json|```/g, "").trim();

    let parsed: {
      name: string;
      confidence: number;
      matchedId: string;
      gi: number | null;
      advice: string;
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { name: "", confidence: 0, gi: null, advice: "未能识别，请尝试更清晰的图片", matchedId: "" };
    }

    // Match against our food DB
    let matched = FOODS.find((f) => f.id === parsed.matchedId);
    if (!matched && parsed.name) {
      matched = FOODS.find((f) => parsed.name.includes(f.name) || f.name.includes(parsed.name));
    }

    return {
      name: parsed.name || matched?.name || "未识别",
      confidence: parsed.confidence ?? 0,
      gi: matched?.gi ?? parsed.gi ?? null,
      advice: parsed.advice || matched?.description || "",
      matchedId: matched?.id ?? "",
    };
  });
