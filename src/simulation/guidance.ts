/**
 * Grupo 2 — Leyes de guiado del misil (persecución pura, navegación proporcional).
 */

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
 * v_perp = v - (v·u / u·u) * u
 */
const perpComponent = (v: Vec3, u: Vec3): Vec3 => {
  const scale_factor = dot(v, u) / dot(u, u);
  return sub(v, scale([u[0], u[1], u[2]], scale_factor));
};

/**
 * Velocidad de rotación de la línea de visión: ω_LOS = (r × v_rel) / R²
 * Donde r es el vector relativo y v_rel es la velocidad relativa.
 * Fórmula de la especificación (sección 3.2 y 3.5).
 */
function computeLOSRateVector(
  rA: Vec3, // posición del avión
  vA: Vec3, // velocidad del avión
  rM: Vec3, // posición del misil
  vM: Vec3  // velocidad del misil
): Vec3 {
  const r = sub(rA, rM); // vector relativo (del misil hacia el avión)
  const R2 = dot(r, r); // R² = r·r

  if (R2 < 1e-12) {
    return [0, 0, 0];
  }

  const v_rel = sub(vA, vM); // velocidad relativa

  // ω_LOS = (r × v_rel) / R²
  // Según especificación sección 3.2 y 3.5
  const cross_r_vrel = cross(r, v_rel);
  return scale(cross_r_vrel, 1 / R2);
}

// ───────────────────────────────────────────────────────────────────────────
// Leyes de guiado
// ───────────────────────────────────────────────────────────────────────────

/**
 * Persecución pura: el misil siempre apunta su velocidad hacia la posición actual del avión.
 * a_M = K_p * (v_M_perp)_perp
 * donde K_p es la ganancia de viraje.
 *
 * Retorna [ax, ay, az] de la aceleración del misil.
 */
export function missileAccelPurePursuit(
  rA: Vec3, // posición del avión
  vA: Vec3, // velocidad del avión
  rM: Vec3, // posición del misil
  vM: Vec3, // velocidad del misil
  gainTurn: number = 1.0,
  maxAccel: number = 300
): Vec3 {
  const toTarget = sub(rA, rM); // dirección deseada
  const vM_norm = norm(vM);

  if (vM_norm < 1e-6) {
    return [0, 0, 0];
  }

  // Queremos que el misil gire su velocidad hacia toTarget
  // Aceleración lateral perpendicular a vM
  const accel_lateral = perpComponent(toTarget, vM);
  const accel_lateral_norm = norm(accel_lateral);

  if (accel_lateral_norm < 1e-6) {
    return [0, 0, 0];
  }

  const accel_unscaled = scale(accel_lateral, gainTurn / vM_norm);
  const accel_norm = norm(accel_unscaled);

  if (accel_norm > maxAccel) {
    return scale(accel_unscaled, maxAccel / accel_norm);
  }

  return accel_unscaled;
}

/**
 * Navegación proporcional (PN): el misil acelera proporcionalmente a la velocidad de rotación de la LOS.
 * a_M = N * (ω_LOS × v_M)
 * donde N es la constante de navegación (típicamente 3–5).
 *
 * Retorna [ax, ay, az] de la aceleración del misil.
 */
export function missileAccelProportionalNav(
  rA: Vec3, // posición del avión
  vA: Vec3, // velocidad del avión
  rM: Vec3, // posición del misil
  vM: Vec3, // velocidad del misil
  navConstant: number = 4,
  maxAccel: number = 300
): Vec3 {
  const omegaLOS = computeLOSRateVector(rA, vA, rM, vM);
  const accel_unscaled = scale(cross(omegaLOS, vM), navConstant);
  const accel_norm = norm(accel_unscaled);

  if (accel_norm > maxAccel) {
    return scale(accel_unscaled, maxAccel / accel_norm);
  }

  return accel_unscaled;
}
