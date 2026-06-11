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
import { useGraphTheme } from "./useGraphTheme";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export default function DistancePlot({ result, currentFrame }: GraphProps) {
  const colors = useGraphTheme();
  if (!result?.time?.length || !result?.distance?.length) {
    return (
      <div style={{ color: colors.text, padding: 24, background: colors.bg, borderRadius: 12 }}>
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
      line: { color: colors.distance, width: 2.5 },
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
        color: colors.currentPoint,
        size: 10,
        symbol: "circle",
        line: { color: colors.distance, width: 2 },
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
        color: colors.minDist,
        size: 12,
        symbol: "star",
        line: { color: "#fff", width: 1.5 },
      },
      text: [`  d_min = ${outcome.minDistance.toFixed(1)} m`],
      textposition: "middle right",
      textfont: { color: colors.minDist, size: 11 },
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
              color: colors.intercept,
              size: 14,
              symbol: "x",
              line: { color: "#fff", width: 2 },
            },
            text: ["  Impacto"],
            textposition: "top right",
            textfont: { color: colors.intercept, size: 11 },
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
    line: { color: colors.cursor, width: 2, dash: "dash" },
  };

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    title: {
      text: `Distancia avión–misil vs tiempo`,
      font: { color: colors.text, size: 15 },
    },
    paper_bgcolor: colors.paper,
    plot_bgcolor: colors.bg,
    font: { color: colors.text, family: "monospace" },
    xaxis: {
      title: { text: "Tiempo (s)", font: { color: colors.text } },
      gridcolor: colors.axis,
      zerolinecolor: colors.axis,
      tickfont: { color: colors.text },
      color: colors.text,
    },
    yaxis: {
      title: { text: "Distancia (m)", font: { color: colors.text } },
      gridcolor: colors.axis,
      zerolinecolor: colors.axis,
      tickfont: { color: colors.text },
      color: colors.text,
      rangemode: "tozero",
    },
    legend: {
      font: { color: colors.text, size: 11 },
      bgcolor: colors.legend,
      bordercolor: colors.axis,
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
        bordercolor: colors.minDist,
        borderwidth: 1,
        font: { color: colors.minDist, size: 11 },
        text: `d_min = ${outcome.minDistance.toFixed(1)} m<br>t = ${outcome.minDistanceTime.toFixed(2)} s`,
        showarrow: true,
        arrowcolor: colors.minDist,
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
