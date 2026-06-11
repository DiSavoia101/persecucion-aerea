/**
 * Grupo 3 — Placeholder táctico para gráficos.
 * Contenedor visual que muestra telemetría del mock
 * hasta que los Grupos 4 y 5 conecten sus componentes.
 */
import { motion } from "framer-motion";
import type { SimulationResult } from "../shared/types";

interface GraphPlaceholderProps {
  name: string;
  description: string;
  accent: "hud" | "cyan" | "amber";
  result: SimulationResult;
  currentFrame: number;
}

export default function GraphPlaceholder({
  name,
  description,
  accent,
  result,
  currentFrame,
}: GraphPlaceholderProps) {
  const lastFrame = Math.max(0, result.time.length - 1);
  const safeFrame = Number.isFinite(currentFrame)
    ? Math.min(Math.max(0, Math.floor(currentFrame)), lastFrame)
    : 0;
  const aircraftPos = result.aircraft.position[safeFrame] ?? [0, 0, 0];
  const missilePos = result.missile.position[safeFrame] ?? [0, 0, 0];
  const distance = result.distance[safeFrame] ?? 0;
  const time = result.time[safeFrame] ?? 0;

  const accentColorMap = {
    hud: "var(--color-hud)",
    cyan: "var(--color-cyan-glow)",
    amber: "var(--color-amber-glow)",
  };

  const color = accentColorMap[accent];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-obsidian relative overflow-hidden radar-sweep">
      {/* Retícula de objetivo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-64 h-64 border rounded-full" style={{ borderColor: color }} />
        <div className="w-32 h-32 border rounded-full absolute" style={{ borderColor: color }} />
        <div className="w-full h-px absolute" style={{ backgroundColor: color }} />
        <div className="h-full w-px absolute" style={{ backgroundColor: color }} />
      </div>

      {/* Bloque de telemetría */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 p-4 border bg-void/80 backdrop-blur-sm"
        style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 pulse-dot" style={{ backgroundColor: color }} />
          <code className="font-mono text-[11px] font-bold tracking-widest" style={{ color }}>
            {"<"}{name}{" />"}
          </code>
        </div>
        <p className="text-ash text-[9px] uppercase tracking-widest mb-4 border-b border-slate-steel pb-2">
          {description}
        </p>

        {/* Telemetría actual */}
        <div className="space-y-1.5 font-mono text-[10px] tabular-nums tracking-widest">
          <div className="flex justify-between gap-6 text-mist">
            <span>FRAME:</span>
            <span>{safeFrame}/{lastFrame}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-amber-glow">OBJ (A/C):</span>
            <span className="text-bright">
              X:{aircraftPos[0].toFixed(0).padStart(4, "0")} Y:{aircraftPos[1].toFixed(0).padStart(4, "0")}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-cyan-glow">ARMA (MSL):</span>
            <span className="text-bright">
              X:{missilePos[0].toFixed(0).padStart(4, "0")} Y:{missilePos[1].toFixed(0).padStart(4, "0")}
            </span>
          </div>
          <div className="flex justify-between gap-6 mt-2 pt-2 border-t border-slate-steel text-mist">
            <span>TIEMPO: {time.toFixed(2)}s</span>
            <span>RANGO: {distance.toFixed(1)}m</span>
          </div>
        </div>
      </motion.div>

      {/* HUD Corner markers */}
      <div className="hud-corners absolute inset-2">
        <div className="hud-corner hud-corner-tl" style={{ borderColor: color }} />
        <div className="hud-corner hud-corner-tr" style={{ borderColor: color }} />
        <div className="hud-corner hud-corner-bl" style={{ borderColor: color }} />
        <div className="hud-corner hud-corner-br" style={{ borderColor: color }} />
      </div>
    </div>
  );
}

