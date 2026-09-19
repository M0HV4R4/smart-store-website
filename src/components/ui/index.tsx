import {
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";

/* ------------------------------------------------------------------ Section */

export function Section({
  id,
  children,
  className,
  tone = "default",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "tight";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 bg-white",
        tone === "tight" ? "py-10 sm:py-12" : "py-12 sm:py-16 lg:py-20",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "mx-auto max-w-3xl items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-[13px] font-semibold text-blue-600">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-h2 font-extrabold text-balance text-slate-950">{title}</h2>
      {subtitle ? (
        <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600 text-pretty sm:text-[16px]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- Button */

type ButtonBase = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "glass" | "ghost" | "light";
  icon?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
};

const SIZES = {
  sm: "h-9.5 px-4 text-[13px] gap-2 rounded-full",
  md: "h-11 px-5.5 text-[14px] gap-2.5 rounded-full",
  lg: "h-12.5 px-6.5 text-[15px] gap-2.5 rounded-full",
};

const VARIANTS = {
  primary: "text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/25 hover:shadow-md hover:shadow-blue-600/35 active:scale-[0.98] transition-all duration-200",
  glass: "bg-white/95 text-slate-800 border border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-200",
  ghost: "text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 active:scale-[0.98] transition-all duration-200",
  light: "bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/80 active:scale-[0.98] transition-all duration-200",
};

function inner(icon: ReactNode, children: ReactNode, iconEnd: ReactNode) {
  return (
    <>
      {icon ? <span className="relative shrink-0">{icon}</span> : null}
      <span className="relative">{children}</span>
      {iconEnd ? <span className="relative shrink-0 rtl:-scale-x-100">{iconEnd}</span> : null}
    </>
  );
}

export function Button({
  children,
  href,
  className,
  size = "md",
  variant = "primary",
  icon,
  iconEnd,
  fullWidth,
  onClick,
  ...rest
}: ButtonBase &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: string }) {
  const classes = cn(
    "inline-flex items-center justify-center font-bold tracking-tight whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
    SIZES[size],
    VARIANTS[variant],
    fullWidth && "w-full",
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick as never}>
        {inner(icon, children, iconEnd)}
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick} {...rest}>
      {inner(icon, children, iconEnd)}
    </button>
  );
}

/* --------------------------------------------------------------------- Card */

export function Card({
  children,
  className,
  as: Tag = "div",
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "relative rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-saas-card ring-1 ring-slate-900/[0.02] transition-all duration-300",
        interactive && "hover:border-blue-400/80 hover:shadow-saas-card-hover hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function IconTile({
  children,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 shadow-2xs", className)}>
      {children}
    </span>
  );
}

export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "blue" | "emerald" | "brand" | "danger" | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
        (tone === "blue" || tone === "brand") && "bg-blue-50 text-blue-700 border border-blue-200/80",
        tone === "emerald" && "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
        tone === "danger" && "bg-rose-50 text-rose-700 border border-rose-200/80",
        tone === "default" && "bg-slate-100 text-slate-700 border border-slate-200/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <details key={item.q} className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-bold text-slate-900">{item.q}</summary>
          <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
}
