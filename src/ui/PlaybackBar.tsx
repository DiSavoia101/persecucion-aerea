/**
 * Grupo 3 — Barra de reproducción tipo timeline
 * Play/pausa/velocidad/scrub → currentFrame.
 */
import { useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface PlaybackBarProps {
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  totalTime: number;
  playing: boolean;
  speed: number;
  speedPresets: number[];
  onPlay: () => void;
  onPause: () => void;
  onSeek: (frame: number) => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
  disabledReason?: string;
  onDisabledAttempt?: () => void;
  eventTime?: number | null;
  eventLabel?: string;
}

export default function PlaybackBar({
  currentFrame,
  totalFrames,
  currentTime,
  totalTime,
  playing,
  speed,
  speedPresets,
  onPlay,
  onPause,
  onSeek,
  onRestart,
  onSpeedChange,
  disabled = false,
  disabledReason,
  onDisabledAttempt,
  eventTime,
  eventLabel,
}: PlaybackBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastFrame = Math.max(0, totalFrames - 1);
  const safeFrame = Number.isFinite(currentFrame)
    ? Math.min(Math.max(0, Math.floor(currentFrame)), lastFrame)
    : 0;
  const progress = totalFrames > 1 ? safeFrame / lastFrame : 0;
  const eventProgress = totalTime > 0 && eventTime != null ? Math.min(Math.max(eventTime / totalTime, 0), 1) : null;
  const playbackState = disabled ? "BLOQUEADO" : playing ? "REPRODUCIENDO" : safeFrame >= lastFrame ? "FIN DE CORRIDA" : "PAUSADO";

  //Seek logic
  const seekFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(Math.round(ratio * lastFrame));
    },
    [lastFrame, onSeek],
  );

  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        onDisabledAttempt?.();
        return;
      }
      seekFromEvent(e.clientX);
      const handleMouseMove = (ev: MouseEvent) => seekFromEvent(ev.clientX);
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [disabled, onDisabledAttempt, seekFromEvent],
  );

  const handlePlayPause = () => {
    if (disabled) {
      onDisabledAttempt?.();
      return;
    }
    if (playing) onPause();
    else onPlay();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`border-t border-panel-border bg-obsidian/95 px-4 py-2 flex items-center gap-3 ${disabled ? "opacity-65" : ""}`}
      title={disabled ? disabledReason : undefined}
    >
      {/*Mission label */}
      <span className={`playback-state ${playing ? "playback-live" : ""}`}>{playbackState}</span>

      {/*Playback controls*/}
      <div className="flex items-center gap-1">
        {/* Reset */}
        <motion.button
          onClick={onRestart}
          className="w-6 h-6 flex items-center justify-center border border-slate-steel text-mist hover:text-hud hover:border-hud/30 transition-colors cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="REINICIAR"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 1.5V8.5M3 5L8.5 1.5V8.5L3 5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <button onClick={() => onSeek(safeFrame - 5)} className="hud-icon-button" title="Retroceder 5 frames" disabled={disabled}>-5</button>
        <button onClick={() => onSeek(safeFrame - 1)} className="hud-icon-button" title="Retroceder 1 frame" disabled={disabled}>-1</button>

        {/* Play/Pause */}
        <motion.button
          onClick={handlePlayPause}
          className={`w-8 h-8 flex items-center justify-center border cursor-pointer transition-all ${playing
            ? "bg-hud/15 border-hud text-hud glow-hud"
            : "bg-hud/5 border-hud/50 text-hud hover:bg-hud/10 hover:border-hud"
            }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={disabled ? disabledReason : playing ? "PAUSAR" : "REPRODUCIR"}
          aria-disabled={disabled}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="1.5" width="3" height="9" rx="0.5" />
              <rect x="7" y="1.5" width="3" height="9" rx="0.5" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.5 1L10.5 6L2.5 11V1Z" />
            </svg>
          )}
        </motion.button>
        <button onClick={() => onSeek(safeFrame + 1)} className="hud-icon-button" title="Avanzar 1 frame" disabled={disabled}>+1</button>
        <button onClick={() => onSeek(safeFrame + 5)} className="hud-icon-button" title="Avanzar 5 frames" disabled={disabled}>+5</button>
      </div>

      {/*Time readout*/}
      <div className="text-[11px] tabular-nums tracking-wider min-w-[110px]">
        <span className="text-hud font-bold text-glow-hud">{currentTime.toFixed(2)}</span>
        <span className="text-ash mx-1">/</span>
        <span className="text-mist">{totalTime.toFixed(2)}</span>
        <span className="text-[8px] text-ash ml-0.5">s</span>
      </div>

      {/*Progress track*/}
      <div
        ref={trackRef}
        onMouseDown={handleTrackMouseDown}
        className={`flex-1 relative h-6 flex items-center group ${disabled ? "cursor-not-allowed" : "cursor-crosshair"}`}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 bg-obsidian border border-slate-steel overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-hud-dim via-hud-mid to-hud relative"
            style={{ width: `${progress * 100}%` }}
          >
            {/* Leading edge glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-hud/30 blur-sm" />
          </div>
        </div>

        {/* Tick marks every 10% */}
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 w-px bg-slate-steel/50"
            style={{ left: `${i * 10}%`, height: i % 5 === 0 ? "100%" : "30%" }}
          />
        ))}

        {/* Thumb military crosshair */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="w-px h-1.5 bg-hud" />
          <div className="w-2.5 h-2.5 border border-hud bg-hud/20 rotate-45 group-hover:bg-hud/40 transition-colors" />
          <div className="w-px h-1.5 bg-hud" />
        </div>

        {eventProgress != null && (
          <div
            className="timeline-event-marker"
            style={{ left: `${eventProgress * 100}%` }}
            title={`${eventLabel ?? "EVENTO DE MISIÓN"} · T+${eventTime?.toFixed(2)}s`}
          />
        )}
      </div>

      {/*Frame counter */}
      <div className="text-[9px] text-ash tabular-nums tracking-wider min-w-[70px] text-right">
        FRAME {String(safeFrame).padStart(3, "0")} / {String(lastFrame).padStart(3, "0")} · {Math.round(progress * 100)}%
      </div>

      {disabled && (
        <div className="border border-warning/30 bg-warning/5 px-2 py-0.5 text-[8px] text-warning tracking-[0.15em]">
          BLOQUEADO
        </div>
      )}

      {/* Speed selector */}
      <div className="flex items-center gap-px">
        <span className="text-[8px] text-mist tracking-[0.15em] mr-1">VEL</span>
        {speedPresets.map((s) => (
          <motion.button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wider cursor-pointer border transition-all ${speed === s
              ? "bg-hud/15 text-hud border-hud/40"
              : "text-ash border-slate-steel hover:text-mist hover:border-mist/30"
              }`}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
          >
            {s}×
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

