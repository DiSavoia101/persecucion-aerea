/**
 * Grupos 4 y 5 — Gráfico 3: distancia vs tiempo (Plotly.js).
 * Props: GraphProps { result, currentFrame }
 *
 * Muestra:
 *   - Curva de distancia R(t) completa.
 *   - Línea vertical sincronizada al currentFrame.
 *   - Marcador del instante actual sobre la curva.
 *   - Anotación de distancia mínima.
 *   - Marcador de intercepción si result.outcome.intercepted === true.
 */

import Plot from "react-plotly.js";
import type { GraphProps } from "../shared/types";

const COLORS = {
  distance: "#6f86b0",
  cursor: "rgba(255,255,255,0.35)",
  currentPoint: "#ffffff",
  minDist: "#ffd166",
  intercept: "#ff3b3b",
  bg: "#0e1521",
  paper: "#131c2b",
  text: "#c9d4e8",
  axis: "#2e4060",
} as const;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export default function DistancePlot({ result, currentFrame }: GraphProps) {
  if (!result?.time?.length || !result?.distance?.length) {
    return (
      <div style={{ color: COLORS.text, padding: 24, background: COLORS.bg, borderRadius: 12 }}>
        Sin datos de simulación.
      </div>
    );
  }

  const n = Math.min(result.time.length, result.distance.length);
  if (n === 0) {
    return <div className="graph-fallback">Sin datos alineados para el gráfico de distancia.</div>;
  }
  const f = clamp(Math.round(currentFrame), 0, n - 1);

  const t = result.time.slice(0, n);
  const d = result.distance.slice(0, n);
  const { outcome } = result;

  const currentTime = t[f];
  const currentDist = d[f];

  const traces: Plotly.Data[] = [
    // Curva completa de distancia
    {
      type: "scatter",
      mode: "lines",
      name: "Distancia R(t)",
      x: t,
      y: d,
      line: { color: COLORS.distance, width: 2.5 },
      hovertemplate: "t = %{x:.2f} s<br>R = %{y:.1f} m<extra></extra>",
    },
    // Marcador en el frame actual
    {
      type: "scatter",
      mode: "markers",
      name: `t actual (${currentTime.toFixed(2)} s)`,
      x: [currentTime],
      y: [currentDist],
      marker: {
        color: COLORS.currentPoint,
        size: 10,
        symbol: "circle",
        line: { color: COLORS.distance, width: 2 },
      },
      hovertemplate: `<b>Frame actual</b><br>t = ${currentTime.toFixed(2)} s<br>R = ${currentDist.toFixed(1)} m<extra></extra>`,
    },
    // Marcador de distancia mínima
    {
      type: "scatter",
      mode: "text+markers",
      name: `d_min = ${outcome.minDistance.toFixed(1)} m`,
      x: [outcome.minDistanceTime],
      y: [outcome.minDistance],
      marker: {
        color: COLORS.minDist,
        size: 12,
        symbol: "star",
        line: { color: "#fff", width: 1.5 },
      },
      text: [`  d_min = ${outcome.minDistance.toFixed(1)} m`],
      textposition: "middle right",
      textfont: { color: COLORS.minDist, size: 11 },
      hovertemplate: `<b>Distancia mínima</b><br>t = ${outcome.minDistanceTime.toFixed(2)} s<br>R = ${outcome.minDistance.toFixed(1)} m<extra></extra>`,
    },
    // Marcador de intercepción (solo si hubo impacto)
    ...(outcome.intercepted && outcome.interceptTime != null
      ? ([
          {
            type: "scatter",
            mode: "text+markers",
            name: `Intercepción (t = ${outcome.interceptTime.toFixed(2)} s)`,
            x: [outcome.interceptTime],
            y: [0],
            marker: {
              color: COLORS.intercept,
              size: 14,
              symbol: "x",
              line: { color: "#fff", width: 2 },
            },
            text: ["  Impacto"],
            textposition: "top right",
            textfont: { color: COLORS.intercept, size: 11 },
            hovertemplate: `<b>INTERCEPCIÓN</b><br>t = ${outcome.interceptTime.toFixed(2)} s<extra></extra>`,
          } as Plotly.Data,
        ])
      : []),
  ];

  // Línea vertical del cursor sincronizada con currentFrame
  const cursorShape: Partial<Plotly.Shape> = {
    type: "line",
    xref: "x", yref: "paper",
    x0: currentTime, x1: currentTime,
    y0: 0, y1: 1,
    line: { color: COLORS.cursor, width: 2, dash: "dash" },
  };

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    title: {
      text: `Distancia avión–misil vs tiempo`,
      font: { color: COLORS.text, size: 15 },
    },
    paper_bgcolor: COLORS.paper,
    plot_bgcolor: COLORS.bg,
    font: { color: COLORS.text, family: "monospace" },
    xaxis: {
      title: { text: "Tiempo (s)", font: { color: COLORS.text } },
      gridcolor: COLORS.axis,
      zerolinecolor: COLORS.axis,
      tickfont: { color: COLORS.text },
      color: COLORS.text,
    },
    yaxis: {
      title: { text: "Distancia (m)", font: { color: COLORS.text } },
      gridcolor: COLORS.axis,
      zerolinecolor: COLORS.axis,
      tickfont: { color: COLORS.text },
      color: COLORS.text,
      rangemode: "tozero",
    },
    legend: {
      font: { color: COLORS.text, size: 11 },
      bgcolor: "rgba(14,21,33,0.7)",
      bordercolor: COLORS.axis,
      borderwidth: 1,
    },
    margin: { t: 50, b: 60, l: 80, r: 20 },
    shapes: [cursorShape],
    // Anotación de distancia mínima
    annotations: [
      {
        xref: "x", yref: "y",
        x: outcome.minDistanceTime,
        y: outcome.minDistance,
        ax: 40, ay: -30,
        bgcolor: "rgba(14,21,33,0.85)",
        bordercolor: COLORS.minDist,
        borderwidth: 1,
        font: { color: COLORS.minDist, size: 11 },
        text: `d_min = ${outcome.minDistance.toFixed(1)} m<br>t = ${outcome.minDistanceTime.toFixed(2)} s`,
        showarrow: true,
        arrowcolor: COLORS.minDist,
        arrowsize: 1,
        arrowwidth: 1.5,
      },
    ],
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      useResizeHandler
      style={{ width: "100%", height: "100%" }}
      config={{ displayModeBar: false, responsive: true }}
    />
  );
}
