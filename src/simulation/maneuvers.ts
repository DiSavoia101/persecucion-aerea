/**
 * Grupo 2 — Maniobras de evasión del avión.
 */

import type { ManeuverType, ManeuverParams } from "../shared/types";

export type Vec3 = [number, number, number];

// ───────────────────────────────────────────────────────────────────────────
// Helpers vectoriales
// ───────────────────────────────────────────────────────────────────────────

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const norm = (a: Vec3): number => Math.sqrt(dot(a, a));

/**
 * Componente perpendicular de `v` respecto a `u`.
 */
const perpComponent = (v: Vec3, u: Vec3): Vec3 => {
  if (norm(u) < 1e-6) return [0, 0, 0];
  const scale_factor = dot(v, u) / dot(u, u);
  return sub(v, scale(u, scale_factor));
};

// ───────────────────────────────────────────────────────────────────────────
// Maniobras de evasión
// ───────────────────────────────────────────────────────────────────────────

/**
 * Calcula la aceleración del avión según su maniobra de evasión.
 *
 * @param maneuver Tipo de maniobra
 * @param params Parámetros opcionales de la maniobra
 * @param vA Velocidad actual del avión
 * @param rA Posición actual del avión
 * @param rM Posición actual del misil
 * @param t Tiempo actual
 * @param maxAccel Aceleración lateral máxima (límite físico)
 * @returns [ax, ay, az]
 */
export function aircraftAcceleration(
  maneuver: ManeuverType,
  params: ManeuverParams | undefined,
  vA: Vec3,
  rA: Vec3,
  rM: Vec3,
  t: number,
  maxAccel: number
): Vec3 {
  const vA_norm = norm(vA);

  switch (maneuver) {
    case "straight":
      // Sin maniobra: aceleración nula
      return [0, 0, 0];

    case "constant_turn": {
      // Viraje constante: |a| = fijo, perpendicular a vA, hacia una dirección fija.
      // Simplificación: usa la aceleración máxima en la dirección perpendicular a vA.
      const turnRate = params?.turnRate ?? 0.5; // rad/s, velocidad de giro
      const a_magnitude = Math.min(vA_norm * turnRate, maxAccel);

      if (vA_norm < 1e-6) {
        return [0, 0, 0];
      }

      // Crea una aceleración lateral perpendicular a vA que causa rotación.
      // Usa un vector auxiliar perpendicular para la maniobra.
      let aux: Vec3;
      if (Math.abs(vA[2]) < 0.9 * vA_norm) {
        // vA no es principalmente vertical; podemos usar z
        aux = [vA[1], -vA[0], 0];
      } else {
        // vA es principalmente vertical; usa x
        aux = [0, vA[2], -vA[1]];
      }

      const aux_norm = norm(aux);
      if (aux_norm < 1e-6) {
        return [0, 0, 0];
      }

      return scale(aux, a_magnitude / aux_norm);
    }

    case "weave": {
      // Serpenteo: aceleración lateral senoidal perpendicular a vA.
      const weaveAmp = params?.weaveAmp ?? 50; // m/s²
      const weaveFreq = params?.weaveFreq ?? 1; // rad/s

      const a_magnitude = weaveAmp * Math.sin(weaveFreq * t);

      if (vA_norm < 1e-6) {
        return [0, 0, 0];
      }

      // Vector auxiliar perpendicular a vA
      let aux: Vec3;
      if (Math.abs(vA[2]) < 0.9 * vA_norm) {
        aux = [vA[1], -vA[0], 0];
      } else {
        aux = [0, vA[2], -vA[1]];
      }

      const aux_norm = norm(aux);
      if (aux_norm < 1e-6) {
        return [0, 0, 0];
      }

      const base_accel = scale(aux, a_magnitude / aux_norm);
      const base_norm = norm(base_accel);

      if (base_norm > maxAccel) {
        return scale(base_accel, maxAccel / base_norm);
      }

      return base_accel;
    }

    case "reactive_evade": {
      // Evasión reactiva: acelera perpendicular a vA, en la dirección que aumenta el rango.
      // r = rA - rM (vector del misil al avión)
      const r = sub(rA, rM);
      const r_norm = norm(r);

      if (r_norm < 1e-6 || vA_norm < 1e-6) {
        return [0, 0, 0];
      }

      // Queremos acelerar en dirección perpendicular a vA pero que aumente r
      // Es decir: a · r > 0 y a ⊥ vA

      // Método: proyecta r en el espacio perpendicular a vA
      const r_perp = perpComponent(r, vA);
      const r_perp_norm = norm(r_perp);

      if (r_perp_norm < 1e-6) {
        // r es paralelo a vA; elige cualquier dirección perpendicular
        let aux: Vec3;
        if (Math.abs(vA[2]) < 0.9 * vA_norm) {
          aux = [vA[1], -vA[0], 0];
        } else {
          aux = [0, vA[2], -vA[1]];
        }
        const aux_norm = norm(aux);
        return scale(aux, maxAccel / aux_norm);
      }

      // Normaliza y aplica el máximo
      return scale(r_perp, maxAccel / r_perp_norm);
    }

    default:
      return [0, 0, 0];
  }
}
