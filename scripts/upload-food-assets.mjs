import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const bucket = "food-images";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL in .env");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env. Use the Supabase service_role key locally only.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const contentTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const descriptions = new Map([
  ["绿豆", "低 GI 杂豆，富含膳食纤维，可替代部分主食。"],
  ["红豆", "低 GI 豆类，建议少糖烹煮，控制总量。"],
  ["莲藕", "升糖相对温和，注意它仍含淀粉，适量食用。"],
  ["小米粥", "比白米粥温和，但粥类消化快，建议搭配蛋白质。"],
  ["荞麦面", "杂粮面食，升糖较慢，适合作为主食替换。"],
  ["芋头", "低到中等升糖，作为主食时需减少米饭面食。"],
  ["冬瓜", "低 GI 蔬菜，热量低，适合日常搭配。"],
  ["豆腐", "优质植物蛋白，几乎不明显升糖。"],
  ["黄豆芽", "低 GI 蔬菜，富含植物蛋白和膳食纤维。"],
  ["黄瓜", "低热量低 GI，适合作为加餐或配菜。"],
  ["红薯粉丝", "中 GI 主食类，口感顺滑但碳水较高，需控量。"],
  ["糙米饭", "保留谷物纤维，比白米饭更适合控糖。"],
  ["刀削面", "中 GI 面食，建议搭配蔬菜和蛋白质降低餐后波动。"],
  ["馄饨", "中 GI，皮含精制面粉，注意数量和汤底油脂。"],
  ["馒头", "中高 GI 面食，建议半个起步并搭配菜肉。"],
  ["粽子", "糯米制品黏性强，消化快，建议少量尝试。"],
  ["玉米", "中 GI 粗粮，适合作为部分主食替换。"],
  ["八宝粥", "中 GI，若额外加糖会明显增加升糖风险。"],
  ["薏仁", "中 GI 谷物，建议与豆类、蔬菜搭配。"],
  ["山药", "淀粉类蔬菜，作为主食替换时更合适。"],
  ["油条", "高 GI 且高油脂，控糖人群建议尽量避免。"],
  ["炒米粉", "高 GI 主食，油脂和碳水都偏高，建议少吃。"],
  ["白米粥", "煮烂后吸收快，容易带来餐后血糖波动。"],
  ["白米饭", "精制碳水，升糖快，建议搭配蔬菜与蛋白质。"],
  ["糯米饭", "糯米黏性强、升糖快，建议严格控制份量。"],
  ["叉烧酥", "高 GI 且高油高糖，建议偶尔少量。"],
  ["月饼", "糖和脂肪含量高，建议切小块分享食用。"],
  ["炸春卷", "油炸加精制面皮，升糖和热量风险都较高。"],
  ["绿豆糕", "常含较多糖和油，控糖人群建议少量。"],
  ["豆沙包", "精制面皮加甜馅，升糖较快，建议减少频率。"],
]);

function slugFromImagePath(imagePath) {
  return path.basename(imagePath).replace(/\.[^.]+$/, "").toLowerCase();
}

async function loadFoods() {
  const foodsJson = await readFile(path.join(root, "public", "static", "foods.json"), "utf8");
  return JSON.parse(foodsJson);
}

async function ensureBucket() {
  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

async function uploadFood(food, index) {
  const localImagePath = path.join(root, "public", food.image.replace(/^\//, ""));
  const ext = path.extname(localImagePath);
  const contentType = contentTypes.get(ext.toLowerCase());

  if (!contentType) {
    throw new Error(`Unsupported image type for ${food.name}: ${ext}`);
  }

  const objectPath = `foods/${path.basename(localImagePath)}`;
  const bytes = await readFile(localImagePath);
  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType,
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const id = String(index + 1);

  const { error: upsertError } = await supabase.from("food_items").upsert(
    {
      id,
      name: food.name,
      gi: food.gi,
      gi_type: food.type,
      description: descriptions.get(food.name) || "",
      storage_bucket: bucket,
      storage_object_path: objectPath,
      image_url: data.publicUrl,
    },
    { onConflict: "id" },
  );

  if (upsertError) throw upsertError;

  return {
    id,
    name: food.name,
    slug: slugFromImagePath(food.image),
    imageUrl: data.publicUrl,
  };
}

await ensureBucket();

const foods = await loadFoods();
const uploaded = [];

for (let i = 0; i < foods.length; i += 1) {
  uploaded.push(await uploadFood(foods[i], i));
}

console.log(`Uploaded ${uploaded.length} food images and metadata rows to Supabase.`);
