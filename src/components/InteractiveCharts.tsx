import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

export function ProgressRing({
  value,
  max = 100,
  size = 132,
  strokeWidth = 10,
  accentClass = 'text-emerald-500',
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  accentClass?: string;
  label: string;
  sublabel?: string;
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.max(0, Math.min(1, value / safeMax));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={`stroke-current ${accentClass} transition-all duration-300`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="text-2xl font-bold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

export interface ChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export function TrendAreaChart({
  data,
  unit = '',
  targetLine,
  height = 190,
  emptyMessage = 'Log daily entries to visualize your trend.',
}: {
  data: ChartPoint[];
  unit?: string;
  targetLine?: number;
  height?: number;
  emptyMessage?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const w = 640;
  const h = height;
  const padLeft = 42;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 28;
  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const vals = data.map((d) => d.value);
  if (typeof targetLine === 'number') vals.push(targetLine);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const span = Math.max(1, rawMax - rawMin);
  const minVal = Math.max(0, rawMin - span * 0.15);
  const maxVal = rawMax + span * 0.15;
  const range = Math.max(1, maxVal - minVal);

  const getX = (i: number) =>
    data.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (data.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - ((val - minVal) / range) * plotH;

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPath =
    data.length > 1
      ? `M ${getX(0)},${padTop + plotH} L ${data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' L ')} L ${getX(
          data.length - 1
        )},${padTop + plotH} Z`
      : '';

  const activePoint = hoverIdx !== null ? data[hoverIdx] : data[data.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Selected:{' '}
          <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
            {activePoint?.value.toLocaleString()}
            {unit ? ` ${unit}` : ''}
          </strong>{' '}
          ({activePoint?.label})
        </span>
        {typeof targetLine === 'number' && (
          <span className="font-mono tabular-nums">
            Target: {targetLine.toLocaleString()}
            {unit ? ` ${unit}` : ''}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full overflow-visible select-none"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="fittrackGreenArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((step) => {
          const yPos = padTop + plotH * step;
          const labelVal = Math.round((maxVal - step * range) * 10) / 10;
          return (
            <g key={step}>
              <line
                x1={padLeft}
                x2={w - padRight}
                y1={yPos}
                y2={yPos}
                className="stroke-zinc-200 dark:stroke-zinc-800/80"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={yPos + 4}
                textAnchor="end"
                className="fill-zinc-400 dark:fill-zinc-500 text-[10px] font-mono"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Target line */}
        {typeof targetLine === 'number' && (
          <line
            x1={padLeft}
            x2={w - padRight}
            y1={getY(targetLine)}
            y2={getY(targetLine)}
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {areaPath && <path d={areaPath} fill="url(#fittrackGreenArea)" />}

        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#22C55E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />
        )}

        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoverIdx === i;
          const showLabel =
            data.length <= 8 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0;

          return (
            <g key={`${d.label}-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5.5 : 3.5}
                className="fill-emerald-500 stroke-white dark:stroke-zinc-950 transition-transform"
                strokeWidth="2"
              />
              {showLabel && (
                <text
                  x={cx}
                  y={h - 6}
                  textAnchor="middle"
                  className="fill-zinc-500 dark:fill-zinc-400 text-[10px] font-mono"
                >
                  {d.label}
                </text>
              )}
              <rect
                x={cx - plotW / Math.max(2, data.length * 2)}
                y={padTop}
                width={plotW / Math.max(1, data.length)}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(i)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function BarComparisonChart({
  data,
  unit = '',
  goal,
  height = 175,
}: {
  data: ChartPoint[];
  unit?: string;
  goal?: number;
  height?: number;
}) {
  const maxVal = Math.max(goal ?? 1, ...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2 pt-4" style={{ height }}>
        {data.map((item, idx) => {
          const pct = Math.max(4, Math.min(100, Math.round((item.value / maxVal) * 100)));
          const hitGoal = goal ? item.value >= goal : false;
          return (
            <div key={`${item.label}-${idx}`} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                {item.value.toLocaleString()}
                {unit}
              </span>
              <div className="w-full max-w-[34px] bg-zinc-100 dark:bg-zinc-800/80 rounded-t-md h-full flex items-end overflow-hidden">
                <div
                  className={`w-full rounded-t-md transition-all duration-200 ${
                    hitGoal
                      ? 'bg-emerald-500'
                      : 'bg-emerald-500/70 dark:bg-emerald-500/60'
                  }`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 mt-1.5 truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResilientImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950 text-zinc-300 p-4 ${className}`}
      >
        <Dumbbell className="w-7 h-7 text-emerald-400 mb-1.5" />
        <span className="text-xs text-center font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
