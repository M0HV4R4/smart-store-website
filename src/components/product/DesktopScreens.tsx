import type { ReactNode } from "react";
import {
  Bell,
  ChartColumn,
  Handshake,
  LayoutGrid,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import type { ReplicaScreen } from "@/config/screenshots";
import { AreaChart, Avatar, Bar, Bars, BRAND, Donut, Panel, ProductIcon, UiBadge } from "./parts";

/* =========================================================================
   نسخ بصرية لواجهات Smart Store (مبنية بـ HTML/SVG، مترجمة، RTL/LTR)
   ⚠️ عند توفر لقطات حقيقية: config/screenshots.ts
   ========================================================================= */

const NAV_ICONS = {
  dashboard: LayoutGrid,
  pos: ShoppingCart,
  products: Package,
  inventory: Store,
  purchases: TrendingUp,
  customers: Users,
  debts: Handshake,
  invoices: Receipt,
  reports: ChartColumn,
  services: Wrench,
  employees: Users,
  settings: Settings,
};

type NavKey = keyof typeof NAV_ICONS;

const NAV_ORDER: NavKey[] = [
  "dashboard",
  "pos",
  "products",
  "inventory",
  "customers",
  "debts",
  "invoices",
  "reports",
  "services",
  "employees",
];

function Shell({ active, children }: { active: NavKey; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="ui-root size-full bg-[radial-gradient(120%_120%_at_15%_0%,#111a3a_0%,#0a0d1c_45%,#06070e_100%)] text-white">
      <div className="flex size-full">
        {/* الشريط الجانبي */}
        <aside className="flex w-[17.5cqw] shrink-0 flex-col gap-[0.9cqw] border-e border-white/[0.06] bg-[linear-gradient(180deg,rgba(12,16,34,0.96),rgba(7,9,20,0.96))] px-[0.9cqw] py-[1cqw]">
          <div className="flex items-center gap-[0.6cqw] px-[0.2cqw]">
            <span className="grid size-[2.2cqw] place-items-center rounded-[0.6cqw] bg-[linear-gradient(135deg,#2f6bff,#7a5af8)]">
              <Store className="size-[1.2cqw]" strokeWidth={2} aria-hidden />
            </span>
            <span className="leading-none">
              <span className="block text-[1.05cqw] font-bold">{t.app.brand}</span>
              <span className="mt-[0.25cqw] block text-[0.68cqw] text-slate-400">{t.app.brandSub}</span>
            </span>
          </div>

          <div className="flex items-center gap-[0.5cqw] rounded-[0.7cqw] border border-white/[0.07] bg-white/[0.03] px-[0.6cqw] py-[0.45cqw]">
            <Search className="size-[0.95cqw] text-slate-500" aria-hidden />
            <span className="text-[0.74cqw] text-slate-500">{t.app.search}</span>
          </div>

          <nav className="flex flex-col gap-[0.18cqw]">
            {NAV_ORDER.map((key) => {
              const Icon = NAV_ICONS[key];
              const isActive = key === active;
              return (
                <span
                  key={key}
                  className={cn(
                    "relative flex items-center gap-[0.55cqw] rounded-[0.6cqw] px-[0.6cqw] py-[0.45cqw] text-[0.82cqw]",
                    isActive
                      ? "bg-[linear-gradient(100deg,rgba(47,107,255,0.3),rgba(122,90,248,0.12))] font-semibold text-white"
                      : "text-slate-400",
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-y-[22%] start-0 w-[0.16cqw] rounded-full bg-[#5f8bff]" />
                  )}
                  <Icon
                    className={cn("size-[1.05cqw]", isActive ? "text-[#8aa8ff]" : "text-slate-500")}
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  {t.app.nav[key]}
                </span>
              );
            })}
          </nav>
        </aside>

        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-[0.8cqw] border-b border-white/[0.06] px-[1.2cqw] py-[0.8cqw]">
            <div>
              <h3 className="text-[1.2cqw] font-bold">{t.app.nav[active]}</h3>
              <p className="mt-[0.1cqw] text-[0.7cqw] text-slate-400">{t.app.today}</p>
            </div>
            <div className="ms-auto flex items-center gap-[0.5cqw]">
              <span className="rounded-[0.55cqw] border border-white/[0.08] bg-white/[0.03] px-[0.65cqw] py-[0.35cqw] text-[0.7cqw] text-slate-300">
                {t.app.period}
              </span>
              <span className="grid size-[1.8cqw] place-items-center rounded-[0.55cqw] border border-white/[0.08] bg-white/[0.03]">
                <Bell className="size-[0.9cqw] text-slate-300" strokeWidth={1.7} aria-hidden />
              </span>
              <Avatar label="S" color="linear-gradient(135deg,#2f6bff,#7a5af8)" />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden p-[1cqw]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Dashboard */

function Kpi({ label, value, color, points }: { label: string; value: string; color: string; points: number[] }) {
  return (
    <Panel className="flex-1 p-[0.8cqw]">
      <div className="text-[0.72cqw] text-slate-400">{label}</div>
      <div dir="ltr" className="mt-[0.25cqw] text-[1.45cqw] font-extrabold tabular-nums">{value}</div>
      <AreaChart id={`kpi-${label}`} className="mt-[0.4cqw] h-[2.6cqw]" series={[{ color, points }]} />
    </Panel>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const cur = t.app.currency;

  return (
    <Shell active="dashboard">
      <div className="flex h-full flex-col gap-[0.9cqw]">
        <div className="flex gap-[0.8cqw]">
          <Kpi label={t.app.kpi.sales} value={`38 400 ${cur}`} color={BRAND.blue} points={[20, 38, 30, 52, 46, 68, 60, 84]} />
          <Kpi label={t.app.kpi.orders} value="126" color={BRAND.cyan} points={[30, 26, 42, 38, 55, 48, 66, 72]} />
          <Kpi label={t.app.kpi.profit} value={`9 250 ${cur}`} color={BRAND.violet} points={[18, 26, 24, 40, 36, 52, 58, 70]} />
          <Kpi label={t.app.kpi.low} value="7" color={BRAND.rose} points={[60, 52, 55, 44, 46, 34, 30, 24]} />
        </div>

        <div className="flex min-h-0 flex-1 gap-[0.8cqw]">
          <Panel className="flex min-w-0 flex-[1.85] flex-col p-[0.9cqw]">
            <div className="flex items-center">
              <div>
                <div className="text-[0.92cqw] font-bold">{t.app.charts.salesTitle}</div>
                <div className="text-[0.68cqw] text-slate-400">{t.app.charts.salesSub}</div>
              </div>
              <div className="ms-auto flex items-center gap-[0.7cqw] text-[0.68cqw] text-slate-400">
                <span className="flex items-center gap-[0.3cqw]">
                  <span className="size-[0.45cqw] rounded-full bg-[#5f8bff]" />
                  {t.app.charts.salesTitle}
                </span>
                <span className="flex items-center gap-[0.3cqw]">
                  <span className="size-[0.45cqw] rounded-full bg-[#22d3ee]" />
                  {t.app.kpi.profit}
                </span>
              </div>
            </div>
            <AreaChart
              id="dash-main"
              className="mt-[0.7cqw] min-h-0 flex-1"
              series={[
                { color: BRAND.blue, points: [26, 40, 32, 55, 47, 66, 58, 78, 70, 88] },
                { color: BRAND.cyan, dashed: true, points: [14, 22, 18, 31, 27, 38, 33, 46, 41, 52] },
              ]}
            />
            <div dir="ltr" className="mt-[0.4cqw] flex justify-between text-[0.64cqw] text-slate-500">
              {["01", "05", "10", "15", "20", "25", "30"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </Panel>

          <div className="flex min-w-0 flex-1 flex-col gap-[0.8cqw]">
            <Panel className="p-[0.85cqw]">
              <div className="text-[0.88cqw] font-bold">{t.app.charts.categories}</div>
              <div className="mt-[0.5cqw] flex items-center gap-[0.8cqw]">
                <Donut
                  size="7.6cqw"
                  slices={[
                    { color: BRAND.blue, value: 44 },
                    { color: BRAND.cyan, value: 24 },
                    { color: BRAND.violet, value: 18 },
                    { color: BRAND.green, value: 14 },
                  ]}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[0.35cqw]">
                  {[
                    [t.app.categories.food, "44%", BRAND.blue],
                    [t.app.categories.drinks, "24%", BRAND.cyan],
                    [t.app.categories.home, "18%", BRAND.violet],
                    [t.app.categories.services, "14%", BRAND.green],
                  ].map(([l, v, c]) => (
                    <div key={l} className="flex items-center gap-[0.4cqw] text-[0.72cqw]">
                      <span className="size-[0.45cqw] rounded-full" style={{ background: c }} />
                      <span className="text-slate-300">{l}</span>
                      <span dir="ltr" className="ms-auto font-semibold tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel className="flex min-h-0 flex-1 flex-col p-[0.85cqw]">
              <div className="text-[0.88cqw] font-bold">{t.app.charts.topProducts}</div>
              <div className="mt-[0.5cqw] flex min-h-0 flex-1 flex-col justify-between">
                {t.app.products.slice(0, 5).map((p, i) => (
                  <div key={p.code} className="flex items-center gap-[0.5cqw]">
                    <ProductIcon index={i} className="size-[1cqw] text-slate-400" />
                    <span className="truncate text-[0.74cqw] text-slate-200">{p.name}</span>
                    <span className="ms-auto w-[4cqw]">
                      <Bar value={90 - i * 14} color={[BRAND.blue, BRAND.cyan, BRAND.violet, BRAND.green, BRAND.amber][i]} />
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ----------------------------------------------------- Products / Inventory */

function ProductsTable({ active }: { active: NavKey }) {
  const { t } = useI18n();
  const stocks = [86, 54, 12, 68, 31, 92, 45, 8];
  const prices = [320, 140, 980, 210, 450, 190, 260, 120];

  return (
    <Shell active={active}>
      <div className="flex h-full flex-col gap-[0.8cqw]">
        <div className="flex items-center gap-[0.5cqw]">
          {[t.app.nav.products, t.app.status.low, t.app.status.out].map((label, i) => (
            <span
              key={label}
              className={cn(
                "rounded-full border px-[0.8cqw] py-[0.3cqw] text-[0.72cqw] font-semibold",
                i === 0 ? "border-white/15 bg-white/[0.1] text-white" : "border-white/[0.07] text-slate-400",
              )}
            >
              {label}
            </span>
          ))}
          <span className="ms-auto rounded-[0.55cqw] bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] px-[0.85cqw] py-[0.35cqw] text-[0.72cqw] font-semibold">
            + {t.app.nav.products}
          </span>
        </div>

        <Panel className="flex min-h-0 flex-1 flex-col p-[0.85cqw]">
          <div className="grid grid-cols-[2.4fr_1fr_1.1fr_1.5fr_1fr_0.9fr] gap-[0.5cqw] border-b border-white/[0.07] pb-[0.45cqw] text-[0.68cqw] font-semibold text-slate-500">
            <span>{t.app.table.product}</span>
            <span>{t.app.table.code}</span>
            <span>{t.app.table.category}</span>
            <span>{t.app.table.qty}</span>
            <span>{t.app.table.price}</span>
            <span>{t.app.table.status}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-between pt-[0.2cqw]">
            {t.app.products.map((p, i) => {
              const stock = stocks[i];
              const color = stock > 50 ? BRAND.green : stock > 20 ? BRAND.amber : BRAND.rose;
              return (
                <div
                  key={p.code}
                  className={cn(
                    "grid grid-cols-[2.4fr_1fr_1.1fr_1.5fr_1fr_0.9fr] items-center gap-[0.5cqw] rounded-[0.5cqw] px-[0.3cqw] py-[0.42cqw]",
                    i % 2 === 1 && "bg-white/[0.022]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-[0.5cqw]">
                    <span
                      className="grid size-[1.7cqw] shrink-0 place-items-center rounded-[0.45cqw]"
                      style={{ background: `${color}1f`, border: `1px solid ${color}38`, color }}
                    >
                      <ProductIcon index={i} className="size-[1cqw]" />
                    </span>
                    <span className="truncate text-[0.78cqw] font-semibold">{p.name}</span>
                  </span>
                  <span dir="ltr" className="text-[0.72cqw] text-slate-400 tabular-nums">{p.code}</span>
                  <span className="truncate text-[0.72cqw] text-slate-400">
                    {t.app.categories[p.cat as keyof typeof t.app.categories]}
                  </span>
                  <span className="flex items-center gap-[0.45cqw]">
                    <Bar value={stock} color={color} />
                    <span dir="ltr" className="w-[1.8cqw] text-[0.7cqw] text-slate-300 tabular-nums">{stock}</span>
                  </span>
                  <span dir="ltr" className="text-[0.75cqw] font-bold tabular-nums">
                    {prices[i]} {t.app.currency}
                  </span>
                  <span>
                    {stock > 50 ? (
                      <UiBadge tone="green">{t.app.status.ok}</UiBadge>
                    ) : stock > 20 ? (
                      <UiBadge tone="amber">{t.app.status.low}</UiBadge>
                    ) : (
                      <UiBadge tone="rose">{t.app.status.out}</UiBadge>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------- POS */

function Pos() {
  const { t } = useI18n();
  const cur = t.app.currency;
  const cart = [
    { name: t.app.products[0].name, qty: 2, price: 320 },
    { name: t.app.products[3].name, qty: 1, price: 210 },
    { name: t.app.products[6].name, qty: 3, price: 260 },
  ];
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);

  return (
    <Shell active="pos">
      <div className="flex h-full gap-[0.8cqw]">
        <div className="flex min-w-0 flex-[1.6] flex-col gap-[0.7cqw]">
          <div className="flex items-center gap-[0.5cqw]">
            {[t.app.pos.categoriesAll, t.app.categories.food, t.app.categories.drinks, t.app.categories.home].map(
              (c, i) => (
                <span
                  key={c}
                  className={cn(
                    "rounded-full px-[0.8cqw] py-[0.3cqw] text-[0.72cqw] font-semibold",
                    i === 0 ? "bg-white text-[#06070e]" : "border border-white/[0.08] text-slate-300",
                  )}
                >
                  {c}
                </span>
              ),
            )}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-4 gap-[0.7cqw]">
            {t.app.products.map((p, i) => (
              <Panel key={p.code} className="flex flex-col p-[0.6cqw]">
                <span
                  className="grid h-[3.4cqw] w-full place-items-center rounded-[0.6cqw]"
                  style={{
                    background: `${Object.values(BRAND)[i % 6]}18`,
                    color: Object.values(BRAND)[i % 6],
                  }}
                >
                  <ProductIcon index={i} className="size-[1.6cqw]" />
                </span>
                <span className="mt-[0.4cqw] truncate text-[0.74cqw] font-semibold">{p.name}</span>
                <span dir="ltr" className="mt-[0.1cqw] text-[0.74cqw] font-bold text-[#8aa8ff] tabular-nums">
                  {[320, 140, 980, 210, 450, 190, 260, 120][i]} {cur}
                </span>
              </Panel>
            ))}
          </div>
        </div>

        <Panel className="flex w-[15cqw] shrink-0 flex-col p-[0.85cqw]">
          <div className="flex items-center">
            <span className="text-[0.92cqw] font-bold">{t.app.pos.cart}</span>
            <span className="ms-auto text-[0.7cqw] text-slate-400">{cart.length}</span>
          </div>
          <div className="mt-[0.6cqw] flex flex-col gap-[0.45cqw]">
            {cart.map((l, i) => (
              <div key={i} className="flex items-center gap-[0.45cqw] rounded-[0.5cqw] bg-white/[0.03] p-[0.45cqw]">
                <ProductIcon index={i} className="size-[1cqw] text-slate-400" />
                <span className="min-w-0 flex-1 truncate text-[0.72cqw]">{l.name}</span>
                <span dir="ltr" className="text-[0.7cqw] text-slate-400 tabular-nums">×{l.qty}</span>
                <span dir="ltr" className="text-[0.72cqw] font-bold tabular-nums">{l.qty * l.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto">
            <div className="flex items-center text-[0.72cqw] text-slate-400">
              <span>{t.app.pos.subtotal}</span>
              <span dir="ltr" className="ms-auto tabular-nums">{total} {cur}</span>
            </div>
            <div className="my-[0.5cqw] h-px bg-white/10" />
            <div className="flex items-end">
              <span className="text-[0.74cqw] text-slate-400">{t.app.pos.total}</span>
              <span dir="ltr" className="ms-auto text-[1.5cqw] font-extrabold tabular-nums">{total} {cur}</span>
            </div>
            <div className="mt-[0.6cqw] rounded-[0.6cqw] bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] py-[0.55cqw] text-center text-[0.8cqw] font-bold">
              {t.app.pos.checkout}
            </div>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

/* --------------------------------------------------------------- Invoice */

function Invoice() {
  const { t } = useI18n();
  const cur = t.app.currency;
  const lines = [
    { name: t.app.products[0].name, qty: 2, price: 320 },
    { name: t.app.products[2].name, qty: 1, price: 980 },
    { name: t.app.products[5].name, qty: 4, price: 190 },
  ];
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const paid = 1500;

  return (
    <Shell active="invoices">
      <div className="flex h-full gap-[0.8cqw]">
        <Panel className="flex min-w-0 flex-1 flex-col bg-white/[0.96] p-[1.1cqw] text-[#0b1020]">
          <div className="flex items-start">
            <div>
              <div className="text-[1.1cqw] font-extrabold">{t.app.brand}</div>
              <div className="text-[0.7cqw] text-slate-500">{t.app.brandSub}</div>
            </div>
            <div className="ms-auto text-end">
              <div className="text-[1cqw] font-bold">{t.app.invoice.title}</div>
              <div dir="ltr" className="text-[0.7cqw] text-slate-500 tabular-nums">
                {t.app.invoice.number}: 2026-0184
              </div>
              <div dir="ltr" className="text-[0.7cqw] text-slate-500 tabular-nums">
                {t.app.invoice.date}: 14/02/2026
              </div>
            </div>
          </div>

          <div className="mt-[0.8cqw] rounded-[0.5cqw] bg-slate-100 px-[0.7cqw] py-[0.45cqw] text-[0.74cqw]">
            <span className="text-slate-500">{t.app.invoice.customer}: </span>
            <span className="font-semibold">{t.app.customers[0]}</span>
          </div>

          <div className="mt-[0.7cqw]">
            <div className="grid grid-cols-[2.6fr_0.8fr_1fr_1fr] gap-[0.4cqw] border-b border-slate-300 pb-[0.35cqw] text-[0.68cqw] font-bold text-slate-500">
              <span>{t.app.invoice.item}</span>
              <span>{t.app.invoice.qty}</span>
              <span>{t.app.invoice.price}</span>
              <span>{t.app.invoice.amount}</span>
            </div>
            {lines.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.6fr_0.8fr_1fr_1fr] gap-[0.4cqw] border-b border-slate-200 py-[0.45cqw] text-[0.74cqw]"
              >
                <span className="truncate font-medium">{l.name}</span>
                <span dir="ltr" className="tabular-nums">{l.qty}</span>
                <span dir="ltr" className="tabular-nums">{l.price}</span>
                <span dir="ltr" className="font-semibold tabular-nums">{l.qty * l.price}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex justify-end pt-[0.7cqw]">
            <div className="w-[12cqw] text-[0.76cqw]">
              <div className="flex justify-between py-[0.2cqw]">
                <span className="text-slate-500">{t.app.invoice.total}</span>
                <span dir="ltr" className="font-bold tabular-nums">{total} {cur}</span>
              </div>
              <div className="flex justify-between py-[0.2cqw]">
                <span className="text-slate-500">{t.app.invoice.paid}</span>
                <span dir="ltr" className="tabular-nums">{paid} {cur}</span>
              </div>
              <div className="mt-[0.3cqw] flex justify-between rounded-[0.4cqw] bg-[#2f6bff] px-[0.5cqw] py-[0.3cqw] text-white">
                <span>{t.app.invoice.rest}</span>
                <span dir="ltr" className="font-bold tabular-nums">{total - paid} {cur}</span>
              </div>
            </div>
          </div>
          <div className="mt-[0.6cqw] text-center text-[0.68cqw] text-slate-400">
            {t.app.invoice.thanks}
          </div>
        </Panel>

        <div className="flex w-[13cqw] shrink-0 flex-col gap-[0.7cqw]">
          <Panel className="p-[0.8cqw]">
            <div className="text-[0.85cqw] font-bold">{t.app.nav.invoices}</div>
            <div className="mt-[0.5cqw] flex flex-col gap-[0.35cqw]">
              {["2026-0184", "2026-0183", "2026-0182", "2026-0181"].map((n, i) => (
                <div
                  key={n}
                  className={cn(
                    "flex items-center gap-[0.4cqw] rounded-[0.45cqw] px-[0.5cqw] py-[0.35cqw] text-[0.7cqw]",
                    i === 0 ? "bg-[#2f6bff]/18 text-white" : "bg-white/[0.03] text-slate-300",
                  )}
                >
                  <Receipt className="size-[0.9cqw]" strokeWidth={1.7} aria-hidden />
                  <span dir="ltr" className="tabular-nums">{n}</span>
                  <span className="ms-auto">
                    {i === 1 ? (
                      <UiBadge tone="amber">{t.app.status.partial}</UiBadge>
                    ) : (
                      <UiBadge tone="green">{t.app.status.paid}</UiBadge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-[0.8cqw]">
            <div className="text-[0.8cqw] font-bold">{t.app.invoice.print}</div>
            <div className="mt-[0.5cqw] rounded-[0.5cqw] bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] py-[0.5cqw] text-center text-[0.75cqw] font-bold">
              {t.app.invoice.print}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

/* --------------------------------------------------------------- Reports */

function Reports() {
  const { t } = useI18n();
  const cur = t.app.currency;
  return (
    <Shell active="reports">
      <div className="flex h-full flex-col gap-[0.8cqw]">
        <div className="flex min-h-0 flex-[1.2] gap-[0.8cqw]">
          <Panel className="flex min-w-0 flex-[1.6] flex-col p-[0.9cqw]">
            <div className="flex items-center">
              <span className="text-[0.9cqw] font-bold">{t.app.charts.salesTitle}</span>
              <span className="ms-auto text-[0.7cqw] text-slate-400">{t.app.period}</span>
            </div>
            <Bars
              className="mt-auto h-[11cqw]"
              data={[
                { a: 48, b: 30 },
                { a: 64, b: 42 },
                { a: 40, b: 26 },
                { a: 78, b: 52 },
                { a: 70, b: 45 },
                { a: 92, b: 62 },
                { a: 58, b: 38 },
                { a: 84, b: 56 },
              ]}
            />
            <div dir="ltr" className="mt-[0.4cqw] flex justify-between text-[0.64cqw] text-slate-500">
              {["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </Panel>
          <Panel className="flex min-w-0 flex-1 flex-col p-[0.9cqw]">
            <span className="text-[0.9cqw] font-bold">{t.app.charts.services}</span>
            <div className="mt-[0.6cqw] flex flex-col gap-[0.5cqw]">
              {t.app.servicesList.slice(0, 4).map((s, i) => (
                <div key={s} className="flex items-center gap-[0.5cqw]">
                  <Wrench className="size-[0.95cqw] text-slate-400" strokeWidth={1.7} aria-hidden />
                  <span className="truncate text-[0.74cqw] text-slate-200">{s}</span>
                  <span className="ms-auto w-[4.4cqw]">
                    <Bar value={[88, 66, 52, 34][i]} color={[BRAND.blue, BRAND.cyan, BRAND.violet, BRAND.green][i]} />
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex min-h-0 flex-1 gap-[0.8cqw]">
          <Panel className="flex min-w-0 flex-1 flex-col p-[0.9cqw]">
            <span className="text-[0.88cqw] font-bold">{t.app.kpi.profit}</span>
            <AreaChart
              id="rep-profit"
              className="mt-auto h-[7cqw]"
              series={[{ color: BRAND.violet, points: [18, 32, 26, 46, 40, 62, 54, 74] }]}
            />
          </Panel>
          <Panel className="flex min-w-0 flex-1 flex-col p-[0.9cqw]">
            <span className="text-[0.88cqw] font-bold">{t.app.charts.topProducts}</span>
            <div className="mt-[0.55cqw] flex flex-col gap-[0.42cqw]">
              {t.app.products.slice(0, 4).map((p, i) => (
                <div key={p.code} className="flex items-center gap-[0.45cqw] text-[0.73cqw]">
                  <span dir="ltr" className="text-slate-500 tabular-nums">{i + 1}</span>
                  <span className="truncate text-slate-200">{p.name}</span>
                  <span dir="ltr" className="ms-auto font-semibold tabular-nums">{[128, 96, 74, 51][i]}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="flex min-w-0 flex-1 flex-col p-[0.9cqw]">
            <span className="text-[0.88cqw] font-bold">{t.app.kpi.debts}</span>
            <div className="mt-[0.55cqw] flex flex-col gap-[0.4cqw]">
              {t.app.customers.slice(0, 4).map((c, i) => (
                <div key={c} className="flex items-center gap-[0.45cqw] rounded-[0.45cqw] bg-white/[0.03] px-[0.5cqw] py-[0.32cqw]">
                  <span className="truncate text-[0.72cqw] text-slate-200">{c}</span>
                  <span dir="ltr" className="ms-auto text-[0.72cqw] font-bold tabular-nums">
                    {[4200, 1800, 950, 400][i]} {cur}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------- Customers/Debts */

function Customers() {
  const { t } = useI18n();
  const cur = t.app.currency;
  const rows = [
    { total: 12400, paid: 8200 },
    { total: 5600, paid: 5600 },
    { total: 9800, paid: 3000 },
    { total: 2300, paid: 2300 },
    { total: 7400, paid: 4400 },
  ];
  return (
    <Shell active="customers">
      <div className="flex h-full flex-col gap-[0.8cqw]">
        <div className="flex gap-[0.8cqw]">
          {[
            [t.app.nav.customers, "128"],
            [t.app.kpi.debts, `18 350 ${cur}`],
            [t.app.status.partial, "12"],
            [t.app.status.paid, "96"],
          ].map(([l, v]) => (
            <Panel key={l} className="flex-1 p-[0.75cqw]">
              <div className="text-[0.7cqw] text-slate-400">{l}</div>
              <div dir="ltr" className="mt-[0.15cqw] text-[1.2cqw] font-extrabold tabular-nums">{v}</div>
            </Panel>
          ))}
        </div>
        <Panel className="flex min-h-0 flex-1 flex-col p-[0.85cqw]">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1fr] gap-[0.5cqw] border-b border-white/[0.07] pb-[0.45cqw] text-[0.68cqw] font-semibold text-slate-500">
            <span>{t.app.table.customer}</span>
            <span>{t.app.table.total}</span>
            <span>{t.app.table.paid}</span>
            <span>{t.app.table.rest}</span>
            <span>{t.app.table.status}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-between pt-[0.2cqw]">
            {t.app.customers.map((c, i) => {
              const r = rows[i];
              const rest = r.total - r.paid;
              return (
                <div
                  key={c}
                  className={cn(
                    "grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1fr] items-center gap-[0.5cqw] rounded-[0.5cqw] px-[0.3cqw] py-[0.5cqw]",
                    i % 2 === 1 && "bg-white/[0.022]",
                  )}
                >
                  <span className="flex items-center gap-[0.5cqw]">
                    <Avatar label={c.slice(0, 1)} color={`linear-gradient(135deg,#2f6bff,#7a5af8)`} />
                    <span className="truncate text-[0.78cqw] font-semibold">{c}</span>
                  </span>
                  <span dir="ltr" className="text-[0.74cqw] tabular-nums">{r.total} {cur}</span>
                  <span dir="ltr" className="text-[0.74cqw] text-slate-400 tabular-nums">{r.paid} {cur}</span>
                  <span dir="ltr" className="text-[0.74cqw] font-bold tabular-nums">{rest} {cur}</span>
                  <span>
                    {rest === 0 ? (
                      <UiBadge tone="green">{t.app.status.paid}</UiBadge>
                    ) : rest < r.total / 2 ? (
                      <UiBadge tone="amber">{t.app.status.partial}</UiBadge>
                    ) : (
                      <UiBadge tone="rose">{t.app.status.due}</UiBadge>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

/* -------------------------------------------------------------- Services */

function Services() {
  const { t } = useI18n();
  const cur = t.app.currency;
  return (
    <Shell active="services">
      <div className="flex h-full gap-[0.8cqw]">
        <Panel className="flex min-w-0 flex-[1.5] flex-col p-[0.85cqw]">
          <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr] gap-[0.5cqw] border-b border-white/[0.07] pb-[0.45cqw] text-[0.68cqw] font-semibold text-slate-500">
            <span>{t.app.table.service}</span>
            <span>{t.app.table.customer}</span>
            <span>{t.app.table.price}</span>
            <span>{t.app.table.status}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-between pt-[0.2cqw]">
            {t.app.servicesList.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "grid grid-cols-[2fr_1.4fr_1fr_1fr] items-center gap-[0.5cqw] rounded-[0.5cqw] px-[0.3cqw] py-[0.55cqw]",
                  i % 2 === 1 && "bg-white/[0.022]",
                )}
              >
                <span className="flex items-center gap-[0.5cqw]">
                  <span className="grid size-[1.7cqw] place-items-center rounded-[0.45cqw] bg-[#7a5af8]/15 text-[#a78bfa]">
                    <Wrench className="size-[0.95cqw]" strokeWidth={1.7} aria-hidden />
                  </span>
                  <span className="truncate text-[0.78cqw] font-semibold">{s}</span>
                </span>
                <span className="truncate text-[0.73cqw] text-slate-400">
                  {t.app.customers[i % t.app.customers.length]}
                </span>
                <span dir="ltr" className="text-[0.74cqw] font-bold tabular-nums">
                  {[1500, 800, 2000, 400, 1200][i]} {cur}
                </span>
                <span>
                  {i % 3 === 0 ? (
                    <UiBadge tone="green">{t.app.status.paid}</UiBadge>
                  ) : (
                    <UiBadge tone="amber">{t.app.status.partial}</UiBadge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="flex w-[13cqw] shrink-0 flex-col p-[0.85cqw]">
          <span className="text-[0.88cqw] font-bold">{t.app.charts.services}</span>
          <Donut
            size="8cqw"
            slices={[
              { color: BRAND.blue, value: 40 },
              { color: BRAND.violet, value: 28 },
              { color: BRAND.cyan, value: 20 },
              { color: BRAND.green, value: 12 },
            ]}
          />
          <div className="mt-[0.7cqw] flex flex-col gap-[0.35cqw]">
            {t.app.servicesList.slice(0, 4).map((s, i) => (
              <div key={s} className="flex items-center gap-[0.4cqw] text-[0.72cqw]">
                <span
                  className="size-[0.45cqw] rounded-full"
                  style={{ background: [BRAND.blue, BRAND.violet, BRAND.cyan, BRAND.green][i] }}
                />
                <span className="truncate text-slate-300">{s}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------- Employees */

function Employees() {
  const { t } = useI18n();
  const matrix = [
    { name: t.app.employeesList[0], role: t.employees.roles.cashier, perms: [true, false, false, false] },
    { name: t.app.employeesList[1], role: t.employees.roles.stock, perms: [true, true, false, false] },
    { name: t.app.employeesList[2], role: t.employees.roles.manager, perms: [true, true, true, true] },
  ];
  const cols = [t.employees.perms.sales, t.employees.perms.inventory, t.employees.perms.reports, t.employees.perms.settings];

  return (
    <Shell active="employees">
      <Panel className="flex h-full flex-col p-[1cqw]">
        <div className="grid grid-cols-[1.8fr_repeat(4,1fr)] gap-[0.5cqw] border-b border-white/[0.07] pb-[0.5cqw] text-[0.72cqw] font-semibold text-slate-500">
          <span>{t.employees.tableEmployee}</span>
          {cols.map((c) => (
            <span key={c} className="text-center">
              {c}
            </span>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div
            key={row.name}
            className={cn(
              "grid grid-cols-[1.8fr_repeat(4,1fr)] items-center gap-[0.5cqw] rounded-[0.5cqw] px-[0.3cqw] py-[0.9cqw]",
              i % 2 === 1 && "bg-white/[0.022]",
            )}
          >
            <span className="flex items-center gap-[0.5cqw]">
              <Avatar label={row.name.slice(0, 1)} color="linear-gradient(135deg,#2f6bff,#7a5af8)" />
              <span>
                <span className="block text-[0.8cqw] font-semibold">{row.name}</span>
                <span className="block text-[0.68cqw] text-slate-500">{row.role}</span>
              </span>
            </span>
            {row.perms.map((ok, j) => (
              <span key={j} className="flex justify-center">
                <span
                  className={cn(
                    "grid size-[1.5cqw] place-items-center rounded-full text-[0.8cqw] font-bold",
                    ok ? "bg-emerald-400/15 text-emerald-300" : "bg-white/[0.05] text-slate-600",
                  )}
                >
                  {ok ? "✓" : "✕"}
                </span>
              </span>
            ))}
          </div>
        ))}
        <p className="mt-auto text-[0.7cqw] text-slate-500">{t.employees.note}</p>
      </Panel>
    </Shell>
  );
}

/* --------------------------------------------------------------- Export */

export function DesktopScreen({ screen }: { screen: ReplicaScreen }) {
  switch (screen) {
    case "pos":
      return <Pos />;
    case "products":
      return <ProductsTable active="products" />;
    case "inventory":
      return <ProductsTable active="inventory" />;
    case "invoice":
      return <Invoice />;
    case "reports":
      return <Reports />;
    case "customers":
      return <Customers />;
    case "services":
      return <Services />;
    case "employees":
      return <Employees />;
    default:
      return <Dashboard />;
  }
}
