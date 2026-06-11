/**
 * types.ts — Contrato de datos central del proyecto "Persecución Avión–Misil".
 * Propietario: Grupo 1 (Investigación). No modificar sin avisar a los demás grupos.
 *
 * Todo el proyecto gira en torno a dos formas:
 *   - SimulationConfig : lo que ENTRA a simulate()
 *   - SimulationResult : lo que SALE de simulate() y consumen los tres gráficos
 *
 * Convención de índices (clave para la sincronización): time[i],
 * aircraft.position[i], missile.position[i], distance[i], etc. corresponden
 * TODOS al mismo instante i. El `currentFrame` de la UI es simplemente ese i.
 */

/** Vector 3D [x, y, z] en metros. Para 2D se usa z = 0. */
export type Vec3 = [number, number, number];

/** Ley de guiado del misil. */
export type GuidanceLaw = "pure_pursuit" | "proportional_nav";

/** Maniobra de evasión del avión. */
export type ManeuverType =
  | "straight"
  | "constant_turn"
  | "weave"
  | "reactive_evade";

/** Método de integración numérica. */
export type Integrator = "euler" | "rk4";

// ───────────────────────────────────────────────────────────────────────────
// ENTRADA — SimulationConfig
// ───────────────────────────────────────────────────────────────────────────

/** Parámetros opcionales de la maniobra del avión (según el tipo elegido). */
export interface ManeuverParams {
  /** rad/s — velocidad de giro. Usado por "constant_turn". */
  turnRate?: number;
  /** m/s² — amplitud de la aceleración lateral. Usado por "weave". */
  weaveAmp?: number;
  /** rad/s — frecuencia del serpenteo. Usado por "weave". */
  weaveFreq?: number;
}

export interface AircraftConfig {
  /** Posición inicial (m). */
  position: Vec3;
  /** Velocidad inicial (m/s). */
  velocity: Vec3;
  maneuver: ManeuverType;
  /** Aceleración lateral máxima (m/s²) — límite físico de la maniobra. */
  maxAccel: number;
  maneuverParams?: ManeuverParams;
}

export interface MissileConfig {
  /** Posición inicial (m). */
  position: Vec3;
  /** Velocidad inicial (m/s). */
  velocity: Vec3;
  guidanceLaw: GuidanceLaw;
  /** N — constante de navegación (solo se usa con "proportional_nav"), típico 3–5. */
  navConstant: number;
  /** Aceleración lateral máxima (m/s²). */
  maxAccel: number;
}

export interface SimulationParams {
  /** Paso de tiempo (s), p. ej. 0.02. */
  dt: number;
  /** Tiempo máximo de simulación (s). */
  maxTime: number;
  /** Distancia de intercepción (m): si R ≤ hitRadius, hubo impacto. */
  hitRadius: number;
  integrator: Integrator;
}

export interface SimulationConfig {
  aircraft: AircraftConfig;
  missile: MissileConfig;
  simulation: SimulationParams;
}

// ───────────────────────────────────────────────────────────────────────────
// SALIDA — SimulationResult
// ───────────────────────────────────────────────────────────────────────────

/** Trayectoria de un cuerpo, muestreada en cada instante. */
export interface BodyTrajectory {
  /** Posición en cada instante (m). */
  position: Vec3[];
  /** Velocidad en cada instante (m/s). */
  velocity: Vec3[];
  /** Rapidez |v| en cada instante (m/s). */
  speed: number[];
}

/** Como BodyTrajectory, más la aceleración que comandó el guiado. */
export interface MissileTrajectory extends BodyTrajectory {
  /** Magnitud de la aceleración lateral comandada en cada instante (m/s²). */
  accelCommand: number[];
}

export interface SimulationOutcome {
  intercepted: boolean;
  /** Instante de intercepción (s), o null si no hubo. */
  interceptTime: number | null;
  /** Distancia mínima alcanzada en toda la corrida (m). */
  minDistance: number;
  /** Instante en que se dio la distancia mínima (s). */
  minDistanceTime: number;
}

export interface SimulationMetadata {
  /** La config exacta con la que se generó este resultado. */
  config: SimulationConfig;
  /** Cantidad de instantes (= time.length). */
  steps: number;
  integrator: Integrator;
}

export interface SimulationResult {
  /** [t0, t1, ...] en segundos. */
  time: number[];

  aircraft: BodyTrajectory;
  missile: MissileTrajectory;

  // Geometría del encuentro (alimentan sobre todo al Gráfico 3).
  /** R = |r_A − r_M| en cada instante (m). */
  distance: number[];
  /** Velocidad de aproximación V_c en cada instante (m/s); positiva al acercarse. */
  closingVelocity: number[];
  /** Ángulo de la línea de visión (rad), útil en 2D. */
  losAngle: number[];

  outcome: SimulationOutcome;
  metadata: SimulationMetadata;
}

// ───────────────────────────────────────────────────────────────────────────
// FUNCIONES QUE EXPONEN LOS GRUPOS
// ───────────────────────────────────────────────────────────────────────────

/** Autovalores y veredicto de estabilidad del caso linealizado (pestaña teórica). */
export interface StabilityResult {
  eigenvalues: { re: number; im: number }[];
  isStable: boolean;
  navConstant: number;
}

/**
 * Grupo 2 — función principal. Determinista: misma config → mismo resultado.
 * Implementación en /src/simulation/index.ts
 */
export type SimulateFn = (config: SimulationConfig) => SimulationResult;

/** Grupo 2 — opcional, para la pestaña teórica del Grupo 6. */
export type AnalyzeStabilityFn = (config: SimulationConfig) => StabilityResult;

/**
 * Grupos 4 y 5 — props que recibe CADA uno de los tres gráficos:
 *   <GridView2D   result={...} currentFrame={...} />   (Gráfico 1)
 *   <Trajectory3D result={...} currentFrame={...} />   (Gráfico 2)
 *   <DistancePlot result={...} currentFrame={...} />   (Gráfico 3)
 */
export interface GraphProps {
  result: SimulationResult;
  /** Índice del instante a mostrar (de 0 a result.time.length − 1). */
  currentFrame: number;
}
