import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { FOODS, giLabel, giLevel } from "@/data/foods";
import { Input } from "@/components/ui/input";

type Filter = "all" | "low" | "mid" | "high";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "low", label: "低 GI" },
  { key: "mid", label: "中 GI" },
  { key: "high", label: "高 GI" },
];

export const Route = createFileRoute("/foods")({
  head: () => ({
    meta: [
      { title: "食物 GI 列表 · 控糖助手" },
      { name: "description", content: "浏览常见食物升糖指数 GI，按低、中、高 GI 筛选。" },
    ],
  }),
  component: FoodsPage,
});

function FoodsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return FOODS.filter((f) => {
      if (filter !== "all" && giLevel(f.gi) !== filter) return false;
      if (q && !f.name.includes(q.trim())) return false;
      return true;
    });
  }, [filter, q]);

  return (
    <main className="flex flex-col gap-4 px-4 pt-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">食物 GI</h1>
        <p className="text-sm text-muted-foreground">浏览常见食物的升糖指数</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索食物名称"
          className="pl-9"
        />
      </div>

      {/* F-A: chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* F-B: grid */}
      <section className="grid grid-cols-2 gap-3">
        {list.map((f) => {
          const l = giLevel(f.gi);
          return (
            <article
              key={f.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-3 shadow-sm transition active:scale-[0.98]"
            >
              <div className="flex aspect-square items-center justify-center rounded-xl bg-muted/60 text-5xl">
                {f.image}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <h3 className="text-sm font-medium">{f.name}</h3>
                <span
                  className={`text-lg font-bold ${
                    l === "low" ? "text-gi-low" : l === "mid" ? "text-gi-mid" : "text-gi-high"
                  }`}
                >
                  {f.gi}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{giLabel(f.gi)} · {f.type}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </article>
          );
        })}
        {list.length === 0 && (
          <p className="col-span-2 py-12 text-center text-sm text-muted-foreground">
            没有符合条件的食物
          </p>
        )}
      </section>
    </main>
  );
}
