import { useCallback, type MouseEvent } from "react";
import {
  Boxes,
  ChartColumnBig,
  Handshake,
  Receipt,
  ScanBarcode,
  ShieldCheck,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { Section, SectionHeading, IconTile } from "@/components/ui";
import { Reveal } from "@/components/motion/Motion";
import { AreaChart, Bar, BRAND, Donut, ProductIcon, UiBadge } from "@/components/product/parts";

type ModuleKey = keyof ReturnType<typeof useI18n>["t"]["solution"]["modules"];

const META: Record<ModuleKey, { Icon: typeof Store; color: string; span: string }> = {
  pos: { Icon: ShoppingCart, color: BRAND.blue, span: "sm:col-span-2 lg:col-span-3 lg:row-span-2" },
  inventory: { Icon: Boxes, color: BRAND.cyan, span: "sm:col-span-2 lg:col-span-3" },
  reports: { Icon: ChartColumnBig, color: BRAND.violet, span: "sm:col-span-2 lg:col-span-3 lg:row-span-2" },
  debts: { Icon: Handshake, color: BRAND.amber, span: "sm:col-span-1 lg:col-span-3" },
  invoices: { Icon: Receipt, color: BRAND.green, span: "sm:col-span-1 lg:col-span-2" },
  customers: { Icon: Users, color: "#f472b6", span: "sm:col-span-1 lg:col-span-2" },
  purchases: { Icon: TrendingUp, color: "#60a5fa", span: "sm:col-span-1 lg:col-span-2" },
  employees: { Icon: ShieldCheck, color: BRAND.green, span: "sm:col-span-1 lg:col-span-2" },
  services: { Icon: Wrench, color: "#a78bfa", span: "sm:col-span-1 lg:col-span-2" },
  multiStore: { Icon: Store, color: BRAND.rose, span: "sm:col-span-2 lg:col-span-2" },
};

const ORDER: ModuleKey[] = [
  "pos",
  "reports",
  "inventory",
  "debts",
  "invoices",
  "customers",
  "purchases",
  "employees",
  "services",
  "multiStore",
];

/* ------------------------- عروض بصرية داخل البطاقات ------------------------- */

function PosVisual() {
  const { t } = useI18n();
  return (
    <div className="mt-5 rounded-2xl border border-line bg-[#0a0d18]/80 p-3.5">
      <div className="flex items-center gap-2 border-b border-line pb-2.5">
        <ScanBarcode className="size-4 text-primary-soft" aria-hidden />
        <span className="text-[12px] font-semibold text-slate-300">{t.app.pos.title}</span>
        <span dir="ltr" className="ms-auto text-[11.5px] text-faint tabular-nums">
          1 290 {t.app.currency}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {t.app.products.slice(0, 3).map((p, i) => (
          <div key={p.code} className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] px-3 py-2">
            <ProductIcon index={i} className="size-4 text-faint" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-200">{p.name}</span>
            <span className="text-[11.5px] text-faint">×{i + 1}</span>
            <span dir="ltr" className="text-[12.5px] font-bold text-white tabular-nums">
              {[320, 280, 690][i]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] py-2 text-center text-[12.5px] font-bold text-white">
        {t.app.pos.checkout}
      </div>
    </div>
  );
}

function ReportsVisual() {
  const { t } = useI18n();
  return (
    <div className="mt-5 rounded-2xl border border-line bg-[#0a0d18]/80 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-300">{t.app.charts.salesTitle}</span>
        <span className="text-[11px] text-faint">{t.app.period}</span>
      </div>
      <AreaChart
        id="sol-rep"
        className="mt-3 h-24"
        series={[
          { color: BRAND.violet, points: [20, 34, 28, 48, 42, 62, 55, 76, 70, 88] },
          { color: BRAND.cyan, dashed: true, points: [12, 20, 17, 28, 25, 36, 32, 44, 40, 52] },
        ]}
      />
      <div className="mt-4 flex items-center gap-4">
        <Donut
          size="60px"
          slices={[
            { color: BRAND.violet, value: 44 },
            { color: BRAND.cyan, value: 30 },
            { color: BRAND.blue, value: 26 },
          ]}
        />
        <div className="flex flex-1 flex-col gap-1.5">
          {[t.app.kpi.sales, t.app.kpi.profit, t.app.charts.services].map((l, i) => (
            <div key={l} className="flex items-center gap-2 text-[11.5px] text-muted">
              <span className="size-1.5 rounded-full" style={{ background: [BRAND.violet, BRAND.cyan, BRAND.blue][i] }} />
              <span className="truncate">{l}</span>
              <span dir="ltr" className="ms-auto font-semibold text-slate-300 tabular-nums">
                {["44%", "30%", "26%"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryVisual() {
  const { t } = useI18n();
  const stocks = [86, 42, 14];
  return (
    <div className="mt-5 flex flex-col gap-2">
      {t.app.products.slice(0, 3).map((p, i) => {
        const color = stocks[i] > 50 ? BRAND.green : stocks[i] > 20 ? BRAND.amber : BRAND.rose;
        return (
          <div key={p.code} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-200">{p.name}</span>
            <span className="w-16">
              <Bar value={stocks[i]} color={color} />
            </span>
            <UiBadge tone={stocks[i] > 50 ? "green" : stocks[i] > 20 ? "amber" : "rose"}>
              {stocks[i] > 50 ? t.app.status.ok : stocks[i] > 20 ? t.app.status.low : t.app.status.out}
            </UiBadge>
          </div>
        );
      })}
    </div>
  );
}

function DebtsVisual() {
  const { t } = useI18n();
  return (
    <div className="mt-5 rounded-2xl border border-line bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted">{t.app.table.total}</span>
        <span dir="ltr" className="font-bold text-white tabular-nums">
          12 400 {t.app.currency}
        </span>
      </div>
      <div className="mt-3">
        <Bar value={66} color={BRAND.amber} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="text-muted">{t.app.table.rest}</span>
        <span dir="ltr" className="font-bold text-warning tabular-nums">
          4 200 {t.app.currency}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------- Section --------------------------------- */

export function Solution() {
  const { t } = useI18n();

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <Section id="features">
      <Reveal>
        <SectionHeading eyebrow={t.solution.eyebrow} title={t.solution.title} subtitle={t.solution.subtitle} />
      </Reveal>

      <div className="mt-12 grid auto-rows-auto grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {ORDER.map((key, i) => {
          const mod = t.solution.modules[key];
          const { Icon, color, span } = META[key];
          const isLarge = key === "pos" || key === "reports";

          return (
            <Reveal key={key} delay={(i % 3) * 0.06} className={cn(span)}>
              <div
                onMouseMove={onMove}
                style={{ ["--mx" as string]: "50%", ["--my" as string]: "0%" }}
                className="surface-card group relative flex h-full flex-col overflow-hidden rounded-card p-5 transition-all duration-500 hover:-translate-y-1 hover:border-line-strong sm:p-6"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(340px circle at var(--mx) var(--my), ${color}1f, transparent 62%)`,
                  }}
                />
                <span
                  className="absolute inset-x-8 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />

                <div className="relative flex items-center gap-3.5">
                  <IconTile color={color}>
                    <Icon className="size-[21px]" strokeWidth={1.7} aria-hidden />
                  </IconTile>
                  <h3 className={cn("font-display font-extrabold text-white", isLarge ? "text-h3" : "text-[17px]")}>
                    {mod.title}
                  </h3>
                </div>

                <p className="relative mt-3 text-[14px] leading-relaxed text-muted">{mod.desc}</p>

                {key === "pos" && <PosVisual />}
                {key === "reports" && <ReportsVisual />}
                {key === "inventory" && <InventoryVisual />}
                {key === "debts" && <DebtsVisual />}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
