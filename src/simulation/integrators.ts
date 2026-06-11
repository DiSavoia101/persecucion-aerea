/**
 * Grupo 2 — Integradores numéricos (rk4Step, eulerStep).
 */

export type Vec3 = [number, number, number];

/** Sistema de EDO: dx/dt = f(x). */
export type DerivativeFn = (state: number[]) => number[];

/**
 * Un paso de Euler: x(t+dt) ≈ x(t) + dt * f(x(t))
 */
export function eulerStep(
  state: number[],
  derivativeFn: DerivativeFn,
  dt: number
): number[] {
  const k1 = derivativeFn(state);
  return state.map((x, i) => x + dt * k1[i]);
}

/**
 * Un paso de Runge-Kutta de 4º orden.
 * x(t+dt) ≈ x(t) + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
 */
export function rk4Step(
  state: number[],
  derivativeFn: DerivativeFn,
  dt: number
): number[] {
  const k1 = derivativeFn(state);

  const state2 = state.map((x, i) => x + (dt / 2) * k1[i]);
  const k2 = derivativeFn(state2);

  const state3 = state.map((x, i) => x + (dt / 2) * k2[i]);
  const k3 = derivativeFn(state3);

  const state4 = state.map((x, i) => x + dt * k3[i]);
  const k4 = derivativeFn(state4);

  return state.map((x, i) => x + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
