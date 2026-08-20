import { useMemo } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { SETTLEMENTS } from "@/lib/delivery/settlements";
import type { Settlement } from "@/lib/delivery/settlements";
import { roadKm } from "@/lib/delivery/settlements";
import { fmtKm } from "@/lib/delivery/format";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const W = 640;
const H = 470;
const LNG_MIN = 49.9;
const LNG_MAX = 55.6;
const LAT_MIN = 42.9;
const LAT_MAX = 46.0;

function project(s: Settlement) {
  const x = ((s.lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  const y = ((LAT_MAX - s.lat) / (LAT_MAX - LAT_MIN)) * H;
  return { x, y };
}

function pointOnQuad(p0: { x: number; y: number }, c: { x: number; y: number }, p1: { x: number; y: number }, t: number) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

interface RegionMapProps {
  from?: Settlement;
  to?: Settlement;
  progress?: number;
  className?: string;
}

export function RegionMap({ from, to, progress, className }: RegionMapProps) {
  const { lite } = useMode();
  const reduced = usePrefersReducedMotion();

  const geometry = useMemo(() => {
    const pts = new Map(SETTLEMENTS.map((s) => [s.id, project(s)]));
    let route:
      | { d: string; from: { x: number; y: number }; to: { x: number; y: number }; c: { x: number; y: number } }
      | undefined;
    let km = 0;
    if (from && to) {
      const a = pts.get(from.id)!;
      const b = pts.get(to.id)!;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const c = { x: mid.x - (dy / len) * 26, y: mid.y + (dx / len) * 26 };
      route = { d: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`, from: a, to: b, c };
      km = roadKm(from, to);
    }
    return { pts, route, km };
  }, [from, to]);

  const { pts, route, km } = geometry;

  if (lite) return null;

  const progressPoint =
    route && progress != null ? pointOnQuad(route.from, route.c, route.to, Math.min(1, Math.max(0, progress))) : null;

  return (
    <div
      data-testid="region-map"
      role="img"
      aria-label={
        from && to
          ? `Маршрут ${from.name} — ${to.name}, ${km} км, на схеме Мангистауской области`
          : "Схема населённых пунктов и маршрутов Мангистауской области"
      }
      className={cn("overflow-hidden rounded-2xl border bg-paper", className)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block size-full">
        <rect width={W} height={H} fill="var(--color-sea)" />
        <path
          d="M 120 8 C 150 60 90 120 118 180 C 145 235 92 300 122 360 C 145 410 118 440 124 462 L 632 462 L 632 8 Z"
          fill="#f1ecdf"
          stroke="#d8d3c2"
          strokeWidth="1.5"
        />
        <path
          d="M 8 40 h 56 M 8 64 h 44 M 8 88 h 50 M 8 112 h 38"
          stroke="#b9cde9"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="16" y="30" fill="#8fa9cc" fontSize="10" fontWeight="700" letterSpacing="2">
          КАСПИЙСКОЕ МОРЕ
        </text>

        {!from &&
          !to &&
          Array.from(pts.entries()).map(([id, p]) => {
            if (id === "aktau") return null;
            const a = pts.get("aktau")!;
            return (
              <line
                key={`line-${id}`}
                x1={a.x}
                y1={a.y}
                x2={p.x}
                y2={p.y}
                stroke="#ded5bf"
                strokeWidth="1.5"
                strokeDasharray="3 5"
              />
            );
          })}

        {route && (
          <>
            <path
              d={route.d}
              fill="none"
              stroke="#1f4fe0"
              strokeWidth="4"
              strokeLinecap="round"
              className={reduced ? "" : "animate-route"}
              strokeDasharray="9 7"
              opacity="0.28"
            />
            <path d={route.d} fill="none" stroke="#1f4fe0" strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {route && progressPoint && (
          <circle
            data-testid="route-dot"
            cx={progressPoint.x}
            cy={progressPoint.y}
            r="6"
            fill="#fff"
            stroke="#1f4fe0"
            strokeWidth="3.5"
          />
        )}

        {Array.from(pts.entries()).map(([id, p]) => {
          const isHub = id === "aktau";
          const isEndpoint = route && (id === from?.id || id === to?.id);
          return (
            <g key={id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHub ? 7 : isEndpoint ? 6 : 4.5}
                fill={isHub || isEndpoint ? "#1f4fe0" : "#211d15"}
                stroke="#f1ecdf"
                strokeWidth={isHub || isEndpoint ? 3 : 1.5}
              />
              <text
                x={p.x + (isHub ? 10 : 8)}
                y={p.y + 3.5}
                fontSize={isHub ? 12 : 10.5}
                fontWeight="700"
                fill={isHub || isEndpoint ? "#1f4fe0" : "#57523f"}
                stroke="#f1ecdf"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {SETTLEMENTS.find((s) => s.id === id)?.name}
              </text>
            </g>
          );
        })}

        {route && (
          <g>
            <rect
              x={route.from.x + (route.to.x - route.from.x) / 2 - 26}
              y={(route.from.y + route.to.y) / 2 + 10}
              width="52"
              height="20"
              rx="10"
              fill="#fff"
              stroke="#d8d3c2"
            />
            <text
              x={route.from.x + (route.to.x - route.from.x) / 2}
              y={(route.from.y + route.to.y) / 2 + 24}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#211d15"
            >
              {fmtKm(km)}
            </text>
          </g>
        )}

        <text x={W - 12} y={H - 12} textAnchor="end" fontSize="10" fill="#8b8572" fontWeight="600">
          Мангистау · схема маршрутов
        </text>
      </svg>
    </div>
  );
}