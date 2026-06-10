/**
 * Grupo 3 — Panel de estado táctico para el header.
 * Estilo: readouts de cockpit militar con indicadores de amenaza.
 */
import { motion } from "framer-motion";
import type { SimulationOutcome } from "../shared/types";

interface StatusPanelProps {
  currentTime: number;
  currentDistance: number;
  closingVelocity: number;
  outcome: SimulationOutcome;
  playing: boolean;
}

export default function StatusPanel({
  currentTime,
  currentDistance,
  closingVelocity,
  outcome,
  playing,
}: StatusPanelProps) {
  const threatLevel =
    currentDistance < 50 ? "CRÍTICA" :
      currentDistance < 200 ? "ALTA" :
        currentDistance < 500 ? "MEDIA" : "BAJA";

  const threatColor =
    threatLevel === "CRÍTICA" ? "text-danger text-glow-threat" :
      threatLevel === "ALTA" ? "text-caution" :
        threatLevel === "MEDIA" ? "text-warning" : "text-hud";

  return (
    <div className="flex items-center gap-3">
      {/*Readout cells */}
      <div className="flex gap-px">
        {/* Time */}
        <div className="bg-obsidian border border-slate-steel px-3 py-1 min-w-[80px]">
          <div className="text-[7px] text-mist tracking-[0.2em]">TIEMPO</div>
          <motion.div
            key={currentTime.toFixed(2)}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="text-[13px] text-hud font-bold tracking-wider tabular-nums text-glow-hud"
          >
            {currentTime.toFixed(2)}
            <span className="text-[8px] text-mist ml-0.5">s</span>
          </motion.div>
        </div>

        {/* Range */}
        <div className="bg-obsidian border border-slate-steel px-3 py-1 min-w-[90px]">
          <div className="text-[7px] text-mist tracking-[0.2em]">RANGO</div>
          <motion.div
            key={currentDistance.toFixed(0)}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className={`text-[13px] font-bold tracking-wider tabular-nums ${threatColor}`}
          >
            {currentDistance.toFixed(1)}
            <span className="text-[8px] text-mist ml-0.5">m</span>
          </motion.div>
        </div>

        {/* Closing Velocity */}
        <div className="bg-obsidian border border-slate-steel px-3 py-1 min-w-[80px]">
          <div className="text-[7px] text-mist tracking-[0.2em]">V<sub>c</sub></div>
          <div className="text-[13px] text-cyan-glow font-bold tracking-wider tabular-nums">
            {closingVelocity.toFixed(0)}
            <span className="text-[8px] text-mist ml-0.5">m/s</span>
          </div>
        </div>
      </div>

      {/* Vertical separator */}
      <div className="w-px h-8 bg-slate-steel" />

      {/* Outcome / Threat*/}
      <div className="flex flex-col gap-0.5">
        {outcome.intercepted ? (
          <div className="badge badge-danger">
            <span className="w-1.5 h-1.5 bg-danger blink-slow inline-block" />
            INTERCEPCIÓN · T+{outcome.interceptTime?.toFixed(2)}s
          </div>
        ) : (
          <div className="badge badge-warning">
            <span className="w-1.5 h-1.5 bg-warning inline-block" />
            SIN IMPACTO · R<sub>min</sub>={outcome.minDistance.toFixed(1)}m
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[8px]">
          <span className={`tracking-[0.15em] ${threatColor}`}>
            AMENAZA: {threatLevel}
          </span>
        </div>
      </div>

      {/*LIVE indicator*/}
      {playing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1 border border-hud/30 px-2 py-0.5"
        >
          <div className="w-1.5 h-1.5 bg-hud pulse-dot" />
          <span className="text-[9px] text-hud font-bold tracking-[0.2em] text-glow-hud">EN VIVO</span>
        </motion.div>
      )}
    </div>
  );
}

