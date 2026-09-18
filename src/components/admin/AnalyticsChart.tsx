import { useState, useId, useMemo } from "react";
import { Monitor, Smartphone, Calendar } from "lucide-react";
import type { TimeseriesPoint } from "@/services/analyticsService";
import { useI18n } from "@/lib/i18n";

interface AnalyticsChartProps {
  data: TimeseriesPoint[];
  isLoading?: boolean;
}

export function AnalyticsChart({ data, isLoading }: AnalyticsChartProps) {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dict = t.admin.analytics;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartId = useId();

  // Determine if all data points are zero
  const totalDownloads = useMemo(
    () => data.reduce((acc, pt) => acc + pt.total, 0),
    [data],
  );
  const isEmpty = data.length === 0 || totalDownloads === 0;

  // Compute maximum value for Y scale (minimum 5 to keep visual headroom)
  const maxValue = useMemo(() => {
    const highest = Math.max(...data.map((d) => Math.max(d.windows, d.android, d.total)), 0);
    return highest > 0 ? Math.ceil(highest * 1.15) : 5;
  }, [data]);

  // Chart layout dimensions
  const viewBoxWidth = 800;
  const viewBoxHeight = 280;
  const padding = { top: 20, right: 24, bottom: 40, left: 48 };
  const graphWidth = viewBoxWidth - padding.left - padding.right;
  const graphHeight = viewBoxHeight - padding.top - padding.bottom;

  // Calculate coordinates for points
  const points = useMemo(() => {
    if (data.length === 0) return [];
    const step = data.length > 1 ? graphWidth / (data.length - 1) : graphWidth;

    return data.map((d, i) => {
      const x = padding.left + i * step;
      // Invert Y coordinate because SVG 0 is top
      const yWindows = padding.top + graphHeight - (d.windows / maxValue) * graphHeight;
      const yAndroid = padding.top + graphHeight - (d.android / maxValue) * graphHeight;
      const yTotal = padding.top + graphHeight - (d.total / maxValue) * graphHeight;

      return {
        ...d,
        x,
        yWindows,
        yAndroid,
        yTotal,
      };
    });
  }, [data, graphWidth, graphHeight, maxValue, padding.left, padding.top]);

  // Build SVG path strings
  const paths = useMemo(() => {
    if (points.length === 0) return { lineWindows: "", areaWindows: "", lineAndroid: "", areaAndroid: "" };

    const groundY = padding.top + graphHeight;

    const lineWindows = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yWindows.toFixed(1)}`).join(" ");
    const areaWindows = `${lineWindows} L ${points[points.length - 1].x.toFixed(1)} ${groundY} L ${points[0].x.toFixed(1)} ${groundY} Z`;

    const lineAndroid = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yAndroid.toFixed(1)}`).join(" ");
    const areaAndroid = `${lineAndroid} L ${points[points.length - 1].x.toFixed(1)} ${groundY} L ${points[0].x.toFixed(1)} ${groundY} Z`;

    return { lineWindows, areaWindows, lineAndroid, areaAndroid };
  }, [points, graphHeight, padding.top]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [0, Math.round(maxValue / 2), maxValue];
    return ticks.map((val) => ({
      val,
      y: padding.top + graphHeight - (val / maxValue) * graphHeight,
    }));
  }, [maxValue, graphHeight, padding.top]);

  // Format date helper
  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T12:00:00Z`);
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-DZ", {
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T12:00:00Z`);
      return new Intl.DateTimeFormat(isAr ? "ar-DZ" : "fr-DZ", {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const activePoint = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  if (isLoading) {
    return (
      <div className="relative flex h-80 w-full animate-pulse items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
          <div className="h-6 w-32 rounded bg-slate-800" />
          <div className="h-3 w-48 rounded bg-slate-800/60" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={dict.accessibleSummary}
      className="relative flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-sm"
    >
      {/* Header & Legend */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {dict.chartTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{dict.chartSubtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span className="font-medium text-slate-300">Windows</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="font-medium text-slate-300">Android</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative mt-4 w-full overflow-hidden">
        {isEmpty ? (
          /* Real Zero Data / Empty State */
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-8 text-center">
            <div className="rounded-full border border-slate-800 bg-slate-900/80 p-3 text-slate-500 mb-3">
              <Calendar className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">
              {dict.emptyChartTitle}
            </h4>
            <p className="mt-1.5 max-w-md text-xs text-slate-400 leading-relaxed">
              {dict.emptyChartDesc}
            </p>
          </div>
        ) : (
          /* SVG Interactive Line / Area Chart */
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              className="w-full h-auto overflow-visible select-none"
              aria-hidden="true"
            >
              <defs>
                {/* Windows Gradient Area */}
                <linearGradient id={`grad-win-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
                {/* Android Gradient Area */}
                <linearGradient id={`grad-and-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines & Y-axis labels */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={viewBoxWidth - padding.right}
                    y2={tick.y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.35"
                  />
                  <text
                    x={padding.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {new Intl.NumberFormat(isAr ? "ar-DZ" : "fr-DZ").format(tick.val)}
                  </text>
                </g>
              ))}

              {/* Area Fills */}
              <path d={paths.areaWindows} fill={`url(#grad-win-${chartId})`} />
              <path d={paths.areaAndroid} fill={`url(#grad-and-${chartId})`} />

              {/* Series Lines */}
              <path
                d={paths.lineWindows}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={paths.lineAndroid}
                fill="none"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active hover crosshair */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={padding.top}
                  x2={activePoint.x}
                  y2={padding.top + graphHeight}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />
              )}

              {/* Interactive Data Points (Focusable & Hoverable) */}
              {points.map((p, i) => {
                const isActive = activeIndex === i;
                return (
                  <g key={i}>
                    {/* Invisible expanded hit target for touch & mouse */}
                    <circle
                      cx={p.x}
                      cy={p.yWindows}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onClick={() => setActiveIndex(i)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${formatFullDate(p.date)}: Windows ${p.windows}, Android ${p.android}, Total ${p.total}`}
                      onFocus={() => setActiveIndex(i)}
                      onBlur={() => setActiveIndex(null)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight") {
                          setActiveIndex(Math.min(points.length - 1, i + 1));
                        } else if (e.key === "ArrowLeft") {
                          setActiveIndex(Math.max(0, i - 1));
                        }
                      }}
                    />

                    {/* Windows Node */}
                    <circle
                      cx={p.x}
                      cy={p.yWindows}
                      r={isActive ? 6 : p.windows > 0 ? 3.5 : 2}
                      fill="#0f172a"
                      stroke="#22d3ee"
                      strokeWidth={isActive ? 3 : 2}
                      className="pointer-events-none transition-all duration-150"
                    />

                    {/* Android Node */}
                    <circle
                      cx={p.x}
                      cy={p.yAndroid}
                      r={isActive ? 6 : p.android > 0 ? 3.5 : 2}
                      fill="#0f172a"
                      stroke="#34d399"
                      strokeWidth={isActive ? 3 : 2}
                      className="pointer-events-none transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* X-axis Date Labels (Sampled to avoid overcrowding) */}
              {points
                .filter((_, i) => {
                  if (points.length <= 10) return true;
                  if (points.length <= 31) return i % 5 === 0 || i === points.length - 1;
                  return i % 15 === 0 || i === points.length - 1;
                })
                .map((p, i) => (
                  <text
                    key={i}
                    x={p.x}
                    y={padding.top + graphHeight + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#64748b"
                    className="select-none"
                  >
                    {formatDateLabel(p.date)}
                  </text>
                ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activePoint && (
              <div
                className="pointer-events-none absolute z-20 flex flex-col gap-1 rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs transition-all duration-75"
                style={{
                  top: "10px",
                  left: isAr
                    ? undefined
                    : `${Math.min(Math.max(activePoint.x - 70, 10), graphWidth - 90)}px`,
                  right: isAr
                    ? `${Math.min(Math.max(viewBoxWidth - activePoint.x - 70, 10), graphWidth - 90)}px`
                    : undefined,
                }}
              >
                <div className="font-semibold text-white border-b border-slate-800 pb-1">
                  {formatFullDate(activePoint.date)}
                </div>
                <div className="mt-1 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                    <Monitor className="h-3 w-3" />
                    <span>Windows:</span>
                  </span>
                  <span className="font-bold text-white">
                    {new Intl.NumberFormat(isAr ? "ar-DZ" : "fr-DZ").format(activePoint.windows)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Smartphone className="h-3 w-3" />
                    <span>Android:</span>
                  </span>
                  <span className="font-bold text-white">
                    {new Intl.NumberFormat(isAr ? "ar-DZ" : "fr-DZ").format(activePoint.android)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 text-slate-300">
                  <span className="font-medium">{dict.total}:</span>
                  <span className="font-bold text-white">
                    {new Intl.NumberFormat(isAr ? "ar-DZ" : "fr-DZ").format(activePoint.total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screen Reader Accessible Data Table Fallback */}
      <table className="sr-only">
        <caption>{dict.accessibleSummary}</caption>
        <thead>
          <tr>
            <th scope="col">{dict.tableVersion || "Date"}</th>
            <th scope="col">Windows</th>
            <th scope="col">Android</th>
            <th scope="col">{dict.total}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pt) => (
            <tr key={pt.date}>
              <th scope="row">{pt.date}</th>
              <td>{pt.windows}</td>
              <td>{pt.android}</td>
              <td>{pt.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
