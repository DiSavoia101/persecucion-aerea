/**
 * GraphsPreview — Banco de pruebas mínimo para los gráficos 2D.
 * Usa mockResult y un slider para controlar currentFrame manualmente.
 * Importar desde App.tsx o usar de forma temporal hasta que el Grupo 3 integre.
 */

import { useState, useEffect, useRef } from "react";
import { mockResult } from "../shared/mockResult";
import { GridView2D } from "../graphs";
import { DistancePlot } from "../graphs";

/** Intervalo entre frames en ms. Ajustar para cambiar velocidad de reproducción. */
const FRAME_INTERVAL_MS = 80;

export default function GraphsPreview() {
  const totalFrames = mockResult.time.length;
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setFrame((prev) => {
        if (prev >= totalFrames - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, FRAME_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalFrames]);

  function handlePlayPause() {
    if (frame >= totalFrames - 1) setFrame(0); // reinicia si terminó
    setPlaying((p) => !p);
  }

  const t = mockResult.time[frame];

  return (
    <div style={styles.root}>
      <h2 style={styles.title}>Gráficos 2D — Persecución Avión–Misil</h2>

      {/* Barra de control de frame */}
      <div style={styles.controls}>
        <button onClick={handlePlayPause} style={styles.playBtn}>
          {playing ? "⏸ Pausa" : "▶ Play"}
        </button>
        <span style={styles.label}>Frame: {frame} / {totalFrames - 1}</span>
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={frame}
          onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }}
          style={styles.slider}
        />
        <span style={styles.label}>t = {t.toFixed(2)} s</span>
      </div>

      {/* Grid de gráficos */}
      <div style={styles.grid}>
        <div style={styles.panel}>
          <GridView2D result={mockResult} currentFrame={frame} />
        </div>
        <div style={styles.panel}>
          <DistancePlot result={mockResult} currentFrame={frame} />
        </div>
      </div>
    </div>
  );
}

const BG = "#0a0e16";
const TEXT = "#c9d4e8";

const styles: Record<string, React.CSSProperties> = {
  root: {
    background: BG,
    minHeight: "100vh",
    padding: "24px 32px",
    fontFamily: "monospace",
    color: TEXT,
  },
  title: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: 600,
    color: TEXT,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    background: "#131c2b",
    padding: "12px 20px",
    borderRadius: 8,
  },
  playBtn: {
    padding: "6px 18px",
    background: "#6f86b0",
    color: "#0a0e16",
    border: "none",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  slider: {
    flex: 1,
    accentColor: "#6f86b0",
    cursor: "pointer",
  },
  label: {
    whiteSpace: "nowrap",
    fontSize: 13,
    color: TEXT,
    minWidth: 80,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    minHeight: 480,
  },
  panel: {
    background: "#131c2b",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 460,
  },
};
