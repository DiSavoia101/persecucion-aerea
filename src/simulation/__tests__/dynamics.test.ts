/**
 * Tests unitarios para dynamics.ts
 * Verifica que la función de derivadas integra correctamente guiado y maniobra
 */

import { describe, it, expect } from "vitest";
import { systemDerivatives } from "../dynamics";
import type { SimulationConfig } from "../../shared/types";

describe("Función de Derivadas del Sistema (dynamics)", () => {
  const createConfig = (overrides?: Partial<SimulationConfig>): SimulationConfig => ({
    aircraft: {
      position: [0, 0, 0],
      velocity: [100, 0, 0],
      maneuver: "straight",
      maxAccel: 90,
      maneuverParams: undefined,
    },
    missile: {
      position: [200, 100, 0],
      velocity: [-50, -50, 0],
      guidanceLaw: "proportional_nav",
      navConstant: 4,
      maxAccel: 300,
    },
    simulation: {
      dt: 0.01,
      maxTime: 10,
      hitRadius: 15,
      integrator: "rk4",
    },
    ...overrides,
  });

  /**
   * Estructura del estado y derivada
   */
  describe("Estructura del sistema", () => {
    it("Derivada tiene 12 componentes (igual que estado)", () => {
      const config = createConfig();
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      expect(derivs).toHaveLength(12);
    });

    it("Primeras 6 componentes son [v_A, a_A]", () => {
      const config = createConfig({
        aircraft: {
          position: [0, 0, 0],
          velocity: [100, 50, 0],
          maneuver: "straight",
          maxAccel: 90,
        },
        missile: {
          position: [200, 100, 0],
          velocity: [-50, -50, 0],
          guidanceLaw: "proportional_nav",
          navConstant: 4,
          maxAccel: 300,
        },
      });
      const state = [0, 0, 0, 100, 50, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      // dr_A/dt = v_A
      expect(derivs[0]).toBe(100);
      expect(derivs[1]).toBe(50);
      expect(derivs[2]).toBe(0);
      // dv_A/dt = a_A (para straight, a_A = [0,0,0])
      expect(derivs[3]).toBe(0);
      expect(derivs[4]).toBe(0);
      expect(derivs[5]).toBe(0);
    });

    it("Últimas 6 componentes son [v_M, a_M]", () => {
      const config = createConfig({
        aircraft: { position: [0, 0, 0], velocity: [0, 0, 0], maneuver: "straight", maxAccel: 90 },
        missile: { position: [200, 100, 0], velocity: [-50, -50, 0], guidanceLaw: "proportional_nav", navConstant: 4, maxAccel: 300 },
      });
      const state = [0, 0, 0, 0, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      // dr_M/dt = v_M
      expect(derivs[6]).toBe(-50);
      expect(derivs[7]).toBe(-50);
      expect(derivs[8]).toBe(0);
    });
  });

  /**
   * Impacto de la maniobra en la derivada
   */
  describe("Efecto de maniobra del avión", () => {
    it("Straight produce a_A = [0,0,0]", () => {
      const config = createConfig({
        aircraft: { position: [0, 0, 0], velocity: [100, 0, 0], maneuver: "straight", maxAccel: 90 },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      expect(derivs[3]).toBe(0);
      expect(derivs[4]).toBe(0);
      expect(derivs[5]).toBe(0);
    });

    it("Constant turn produce a_A ≠ [0,0,0]", () => {
      const config = createConfig({
        aircraft: {
          position: [0, 0, 0],
          velocity: [100, 0, 0],
          maneuver: "constant_turn",
          maxAccel: 90,
          maneuverParams: { turnRate: 0.5 },
        },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      // La aceleración debe ser distinta de cero
      const accelMag = Math.sqrt(derivs[3] ** 2 + derivs[4] ** 2 + derivs[5] ** 2);
      expect(accelMag).toBeGreaterThan(0);
    });

    it("Weave depende del tiempo", () => {
      const config = createConfig({
        aircraft: {
          position: [0, 0, 0],
          velocity: [100, 0, 0],
          maneuver: "weave",
          maxAccel: 90,
          maneuverParams: { weaveAmp: 50, weaveFreq: 1.0 },
        },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];

      const derivs_t0 = systemDerivatives(state, config, 0);
      const derivs_t_pi2 = systemDerivatives(state, config, Math.PI / 2);

      // Las aceleraciones deben ser diferentes
      const accelMag_0 = Math.sqrt(
        derivs_t0[3] ** 2 + derivs_t0[4] ** 2 + derivs_t0[5] ** 2
      );
      const accelMag_pi2 = Math.sqrt(
        derivs_t_pi2[3] ** 2 + derivs_t_pi2[4] ** 2 + derivs_t_pi2[5] ** 2
      );

      expect(accelMag_pi2).toBeGreaterThan(accelMag_0 * 2);
    });
  });

  /**
   * Impacto de la ley de guiado en la derivada
   */
  describe("Efecto de ley de guiado del misil", () => {
    it("Pure Pursuit produce aceleración del misil", () => {
      const config = createConfig({
        missile: {
          position: [200, 100, 0],
          velocity: [-50, -50, 0],
          guidanceLaw: "pure_pursuit",
          navConstant: 4,
          maxAccel: 300,
        },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      const accelMag = Math.sqrt(derivs[9] ** 2 + derivs[10] ** 2 + derivs[11] ** 2);
      expect(accelMag).toBeGreaterThan(0);
    });

    it("Proportional Nav produce aceleración del misil", () => {
      const config = createConfig({
        missile: {
          position: [200, 100, 0],
          velocity: [-50, -50, 0],
          guidanceLaw: "proportional_nav",
          navConstant: 4,
          maxAccel: 300,
        },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      const accelMag = Math.sqrt(derivs[9] ** 2 + derivs[10] ** 2 + derivs[11] ** 2);
      expect(accelMag).toBeGreaterThan(0);
    });

    it("Distinto navConstant produce distinto resultado", () => {
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];

      const config_N3 = createConfig({
        missile: {
          position: [200, 100, 0],
          velocity: [-50, -50, 0],
          guidanceLaw: "proportional_nav",
          navConstant: 3,
          maxAccel: 300,
        },
      });
      const config_N5 = createConfig({
        missile: {
          position: [200, 100, 0],
          velocity: [-50, -50, 0],
          guidanceLaw: "proportional_nav",
          navConstant: 5,
          maxAccel: 300,
        },
      });

      const derivs_N3 = systemDerivatives(state, config_N3, 0);
      const derivs_N5 = systemDerivatives(state, config_N5, 0);

      const accelMag_N3 = Math.sqrt(
        derivs_N3[9] ** 2 + derivs_N3[10] ** 2 + derivs_N3[11] ** 2
      );
      const accelMag_N5 = Math.sqrt(
        derivs_N5[9] ** 2 + derivs_N5[10] ** 2 + derivs_N5[11] ** 2
      );

      expect(accelMag_N5).toBeGreaterThan(accelMag_N3);
    });
  });

  /**
   * Velocidades en la derivada
   */
  describe("Velocidades en la derivada", () => {
    it("dr/dt = v (avión)", () => {
      const config = createConfig();
      const state = [10, 20, 30, 100, 50, 25, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      expect(derivs[0]).toBe(100);
      expect(derivs[1]).toBe(50);
      expect(derivs[2]).toBe(25);
    });

    it("dr/dt = v (misil)", () => {
      const config = createConfig();
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -30, -40, -50];
      const derivs = systemDerivatives(state, config, 0);

      expect(derivs[6]).toBe(-30);
      expect(derivs[7]).toBe(-40);
      expect(derivs[8]).toBe(-50);
    });
  });

  /**
   * Aceleraciones respetan límites
   */
  describe("Límites de aceleración", () => {
    it("Aceleración del avión respeta maxAccel", () => {
      const maxAccel = 50;
      const config = createConfig({
        aircraft: {
          position: [0, 0, 0],
          velocity: [100, 0, 0],
          maneuver: "constant_turn",
          maxAccel,
          maneuverParams: { turnRate: 10 }, // Intentar exceder límite
        },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      const accelMag = Math.sqrt(derivs[3] ** 2 + derivs[4] ** 2 + derivs[5] ** 2);
      expect(accelMag).toBeLessThanOrEqual(maxAccel + 1e-6);
    });

    it("Aceleración del misil respeta maxAccel", () => {
      const maxAccel = 100;
      const config = createConfig({
        missile: {
          position: [200, 100, 0],
          velocity: [-50, -50, 0],
          guidanceLaw: "proportional_nav",
          navConstant: 20, // Intentar exceder límite
          maxAccel,
        },
      });
      const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      const accelMag = Math.sqrt(derivs[9] ** 2 + derivs[10] ** 2 + derivs[11] ** 2);
      expect(accelMag).toBeLessThanOrEqual(maxAccel + 1e-6);
    });
  });

  /**
   * Caso 3D
   */
  describe("Funcionamiento en 3D", () => {
    it("Maneja z ≠ 0 correctamente", () => {
      const config = createConfig({
        aircraft: {
          position: [0, 0, 100],
          velocity: [100, 0, 50],
          maneuver: "straight",
          maxAccel: 90,
        },
        missile: {
          position: [200, 100, 80],
          velocity: [-50, -50, 0],
          guidanceLaw: "proportional_nav",
          navConstant: 4,
          maxAccel: 300,
        },
      });
      const state = [0, 0, 100, 100, 0, 50, 200, 100, 80, -50, -50, 0];
      const derivs = systemDerivatives(state, config, 0);

      // Debe retornar 12 componentes válidas
      expect(derivs).toHaveLength(12);
      expect(derivs[2]).toBe(50); // dz_A/dt = vz_A
      expect(derivs[8]).toBe(0);  // dz_M/dt = vz_M
    });
  });
});
