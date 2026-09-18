import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { ReplicaScreen, Shot } from "@/config/screenshots";
import { DesktopScreen } from "@/components/product/DesktopScreens";
import { PhoneScreen, type PhoneView } from "@/components/product/PhoneScreens";

/* =========================================================================
   إطارات الأجهزة — تصميم نظيف بدون تدرجات داكنة
   ========================================================================= */

export function Laptop({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <div className="relative rounded-2xl border-4 border-slate-800 bg-slate-900 p-2 shadow-xl">
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-lg bg-slate-900">
            {children}
          </div>
          <span className="absolute top-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-slate-700" />
        </div>

        {/* قاعدة اللابتوب */}
        <div className="relative mx-auto -mt-1 h-3 w-[106%] rounded-b-xl border-t border-slate-700 bg-slate-800 shadow-md" />
      </div>
    </div>
  );
}

export function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative rounded-[2.5rem] border-4 border-slate-800 bg-slate-900 p-2 shadow-2xl">
        <div className="relative aspect-[9/19.3] w-full overflow-hidden rounded-[2rem] bg-slate-900">
          {children}
          {/* نوتش الكاميرا */}
          <div className="pointer-events-none absolute top-2 left-1/2 h-3.5 w-20 -translate-x-1/2 rounded-full bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export function DesktopContent({ shot, screen }: { shot?: Shot; screen: ReplicaScreen }) {
  if (shot?.image) {
    return (
      <img
        src={shot.image}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    );
  }
  return <DesktopScreen screen={screen} />;
}

export function PhoneContent({ view }: { view: PhoneView }) {
  return <PhoneScreen view={view} />;
}
