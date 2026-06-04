import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.API_PORT || process.env.PORT || 3002);
const model = process.env.QWEN_VL_MODEL || "qwen-vl-max";

app.use(express.json({ limit: "10mb" }));

function isLocalDevOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin =
    process.env.CORS_ORIGIN || (origin && isLocalDevOrigin(origin) ? origin : "http://localhost:5173");

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const fallbackResult = {
  food: "未识别",
  gi: null,
  diabetesFriendly: null,
  advice: "请尝试上传更清晰、主体更明确的食物图片。",
  portion: "",
  nutrition: {
    calories: null,
    carbohydrates: null,
    protein: null,
    fat: null,
    fiber: null,
  },
};

function toImageUrl(imageBase64, mimeType = "image/jpeg") {
  if (typeof imageBase64 !== "string") return "";
  if (imageBase64.startsWith("data:image/")) return imageBase64;
  return `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;
}

function parseJsonContent(content) {
  if (!content) return {};

  const cleaned = String(content)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return {};

    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function normalizeResult(raw) {
  const nutrition = raw.nutrition || raw["营养成分估算"] || {};

  return {
    food: String(raw.food || raw["食物"] || fallbackResult.food),
    gi: typeof raw.gi === "number" ? raw.gi : typeof raw["GI数值"] === "number" ? raw["GI数值"] : null,
    diabetesFriendly:
      typeof raw.diabetesFriendly === "boolean"
        ? raw.diabetesFriendly
        : typeof raw["是否适合糖尿病患者"] === "boolean"
          ? raw["是否适合糖尿病患者"]
          : null,
    advice: String(raw.advice || raw["建议"] || fallbackResult.advice),
    portion: String(raw.portion || raw["用量"] || raw["食用量"] || ""),
    nutrition: {
      calories: nutrition.calories ?? nutrition["热量"] ?? null,
      carbohydrates: nutrition.carbohydrates ?? nutrition.carbs ?? nutrition["碳水化合物"] ?? null,
      protein: nutrition.protein ?? nutrition["蛋白质"] ?? null,
      fat: nutrition.fat ?? nutrition["脂肪"] ?? null,
      fiber: nutrition.fiber ?? nutrition["膳食纤维"] ?? null,
    },
  };
}

function getErrorStatus(error) {
  const status = error?.status || error?.code;
  if (typeof status === "number" && status >= 400 && status < 600) return status;
  return 500;
}

function getClientErrorMessage(error) {
  const message = error instanceof Error ? error.message : "识别失败";
  const status = getErrorStatus(error);

  if (status === 401 || status === 403) {
    return "DashScope API Key 无效或没有模型调用权限";
  }

  if (status === 429) {
    return "DashScope 请求过于频繁，请稍后再试";
  }

  if (status === 400) {
    return `DashScope 拒绝了请求：${message}`;
  }

  return message;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/debug/config", (_req, res) => {
  res.json({
    ok: true,
    hasDashScopeApiKey: Boolean(process.env.DASHSCOPE_API_KEY),
    model,
  });
});

app.post("/api/recognize", async (req, res) => {
  try {
    if (!process.env.DASHSCOPE_API_KEY) {
      res.status(500).json({ error: "缺少环境变量 DASHSCOPE_API_KEY" });
      return;
    }

    const { imageBase64, mimeType } = req.body || {};
    if (typeof imageBase64 !== "string" || imageBase64.length < 20) {
      res.status(400).json({ error: "请上传 base64 格式的图片数据" });
      return;
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是一名面向糖尿病患者的食物图像识别和营养评估助手。必须只返回 JSON，不要返回 Markdown 或解释文字。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "请识别图片中的主要食物，并评估它对糖尿病患者的适合程度。只返回 JSON，字段必须为：food 字符串，gi 数字或 null，diabetesFriendly 布尔值或 null，advice 字符串，portion 字符串，nutrition 对象。nutrition 对象包含 calories、carbohydrates、protein、fat、fiber，单位请写在值里，如 '约 180 千卡' 或 '约 30 克'。如果无法判断，请给出保守估算。",
            },
            {
              type: "image_url",
              image_url: {
                url: toImageUrl(imageBase64, mimeType),
              },
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices?.[0]?.message?.content || "";
    const parsed = parseJsonContent(content);
    const result = normalizeResult(parsed);

    if (result.food === fallbackResult.food && content) {
      console.warn("Qwen-VL returned non-JSON content:", content.slice(0, 500));
    }

    res.json({
      ...result,
      model: response.model || model,
    });
  } catch (error) {
    const message = getClientErrorMessage(error);
    console.error("Qwen-VL recognition failed:", error);
    res.status(getErrorStatus(error)).json({
      ...fallbackResult,
      error: message,
    });
  }
});

app.listen(port, () => {
  console.log(`Food scan API server listening on http://localhost:${port}`);
});
