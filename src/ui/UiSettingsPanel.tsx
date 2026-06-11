import { useEffect, useState } from "react";

export type UiTheme = "green" | "cyan" | "amber" | "threat" | "blueprint" | "terminal" | "militaryNight" | "naval" | "desert" | "contrast" | "skyOps" | "lightHangar" | "tacticalMap" | "laboratory";
export type UiDensity = "compact" | "normal" | "presentation";
export type PanelStyle = "tactical" | "glass" | "blueprint" | "crt" | "minimal" | "alert";
export type GridIntensity = "low" | "medium" | "high";
export type SimulationVolume = "low" | "medium" | "high";

export interface UiSettings {
  theme: UiTheme;
  scanlines: boolean;
  glow: boolean;
  reducedMotion: boolean;
  density: UiDensity;
  sound: boolean;
  simulationSound: boolean;
  simulationMotor: boolean;
  impactSound: boolean;
  simulationVolume: SimulationVolume;
  showMissionMilestones: boolean;
  panelStyle: PanelStyle;
  gridIntensity: GridIntensity;
}

interface UiSettingsPanelProps {
  settings: UiSettings;
  onChange: (settings: UiSettings) => void;
  presentationMode: boolean;
  onPresentationModeChange: (enabled: boolean) => void;
  onReset: () => void;
  closeSignal?: number;
}

const themes: { value: UiTheme; label: string }[] = [
  { value: "green", label: "HUD VERDE" },
  { value: "cyan", label: "CIAN RADAR" },
  { value: "amber", label: "ÁMBAR CABINA" },
  { value: "threat", label: "ROJO AMENAZA" },
  { value: "blueprint", label: "PLANO AZUL" },
  { value: "terminal", label: "TERMINAL TÁCTICA" },
  { value: "militaryNight", label: "NOCTURNO MILITAR" },
  { value: "naval", label: "RADAR NAVAL" },
  { value: "desert", label: "DESIERTO TÁCTICO" },
  { value: "contrast", label: "ALTO CONTRASTE" },
  { value: "skyOps", label: "CIELO OPERATIVO" },
  { value: "lightHangar", label: "HANGAR CLARO" },
  { value: "tacticalMap", label: "MAPA TÁCTICO" },
  { value: "laboratory", label: "LABORATORIO CLARO" },
];

export default function UiSettingsPanel({
  settings,
  onChange,
  presentationMode,
  onPresentationModeChange,
  onReset,
  closeSignal = 0,
}: UiSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const patch = (next: Partial<UiSettings>) => onChange({ ...settings, ...next });

  useEffect(() => {
    if (closeSignal > 0) setOpen(false);
  }, [closeSignal]);

  return (
    <div className="relative topbar-control">
      <button
        onClick={() => setOpen((value) => !value)}
        className="hud-mini-button"
        aria-expanded={open}
      >
        VISUAL
      </button>

      {open && (
        <div className="ui-settings-popover">
          <div className="tac-label tac-label-hud mb-1">PREFERENCIAS VISUALES</div>
          <p className="text-[8px] text-ash tracking-wide mb-3">Apariencia local de la estación táctica.</p>
          <label>ESTILO VISUAL</label>
          <select value={settings.theme} onChange={(event) => patch({ theme: event.target.value as UiTheme })}>
            {themes.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}
          </select>

          <div className="mil-divider my-3" />
          <label>DENSIDAD DEL ÁREA DE TRABAJO</label>
          <div className="grid grid-cols-3 gap-1">
            {(["compact", "normal", "presentation"] as UiDensity[]).map((density) => (
              <button
                key={density}
                onClick={() => patch({ density })}
                className={`hud-mini-button ${settings.density === density ? "hud-mini-button-active" : ""}`}
              >
                {density === "compact" ? "COMPACTA" : density === "normal" ? "NORMAL" : "PRESENT."}
              </button>
            ))}
          </div>

          <label className="mt-3">ESTILO DE PANEL</label>
          <select value={settings.panelStyle} onChange={(event) => patch({ panelStyle: event.target.value as PanelStyle })}>
            <option value="tactical">TÁCTICO</option>
            <option value="glass">CRISTAL</option>
            <option value="blueprint">PLANO TÉCNICO</option>
            <option value="crt">CRT</option>
            <option value="minimal">MINIMAL</option>
            <option value="alert">ALERTA</option>
          </select>

          <label className="mt-3">INTENSIDAD DE GRILLA</label>
          <div className="grid grid-cols-3 gap-1">
            {(["low", "medium", "high"] as GridIntensity[]).map((intensity) => (
              <button key={intensity} onClick={() => patch({ gridIntensity: intensity })} className={`hud-mini-button ${settings.gridIntensity === intensity ? "hud-mini-button-active" : ""}`}>
                {intensity === "low" ? "BAJA" : intensity === "medium" ? "MEDIA" : "ALTA"}
              </button>
            ))}
          </div>

          <div className="mil-divider my-3" />
          <label>EFECTOS Y PRESENTACIÓN</label>
          <div className="space-y-1">
            <Toggle label="LÍNEAS CRT" enabled={settings.scanlines} onChange={(scanlines) => patch({ scanlines })} />
            <Toggle label="EFECTOS / RESPLANDOR" enabled={settings.glow} onChange={(glow) => patch({ glow })} />
            <Toggle label="ANIMACIÓN REDUCIDA" enabled={settings.reducedMotion} onChange={(reducedMotion) => patch({ reducedMotion })} />
            <Toggle label="SONIDO UI" enabled={settings.sound} onChange={(sound) => patch({ sound })} />
            <Toggle label="SONIDO SIMULACIÓN" enabled={settings.simulationSound} onChange={(simulationSound) => patch({ simulationSound })} />
            <Toggle label="MOTOR" enabled={settings.simulationMotor} onChange={(simulationMotor) => patch({ simulationMotor })} />
            <Toggle label="EVENTOS DE IMPACTO" enabled={settings.impactSound} onChange={(impactSound) => patch({ impactSound })} />
            <label className="mt-2">VOLUMEN SIMULACIÓN</label>
            <div className="grid grid-cols-3 gap-1">
              {(["low", "medium", "high"] as SimulationVolume[]).map((volume) => (
                <button
                  key={volume}
                  onClick={() => patch({ simulationVolume: volume })}
                  className={`hud-mini-button ${settings.simulationVolume === volume ? "hud-mini-button-active" : ""}`}
                >
                  {volume === "low" ? "BAJO" : volume === "medium" ? "MEDIO" : "ALTO"}
                </button>
              ))}
            </div>
            <Toggle label="HITOS DE MISIÓN" enabled={settings.showMissionMilestones} onChange={(showMissionMilestones) => patch({ showMissionMilestones })} />
            <Toggle label="MODO PRESENTACIÓN" enabled={presentationMode} onChange={onPresentationModeChange} />
          </div>
          <button onClick={onReset} className="hud-mini-button w-full mt-3">RESTABLECER UI</button>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="w-full flex items-center justify-between border border-slate-steel px-2 py-1 text-[8px] tracking-[0.12em] text-mist hover:text-hud"
      aria-pressed={enabled}
    >
      {label}
      <span className={enabled ? "text-hud" : "text-ash"}>{enabled ? "ACTIVO" : "INACTIVO"}</span>
    </button>
  );
}
