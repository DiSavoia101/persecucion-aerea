/**
 * Tests unitarios para integrators.ts
 * Verifica que Euler y RK4 resuelven correctamente EDOs simples
 */

import { describe, it, expect } from "vitest";
import { eulerStep, rk4Step } from "../integrators";

describe("Integradores Numéricos", () => {
  /**
   * Caso simple: dx/dt = -x (decaimiento exponencial)
   * Solución exacta: x(t) = x₀ * e^(-t)
   */
  describe("Decaimiento exponencial: dx/dt = -x", () => {
    const derivativeFn = (state: number[]) => [state[0] * -1];
    const dt = 0.01;
    const x0 = 1.0;
    const expectedAtT1 = Math.exp(-1); // ≈ 0.368

    it("Euler: aproxima solución exponencial", () => {
      let state = [x0];
      for (let i = 0; i < 100; i++) {
        state = eulerStep(state, derivativeFn, dt);
      }
      // Euler es menos preciso; permitimos error ~5%
      expect(state[0]).toBeCloseTo(expectedAtT1, 1);
    });

    it("RK4: aproxima solución exponencial con mayor precisión", () => {
      let state = [x0];
      for (let i = 0; i < 100; i++) {
        state = rk4Step(state, derivativeFn, dt);
      }
      // RK4 es muy preciso; esperamos error < 0.1%
      expect(state[0]).toBeCloseTo(expectedAtT1, 3);
    });
  });

  /**
   * Caso armónico: d²x/dt² = -x
   * Estado: [x, v], derivada: [v, -x]
   * Solución: x(t) = cos(t), v(t) = -sin(t)
   */
  describe("Oscilador armónico: d²x/dt² = -x", () => {
    const derivativeFn = (state: number[]) => [state[1], -state[0]];
    const dt = 0.01;

    it("Euler: mantiene aproximadamente la energía", () => {
      let state = [1, 0]; // x=1, v=0
      const energyHistory = [];
      for (let i = 0; i < 200; i++) {
        const energy = state[0] ** 2 + state[1] ** 2;
        energyHistory.push(energy);
        state = eulerStep(state, derivativeFn, dt);
      }
      // La energía inicial debe ser ~1
      expect(energyHistory[0]).toBeCloseTo(1, 1);
      // Euler pierde energía gradualmente (error aceptable)
      expect(energyHistory[energyHistory.length - 1]).toBeLessThan(1.1);
      expect(energyHistory[energyHistory.length - 1]).toBeGreaterThan(0.95);
    });

    it("RK4: conserva la energía mucho mejor", () => {
      let state = [1, 0]; // x=1, v=0
      const energyHistory = [];
      for (let i = 0; i < 200; i++) {
        const energy = state[0] ** 2 + state[1] ** 2;
        energyHistory.push(energy);
        state = rk4Step(state, derivativeFn, dt);
      }
      // La energía inicial debe ser ~1
      expect(energyHistory[0]).toBeCloseTo(1, 3);
      // RK4 conserva energía muy bien
      expect(energyHistory[energyHistory.length - 1]).toBeCloseTo(1, 2);
    });
  });

  /**
   * Caso multidimensional: movimiento rectilíneo
   * Estado: [x, y, z, vx, vy, vz]
   * Derivada: [vx, vy, vz, 0, 0, 0] (velocidad constante)
   */
  describe("Movimiento rectilíneo uniforme", () => {
    const state = [0, 0, 0, 10, 5, 0]; // pos (0,0,0), vel (10,5,0)
    const derivativeFn = (s: number[]) => [s[3], s[4], s[5], 0, 0, 0];
    const dt = 0.1;
    const steps = 10; // dt*steps = 1.0 segundo

    it("Euler: calcula posición correcta", () => {
      let s = state;
      for (let i = 0; i < steps; i++) {
        s = eulerStep(s, derivativeFn, dt);
      }
      expect(s[0]).toBeCloseTo(10, 0); // x = 10 * 1.0
      expect(s[1]).toBeCloseTo(5, 0);  // y = 5 * 1.0
      expect(s[2]).toBeCloseTo(0, 0);  // z = 0
      expect(s[3]).toBeCloseTo(10, 10); // vx permanece 10
    });

    it("RK4: calcula posición correcta", () => {
      let s = state;
      for (let i = 0; i < steps; i++) {
        s = rk4Step(s, derivativeFn, dt);
      }
      expect(s[0]).toBeCloseTo(10, 0);
      expect(s[1]).toBeCloseTo(5, 0);
      expect(s[2]).toBeCloseTo(0, 0);
      expect(s[3]).toBeCloseTo(10, 10);
    });
  });

  /**
   * RK4 debe ser más preciso que Euler
   */
  it("RK4 es más preciso que Euler para el mismo dt", () => {
    const derivativeFn = (state: number[]) => [-state[0]];
    const dt = 0.1;
    const target = Math.exp(-1);

    let stateEuler = [1];
    let stateRK4 = [1];

    for (let i = 0; i < 10; i++) {
      stateEuler = eulerStep(stateEuler, derivativeFn, dt);
      stateRK4 = rk4Step(stateRK4, derivativeFn, dt);
    }

    const errorEuler = Math.abs(stateEuler[0] - target);
    const errorRK4 = Math.abs(stateRK4[0] - target);

    expect(errorRK4).toBeLessThan(errorEuler);
  });
});
