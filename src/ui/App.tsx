/**
 * Grupo 3 — UI / orquestador.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import type { SimulationConfig, SimulationResult } from "../shared/types";
import { mockResult, mockConfig } from "../shared/mockResult";
import Controls, { validateConfig } from "./Controls";
import PlaybackBar from "./PlaybackBar";
import StatusPanel from "./StatusPanel";
import GraphWorkspace from "./GraphWorkspace";
import UiSettingsPanel, { type UiSettings } from "./UiSettingsPanel";
import MissionLog, { type MissionEvent } from "./MissionLog";

type TabId = "simulation" | "theory";
type EventTone = NonNullable<MissionEvent["tone"]>;

const DEFAULT_UI_SETTINGS: UiSettings = {
  theme: "green",
  scanlines: true,
  glow: true,
  reducedMotion: false,
  density: "normal",
  sound: false,
  panelStyle: "tactical",
  gridIntensity: "medium",
};

const VALID_UI_SETTINGS = {
  theme: ["green", "cyan", "amber", "threat", "blueprint", "terminal", "militaryNight", "naval", "desert", "contrast", "skyOps", "lightHangar", "tacticalMap", "laboratory"],
  density: ["compact", "normal", "presentation"],
  panelStyle: ["tactical", "glass", "blueprint", "crt", "minimal", "alert"],
  gridIntensity: ["low", "medium", "high"],
} as const;

function loadUiSettings(): UiSettings {
  try {
    const saved = JSON.parse(localStorage.getItem("taccon-ui-settings") ?? "{}") as Partial<UiSettings>;
    return {
      ...DEFAULT_UI_SETTINGS,
      theme: VALID_UI_SETTINGS.theme.includes(saved.theme as UiSettings["theme"]) ? saved.theme as UiSettings["theme"] : DEFAULT_UI_SETTINGS.theme,
      density: VALID_UI_SETTINGS.density.includes(saved.density as UiSettings["density"]) ? saved.density as UiSettings["density"] : DEFAULT_UI_SETTINGS.density,
      panelStyle: VALID_UI_SETTINGS.panelStyle.includes(saved.panelStyle as UiSettings["panelStyle"]) ? saved.panelStyle as UiSettings["panelStyle"] : DEFAULT_UI_SETTINGS.panelStyle,
      gridIntensity: VALID_UI_SETTINGS.gridIntensity.includes(saved.gridIntensity as UiSettings["gridIntensity"]) ? saved.gridIntensity as UiSettings["gridIntensity"] : DEFAULT_UI_SETTINGS.gridIntensity,
      scanlines: typeof saved.scanlines === "boolean" ? saved.scanlines : DEFAULT_UI_SETTINGS.scanlines,
      glow: typeof saved.glow === "boolean" ? saved.glow : DEFAULT_UI_SETTINGS.glow,
      reducedMotion: typeof saved.reducedMotion === "boolean" ? saved.reducedMotion : DEFAULT_UI_SETTINGS.reducedMotion,
      sound: typeof saved.sound === "boolean" ? saved.sound : DEFAULT_UI_SETTINGS.sound,
    };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

function clampFrame(frame: number, lastFrame: number) {
  return Number.isFinite(frame)
    ? Math.min(Math.max(0, Math.floor(frame)), lastFrame)
    : 0;
}

function runSimulation(config: SimulationConfig): SimulationResult {
  // Reemplazar este fallback con simulate(config) cuando el Grupo 2 lo exporte.
  const fallbackResult = structuredClone(mockResult);
  return {
    ...fallbackResult,
    metadata: {
      ...fallbackResult.metadata,
      config: structuredClone(config),
      integrator: config.simulation.integrator,
      steps: fallbackResult.time.length,
    },
  };
}

function configsMatch(left: SimulationConfig, right: SimulationConfig) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("simulation");
  const [config, setConfig] = useState<SimulationConfig>(() => structuredClone(mockConfig));
  const [result, setResult] = useState<SimulationResult>(() => structuredClone(mockResult));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [uiSettings, setUiSettings] = useState<UiSettings>(loadUiSettings);
  const [uiMessage, setUiMessage] = useState("Simulación cargada con datos mock · lista para reproducir");
  const [runCount, setRunCount] = useState(1);
  const [lastRunTime, setLastRunTime] = useState(() => new Date());
  const [runNotice, setRunNotice] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [missionEvents, setMissionEvents] = useState<MissionEvent[]>([]);
  const [demoSignal, setDemoSignal] = useState(0);
  const [focusSignal, setFocusSignal] = useState(0);
  const [layoutSignal, setLayoutSignal] = useState(0);
  const [escapeSignal, setEscapeSignal] = useState(0);
  const [resetWorkspaceSignal, setResetWorkspaceSignal] = useState(0);
  const [inspectorSignal, setInspectorSignal] = useState(0);
  const [cleanSignal, setCleanSignal] = useState(0);
  const [missionLogOpen, setMissionLogOpen] = useState(false);
  const [closePanelsSignal, setClosePanelsSignal] = useState(0);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showStateStrip, setShowStateStrip] = useState(true);
  const lastTimestampRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const eventIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const endNotifiedRef = useRef(false);
  const lastConfigLogRef = useRef("");
  const lastLoggedSeekRef = useRef(-999);

  const totalFrames = result.time.length;
  const lastFrame = Math.max(0, totalFrames - 1);
  const safeFrame = clampFrame(currentFrame, lastFrame);

  const currentTime = result.time[safeFrame] ?? 0;
  const currentDistance = result.distance[safeFrame] ?? 0;
  const closingVel = result.closingVelocity[safeFrame] ?? 0;
  const configErrors = validateConfig(config);
  const configInvalid = configErrors.length > 0;
  const configPending = !configsMatch(config, result.metadata.config);
  const configStatus = configInvalid ? "INVÁLIDA" : configPending ? "PENDIENTE" : "APLICADA";
  const playbackDisabled = configInvalid || configPending;
  const playbackDisabledReason = configInvalid
    ? "Corregí la configuración antes de reproducir"
    : "Ejecutá la simulación para aplicar cambios";

  const playTone = useCallback((frequency: number, duration = 0.06) => {
    if (!uiSettings.sound) return;
    try {
      const AudioContextConstructor = window.AudioContext;
      const context = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
    } catch {
    }
  }, [uiSettings.sound]);

  const addEvent = useCallback((message: string, tone: EventTone = "info", toast = true) => {
    const event: MissionEvent = {
      id: ++eventIdRef.current,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      message,
      tone,
    };
    setMissionEvents((events) => [...events, event].slice(-10));
    if (toast) setActionToast(message);
  }, []);

  const handleUiEvent = useCallback((message: string) => {
    setActionToast(message);
    playTone(message.includes("oculto") || message.includes("cerrad") ? 300 : 520, 0.045);
  }, [playTone]);

  useEffect(() => {
    setCurrentFrame((frame) => clampFrame(frame, lastFrame));
  }, [lastFrame, result]);

  useEffect(() => {
    if (safeFrame < lastFrame) {
      endNotifiedRef.current = false;
      return;
    }
    if (totalFrames > 1 && !endNotifiedRef.current) {
      endNotifiedRef.current = true;
      addEvent("Fin de corrida alcanzado", "success");
      playTone(320, 0.1);
    }
  }, [addEvent, lastFrame, playTone, safeFrame, totalFrames]);

  useEffect(() => {
    if (!runNotice) return;
    const timeoutId = window.setTimeout(() => setRunNotice(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [runNotice]);

  useEffect(() => {
    if (!actionToast) return;
    const timeoutId = window.setTimeout(() => setActionToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [actionToast]);

  useEffect(() => {
    try {
      localStorage.setItem("taccon-ui-settings", JSON.stringify(uiSettings));
    } catch {
    }
  }, [uiSettings]);

  useEffect(() => () => {
    void audioContextRef.current?.close();
  }, []);

  useEffect(() => {
    if (!playing || totalFrames <= 1) {
      lastTimestampRef.current = null;
      elapsedRef.current = 0;
      return;
    }

    const dt = result.metadata.config.simulation.dt;
    const frameDuration = (Number.isFinite(dt) && dt > 0 ? dt : 0.05) * 1000 / speed;
    let animationFrameId = 0;

    const advance = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      } else {
        elapsedRef.current += timestamp - lastTimestampRef.current;
        lastTimestampRef.current = timestamp;
      }

      const framesToAdvance = Math.floor(elapsedRef.current / frameDuration);
      if (framesToAdvance > 0) {
        elapsedRef.current -= framesToAdvance * frameDuration;
        setCurrentFrame((frame) => {
          const nextFrame = Math.min(frame + framesToAdvance, lastFrame);
          if (nextFrame >= lastFrame) {
            setPlaying(false);
          }
          return nextFrame;
        });
      }

      animationFrameId = requestAnimationFrame(advance);
    };

    animationFrameId = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(animationFrameId);
  }, [lastFrame, playing, result.metadata.config.simulation.dt, speed, totalFrames]);

  const handleSimulate = useCallback((nextConfig: SimulationConfig) => {
    setConfig(structuredClone(nextConfig));
    setResult(runSimulation(nextConfig));
    setCurrentFrame(0);
    setPlaying(false);
    lastConfigLogRef.current = "";
    lastLoggedSeekRef.current = -999;
    setRunCount((count) => count + 1);
    setLastRunTime(new Date());
    setRunNotice("Simulación cargada con mock · frame reiniciado · listo para reproducir");
    setUiMessage("Resultado mock aplicado y listo para reproducir");
    addEvent(`CORRIDA #${runCount + 1} cargada · fuente mock · frame 0`, "success");
    playTone(720);
  }, [addEvent, playTone, runCount]);

  const handleConfigChange = useCallback((nextConfig: SimulationConfig) => {
    const errors = validateConfig(nextConfig);
    const invalid = errors.length > 0;
    setConfig(nextConfig);
    setPlaying(false);
    setUiMessage(
      invalid
        ? "Corregí la configuración antes de reproducir"
        : "Ejecutá la simulación para aplicar cambios",
    );
    const logMessage = invalid ? `Config inválida: ${errors[0]}` : "Configuración modificada · requiere ejecutar";
    if (lastConfigLogRef.current !== logMessage) {
      lastConfigLogRef.current = logMessage;
      addEvent(logMessage, invalid ? "warning" : "info", false);
    }
    if (invalid) playTone(180, 0.09);
  }, [addEvent, playTone]);

  const handlePlay = useCallback(() => {
    if (playbackDisabled) {
      setUiMessage(playbackDisabledReason);
      addEvent(playbackDisabledReason, "warning");
      playTone(180, 0.09);
      return;
    }
    setCurrentFrame((frame) => frame >= lastFrame ? 0 : frame);
    setPlaying(totalFrames > 1);
    setUiMessage("Reproduciendo última simulación aplicada");
    addEvent("Reproducción iniciada", "success");
    playTone(620);
  }, [addEvent, lastFrame, playTone, playbackDisabled, playbackDisabledReason, totalFrames]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    addEvent("Reproducción pausada");
    playTone(280);
  }, [addEvent, playTone]);

  const handleRestart = useCallback(() => {
    setCurrentFrame(0);
    setPlaying(false);
    addEvent("Línea de tiempo reiniciada · frame 0");
    playTone(420);
  }, [addEvent, playTone]);

  const handleSeek = useCallback((frame: number) => {
    const nextFrame = clampFrame(frame, lastFrame);
    setCurrentFrame(nextFrame);
    setPlaying(false);
    if (nextFrame === 0 || nextFrame === lastFrame || Math.abs(nextFrame - lastLoggedSeekRef.current) >= 5) {
      lastLoggedSeekRef.current = nextFrame;
      addEvent(`Frame seleccionado: ${nextFrame}/${lastFrame}`, "info", false);
    }
  }, [addEvent, lastFrame]);

  const handleSpeedChange = useCallback((nextSpeed: number) => {
    setSpeed(nextSpeed);
    setActionToast(`Velocidad de reproducción: ${nextSpeed}×`);
    playTone(440 + nextSpeed * 40, 0.04);
  }, [playTone]);

  const handlePresentationMode = useCallback((enabled: boolean) => {
    setPresentationMode(enabled);
    setActionToast(enabled ? "Modo presentación activado" : "Modo presentación desactivado");
  }, []);

  const handleUiSettingsChange = useCallback((next: UiSettings) => {
    if (next.theme !== uiSettings.theme) setActionToast("Tema visual actualizado");
    if (next.sound !== uiSettings.sound) setActionToast(`Sonido UI ${next.sound ? "activado" : "silenciado"}`);
    setUiSettings(next);
  }, [uiSettings]);

  const handleDemoMode = useCallback(() => {
    setPresentationMode(true);
    setCurrentFrame(0);
    setPlaying(false);
    setDemoSignal((signal) => signal + 1);
    setUiMessage("Demo lista · presioná Reproducir para iniciar");
    addEvent("Modo demo listo · todos los visores · frame 0", "success");
  }, [addEvent]);

  const handleCleanView = useCallback(() => {
    setPresentationMode(true);
    setShowStatusPanel(true);
    setShowTimeline(true);
    setShowStateStrip(false);
    setClosePanelsSignal((signal) => signal + 1);
    setCleanSignal((signal) => signal + 1);
    setMissionLogOpen(false);
    setActionToast("Vista limpia activada");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea, [contenteditable='true']")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (playing) handlePause();
        else handlePlay();
      } else if (event.key.toLowerCase() === "r") {
        handleRestart();
      } else if (event.key === "ArrowLeft") {
        handleSeek(safeFrame - 5);
      } else if (event.key === "ArrowRight") {
        handleSeek(safeFrame + 5);
      } else if (event.key.toLowerCase() === "a") {
        handleSeek(safeFrame - 5);
      } else if (event.key.toLowerCase() === "d") {
        handleSeek(safeFrame + 5);
      } else if (event.key.toLowerCase() === "p") {
        handlePresentationMode(!presentationMode);
      } else if (event.key.toLowerCase() === "f") {
        setFocusSignal((signal) => signal + 1);
      } else if (event.key.toLowerCase() === "g") {
        setLayoutSignal((signal) => signal + 1);
      } else if (event.key.toLowerCase() === "l") {
        setMissionLogOpen((open) => !open);
      } else if (event.key.toLowerCase() === "i") {
        setInspectorSignal((signal) => signal + 1);
      } else if (event.key.toLowerCase() === "m") {
        handleUiSettingsChange({ ...uiSettings, sound: !uiSettings.sound });
      } else if (event.key.toLowerCase() === "h") {
        setShowShortcutHelp((value) => !value);
      } else if (event.key === "Escape") {
        setPresentationMode(false);
        setEscapeSignal((signal) => signal + 1);
        setClosePanelsSignal((signal) => signal + 1);
        setMissionLogOpen(false);
        setShowShortcutHelp(false);
        setActionToast(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePause, handlePlay, handlePresentationMode, handleRestart, handleSeek, handleUiSettingsChange, playing, presentationMode, safeFrame, uiSettings]);

  return (
    <MotionConfig reducedMotion={uiSettings.reducedMotion ? "always" : "never"}>
      <div
        className="min-h-screen bg-void flex flex-col relative ui-root"
        data-theme={uiSettings.theme}
        data-scanlines={uiSettings.scanlines ? "on" : "off"}
        data-glow={uiSettings.glow ? "on" : "off"}
        data-motion={uiSettings.reducedMotion ? "reduced" : "full"}
        data-density={uiSettings.density}
        data-presentation={presentationMode ? "on" : "off"}
        data-panel-style={uiSettings.panelStyle}
        data-grid-intensity={uiSettings.gridIntensity}
      >
      <AnimatePresence>
        {actionToast && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="hud-toast">
            &gt; {actionToast}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showShortcutHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="shortcut-help">
            <div className="shortcut-help-panel">
              <div className="flex items-center justify-between mb-3">
                <span className="tac-label tac-label-hud">ATAJOS DE TECLADO</span>
                <button onClick={() => setShowShortcutHelp(false)} className="hud-icon-button">CERRAR</button>
              </div>
              {[
                ["ESPACIO", "Reproducir / pausar"], ["R", "Reiniciar"], ["A / ←", "Retroceder 5 frames"],
                ["D / →", "Avanzar 5 frames"], ["F", "Recorrer foco de visores"], ["G", "Cambiar distribución"], ["P", "Modo presentación"],
                ["L", "Abrir/cerrar bitácora"], ["I", "Abrir/cerrar inspector"], ["M", "Activar/silenciar sonido"],
                ["H", "Mostrar esta ayuda"], ["ESC", "Cerrar paneles y salir de foco"],
              ].map(([key, label]) => <div key={key} className="shortcut-row"><kbd>{key}</kbd><span>{label}</span></div>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="topbar flex items-center justify-between px-4 py-2 border-b border-panel-border bg-obsidian/95 z-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-hud/40 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-hud/5" />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="currentColor" strokeWidth="1" className="text-hud" />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" className="text-hud" />
              <line x1="7" y1="3" x2="7" y2="5.5" stroke="currentColor" strokeWidth="0.5" className="text-hud/50" />
              <line x1="7" y1="8.5" x2="7" y2="11" stroke="currentColor" strokeWidth="0.5" className="text-hud/50" />
              <line x1="3.5" y1="7" x2="5.5" y2="7" stroke="currentColor" strokeWidth="0.5" className="text-hud/50" />
              <line x1="8.5" y1="7" x2="10.5" y2="7" stroke="currentColor" strokeWidth="0.5" className="text-hud/50" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[11px] font-bold tracking-[0.2em] text-hud leading-none text-glow-hud">
                TACCON-SIM
              </h1>
              <span className="text-[8px] text-mist tracking-[0.15em] border border-slate-steel px-1.5 py-0.5">
                v1.0
              </span>
            </div>
            <p className="text-[8px] text-ash tracking-[0.25em] mt-0.5">
              SISTEMA DE SIMULACIÓN TÁCTICO | PERSECUCIÓN AÉREA
            </p>
          </div>
        </div>

        <nav className="flex gap-px">
          {([
            { id: "simulation" as TabId, label: "SIMULACIÓN TÁCTICA", code: "TAC-01" },
            { id: "theory" as TabId, label: "ANÁLISIS TEÓRICO", code: "THR-02" },
          ]).map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-1.5 text-[10px] font-bold tracking-[0.15em] transition-all cursor-pointer border ${activeTab === tab.id
                ? "bg-hud/10 text-hud border-hud/30"
                : "bg-transparent text-ash border-slate-steel hover:text-mist hover:border-mist/30"
                }`}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-0 top-0 h-[2px] bg-hud"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="text-[7px] text-mist mr-2">[{tab.code}]</span>
              {tab.label}
            </motion.button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            onClick={() => handlePresentationMode(!presentationMode)}
            className={`hud-mini-button topbar-control ${presentationMode ? "hud-mini-button-active" : ""}`}
          >
            {presentationMode ? "SALIR PRESENTACIÓN" : "PRESENTACIÓN"}
          </button>
          <button onClick={handleDemoMode} className="hud-mini-button topbar-control" title="Preparar pantalla para demo">
            MODO DEMO
          </button>
          <button onClick={handleCleanView} className="hud-mini-button topbar-control" title="Dejar área de visores, indicadores y línea de tiempo">
            VISTA LIMPIA
          </button>
          <UiSettingsPanel
            settings={uiSettings}
            onChange={handleUiSettingsChange}
            presentationMode={presentationMode}
            onPresentationModeChange={handlePresentationMode}
            onReset={() => {
              setUiSettings(DEFAULT_UI_SETTINGS);
              setResetWorkspaceSignal((signal) => signal + 1);
              try {
                localStorage.removeItem("taccon-ui-settings");
                localStorage.removeItem("taccon-workspace-prefs");
              } catch {}
              setActionToast("Preferencias UI restablecidas");
            }}
            closeSignal={closePanelsSignal}
          />
          {showStatusPanel && <StatusPanel
            currentTime={currentTime}
            currentDistance={currentDistance}
            closingVelocity={closingVel}
            outcome={result.outcome}
            playing={playing}
          />}
          <button onClick={() => setShowStatusPanel((value) => !value)} className="hud-icon-button" title="Mostrar u ocultar KPIs">KPI</button>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "simulation" ? (
            <motion.div
              key="simulation"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 flex overflow-hidden">
                <AnimatePresence>
                  {showControls && !presentationMode && (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 310, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-r border-panel-border bg-obsidian/60 overflow-y-auto overflow-x-hidden flex-shrink-0"
                    >
                      <Controls
                        config={config}
                        onConfigChange={handleConfigChange}
                        onSimulate={handleSimulate}
                        configStatus={configStatus}
                        runCount={runCount}
                        onEvent={addEvent}
                      />
                    </motion.aside>
                  )}
                </AnimatePresence>

                {!presentationMode && <motion.button
                  onClick={() => setShowControls((v) => !v)}
                  className="self-start mt-3 px-0.5 py-4 bg-obsidian border border-panel-border border-l-0 text-mist hover:text-hud transition-colors cursor-pointer z-10"
                  whileHover={{ x: 2 }}
                  title={showControls ? "OCULTAR PANEL" : "MOSTRAR PANEL"}
                  aria-label={showControls ? "Ocultar panel de configuración" : "Mostrar panel de configuración"}
                >
                  <motion.span
                    animate={{ rotate: showControls ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                    className="block text-[9px]"
                  >
                    ◂
                  </motion.span>
                </motion.button>}

                <GraphWorkspace
                  result={result}
                  currentFrame={safeFrame}
                  onEvent={handleUiEvent}
                  demoSignal={demoSignal}
                  focusSignal={focusSignal}
                  layoutSignal={layoutSignal}
                  escapeSignal={escapeSignal}
                  resetSignal={resetWorkspaceSignal}
                  inspectorSignal={inspectorSignal}
                  cleanSignal={cleanSignal}
                />
              </div>

              <AnimatePresence>
                {runNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="run-notice"
                  >
                    <span className="status-chip status-chip-ready">SIM LISTA</span>
                    <span className="text-bright">{runNotice}</span>
                    <span className="text-hud ml-auto">CORRIDA #{runCount} · {lastRunTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {showStateStrip && <div className="simulation-state-strip">
                <div className="state-readout">
                  <span>CONFIG EDITADA</span>
                  <strong className={configInvalid ? "text-danger" : configPending ? "text-warning" : "text-mist"}>
                    dt={config.simulation.dt}s · {configStatus}
                  </strong>
                </div>
                <div className="state-readout">
                  <span>CONFIG APLICADA</span>
                  <strong className="text-hud">dt={result.metadata.config.simulation.dt}s · {result.metadata.integrator.toUpperCase()}</strong>
                </div>
                <div className="state-readout">
                  <span>RESULTADO ACTUAL</span>
                  <strong className="text-cyan-glow">CORRIDA #{runCount} · MOCK · {totalFrames} FRAMES</strong>
                </div>
                <span className={configInvalid ? "status-chip status-chip-danger" : configPending ? "status-chip status-chip-warning" : "status-chip status-chip-ready"}>
                  {configInvalid ? "CONFIG INVÁLIDA" : configPending ? "CONFIG PENDIENTE" : "SIM LISTA"}
                </span>
                <span className="text-mist flex-1 text-right">{uiMessage}</span>
              </div>}

              {showTimeline && <PlaybackBar
                currentFrame={safeFrame}
                totalFrames={totalFrames}
                currentTime={currentTime}
                totalTime={result.time[lastFrame] ?? 0}
                playing={playing}
                speed={speed}
                speedPresets={[0.25, 0.5, 1, 2, 4]}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onRestart={handleRestart}
                onSpeedChange={handleSpeedChange}
                disabled={playbackDisabled}
                disabledReason={playbackDisabledReason}
                onDisabledAttempt={() => setUiMessage(playbackDisabledReason)}
                eventTime={result.outcome.interceptTime ?? result.outcome.minDistanceTime}
                eventLabel={result.outcome.intercepted ? "EVENTO DE INTERCEPCIÓN" : "DISTANCIA MÍNIMA"}
              />}
              <div className="secondary-controls">
                <button onClick={() => setShowStateStrip((value) => !value)} className="hud-mini-button">RESUMEN</button>
                <button onClick={() => setShowTimeline((value) => !value)} className="hud-mini-button">LÍNEA DE TIEMPO</button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="theory"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="flex-1 overflow-y-auto p-6 tactical-grid"
            >
              <div className="max-w-4xl mx-auto">
                <div className="mil-panel p-6">
                  <div className="mil-corners">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 bg-hud" />
                      <span className="tac-label tac-label-hud">ANÁLISIS TEÓRICO</span>
                      <span className="text-[8px] text-mist ml-2">[THR-02]</span>
                    </div>
                    <div className="mil-divider mb-4" />
                    <p className="text-mist text-[11px] leading-relaxed tracking-wide">
                      MÓDULO RESERVADO PARA EL GRUPO 6.
                      CONTENIDO: ECUACIONES DE MOVIMIENTO, LEYES DE GUIADO,
                      CLASIFICACIÓN DEL SISTEMA (LINEAL / NO LINEAL / HOMOGÉNEO),
                      ANÁLISIS DE ESTABILIDAD VÍA AUTOVALORES.
                    </p>
                    <div className="mt-6 p-4 border border-dashed border-slate-steel text-center">
                      <code className="text-hud/50 text-[11px]">{"<TheoryTab />"}</code>
                      <span className="text-ash text-[10px] ml-2">PENDIENTE IMPLEMENTACIÓN</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="px-4 py-1 border-t border-panel-border bg-obsidian/90 flex items-center justify-between text-[8px] text-ash tracking-[0.15em]">
        <span>FUENTE: MOCK | INTEGRADOR: {result.metadata.integrator.toUpperCase()} | dt ACTIVO={result.metadata.config.simulation.dt}s</span>
        <span className="flex items-center gap-2">
          <span className="w-1 h-1 bg-hud pulse-dot inline-block" />
          CONFIG {configStatus}
        </span>
        <span>RESULTADO: {totalFrames} FRAMES | BORRADOR dt={config.simulation.dt}s</span>
        <button onClick={() => setShowShortcutHelp(true)} className="hud-mini-button" title="H · Mostrar ayuda">ATAJOS [H]</button>
      </div>
      <MissionLog
        events={missionEvents}
        onClear={() => setMissionEvents([])}
        open={missionLogOpen}
        onOpenChange={setMissionLogOpen}
      />
      </div>
    </MotionConfig>
  );
}
