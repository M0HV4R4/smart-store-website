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
  sm: "h-10 px-4 text-[13.5px] gap-2 rounded-lg",
  md: "h-11 px-5 text-[14.5px] gap-2.5 rounded-lg",
  lg: "h-12 px-6 text-[15.5px] gap-2.5 rounded-lg",
};

const VARIANTS = {
  primary: "text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 shadow-sm",
  glass: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm",
  ghost: "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent",
  light: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
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
    "inline-flex items-center justify-center font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-50",
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
        "relative rounded-card border border-slate-200 bg-white p-6 shadow-sm",
        interactive && "hover:border-slate-300",
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
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100", className)}>
      {children}
    </span>
  );
}

export function Pill({
  children,
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-700">
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
