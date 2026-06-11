import { useEffect, useState } from "react";

export type UiTheme = "green" | "cyan" | "amber" | "threat" | "blueprint" | "terminal" | "militaryNight" | "naval" | "desert" | "contrast" | "skyOps" | "lightHangar" | "tacticalMap" | "laboratory";
export type UiDensity = "compact" | "normal" | "presentation";
export type PanelStyle = "tactical" | "glass" | "blueprint" | "crt" | "minimal" | "alert";
export type GridIntensity = "low" | "medium" | "high";
export type SimulationVolume = "low" | "medium" | "high";
export type WorkspaceSize = "compact" | "normal" | "wide" | "maximum";

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
  workspaceSize: WorkspaceSize;
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
  customStartAudioName?: string;
  customImpactAudioName?: string;
  onCustomStartAudio: (file: File | null) => void;
  onCustomImpactAudio: (file: File | null) => void;
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
  customStartAudioName,
  customImpactAudioName,
  onCustomStartAudio,
  onCustomImpactAudio,
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
        aria-label={open ? "Ocultar preferencias visuales" : "Mostrar preferencias visuales"}
        title={open ? "Ocultar preferencias visuales" : "Mostrar preferencias visuales"}
      >
        {open ? "OCULTAR PREFERENCIAS" : "MOSTRAR PREFERENCIAS"}
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

          <label className="mt-3">TAMAÑO DEL ÁREA DE VISORES</label>
          <select value={settings.workspaceSize} onChange={(event) => patch({ workspaceSize: event.target.value as WorkspaceSize })}>
            <option value="compact">VISORES COMPACTOS</option>
            <option value="normal">VISORES NORMAL</option>
            <option value="wide">VISORES AMPLIOS</option>
            <option value="maximum">VISORES MÁXIMO</option>
          </select>

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
            <AudioFileControl
              label="AUDIO DE ARRANQUE"
              fileName={customStartAudioName}
              onChange={onCustomStartAudio}
              resetLabel="RESTABLECER ARRANQUE"
            />
            <AudioFileControl
              label="AUDIO DE EXPLOSIÓN"
              fileName={customImpactAudioName}
              onChange={onCustomImpactAudio}
              resetLabel="RESTABLECER EXPLOSIÓN"
            />
            <Toggle label={settings.showMissionMilestones ? "OCULTAR HITOS DE MISIÓN" : "MOSTRAR HITOS DE MISIÓN"} enabled={settings.showMissionMilestones} onChange={(showMissionMilestones) => patch({ showMissionMilestones })} />
            <Toggle label={presentationMode ? "SALIR DE PRESENTACIÓN" : "MOSTRAR PRESENTACIÓN"} enabled={presentationMode} onChange={onPresentationModeChange} />
          </div>
          <button onClick={onReset} className="hud-mini-button w-full mt-3">RESTABLECER UI</button>
        </div>
      )}
    </div>
  );
}

function AudioFileControl({
  label,
  fileName,
  onChange,
  resetLabel,
}: {
  label: string;
  fileName?: string;
  onChange: (file: File | null) => void;
  resetLabel: string;
}) {
  return (
    <div className="audio-file-control">
      <label>{label}</label>
      <span title={fileName}>{fileName ?? "Fallback Web Audio"}</span>
      <div className="grid grid-cols-2 gap-1">
        <label className="hud-mini-button text-center cursor-pointer">
          CARGAR AUDIO
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(event) => {
              onChange(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>
        <button type="button" className="hud-mini-button" onClick={() => onChange(null)} disabled={!fileName}>
          {resetLabel}
        </button>
      </div>
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
