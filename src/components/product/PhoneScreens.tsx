import { Home, Package, Search, ShoppingCart, SlidersHorizontal, Store, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useI18n } from "@/lib/i18n";
import { BRAND, ProductIcon } from "./parts";

export type PhoneView = "pos" | "scan" | "products";

function StatusBar() {
  return (
    <div dir="ltr" className="flex items-center justify-between px-[6cqw] pt-[3.4cqw] pb-[1.2cqw] text-[3.2cqw] font-semibold text-white/90">
      <span dir="ltr" className="tabular-nums">9:41</span>
      <div className="flex items-center gap-[1.4cqw]">
        <svg viewBox="0 0 20 14" className="h-[2.8cqw] w-[4cqw] fill-white/85" aria-hidden>
          <rect x="0" y="9" width="3" height="5" rx="1" />
          <rect x="4.8" y="6.5" width="3" height="7.5" rx="1" />
          <rect x="9.6" y="3.5" width="3" height="10.5" rx="1" />
          <rect x="14.4" y="0" width="3" height="14" rx="1" opacity=".45" />
        </svg>
        <div className="flex h-[3.2cqw] w-[6cqw] items-center rounded-[1cqw] border border-white/60 p-[0.45cqw]">
          <div className="h-full w-[72%] rounded-[0.4cqw] bg-white/85" />
        </div>
      </div>
    </div>
  );
}

function BottomNav({ active }: { active: "home" | "pos" | "products" }) {
  const { t } = useI18n();
  const items = [
    { key: "home" as const, label: t.app.nav.dashboard, Icon: Home },
    { key: "pos" as const, label: t.app.nav.pos, Icon: ShoppingCart },
    { key: "products" as const, label: t.app.nav.products, Icon: Package },
  ];
  return (
    <div className="mt-auto flex items-center justify-around border-t border-white/[0.07] bg-[#070a16]/85 px-[4cqw] pt-[2.2cqw] pb-[3.4cqw]">
      {items.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <span key={key} className="flex flex-col items-center gap-[0.9cqw]">
            <Icon
              className={cn("size-[4.4cqw]", isActive ? "text-[#8aa8ff]" : "text-slate-500")}
              strokeWidth={1.8}
              aria-hidden
            />
            <span className={cn("text-[2.5cqw] font-medium", isActive ? "text-[#8aa8ff]" : "text-slate-500")}>
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function PosView() {
  const { t } = useI18n();
  const cur = t.app.currency;
  const prices = [320, 140, 980, 210, 450, 190];
  const total = 1290;

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex items-center gap-[2.6cqw] px-[5cqw] pb-[2.6cqw]">
        <span className="grid size-[8.6cqw] place-items-center rounded-[2.6cqw] bg-[linear-gradient(135deg,#2f6bff,#7a5af8)]">
          <Store className="size-[4.4cqw] text-white" strokeWidth={2} aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block text-[3.9cqw] font-bold">{t.app.pos.title}</span>
          <span className="block text-[2.9cqw] text-slate-400">{t.app.pos.newSale}</span>
        </span>
        <span className="relative ms-auto grid size-[8.6cqw] place-items-center rounded-[2.6cqw] border border-white/10 bg-white/[0.05]">
          <ShoppingCart className="size-[4.2cqw]" strokeWidth={1.8} aria-hidden />
          <span className="absolute -top-[1cqw] -end-[1cqw] grid size-[4.4cqw] place-items-center rounded-full bg-[#f87171] text-[2.7cqw] font-bold">
            3
          </span>
        </span>
      </div>

      <div className="flex items-center gap-[2.2cqw] px-[5cqw]">
        <span className="flex flex-1 items-center gap-[2cqw] rounded-[3cqw] border border-white/[0.08] bg-white/[0.05] px-[3.2cqw] py-[2.1cqw]">
          <Search className="size-[3.8cqw] text-slate-400" strokeWidth={2} aria-hidden />
          <span className="text-[3cqw] text-slate-400">{t.app.search}</span>
        </span>
        <span className="grid size-[9cqw] place-items-center rounded-[3cqw] bg-[linear-gradient(135deg,#22d3ee,#2f6bff)]">
          <svg viewBox="0 0 24 24" className="size-[4.4cqw]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
            <path d="M3 7V5.2A2.2 2.2 0 0 1 5.2 3H7M17 3h1.8A2.2 2.2 0 0 1 21 5.2V7M21 17v1.8a2.2 2.2 0 0 1-2.2 2.2H17M7 21H5.2A2.2 2.2 0 0 1 3 18.8V17" />
            <path d="M7 8.5v7M10.5 8.5v7M14 8.5v7M17 8.5v7" />
          </svg>
        </span>
      </div>

      <div className="mt-[2.8cqw] flex gap-[1.8cqw] px-[5cqw]">
        {[t.app.pos.categoriesAll, t.app.categories.food, t.app.categories.drinks].map((c, i) => (
          <span
            key={c}
            className={cn(
              "truncate rounded-full px-[3.2cqw] py-[1.4cqw] text-[2.9cqw] font-semibold",
              i === 0 ? "bg-white text-[#06070e]" : "border border-white/[0.08] bg-white/[0.04] text-slate-300",
            )}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-[2.8cqw] grid grid-cols-2 gap-[2.4cqw] px-[5cqw]">
        {t.app.products.slice(0, 6).map((p, i) => {
          const color = Object.values(BRAND)[i % 6];
          return (
            <div
              key={p.code}
              className="rounded-[3.2cqw] border border-white/[0.07] bg-[linear-gradient(160deg,rgba(255,255,255,0.065),rgba(255,255,255,0.02))] p-[2.4cqw]"
            >
              <span
                className="grid h-[10cqw] w-full place-items-center rounded-[2.2cqw]"
                style={{ background: `${color}1f`, border: `1px solid ${color}33`, color }}
              >
                <ProductIcon index={i} className="size-[5cqw]" />
              </span>
              <span className="mt-[1.6cqw] block truncate text-[3cqw] font-semibold">{p.name}</span>
              <span className="mt-[0.4cqw] flex items-center">
                <span dir="ltr" className="text-[3.2cqw] font-bold tabular-nums" style={{ color }}>
                  {prices[i]} {cur}
                </span>
                <span className="ms-auto grid size-[4.8cqw] place-items-center rounded-full bg-white/10 text-[3.2cqw] leading-none font-bold">
                  +
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto px-[4cqw] pb-[2cqw]">
        <div className="rounded-[4cqw] border border-white/[0.09] bg-[linear-gradient(160deg,rgba(22,28,56,0.96),rgba(9,12,26,0.96))] p-[3.2cqw]">
          <div className="flex items-center text-[2.9cqw] text-slate-400">
            <span>{t.app.pos.subtotal}</span>
            <span dir="ltr" className="ms-auto text-white/90 tabular-nums">{total} {cur}</span>
          </div>
          <div className="my-[2cqw] h-px bg-white/10" />
          <div className="flex items-end">
            <span>
              <span className="block text-[2.8cqw] text-slate-400">{t.app.pos.total}</span>
              <span dir="ltr" className="block text-[5.6cqw] leading-none font-extrabold tabular-nums">
                {total} {cur}
              </span>
            </span>
            <span className="ms-auto rounded-full bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] px-[4.6cqw] py-[2.4cqw] text-[3.3cqw] font-bold">
              {t.app.pos.checkout}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanView() {
  const { t } = useI18n();
  const cur = t.app.currency;

  return (
    <div className="flex h-full flex-col bg-[#05060f]">
      <StatusBar />
      <div className="flex items-center px-[5cqw] pb-[2.4cqw]">
        <span className="text-[3.9cqw] font-bold">{t.app.pos.scan}</span>
        <span className="ms-auto grid size-[7.6cqw] place-items-center rounded-full border border-white/10 bg-white/[0.05]">
          <X className="size-[3.6cqw]" strokeWidth={2.2} aria-hidden />
        </span>
      </div>

      <div className="relative mx-[5cqw] flex-1 overflow-hidden rounded-[5cqw] border border-white/[0.08] bg-[radial-gradient(120%_90%_at_50%_15%,#19204a,#080b1b_70%)]">
        <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(115deg,rgba(255,255,255,0.04)_0_2px,transparent_2px_7px)]" />
        <div className="absolute top-1/2 left-1/2 h-[36%] w-[74%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute -inset-[1.4cqw] rounded-[4cqw] bg-[#22d3ee]/10 blur-md" />
          {[
            "top-0 left-0 border-t-[0.9cqw] border-l-[0.9cqw] rounded-tl-[3cqw]",
            "top-0 right-0 border-t-[0.9cqw] border-r-[0.9cqw] rounded-tr-[3cqw]",
            "bottom-0 left-0 border-b-[0.9cqw] border-l-[0.9cqw] rounded-bl-[3cqw]",
            "bottom-0 right-0 border-b-[0.9cqw] border-r-[0.9cqw] rounded-br-[3cqw]",
          ].map((c) => (
            <span key={c} className={cn("absolute size-[8cqw] border-[#22d3ee]", c)} />
          ))}
          <div dir="ltr" className="absolute inset-0 flex items-center justify-center gap-[0.6cqw] px-[8cqw]">
            {[3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3].map((w, i) => (
              <span key={i} className="h-[52%] rounded-[0.2cqw] bg-white/85" style={{ width: `${w * 0.5}cqw` }} />
            ))}
          </div>
          <div className="absolute inset-x-[4%] top-1/2 h-[0.55cqw] rounded-full bg-[#22d3ee] shadow-[0_0_4cqw_1cqw_rgba(34,211,238,0.6)] animate-beam" />
        </div>
        <div className="absolute inset-x-0 bottom-[5%] text-center text-[2.8cqw] text-slate-400">
          {t.app.pos.scanHint}
        </div>
      </div>

      <div className="mx-[4cqw] mt-[2.8cqw] mb-[3.6cqw] rounded-[4.2cqw] border border-white/[0.09] bg-[linear-gradient(160deg,rgba(22,28,56,0.96),rgba(9,12,26,0.96))] p-[3.4cqw]">
        <div className="flex items-center gap-[1.6cqw] text-[2.9cqw] font-semibold text-emerald-300">
          <span className="size-[1.5cqw] rounded-full bg-emerald-400 animate-blink" />
          {t.app.pos.matched}
        </div>
        <div className="mt-[2.2cqw] flex items-center gap-[2.8cqw]">
          <span className="grid size-[12cqw] place-items-center rounded-[3cqw] border border-[#5f8bff]/30 bg-[#5f8bff]/15 text-[#8aa8ff]">
            <ProductIcon index={2} className="size-[6cqw]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[3.4cqw] font-bold">{t.app.products[2].name}</span>
            <span dir="ltr" className="mt-[0.4cqw] block text-[2.7cqw] text-slate-400 tabular-nums rtl:text-end">
              6 291041 500213
            </span>
            <span className="mt-[1cqw] flex items-center gap-[2cqw]">
              <span dir="ltr" className="text-[4cqw] font-extrabold tabular-nums">980 {cur}</span>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/12 px-[2cqw] py-[0.4cqw] text-[2.6cqw] font-semibold text-amber-300">
                {t.app.pos.remaining}: 12
              </span>
            </span>
          </span>
        </div>
        <div className="mt-[2.8cqw] flex items-center gap-[2.2cqw]">
          <span className="flex items-center gap-[2.8cqw] rounded-full border border-white/10 bg-white/[0.05] px-[3.2cqw] py-[1.7cqw]">
            <span className="text-[3.6cqw] leading-none font-bold text-slate-300">−</span>
            <span dir="ltr" className="text-[3.2cqw] font-bold tabular-nums">2</span>
            <span className="text-[3.6cqw] leading-none font-bold text-slate-300">+</span>
          </span>
          <span className="flex-1 rounded-full bg-[linear-gradient(100deg,#2f6bff,#7a5af8)] py-[2.3cqw] text-center text-[3.2cqw] font-bold">
            {t.app.pos.addToCart}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductsView() {
  const { t } = useI18n();
  const cur = t.app.currency;
  const stocks = [86, 54, 12, 68, 31];
  const prices = [320, 140, 980, 210, 450];

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex items-center px-[5cqw] pb-[2.4cqw]">
        <span>
          <span className="block text-[4.1cqw] font-bold">{t.app.nav.products}</span>
          <span className="block text-[2.9cqw] text-slate-400">{t.app.nav.inventory}</span>
        </span>
        <span className="ms-auto grid size-[8.2cqw] place-items-center rounded-full border border-white/10 bg-white/[0.05]">
          <SlidersHorizontal className="size-[4cqw]" strokeWidth={1.8} aria-hidden />
        </span>
      </div>

      <div className="mx-[5cqw] flex items-center gap-[2cqw] rounded-[3cqw] border border-white/[0.08] bg-white/[0.05] px-[3.2cqw] py-[2.1cqw]">
        <Search className="size-[3.8cqw] text-slate-400" strokeWidth={2} aria-hidden />
        <span className="text-[3cqw] text-slate-400">{t.app.search}</span>
      </div>

      <div className="mt-[2.8cqw] flex flex-col gap-[2cqw] px-[5cqw]">
        {t.app.products.slice(0, 5).map((p, i) => {
          const stock = stocks[i];
          const color = stock > 50 ? BRAND.green : stock > 20 ? BRAND.amber : BRAND.rose;
          return (
            <div
              key={p.code}
              className="flex items-center gap-[2.6cqw] rounded-[3.2cqw] border border-white/[0.07] bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-[2.4cqw]"
            >
              <span
                className="grid size-[10.4cqw] shrink-0 place-items-center rounded-[2.6cqw]"
                style={{ background: `${color}1f`, border: `1px solid ${color}38`, color }}
              >
                <ProductIcon index={i} className="size-[5.2cqw]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[3.2cqw] font-semibold">{p.name}</span>
                <span dir="ltr" className="block text-[2.7cqw] text-slate-500 tabular-nums">{p.code}</span>
                <span className="mt-[1.1cqw] block h-[0.9cqw] w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <span className="block h-full rounded-full" style={{ width: `${stock}%`, background: color }} />
                </span>
              </span>
              <span className="text-end">
                <span dir="ltr" className="block text-[3.2cqw] font-bold tabular-nums">{prices[i]} {cur}</span>
                <span dir="ltr" className="block text-[2.7cqw] font-semibold tabular-nums" style={{ color }}>
                  {stock}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <BottomNav active="products" />
    </div>
  );
}

export function PhoneScreen({ view }: { view: PhoneView }) {
  return (
    <div className="ui-root size-full bg-[radial-gradient(120%_80%_at_50%_0%,#121838_0%,#0a0d20_45%,#05060f_100%)] text-white">
      {view === "scan" ? <ScanView /> : view === "products" ? <ProductsView /> : <PosView />}
    </div>
  );
}
