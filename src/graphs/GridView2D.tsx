/**
 * Grupos 4 y 5 — Gráfico 1: vista cenital 2D con grilla (Plotly.js).
 * Props: GraphProps { result, currentFrame }
 *
 * Paleta coherente con Trajectory3D:
 *   avión = ámbar #ffb02e · misil = rojo #ff3b3b · LOS = azul #6f86b0
 */

import Plot from "react-plotly.js";
import type { GraphProps } from "../shared/types";

/** Tamaño de cada celda del tablero de ajedrez en metros. */
const CELL_SIZE = 200;

/** Colores coherentes con Trajectory3D.tsx */
const COLORS = {
  aircraft: "#ffb02e",
  missile: "#ff3b3b",
  los: "#6f86b0",
  gridLight: "rgba(255,255,255,0.04)",
  gridDark: "rgba(0,0,0,0)",
  bg: "#0e1521",
  paper: "#131c2b",
  text: "#c9d4e8",
  axis: "#2e4060",
} as const;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Genera los rectángulos del tablero de ajedrez dentro del bounding box. */
function buildChessShapes(
  xMin: number, xMax: number,
  yMin: number, yMax: number,
): Partial<Plotly.Shape>[] {
  const shapes: Partial<Plotly.Shape>[] = [];
  const colStart = Math.floor(xMin / CELL_SIZE);
  const colEnd = Math.ceil(xMax / CELL_SIZE);
  const rowStart = Math.floor(yMin / CELL_SIZE);
  const rowEnd = Math.ceil(yMax / CELL_SIZE);

  for (let c = colStart; c < colEnd; c++) {
    for (let r = rowStart; r < rowEnd; r++) {
      if ((c + r) % 2 === 0) continue; // solo las celdas oscuras
      shapes.push({
        type: "rect",
        xref: "x", yref: "y",
        x0: c * CELL_SIZE, x1: (c + 1) * CELL_SIZE,
        y0: r * CELL_SIZE, y1: (r + 1) * CELL_SIZE,
        fillcolor: COLORS.gridLight,
        line: { width: 0 },
        layer: "below",
      });
    }
  }
  return shapes;
}

export default function GridView2D({ result, currentFrame }: GraphProps) {
  if (!result?.aircraft?.position?.length || !result?.missile?.position?.length) {
    return (
      <div style={{ color: COLORS.text, padding: 24, background: COLORS.bg, borderRadius: 12 }}>
        Sin datos de simulación.
      </div>
    );
  }

  const n = result.time.length;
  const f = clamp(Math.round(currentFrame), 0, n - 1);

  // Extraer X e Y de todos los frames hasta currentFrame
  const aircraftX = result.aircraft.position.slice(0, f + 1).map((p) => p[0]);
  const aircraftY = result.aircraft.position.slice(0, f + 1).map((p) => p[1]);
  const missileX = result.missile.position.slice(0, f + 1).map((p) => p[0]);
  const missileY = result.missile.position.slice(0, f + 1).map((p) => p[1]);

  const acPos = result.aircraft.position[f];
  const miPos = result.missile.position[f];

  // Bounding box con margen para centrar el gráfico correctamente
  const allX = [...aircraftX, ...missileX];
  const allY = [...aircraftY, ...missileY];
  const xMin = Math.min(...allX) - CELL_SIZE;
  const xMax = Math.max(...allX) + CELL_SIZE;
  const yMin = Math.min(...allY) - CELL_SIZE;
  const yMax = Math.max(...allY) + CELL_SIZE;

  const traces: Plotly.Data[] = [
    // Rastro avión
    {
      type: "scatter",
      mode: "lines",
      name: "Rastro avión",
      x: aircraftX,
      y: aircraftY,
      line: { color: COLORS.aircraft, width: 2, dash: "solid" },
      opacity: 0.7,
      hoverinfo: "skip",
    },
    // Rastro misil
    {
      type: "scatter",
      mode: "lines",
      name: "Rastro misil",
      x: missileX,
      y: missileY,
      line: { color: COLORS.missile, width: 2, dash: "solid" },
      opacity: 0.7,
      hoverinfo: "skip",
    },
    // Línea de visión (LOS) punteada entre avión y misil en el frame actual
    {
      type: "scatter",
      mode: "lines",
      name: "LOS",
      x: [acPos[0], miPos[0]],
      y: [acPos[1], miPos[1]],
      line: { color: COLORS.los, width: 1.5, dash: "dot" },
      opacity: 0.75,
      hoverinfo: "skip",
      showlegend: true,
    },
    // Marcador actual del avión
    {
      type: "scatter",
      mode: "markers",
      name: "Avión",
      x: [acPos[0]],
      y: [acPos[1]],
      marker: {
        color: COLORS.aircraft,
        size: 14,
        symbol: "triangle-right",
        line: { color: "#fff", width: 1.5 },
      },
      hovertemplate: `<b>Avión</b><br>t = ${result.time[f].toFixed(2)} s<br>x = %{x:.0f} m<br>y = %{y:.0f} m<extra></extra>`,
    },
    // Marcador actual del misil
    {
      type: "scatter",
      mode: "markers",
      name: "Misil",
      x: [miPos[0]],
      y: [miPos[1]],
      marker: {
        color: COLORS.missile,
        size: 13,
        symbol: "diamond",
        line: { color: "#fff", width: 1.5 },
      },
      hovertemplate: `<b>Misil</b><br>t = ${result.time[f].toFixed(2)} s<br>x = %{x:.0f} m<br>y = %{y:.0f} m<extra></extra>`,
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    title: {
      text: `Vista cenital — t = ${result.time[f].toFixed(2)} s`,
      font: { color: COLORS.text, size: 15 },
    },
    paper_bgcolor: COLORS.paper,
    plot_bgcolor: COLORS.bg,
    font: { color: COLORS.text, family: "monospace" },
    xaxis: {
      title: { text: "X (m)", font: { color: COLORS.text } },
      range: [xMin, xMax],
      gridcolor: COLORS.axis,
      zerolinecolor: COLORS.axis,
      tickfont: { color: COLORS.text },
      color: COLORS.text,
    },
    yaxis: {
      title: { text: "Y (m)", font: { color: COLORS.text } },
      range: [yMin, yMax],
      gridcolor: COLORS.axis,
      zerolinecolor: COLORS.axis,
      tickfont: { color: COLORS.text },
      color: COLORS.text,
      scaleanchor: "x", // mantiene relación de aspecto 1:1
      scaleratio: 1,
    },
    legend: {
      font: { color: COLORS.text, size: 12 },
      bgcolor: "rgba(14,21,33,0.7)",
      bordercolor: COLORS.axis,
      borderwidth: 1,
    },
    margin: { t: 50, b: 60, l: 70, r: 20 },
    shapes: buildChessShapes(xMin, xMax, yMin, yMax),
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
