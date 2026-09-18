import type { ReactNode } from "react";
import { Candy, Coffee, CupSoda, Droplet, Leaf, Milk, Package, SprayCan } from "lucide-react";
import { cn } from "@/utils/cn";

/* =========================================================================
   عناصر واجهة المنتج — كل المقاسات بوحدات cqw لتتكيّف مع أي إطار جهاز
   ========================================================================= */

export const BRAND = {
  blue: "#5f8bff",
  cyan: "#22d3ee",
  violet: "#8b7bff",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#f87171",
};

export function Panel({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[1.1cqw] border border-white/[0.07] bg-[linear-gradient(155deg,rgba(255,255,255,0.05),rgba(255,255,255,0.016))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function UiBadge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "rose" | "blue" | "violet";
}) {
  const tones = {
    green: "bg-emerald-400/12 text-emerald-300 border-emerald-400/25",
    amber: "bg-amber-400/12 text-amber-300 border-amber-400/25",
    rose: "bg-rose-400/12 text-rose-300 border-rose-400/25",
    blue: "bg-sky-400/12 text-sky-300 border-sky-400/25",
    violet: "bg-violet-400/12 text-violet-300 border-violet-400/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-[0.7cqw] py-[0.14cqw] text-[0.76cqw] font-semibold whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-[0.5cqw] w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

export function Avatar({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex size-[2cqw] items-center justify-center rounded-full text-[0.78cqw] font-bold text-white/95"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}

/** رسم مساحي ناعم — دائماً LTR كي يبقى محور الزمن صحيحاً */
export function AreaChart({
  id,
  series,
  className,
}: {
  id: string;
  series: { color: string; points: number[]; dashed?: boolean }[];
  className?: string;
}) {
  const W = 300;
  const H = 100;

  const smooth = (pts: number[]) => {
    const c = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - (v / 100) * H] as const);
    let d = `M${c[0][0]},${c[0][1]}`;
    for (let i = 0; i < c.length - 1; i++) {
      const [x0, y0] = c[i];
      const [x1, y1] = c[i + 1];
      const mx = (x0 + x1) / 2;
      d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    return d;
  };

  return (
    <div dir="ltr" className={cn("relative w-full", className)}>
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-px w-full bg-white/[0.05]" />
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${id}-f${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {series.map((s, i) =>
          s.dashed ? null : (
            <path key={`f${i}`} d={`${smooth(s.points)} L${W},${H} L0,${H} Z`} fill={`url(#${id}-f${i})`} />
          ),
        )}
        {series.map((s, i) => (
          <path
            key={`l${i}`}
            d={smooth(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray={s.dashed ? "5 5" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}

export function Bars({
  data,
  colors = [BRAND.blue, BRAND.cyan],
  className,
}: {
  data: { a: number; b?: number }[];
  colors?: string[];
  className?: string;
}) {
  return (
    <div dir="ltr" className={cn("flex w-full items-end gap-[0.7cqw]", className)}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 items-end gap-[0.2cqw]">
          <div
            className="flex-1 rounded-t-[0.3cqw]"
            style={{ height: `${d.a}%`, background: `linear-gradient(180deg, ${colors[0]}, ${colors[0]}22)` }}
          />
          {d.b !== undefined && (
            <div
              className="flex-1 rounded-t-[0.3cqw]"
              style={{ height: `${d.b}%`, background: `linear-gradient(180deg, ${colors[1]}, ${colors[1]}1a)` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function Donut({ slices, size = "9cqw" }: { slices: { color: string; value: number }[]; size?: string }) {
  const total = slices.reduce((a, b) => a + b.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13" />
        {slices.map((s, i) => {
          const len = (s.value / total) * C;
          const node = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, len - 3)} ${C - len + 3}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return node;
        })}
      </svg>
    </div>
  );
}

/** رموز منتجات نظيفة بدل الإيموجي (تظهر بنفس الشكل على كل الأنظمة) */
const PRODUCT_ICONS = [Coffee, Milk, Droplet, Candy, SprayCan, Leaf, CupSoda, Package];

export function ProductIcon({ index, className }: { index: number; className?: string }) {
  const Icon = PRODUCT_ICONS[index % PRODUCT_ICONS.length];
  return <Icon className={className} strokeWidth={1.6} aria-hidden />;
}

/** شريط باركود زخرفي */
export function BarcodeStripes({ className, seed = 1 }: { className?: string; seed?: number }) {
  const widths = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 2, 1];
  return (
    <div dir="ltr" className={cn("flex items-stretch gap-[2px]", className)} aria-hidden>
      {widths.map((w, i) => (
        <span
          key={i}
          className="h-full rounded-[1px] bg-current"
          style={{ width: `${(w * (i % seed === 0 ? 1.1 : 1)).toFixed(1)}px`, opacity: i % 5 === 0 ? 0.75 : 1 }}
        />
      ))}
    </div>
  );
}
