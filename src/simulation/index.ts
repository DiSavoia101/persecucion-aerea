/**
 * Grupo 2 — Backend lógico.
 * Exportar: simulate(config), analyzeStability(config) (opcional).
 */

import type {
  SimulationConfig,
  SimulationResult,
  Vec3,
  StabilityResult,
} from "../shared/types";
import { systemDerivatives } from "./dynamics";
import { rk4Step, eulerStep } from "./integrators";

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const asVec3 = (arr: number[], offset: number): Vec3 => [
  arr[offset],
  arr[offset + 1],
  arr[offset + 2],
];

const norm = (v: Vec3): number =>
  Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

const dot = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Calcula geometría del encuentro a partir del estado actual.
 */
interface GeometrySnapshot {
  distance: number;
  closingVelocity: number;
  losAngle: number;
}

function computeGeometry(
  rA: Vec3,
  vA: Vec3,
  rM: Vec3,
  vM: Vec3
): GeometrySnapshot {
  const r = [rA[0] - rM[0], rA[1] - rM[1], rA[2] - rM[2]] as Vec3; // vector relativo
  const distance = norm(r);

  const v_rel = [vA[0] - vM[0], vA[1] - vM[1], vA[2] - vM[2]] as Vec3;
  const closingVelocity = distance > 1e-6 ? -dot(v_rel, r) / distance : 0;

  // LOS angle en 2D (solo si z = 0)
  const losAngle = Math.atan2(r[1], r[0]);

  return { distance, closingVelocity, losAngle };
}

// ───────────────────────────────────────────────────────────────────────────
// Función principal: simulate
// ───────────────────────────────────────────────────────────────────────────

/**
 * Simula la persecución avión-misil bajo la configuración dada.
 * Retorna un SimulationResult con todas las trayectorias y datos de encuentro.
 */
export function simulate(config: SimulationConfig): SimulationResult {
  const { aircraft, missile, simulation } = config;

  // Estado inicial: [rA, vA, rM, vM] aplanado
  const initialState: number[] = [
    ...aircraft.position,
    ...aircraft.velocity,
    ...missile.position,
    ...missile.velocity,
  ];

  // Selecciona el integrador
  const integrator =
    simulation.integrator === "rk4" ? rk4Step : eulerStep;

  // Arreglos de salida
  const time: number[] = [];
  const aircraftPositions: Vec3[] = [];
  const aircraftVelocities: Vec3[] = [];
  const aircraftSpeeds: number[] = [];
  const missilePositions: Vec3[] = [];
  const missileVelocities: Vec3[] = [];
  const missileSpeeds: number[] = [];
  const missileAccelCommands: number[] = [];
  const distances: number[] = [];
  const closingVelocities: number[] = [];
  const losAngles: number[] = [];

  let state = initialState;
  let t = 0;
  let intercepted = false;
  let interceptTime: number | null = null;
  let minDistance = Infinity;
  let minDistanceTime = 0;

  // Bucle de integración
  while (t <= simulation.maxTime) {
    // Extrae posiciones y velocidades
    const rA = asVec3(state, 0);
    const vA = asVec3(state, 3);
    const rM = asVec3(state, 6);
    const vM = asVec3(state, 9);

    // Calcula geometría
    const { distance, closingVelocity, losAngle } = computeGeometry(
      rA,
      vA,
      rM,
      vM
    );

    // Guarda snapshots
    time.push(t);
    aircraftPositions.push([rA[0], rA[1], rA[2]]);
    aircraftVelocities.push([vA[0], vA[1], vA[2]]);
    aircraftSpeeds.push(norm(vA));
    missilePositions.push([rM[0], rM[1], rM[2]]);
    missileVelocities.push([vM[0], vM[1], vM[2]]);
    missileSpeeds.push(norm(vM));
    distances.push(distance);
    closingVelocities.push(closingVelocity);
    losAngles.push(losAngle);

    // Calcula aceleración comandada del misil (para gráfico)
    const derivs = systemDerivatives(state, config, t);
    const aMagnitude = Math.sqrt(
      derivs[9] ** 2 + derivs[10] ** 2 + derivs[11] ** 2
    );
    missileAccelCommands.push(aMagnitude);

    // Actualiza mínima distancia
    if (distance < minDistance) {
      minDistance = distance;
      minDistanceTime = t;
    }

    // Verifica intercepción
    if (distance <= simulation.hitRadius && !intercepted) {
      intercepted = true;
      interceptTime = t;
    }

    // Condición de parada
    if (intercepted || t >= simulation.maxTime) {
      break;
    }

    // Próximo paso
    const derivsFn = (s: number[]) => systemDerivatives(s, config, t);
    state = integrator(state, derivsFn, simulation.dt);
    t += simulation.dt;
  }

  // Construye el resultado
  const result: SimulationResult = {
    time,
    aircraft: {
      position: aircraftPositions,
      velocity: aircraftVelocities,
      speed: aircraftSpeeds,
    },
    missile: {
      position: missilePositions,
      velocity: missileVelocities,
      speed: missileSpeeds,
      accelCommand: missileAccelCommands,
    },
    distance: distances,
    closingVelocity: closingVelocities,
    losAngle: losAngles,
    outcome: {
      intercepted,
      interceptTime,
      minDistance,
      minDistanceTime,
    },
    metadata: {
      config,
      steps: time.length,
      integrator: simulation.integrator,
    },
  };

  return result;
}

// ───────────────────────────────────────────────────────────────────────────
// Opcional: analyzeStability (para la pestaña teórica del Grupo 6)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Analiza la estabilidad del sistema linealizado (opcional para la pestaña teórica).
 * Por simplicidad, devuelve un resultado dummy; el Grupo 6 puede expandir esto.
 */
export function analyzeStability(config: SimulationConfig): StabilityResult {
  // Stub: en una implementación completa, calcularía autovalores de la matriz A
  // del sistema linealizado alrededor del triángulo de colisión nominal.
  // Por ahora, devolvemos un resultado didáctico.

  const N = config.missile.navConstant;
  const isStable = N >= 3; // PN es estable si N >= 3 (criterio clásico)

  return {
    eigenvalues: [
      { re: -N / 2, im: Math.sqrt(Math.max(0, N ** 2 / 4 - N)) },
      { re: -N / 2, im: -Math.sqrt(Math.max(0, N ** 2 / 4 - N)) },
    ],
    isStable,
    navConstant: N,
  };
}
