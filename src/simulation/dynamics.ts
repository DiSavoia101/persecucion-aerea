/**
 * Grupo 2 — Función de derivadas del sistema (f).
 *
 * El estado es un arreglo de 12 números:
 * [rA_x, rA_y, rA_z, vA_x, vA_y, vA_z, rM_x, rM_y, rM_z, vM_x, vM_y, vM_z]
 * = [r_A, v_A, r_M, v_M] en forma aplanada
 */

import type { SimulationConfig } from "../shared/types";
import { missileAccelPurePursuit, missileAccelProportionalNav } from "./guidance";
import { aircraftAcceleration } from "./maneuvers";

export type Vec3 = [number, number, number];

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const asVec3 = (arr: number[], offset: number): Vec3 => [
  arr[offset],
  arr[offset + 1],
  arr[offset + 2],
];

/**
 * Función de derivadas del sistema dinámico completo.
 *
 * @param state Vector de estado aplanado [rA, vA, rM, vM]
 * @param config Configuración de la simulación
 * @param t Tiempo actual (para maniobras que dependan del tiempo, como weave)
 * @returns Array de derivadas
 */
export function systemDerivatives(
  state: number[],
  config: SimulationConfig,
  t: number
): number[] {
  const rA = asVec3(state, 0);
  const vA = asVec3(state, 3);
  const rM = asVec3(state, 6);
  const vM = asVec3(state, 9);

  // Aceleración del avión
  const aA = aircraftAcceleration(
    config.aircraft.maneuver,
    config.aircraft.maneuverParams,
    vA,
    rA,
    rM,
    t,
    config.aircraft.maxAccel
  );

  // Aceleración del misil (según su ley de guiado)
  let aM: Vec3;
  if (config.missile.guidanceLaw === "pure_pursuit") {
    aM = missileAccelPurePursuit(rA, vA, rM, vM, 1.0, config.missile.maxAccel);
  } else if (config.missile.guidanceLaw === "proportional_nav") {
    aM = missileAccelProportionalNav(rA, vA, rM, vM, config.missile.navConstant, config.missile.maxAccel);
  } else {
    aM = [0, 0, 0];
  }

  // d/dt [r_A, v_A, r_M, v_M] = [v_A, a_A, v_M, a_M]
  return [
    vA[0], vA[1], vA[2],           // dr_A/dt = v_A
    aA[0], aA[1], aA[2],           // dv_A/dt = a_A
    vM[0], vM[1], vM[2],           // dr_M/dt = v_M
    aM[0], aM[1], aM[2],           // dv_M/dt = a_M
  ];
}

