export type FoodType = "low" | "medium" | "high";

export interface Food {
  id: string;
  name: string;
  gi: number;
  description: string;
  image: string;
  type: FoodType;
  source?: "library" | "recognition";
}

export const FOODS: Food[] = [
  { id: "1", name: "绿豆", gi: 38, description: "低 GI 杂豆，富含膳食纤维，可替代部分主食。", image: "/images/lvdou.jpg", type: "low" },
  { id: "2", name: "红豆", gi: 37, description: "低 GI 豆类，建议少糖烹煮，控制总量。", image: "/images/hongdou.jpg", type: "low" },
  { id: "3", name: "莲藕", gi: 49, description: "升糖相对温和，注意它仍含淀粉，适量食用。", image: "/images/lianou.jpg", type: "low" },
  { id: "4", name: "小米粥", gi: 52, description: "比白米粥温和，但粥类消化快，建议搭配蛋白质。", image: "/images/xiaomizhou.jpg", type: "low" },
  { id: "5", name: "荞麦面", gi: 47, description: "杂粮面食，升糖较慢，适合作为主食替换。", image: "/images/qiaomaimian.png", type: "low" },
  { id: "6", name: "芋头", gi: 54, description: "低到中等升糖，作为主食时需减少米饭面食。", image: "/images/yutou.jpg", type: "low" },
  { id: "7", name: "冬瓜", gi: 15, description: "低 GI 蔬菜，热量低，适合日常搭配。", image: "/images/donggua.jpg", type: "low" },
  { id: "8", name: "豆腐", gi: 15, description: "优质植物蛋白，几乎不明显升糖。", image: "/images/doufu.jpg", type: "low" },
  { id: "9", name: "黄豆芽", gi: 25, description: "低 GI 蔬菜，富含植物蛋白和膳食纤维。", image: "/images/huangdouya.JPG", type: "low" },
  { id: "10", name: "黄瓜", gi: 15, description: "低热量低 GI，适合作为加餐或配菜。", image: "/images/huanggua.jpg", type: "low" },
  { id: "11", name: "红薯粉丝", gi: 63, description: "中 GI 主食类，口感顺滑但碳水较高，需控量。", image: "/images/hongshufensi.png", type: "medium" },
  { id: "12", name: "糙米饭", gi: 65, description: "保留谷物纤维，比白米饭更适合控糖。", image: "/images/caomifan.jpeg", type: "medium" },
  { id: "13", name: "刀削面", gi: 66, description: "中 GI 面食，建议搭配蔬菜和蛋白质降低餐后波动。", image: "/images/daoxiaomian.jpg", type: "medium" },
  { id: "14", name: "馄饨", gi: 60, description: "中 GI，皮含精制面粉，注意数量和汤底油脂。", image: "/images/huntun.jpg", type: "medium" },
  { id: "15", name: "馒头", gi: 68, description: "中高 GI 面食，建议半个起步并搭配菜肉。", image: "/images/mantou.webp", type: "medium" },
  { id: "16", name: "粽子", gi: 67, description: "糯米制品黏性强，消化快，建议少量尝试。", image: "/images/zongzi.webp", type: "medium" },
  { id: "17", name: "玉米", gi: 60, description: "中 GI 粗粮，适合作为部分主食替换。", image: "/images/yumi.webp", type: "medium" },
  { id: "18", name: "八宝粥", gi: 58, description: "中 GI，若额外加糖会明显增加升糖风险。", image: "/images/babaozhou.jpeg", type: "medium" },
  { id: "19", name: "薏仁", gi: 58, description: "中 GI 谷物，建议与豆类、蔬菜搭配。", image: "/images/yiren.png", type: "medium" },
  { id: "20", name: "山药", gi: 65, description: "淀粉类蔬菜，作为主食替换时更合适。", image: "/images/shanyao.jpeg", type: "medium" },
  { id: "21", name: "油条", gi: 95, description: "高 GI 且高油脂，控糖人群建议尽量避免。", image: "/images/youtiao.jpg", type: "high" },
  { id: "22", name: "炒米粉", gi: 85, description: "高 GI 主食，油脂和碳水都偏高，建议少吃。", image: "/images/chaomifen.jpg", type: "high" },
  { id: "23", name: "白米粥", gi: 78, description: "煮烂后吸收快，容易带来餐后血糖波动。", image: "/images/baimizhou.jpg", type: "high" },
  { id: "24", name: "白米饭", gi: 83, description: "精制碳水，升糖快，建议搭配蔬菜与蛋白质。", image: "/images/baimifan.jpg", type: "high" },
  { id: "25", name: "糯米饭", gi: 87, description: "糯米黏性强、升糖快，建议严格控制份量。", image: "/images/nuomifan.png", type: "high" },
  { id: "26", name: "叉烧酥", gi: 76, description: "高 GI 且高油高糖，建议偶尔少量。", image: "/images/chashaosu.webp", type: "high" },
  { id: "27", name: "月饼", gi: 79, description: "糖和脂肪含量高，建议切小块分享食用。", image: "/images/yuebing.jpg", type: "high" },
  { id: "28", name: "炸春卷", gi: 82, description: "油炸加精制面皮，升糖和热量风险都较高。", image: "/images/zhachunjuan.jpg", type: "high" },
  { id: "29", name: "绿豆糕", gi: 78, description: "常含较多糖和油，控糖人群建议少量。", image: "/images/lvdougao.jpg", type: "high" },
  { id: "30", name: "豆沙包", gi: 75, description: "精制面皮加甜馅，升糖较快，建议减少频率。", image: "/images/doushabao.jpg", type: "high" },
];

export function giLevel(gi: number): "low" | "mid" | "high" {
  if (gi <= 55) return "low";
  if (gi <= 70) return "mid";
  return "high";
}

export function giLabel(gi: number): string {
  const l = giLevel(gi);
  return l === "low" ? "低 GI" : l === "mid" ? "中 GI" : "高 GI";
}
