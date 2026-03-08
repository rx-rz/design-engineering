import { useState, useEffect, useRef } from "react";

const metrics = [
  {
    id: "uptime",
    label: "Uptime",
    unit: "%",
    data: [
      99.91, 99.94, 99.87, 99.99, 99.95, 99.98, 99.93, 99.97, 99.89, 99.99,
      99.96, 99.98,
    ],
    decimals: 2,
    threshold: 99.95,
    thresholdDir: "above",
    accentGood: "oklch(0.75 0.18 142)",
    accentBad: "oklch(0.72 0.19 28)",
  },
  {
    id: "latency",
    label: "P95 Latency",
    unit: "ms",
    data: [112, 98, 134, 87, 105, 119, 93, 141, 88, 102, 116, 94],
    decimals: 0,
    threshold: 110,
    thresholdDir: "below",
    accentGood: "oklch(0.75 0.18 142)",
    accentBad: "oklch(0.72 0.19 28)",
  },
  {
    id: "rps",
    label: "Req / sec",
    data: [
      4210, 3890, 4450, 5120, 4780, 5340, 4920, 5680, 5230, 4990, 5410, 5760,
    ],
    unit: "rps",
    decimals: 0,
    threshold: 5000,
    thresholdDir: "above",
    accentGood: "oklch(0.75 0.18 142)",
    accentBad: "oklch(0.72 0.19 28)",
  },
];

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function useCountUp(target, duration = 1100, decimals = 0) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    startTimeRef.current = null;
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const t = Math.min((now - startTimeRef.current) / duration, 1);
      const val = from + (target - from) * easeOutExpo(t);
      setDisplay(parseFloat(val.toFixed(decimals)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return display;
}

function Sparkline({ data, activeIndex, accent }) {
  const W = 230,
    H = 52,
    P = 6;
  const min = Math.min(...data),
    max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    P + (i / (data.length - 1)) * (W - P * 2),
    P + (H - P * 2) - ((v - min) / range) * (H - P * 2),
  ]);
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts.at(-1)[0]},${H - P} L${pts[0][0]},${H - P} Z`;
  const ap = pts[activeIndex];

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient
          id={`g${accent.replace(/[^a-z]/gi, "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${accent.replace(/[^a-z]/gi, "")})`} />
      <path
        d={line}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {ap && (
        <>
          <line
            x1={ap[0]}
            y1={P}
            x2={ap[0]}
            y2={H - P}
            stroke={accent}
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.5"
          />
          <circle cx={ap[0]} cy={ap[1]} r="3.5" fill={accent} />
          <circle
            cx={ap[0]}
            cy={ap[1]}
            r="7"
            fill={accent}
            fillOpacity="0.15"
          />
        </>
      )}
    </svg>
  );
}

function Card({ metric, index }) {
  const [scrub, setScrub] = useState(metric.data.length - 1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 150 + 80);
    return () => clearTimeout(t);
  }, []);

  const value = metric.data[scrub];
  const isGood =
    metric.thresholdDir === "above"
      ? value >= metric.threshold
      : value <= metric.threshold;
  const accent = isGood ? metric.accentGood : metric.accentBad;
  const animated = useCountUp(visible ? value : 0, 1100, metric.decimals);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        background: "oklch(0.13 0.015 245)",
        border: "1px solid oklch(0.21 0.018 245)",
        borderRadius: "14px",
        padding: "2.4rem 2.4rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.4rem",
        position: "relative",
        flex: "1 1 24rem",
        minWidth: "24rem",
        maxWidth: "32rem",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          transition: "background 0.6s ease",
          borderRadius: "1px",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "1.05rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "oklch(0.5 0.02 245)",
          }}
        >
          {metric.label}
        </span>
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "0.9rem",
            letterSpacing: "0.08em",
            color: accent,
            background: `${accent}1a`,
            border: `1px solid ${accent}55`,
            borderRadius: "5px",
            padding: "0.25rem 0.7rem",
            transition: "all 0.5s ease",
          }}
        >
          {isGood ? "nominal" : "degraded"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "4rem",
            fontWeight: 500,
            lineHeight: 1,
            color: "oklch(0.94 0.01 245)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            minWidth: `${metric.decimals > 0 ? 8 : 5}ch`,
          }}
        >
          {animated.toFixed(metric.decimals)}
        </span>
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "1.3rem",
            color: "oklch(0.4 0.02 245)",
            paddingBottom: "0.4rem",
          }}
        >
          {metric.unit}
        </span>
      </div>

      <Sparkline data={metric.data} activeIndex={scrub} accent={accent} />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          type="range"
          min={0}
          max={metric.data.length - 1}
          value={scrub}
          onChange={(e) => setScrub(Number(e.target.value))}
          style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "DM Mono, monospace",
            fontSize: "0.9rem",
            color: "oklch(0.35 0.02 245)",
          }}
        >
          <span>−11h</span>
          <span>now</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.09 0.01 245)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 2px; background: oklch(0.22 0.018 245); border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: currentColor; cursor: pointer; }
      `}</style>
      <div
        style={{
          marginBottom: "3rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        <p
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "1rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "oklch(0.38 0.02 245)",
          }}
        >
          System Health
        </p>
        <p
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "0.85rem",
            color: "oklch(0.3 0.02 245)",
            letterSpacing: "0.06em",
          }}
        >
          drag slider to travel through time
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.6rem",
          justifyContent: "center",
          maxWidth: "108rem",
          width: "100%",
        }}
      >
        {metrics.map((m, i) => (
          <Card key={m.id} metric={m} index={i} />
        ))}
      </div>
    </div>
  );
}
