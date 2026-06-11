/**
 * Grupo 3 — Formularios de entrada
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  SimulationConfig,
  GuidanceLaw,
  ManeuverType,
  Integrator,
  Vec3,
} from "../shared/types";
import { mockConfig } from "../shared/mockResult";

interface ControlsProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  onSimulate: (config: SimulationConfig) => void;
  configStatus?: "APLICADA" | "PENDIENTE" | "INVÁLIDA";
  runCount?: number;
  onEvent?: (message: string) => void;
}

// Military Section
interface SectionProps {
  title: string;
  code: string;
  accentColor: "hud" | "amber" | "cyan" | "neutral";
  defaultOpen?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}

function Section({ title, code, accentColor, defaultOpen = true, onReset, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const accentMap = {
    hud: { text: "text-hud", border: "border-hud/20", dot: "bg-hud" },
    amber: { text: "text-amber-glow", border: "border-amber-glow/20", dot: "bg-amber-glow" },
    cyan: { text: "text-cyan-glow", border: "border-cyan-glow/20", dot: "bg-cyan-glow" },
    neutral: { text: "text-mist", border: "border-slate-steel", dot: "bg-mist" },
  };

  const accent = accentMap[accentColor];

  return (
    <div className={`border-b ${accent.border}`}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-glass-hover transition-colors"
        whileTap={{ scale: 0.995 }}
        aria-expanded={open}
        aria-label={`${open ? "Ocultar" : "Mostrar"} ${title}`}
        title={`${open ? "Ocultar" : "Mostrar"} ${title}`}
      >
        <div className={`w-1.5 h-1.5 ${accent.dot} ${open ? "pulse-dot" : ""}`} />
        <span className="text-[8px] text-ash tracking-[0.15em] font-bold">[{code}]</span>
        <span className={`text-[9px] font-bold tracking-[0.15em] flex-1 ${accent.text}`}>
          {title}
        </span>
        {onReset && (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onReset();
              }
            }}
            className="border border-slate-steel px-1.5 py-0.5 text-[7px] text-ash hover:text-hud hover:border-hud/30 transition-colors"
            title={`Restaurar ${title}`}
          >
            RESTAURAR
          </span>
        )}
        <span className="text-[7px] text-ash tracking-[0.08em]">
          {open ? "OCULTAR" : "MOSTRAR"}
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-ash text-[8px]"
        >
          ▸
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//Field components
interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}

function NumberField({ label, value, onChange, step = 1, min, max, unit }: NumberFieldProps) {
  return (
    <div>
      <label>
        {label}
        {unit && <span className="text-ash ml-1 text-[8px]">[{unit}]</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
}

interface Vec3FieldProps {
  label: string;
  value: Vec3;
  onChange: (v: Vec3) => void;
  step?: number;
}

function Vec3Field({ label, value, onChange, step = 1 }: Vec3FieldProps) {
  const handleComponent = (idx: number, v: number) => {
    const next: Vec3 = [...value];
    next[idx] = v;
    onChange(next);
  };

  return (
    <div>
      <label>{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {(["X", "Y", "Z"] as const).map((l, i) => (
          <div key={l} className="relative">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-ash font-bold tracking-wider">
              {l}
            </span>
            <input
              type="number"
              value={value[i]}
              onChange={(e) => handleComponent(i, Number(e.target.value))}
              step={step}
              className="!pl-5 !text-[11px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}

function SelectField<T extends string>({ label, value, onChange, options }: SelectFieldProps<T>) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

//Options
const GUIDANCE_OPTIONS: { value: GuidanceLaw; label: string }[] = [
  { value: "pure_pursuit", label: "PERSECUCIÓN PURA (PP)" },
  { value: "proportional_nav", label: "NAVEGACIÓN PROPORCIONAL (PN)" },
];

const MANEUVER_OPTIONS: { value: ManeuverType; label: string }[] = [
  { value: "straight", label: "RECTA (SIN MANIOBRA)" },
  { value: "constant_turn", label: "VIRAJE CONSTANTE" },
  { value: "weave", label: "SERPENTEO" },
  { value: "reactive_evade", label: "EVASIÓN REACTIVA" },
];

const INTEGRATOR_OPTIONS: { value: Integrator; label: string }[] = [
  { value: "rk4", label: "RUNGE-KUTTA 4 (RK4)" },
  { value: "euler", label: "EULER (DIDÁCTICO)" },
];

type PresetId = "pn" | "pursuit" | "weave" | "reactive" | "slowMissile" | "fastMissile" | "nearEscape" | "euler" | "rk4" | "closeImpact" | "noIntercept" | "demo3d";

const PRESETS: { id: PresetId; category: string; label: string; description: string }[] = [
  { id: "pn", category: "Intercepción", label: "Intercepción PN limpia", description: "PN con intercepción rápida y estable." },
  { id: "pursuit", category: "Básicos", label: "Persecución pura", description: "Guiado directo contra un objetivo rectilíneo." },
  { id: "weave", category: "Evasión", label: "Serpenteo evasivo", description: "El avión serpentea para intentar escapar." },
  { id: "reactive", category: "Evasión", label: "Evasión reactiva", description: "Maniobra reactiva con alta aceleración lateral." },
  { id: "slowMissile", category: "Comparación", label: "Misil lento", description: "Reduce velocidad y capacidad de cierre del misil." },
  { id: "fastMissile", category: "Comparación", label: "Misil rápido", description: "Encuentro corto con misil de alta velocidad." },
  { id: "nearEscape", category: "Intercepción", label: "Avión casi escapa", description: "Escenario exigente cerca del límite de intercepción." },
  { id: "euler", category: "Comparación", label: "Comparar Euler", description: "Configuración base usando integrador Euler." },
  { id: "rk4", category: "Comparación", label: "Comparar RK4", description: "Configuración base usando integrador RK4." },
  { id: "closeImpact", category: "Intercepción", label: "Impacto cercano", description: "Distancia inicial corta para observar el impacto." },
  { id: "noIntercept", category: "Estrés / demo", label: "Sin intercepción", description: "El misil no alcanza al avión antes del tiempo máximo." },
  { id: "demo3d", category: "Estrés / demo", label: "Demo 3D", description: "Trayectorias amplias y maniobra visible para presentación." },
];

function cloneConfig(config: SimulationConfig): SimulationConfig {
  return {
    aircraft: {
      ...config.aircraft,
      position: [...config.aircraft.position],
      velocity: [...config.aircraft.velocity],
      maneuverParams: config.aircraft.maneuverParams
        ? { ...config.aircraft.maneuverParams }
        : undefined,
    },
    missile: {
      ...config.missile,
      position: [...config.missile.position],
      velocity: [...config.missile.velocity],
    },
    simulation: { ...config.simulation },
  };
}

export function validateConfig(config: SimulationConfig): string[] {
  const errors: string[] = [];
  const numericValues = [
    ...config.aircraft.position,
    ...config.aircraft.velocity,
    config.aircraft.maxAccel,
    ...config.missile.position,
    ...config.missile.velocity,
    config.missile.maxAccel,
    config.missile.navConstant,
    config.simulation.dt,
    config.simulation.maxTime,
    config.simulation.hitRadius,
    ...Object.values(config.aircraft.maneuverParams ?? {}),
  ];

  if (numericValues.some((value) => !Number.isFinite(value))) {
    errors.push("Todos los parámetros numéricos deben ser finitos.");
  }
  if (config.simulation.dt <= 0) errors.push("dt debe ser mayor que 0.");
  if (config.simulation.maxTime <= 0) errors.push("El tiempo máximo debe ser mayor que 0.");
  if (config.simulation.hitRadius <= 0) errors.push("El radio de impacto debe ser mayor que 0.");
  if (config.aircraft.maxAccel < 0) errors.push("La aceleración máxima del avión no puede ser negativa.");
  if (config.missile.maxAccel < 0) errors.push("La aceleración máxima del misil no puede ser negativa.");
  if (config.missile.navConstant <= 0) errors.push("La constante de navegación debe ser mayor que 0.");
  if (config.aircraft.velocity.every((value) => value === 0)) errors.push("La velocidad inicial del avión no puede ser nula.");
  if (config.missile.velocity.every((value) => value === 0)) errors.push("La velocidad inicial del misil no puede ser nula.");

  return errors;
}

//Main Component
export default function Controls({ config, onConfigChange, onSimulate, configStatus = "APLICADA", runCount = 1, onEvent }: ControlsProps) {
  const validationErrors = validateConfig(config);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("pn");

  const updateAircraft = useCallback(
    (patch: Partial<typeof config.aircraft>) => {
      onConfigChange({ ...config, aircraft: { ...config.aircraft, ...patch } });
    },
    [config, onConfigChange],
  );

  const updateMissile = useCallback(
    (patch: Partial<typeof config.missile>) => {
      onConfigChange({ ...config, missile: { ...config.missile, ...patch } });
    },
    [config, onConfigChange],
  );

  const updateSim = useCallback(
    (patch: Partial<typeof config.simulation>) => {
      onConfigChange({ ...config, simulation: { ...config.simulation, ...patch } });
    },
    [config, onConfigChange],
  );

  const updateManeuverParams = useCallback(
    (patch: Partial<NonNullable<typeof config.aircraft.maneuverParams>>) => {
      onConfigChange({
        ...config,
        aircraft: {
          ...config.aircraft,
          maneuverParams: { ...config.aircraft.maneuverParams, ...patch },
        },
      });
    },
    [config, onConfigChange],
  );

  const applyPreset = useCallback((preset: PresetId) => {
    const next = cloneConfig(mockConfig);

    if (preset === "pursuit") {
      next.aircraft.maneuver = "straight";
      next.missile.guidanceLaw = "pure_pursuit";
    } else if (preset === "weave") {
      next.aircraft.maneuver = "weave";
      next.aircraft.maxAccel = 110;
      next.aircraft.maneuverParams = { weaveAmp: 105, weaveFreq: 2.8 };
      next.missile.navConstant = 3.5;
    } else if (preset === "reactive") {
      next.aircraft.maneuver = "reactive_evade";
      next.aircraft.maxAccel = 145;
      next.missile.navConstant = 3.2;
    } else if (preset === "slowMissile") {
      next.missile.velocity = [-310, -80, 0];
      next.missile.maxAccel = 180;
    } else if (preset === "fastMissile") {
      next.missile.velocity = [-720, -180, 0];
      next.missile.maxAccel = 380;
    } else if (preset === "nearEscape") {
      next.aircraft.velocity = [285, 0, 0];
      next.aircraft.maneuver = "weave";
      next.aircraft.maxAccel = 135;
      next.aircraft.maneuverParams = { weaveAmp: 130, weaveFreq: 2.4 };
      next.missile.velocity = [-390, -110, 0];
      next.simulation.maxTime = 12;
    } else if (preset === "euler") {
      next.simulation.integrator = "euler";
    } else if (preset === "rk4") {
      next.simulation.integrator = "rk4";
    } else if (preset === "closeImpact") {
      next.missile.position = [900, 320, 0];
      next.simulation.maxTime = 6;
    } else if (preset === "noIntercept") {
      next.aircraft.velocity = [300, 0, 0];
      next.missile.velocity = [-220, -40, 0];
      next.missile.maxAccel = 90;
      next.simulation.maxTime = 6;
    } else if (preset === "demo3d") {
      next.aircraft.position = [0, 0, 180];
      next.aircraft.maneuver = "constant_turn";
      next.aircraft.maxAccel = 120;
      next.aircraft.maneuverParams = { turnRate: 0.42 };
      next.missile.position = [2600, 1100, -160];
      next.simulation.maxTime = 14;
    }

    onConfigChange(next);
    onEvent?.(`Preajuste cargado: ${PRESETS.find((item) => item.id === preset)?.label ?? preset}`);
  }, [onConfigChange, onEvent]);

  const handleSimulate = useCallback(() => {
    const errors = validateConfig(config);
    if (errors.length === 0) onSimulate(config);
  }, [config, onSimulate]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-panel-border flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-hud pulse-dot" />
        <span className="text-[9px] font-bold tracking-[0.2em] text-hud text-glow-hud">
          CONFIGURACIÓN DE MISIÓN
        </span>
        <span className="text-[7px] text-ash ml-auto tracking-[0.15em]">[SYS-PARAM]</span>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">
        {/* TARGET (Aircraft) */}
        <Section
          title="OBJETIVO · AVIÓN"
          code="OBJ"
          accentColor="amber"
          onReset={() => {
            onConfigChange({ ...config, aircraft: structuredClone(mockConfig.aircraft) });
            onEvent?.("Configuración del avión restablecida");
          }}
        >
          <Vec3Field
            label="POS INICIAL"
            value={config.aircraft.position}
            onChange={(v) => updateAircraft({ position: v })}
          />
          <Vec3Field
            label="VEL INICIAL"
            value={config.aircraft.velocity}
            onChange={(v) => updateAircraft({ velocity: v })}
            step={10}
          />
          <SelectField
            label="MANIOBRA EVASIVA"
            value={config.aircraft.maneuver}
            onChange={(v) => updateAircraft({ maneuver: v })}
            options={MANEUVER_OPTIONS}
          />
          <NumberField
            label="ACEL. MÁX LATERAL"
            value={config.aircraft.maxAccel}
            onChange={(v) => updateAircraft({ maxAccel: v })}
            step={5}
            min={0}
            unit="m/s²"
          />

          <AnimatePresence>
            {config.aircraft.maneuver === "constant_turn" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <NumberField
                  label="VEL. DE GIRO"
                  value={config.aircraft.maneuverParams?.turnRate ?? 0.5}
                  onChange={(v) => updateManeuverParams({ turnRate: v })}
                  step={0.1}
                  unit="rad/s"
                />
              </motion.div>
            )}
            {config.aircraft.maneuver === "weave" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden space-y-2.5"
              >
                <NumberField
                  label="AMPLITUD DE SERPENTEO"
                  value={config.aircraft.maneuverParams?.weaveAmp ?? 95}
                  onChange={(v) => updateManeuverParams({ weaveAmp: v })}
                  step={5}
                  unit="m/s²"
                />
                <NumberField
                  label="FRECUENCIA DE SERPENTEO"
                  value={config.aircraft.maneuverParams?.weaveFreq ?? 2.3}
                  onChange={(v) => updateManeuverParams({ weaveFreq: v })}
                  step={0.1}
                  unit="rad/s"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/*WEAPON (Missile) */}
        <Section
          title="ARMA · MISIL"
          code="MSL"
          accentColor="cyan"
          onReset={() => {
            onConfigChange({ ...config, missile: structuredClone(mockConfig.missile) });
            onEvent?.("Configuración del misil restablecida");
          }}
        >
          <Vec3Field
            label="POS INICIAL"
            value={config.missile.position}
            onChange={(v) => updateMissile({ position: v })}
          />
          <Vec3Field
            label="VEL INICIAL"
            value={config.missile.velocity}
            onChange={(v) => updateMissile({ velocity: v })}
            step={10}
          />
          <SelectField
            label="LEY DE GUIADO"
            value={config.missile.guidanceLaw}
            onChange={(v) => updateMissile({ guidanceLaw: v })}
            options={GUIDANCE_OPTIONS}
          />

          <AnimatePresence>
            {config.missile.guidanceLaw === "proportional_nav" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <NumberField
                  label="CONSTANTE N"
                  value={config.missile.navConstant}
                  onChange={(v) => updateMissile({ navConstant: v })}
                  step={0.5}
                  min={1}
                  max={10}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <NumberField
            label="ACEL. MÁX LATERAL"
            value={config.missile.maxAccel}
            onChange={(v) => updateMissile({ maxAccel: v })}
            step={10}
            min={0}
            unit="m/s²"
          />
        </Section>

        {/*SIM PARAMS*/}
        <Section
          title="SIMULACIÓN"
          code="SIM"
          accentColor="neutral"
          defaultOpen={false}
          onReset={() => {
            onConfigChange({ ...config, simulation: structuredClone(mockConfig.simulation) });
            onEvent?.("Parámetros de simulación restablecidos");
          }}
        >
          <NumberField
            label="PASO DE TIEMPO (dt)"
            value={config.simulation.dt}
            onChange={(v) => updateSim({ dt: v })}
            step={0.01}
            min={0.001}
            unit="s"
          />
          <NumberField
            label="TIEMPO MÁXIMO"
            value={config.simulation.maxTime}
            onChange={(v) => updateSim({ maxTime: v })}
            step={1}
            min={1}
            unit="s"
          />
          <NumberField
            label="RADIO DE IMPACTO"
            value={config.simulation.hitRadius}
            onChange={(v) => updateSim({ hitRadius: v })}
            step={1}
            min={1}
            unit="m"
          />
          <SelectField
            label="INTEGRADOR NUMÉRICO"
            value={config.simulation.integrator}
            onChange={(v) => updateSim({ integrator: v })}
            options={INTEGRATOR_OPTIONS}
          />
        </Section>
      </div>

      {/*Execute Button*/}
      <div className="px-3 py-2.5 border-t border-panel-border space-y-2">
        <div className="flex items-center justify-between text-[8px] tracking-[0.12em]">
          <span className={configStatus === "INVÁLIDA" ? "status-chip status-chip-danger" : configStatus === "PENDIENTE" ? "status-chip status-chip-warning" : "status-chip status-chip-ready"}>
            CONFIG {configStatus}
          </span>
          <span className="text-ash">ÚLTIMO RESULTADO: CORRIDA #{runCount}</span>
        </div>
        <div className="preset-picker">
          <label>ESCENARIO PREDEFINIDO</label>
          <div className="grid grid-cols-[1fr_auto] gap-1">
            <select value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value as PresetId)}>
              {Array.from(new Set(PRESETS.map((preset) => preset.category))).map((category) => (
                <optgroup key={category} label={category}>
                  {PRESETS.filter((preset) => preset.category === category).map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button onClick={() => applyPreset(selectedPreset)} className="btn btn-ghost !px-2 !py-1.5 !text-[8px]">
              CARGAR
            </button>
          </div>
          <p>{PRESETS.find((preset) => preset.id === selectedPreset)?.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-1">
          <button onClick={() => {
            onConfigChange(cloneConfig(mockConfig));
            onEvent?.("Configuración global restablecida");
          }} className="btn btn-ghost !px-1 !py-1.5 !text-[8px]">
            RESTAURAR TODO
          </button>
        </div>

        {validationErrors.length > 0 && (
          <div className="border border-danger/40 bg-danger/5 px-2 py-1.5 text-[8px] text-danger tracking-wide space-y-1">
            {validationErrors.map((error) => <div key={error}>• {error}</div>)}
          </div>
        )}

        <motion.button
          onClick={handleSimulate}
          disabled={validationErrors.length > 0}
          className={`btn btn-primary w-full ${validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : configStatus === "PENDIENTE" ? "execute-attention" : ""}`}
          aria-disabled={validationErrors.length > 0}
          title={validationErrors.length > 0 ? "Corregí la configuración antes de ejecutar" : "Cargar simulación con la configuración actual"}
          whileHover={{ scale: 1.01, boxShadow: "0 0 24px rgba(0, 255, 136, 0.2)" }}
          whileTap={{ scale: 0.99 }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 0.5L9 5L1 9.5V0.5Z" />
          </svg>
          {configStatus === "PENDIENTE" ? "APLICAR CAMBIOS · EJECUTAR" : "EJECUTAR SIMULACIÓN"}
        </motion.button>
      </div>
    </div>
  );
}

