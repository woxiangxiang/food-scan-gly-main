export type FoodType = "主食" | "水果" | "蔬菜" | "肉蛋奶" | "饮料" | "零食";

export interface Food {
  id: string;
  name: string;
  gi: number;
  description: string;
  image: string;
  type: FoodType;
}

export const FOODS: Food[] = [
  { id: "1", name: "白米饭", gi: 83, description: "精制碳水，升糖快，建议搭配蔬菜与蛋白质", image: "🍚", type: "主食" },
  { id: "2", name: "糙米饭", gi: 56, description: "全谷物，富含膳食纤维，升糖较慢", image: "🍙", type: "主食" },
  { id: "3", name: "全麦面包", gi: 51, description: "比白面包升糖慢，建议选择无添加糖款", image: "🍞", type: "主食" },
  { id: "4", name: "燕麦粥", gi: 55, description: "β-葡聚糖有助于稳定血糖", image: "🥣", type: "主食" },
  { id: "5", name: "白面包", gi: 75, description: "精制面粉，建议替换为全麦", image: "🥖", type: "主食" },
  { id: "6", name: "玉米", gi: 55, description: "含膳食纤维，适量食用", image: "🌽", type: "主食" },
  { id: "7", name: "红薯", gi: 63, description: "煮制比烤制 GI 略低", image: "🍠", type: "主食" },
  { id: "8", name: "土豆泥", gi: 87, description: "加工后升糖快，建议蒸煮整块食用", image: "🥔", type: "主食" },
  { id: "9", name: "苹果", gi: 36, description: "低 GI 水果，富含果胶", image: "🍎", type: "水果" },
  { id: "10", name: "香蕉", gi: 51, description: "成熟度越高 GI 越高", image: "🍌", type: "水果" },
  { id: "11", name: "西瓜", gi: 72, description: "GI 高但 GL 不高，控制份量", image: "🍉", type: "水果" },
  { id: "12", name: "葡萄", gi: 43, description: "推荐每次一小串", image: "🍇", type: "水果" },
  { id: "13", name: "草莓", gi: 40, description: "低糖低 GI，糖友友好", image: "🍓", type: "水果" },
  { id: "14", name: "橙子", gi: 43, description: "建议直接吃而非榨汁", image: "🍊", type: "水果" },
  { id: "15", name: "西兰花", gi: 15, description: "高纤维低 GI，推荐常吃", image: "🥦", type: "蔬菜" },
  { id: "16", name: "胡萝卜", gi: 39, description: "生吃 GI 更低", image: "🥕", type: "蔬菜" },
  { id: "17", name: "黄瓜", gi: 15, description: "几乎不升糖，可大量食用", image: "🥒", type: "蔬菜" },
  { id: "18", name: "番茄", gi: 30, description: "低 GI，富含番茄红素", image: "🍅", type: "蔬菜" },
  { id: "19", name: "鸡蛋", gi: 0, description: "优质蛋白，几乎不升糖", image: "🥚", type: "肉蛋奶" },
  { id: "20", name: "牛奶", gi: 27, description: "低脂或脱脂更佳", image: "🥛", type: "肉蛋奶" },
  { id: "21", name: "酸奶", gi: 36, description: "选择无糖原味酸奶", image: "🥛", type: "肉蛋奶" },
  { id: "22", name: "鸡胸肉", gi: 0, description: "高蛋白低脂，控糖好选择", image: "🍗", type: "肉蛋奶" },
  { id: "23", name: "可乐", gi: 78, description: "高糖饮料，建议避免", image: "🥤", type: "饮料" },
  { id: "24", name: "鲜榨橙汁", gi: 65, description: "缺少纤维，升糖快于整果", image: "🧃", type: "饮料" },
  { id: "25", name: "黑咖啡", gi: 0, description: "无糖不升糖，适量饮用", image: "☕", type: "饮料" },
  { id: "26", name: "薯片", gi: 70, description: "高油高碳水，避免食用", image: "🍟", type: "零食" },
  { id: "27", name: "巧克力", gi: 49, description: "选择 70% 以上黑巧", image: "🍫", type: "零食" },
  { id: "28", name: "饼干", gi: 72, description: "精制糖与脂肪，少吃为妙", image: "🍪", type: "零食" },
  { id: "29", name: "坚果（杏仁）", gi: 15, description: "健康脂肪，每日一小把", image: "🥜", type: "零食" },
  { id: "30", name: "蜂蜜", gi: 58, description: "天然糖分仍会升糖", image: "🍯", type: "零食" },
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
