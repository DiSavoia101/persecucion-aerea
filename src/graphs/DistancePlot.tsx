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
  const firstTime = t[0] ?? 0;
  const lastTime = t.at(-1) ?? firstTime;
  const timeSpan = Math.max(lastTime - firstTime, result.metadata.config.simulation.dt, 0.1);
  const timePadding = Math.max(timeSpan * 0.08, result.metadata.config.simulation.dt * 2);
  const maxDistance = Math.max(...d, outcome.minDistance, 1);
  const distancePadding = Math.max(maxDistance * 0.1, result.metadata.config.simulation.hitRadius * 2);
  const eventNearRight = outcome.minDistanceTime >= firstTime + timeSpan * 0.78;
  const annotationXOffset = eventNearRight ? -72 : 72;
  const annotationAlign: "left" | "right" = eventNearRight ? "right" : "left";

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
        line: { color: colors.text, width: 2 },
      },
      cliponaxis: false,
      hovertemplate: `<b>Frame actual</b><br>t = ${currentTime.toFixed(2)} s<br>R = ${currentDist.toFixed(1)} m<extra></extra>`,
    },
    // Marcador de distancia mínima
    {
      type: "scatter",
      mode: "markers",
      name: `d_min = ${outcome.minDistance.toFixed(1)} m`,
      x: [outcome.minDistanceTime],
      y: [outcome.minDistance],
      marker: {
        color: colors.minDist,
        size: 12,
        symbol: "star",
        line: { color: colors.text, width: 1.5 },
      },
      cliponaxis: false,
      hovertemplate: `<b>Distancia mínima</b><br>t = ${outcome.minDistanceTime.toFixed(2)} s<br>R = ${outcome.minDistance.toFixed(1)} m<extra></extra>`,
    },
    // Marcador de intercepción (solo si hubo impacto)
    ...(outcome.intercepted && outcome.interceptTime != null
      ? ([
          {
            type: "scatter",
            mode: "markers",
            name: `Intercepción (t = ${outcome.interceptTime.toFixed(2)} s)`,
            x: [outcome.interceptTime],
            y: [0],
            marker: {
              color: colors.intercept,
              size: 14,
              symbol: "x",
              line: { color: colors.text, width: 2 },
            },
            cliponaxis: false,
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
    paper_bgcolor: colors.paper,
    plot_bgcolor: colors.bg,
    font: { color: colors.text, family: "monospace" },
    xaxis: {
      title: { text: "Tiempo (s)", font: { color: colors.text } },
      range: [Math.min(0, firstTime), lastTime + timePadding],
      gridcolor: colors.axis,
      zerolinecolor: colors.axis,
      tickfont: { color: colors.text },
      color: colors.text,
    },
    yaxis: {
      title: { text: "Distancia (m)", font: { color: colors.text } },
      range: [0, maxDistance + distancePadding],
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
      orientation: "h",
      x: 0,
      y: 1.02,
      xanchor: "left",
      yanchor: "bottom",
    },
    margin: { t: 50, b: 72, l: 80, r: 48 },
    shapes: [cursorShape],
    annotations: [
      {
        xref: "x", yref: "y",
        x: outcome.minDistanceTime,
        y: outcome.minDistance,
        ax: annotationXOffset,
        ay: -44,
        align: annotationAlign,
        bgcolor: colors.legend,
        bordercolor: colors.minDist,
        borderwidth: 1,
        font: { color: colors.minDist, size: 11 },
        text: `d_min ${outcome.minDistance.toFixed(1)} m · ${outcome.minDistanceTime.toFixed(2)} s`,
        showarrow: true,
        arrowcolor: colors.minDist,
        arrowsize: 1,
        arrowwidth: 1.5,
      },
      ...(outcome.intercepted && outcome.interceptTime != null
        ? [{
            xref: "x" as const,
            yref: "y" as const,
            x: outcome.interceptTime,
            y: 0,
            ax: annotationXOffset,
            ay: -94,
            align: annotationAlign,
            bgcolor: colors.legend,
            bordercolor: colors.intercept,
            borderwidth: 1,
            font: { color: colors.intercept, size: 11 },
            text: `Intercepción · ${outcome.interceptTime.toFixed(2)} s`,
            showarrow: true,
            arrowcolor: colors.intercept,
            arrowsize: 1,
            arrowwidth: 1.5,
          }]
        : []),
    ],
  };

  return (
    <div className="plotly-graph-shell">
      <div className="plotly-graph-caption">Distancia avión–misil vs tiempo</div>
      <div className="plotly-graph-body">
        <Plot
          data={traces}
          layout={layout}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>
    </div>
  );
}
