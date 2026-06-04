import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, Plus, Droplet } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { toast } from "sonner";

import { useGlucose } from "@/hooks/use-glucose";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "我的 · 血糖记录" },
      { name: "description", content: "记录与查看血糖趋势，统计平均、最低、最高。" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { entries, add, remove } = useGlucose();

  const last30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return entries.filter((e) => e.timestamp >= cutoff);
  }, [entries]);

  const last3DayStats = useMemo(() => {
    const cutoff = Date.now() - 3 * 86400000;
    const arr = entries.filter((e) => e.timestamp >= cutoff).map((e) => e.value);
    if (arr.length === 0) return null;
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      avg: sum / arr.length,
      min: Math.min(...arr),
      max: Math.max(...arr),
    };
  }, [entries]);

  const chartData = last30.map((e) => ({
    t: new Date(e.timestamp).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
    v: e.value,
    ts: e.timestamp,
  }));

  return (
    <main className="flex flex-col gap-4 px-4 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">我的</h1>
          <p className="text-sm text-muted-foreground">血糖趋势与记录</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Droplet className="size-5" />
        </div>
      </header>

      {/* P-A chart */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">近 30 天血糖趋势</h2>
          <span className="text-xs text-muted-foreground">mmol/L</span>
        </div>
        <div className="h-44 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" domain={[2, "dataMax + 2"]} />
                <ReferenceArea y1={3.9} y2={6.1} fill="var(--color-gi-low-soft)" fillOpacity={0.5} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} mmol/L`, "血糖"]}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-primary)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              暂无数据，记录一次血糖开始追踪吧
            </div>
          )}
        </div>
      </section>

      {/* P-B stats */}
      <section className="grid grid-cols-3 gap-2">
        <StatCard label="平均" value={last3DayStats?.avg} accent="text-primary" />
        <StatCard label="最低" value={last3DayStats?.min} accent="text-gi-low" />
        <StatCard label="最高" value={last3DayStats?.max} accent="text-gi-high" />
      </section>

      {/* P-C record button */}
      <RecordDialog
        onSave={(v) => {
          add(v);
          toast.success(`已记录 ${v.toFixed(1)} mmol/L`);
        }}
      />

      {/* P-D history */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium">历史记录</h2>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">尚无记录</p>
        ) : (
          <ul className="divide-y divide-border">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{e.value.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">mmol/L</span></p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  aria-label="删除"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | undefined;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent}`}>
        {value != null ? value.toFixed(1) : "—"}
      </p>
    </div>
  );
}

function RecordDialog({ onSave }: { onSave: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  const submit = () => {
    const n = parseFloat(val);
    if (Number.isNaN(n) || n < 2 || n > 30) {
      toast.error("请输入 2 - 30 之间的数值");
      return;
    }
    onSave(n);
    setVal("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 w-full rounded-2xl text-base font-medium shadow-sm">
          <Plus className="size-5" /> 记录血糖
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>记录血糖</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="g">数值 (mmol/L)</Label>
          <Input
            id="g"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="例如 5.6"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">建议范围 2.0 - 30.0</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={submit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
