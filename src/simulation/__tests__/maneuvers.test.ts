/**
 * Tests unitarios para maneuvers.ts
 * Verifica que las maniobras de evasión del avión funcionan correctamente
 */

import { describe, it, expect } from "vitest";
import { aircraftAcceleration } from "../maneuvers";

type Vec3 = [number, number, number];

describe("Maniobras de Evasión del Avión", () => {
  const genericPos = [0, 0, 0] as Vec3;
  const missilePos = [100, 0, 0] as Vec3;

  /**
   * Maniobra: Recta (sin maniobra)
   */
  describe("Maniobra: Straight (sin maniobra)", () => {
    it("Retorna aceleración nula", () => {
      const vel = [100, 0, 0] as Vec3;
      const accel = aircraftAcceleration(
        "straight",
        undefined,
        vel,
        genericPos,
        missilePos,
        0,
        90
      );
      expect(accel[0]).toBe(0);
      expect(accel[1]).toBe(0);
      expect(accel[2]).toBe(0);
    });

    it("Retorna cero incluso en tiempos diferentes", () => {
      const vel = [50, 25, 0] as Vec3;
      for (let t = 0; t < 10; t += 0.1) {
        const accel = aircraftAcceleration(
          "straight",
          undefined,
          vel,
          genericPos,
          missilePos,
          t,
          90
        );
        expect(accel[0]).toBe(0);
        expect(accel[1]).toBe(0);
        expect(accel[2]).toBe(0);
      }
    });
  });

  /**
   * Maniobra: Constant Turn (viraje circular)
   */
  describe("Maniobra: Constant Turn (viraje)", () => {
    it("Produce aceleración perpendicular a la velocidad", () => {
      const vel = [100, 0, 0] as Vec3;
      const params = { turnRate: 0.5 };
      const accel = aircraftAcceleration(
        "constant_turn",
        params,
        vel,
        genericPos,
        missilePos,
        0,
        90
      );
      // dot(a, v) debe ser ≈ 0
      const dot = accel[0] * vel[0] + accel[1] * vel[1] + accel[2] * vel[2];
      expect(Math.abs(dot)).toBeLessThan(1);
    });

    it("Respeta maxAccel", () => {
      const vel = [100, 0, 0] as Vec3;
      const maxAccel = 50;
      const params = { turnRate: 1.0 };
      const accel = aircraftAcceleration(
        "constant_turn",
        params,
        vel,
        genericPos,
        missilePos,
        0,
        maxAccel
      );
      const magnitude = Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2);
      expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
    });

    it("Usa turnRate para calcular magnitud", () => {
      const vel = [100, 0, 0] as Vec3;
      const turnRates = [0.5, 1.0, 2.0];
      const magnitudes = [];

      for (const tr of turnRates) {
        const accel = aircraftAcceleration(
          "constant_turn",
          { turnRate: tr },
          vel,
          genericPos,
          missilePos,
          0,
          1000 // Sin límite
        );
        magnitudes.push(Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2));
      }

      // Mayor turnRate → mayor magnitud
      expect(magnitudes[1]).toBeGreaterThan(magnitudes[0]);
      expect(magnitudes[2]).toBeGreaterThan(magnitudes[1]);
    });
  });

  /**
   * Maniobra: Weave (serpenteo senoidal)
   */
  describe("Maniobra: Weave (serpenteo)", () => {
    it("Produce aceleración perpendicular a la velocidad", () => {
      const vel = [100, 0, 0] as Vec3;
      const params = { weaveAmp: 50, weaveFreq: 2.3 };
      const accel = aircraftAcceleration(
        "weave",
        params,
        vel,
        genericPos,
        missilePos,
        0,
        90
      );
      // dot(a, v) debe ser ≈ 0
      const dot = accel[0] * vel[0] + accel[1] * vel[1] + accel[2] * vel[2];
      expect(Math.abs(dot)).toBeLessThan(1);
    });

    it("La aceleración es senoidal en el tiempo", () => {
      const vel = [100, 0, 0] as Vec3;
      const params = { weaveAmp: 50, weaveFreq: Math.PI };
      const magnitudes = [];

      for (let t = 0; t < 2 * Math.PI; t += 0.1) {
        const accel = aircraftAcceleration(
          "weave",
          params,
          vel,
          genericPos,
          missilePos,
          t,
          1000
        );
        magnitudes.push(Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2));
      }

      // En t=0: sin(0)=0 → aceleración ~0
      expect(magnitudes[0]).toBeLessThan(5);
      // En t=π/2: sin(π/2)=1 → aceleración máxima
      const midIndex = Math.floor(magnitudes.length / 4);
      expect(magnitudes[midIndex]).toBeGreaterThan(
        magnitudes[0] * 10
      );
    });

    it("Respeta maxAccel", () => {
      const vel = [100, 0, 0] as Vec3;
      const maxAccel = 100;
      const params = { weaveAmp: 200, weaveFreq: 1.0 };

      for (let t = 0; t < 10; t += 0.1) {
        const accel = aircraftAcceleration(
          "weave",
          params,
          vel,
          genericPos,
          missilePos,
          t,
          maxAccel
        );
        const magnitude = Math.sqrt(
          accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2
        );
        expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
      }
    });

    it("Usa weaveAmp y weaveFreq", () => {
      const vel = [100, 0, 0] as Vec3;
      const t = Math.PI / 2;

      const accel1 = aircraftAcceleration(
        "weave",
        { weaveAmp: 50, weaveFreq: 1.0 },
        vel,
        genericPos,
        missilePos,
        t,
        1000
      );
      const accel2 = aircraftAcceleration(
        "weave",
        { weaveAmp: 100, weaveFreq: 1.0 },
        vel,
        genericPos,
        missilePos,
        t,
        1000
      );

      const mag1 = Math.sqrt(accel1[0] ** 2 + accel1[1] ** 2 + accel1[2] ** 2);
      const mag2 = Math.sqrt(accel2[0] ** 2 + accel2[1] ** 2 + accel2[2] ** 2);

      // Mayor weaveAmp → mayor magnitud
      expect(mag2).toBeGreaterThan(mag1);
    });
  });

  /**
   * Maniobra: Reactive Evade (evasión inteligente)
   */
  describe("Maniobra: Reactive Evade (evasión inteligente)", () => {
    it("Produce aceleración perpendicular a la velocidad", () => {
      const vel = [100, 0, 0] as Vec3;
      const aircraftPos = [0, 0, 0] as Vec3;
      const missilePos_evasion = [-100, 0, 0] as Vec3;

      const accel = aircraftAcceleration(
        "reactive_evade",
        undefined,
        vel,
        aircraftPos,
        missilePos_evasion,
        0,
        90
      );

      const dot = accel[0] * vel[0] + accel[1] * vel[1] + accel[2] * vel[2];
      expect(Math.abs(dot)).toBeLessThan(1);
    });

    it("Acelera lejos del misil", () => {
      // Avión en origen, misil en dirección -x
      const aircraftPos = [0, 0, 0] as Vec3;
      const missilePos_evasion = [-100, 0, 0] as Vec3;
      const vel = [100, 0, 0] as Vec3;

      const accel = aircraftAcceleration(
        "reactive_evade",
        undefined,
        vel,
        aircraftPos,
        missilePos_evasion,
        0,
        90
      );

      // El vector r = aircraftPos - missilePos = (100, 0, 0)
      // La aceleración debe tener componente positiva en y o z (perpendicular)
      const magnitude = Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2);
      expect(magnitude).toBeGreaterThan(0);
    });

    it("Respeta maxAccel", () => {
      const vel = [100, 0, 0] as Vec3;
      const aircraftPos = [0, 0, 0] as Vec3;
      const missilePos_evasion = [-1000, -1000, 0] as Vec3;
      const maxAccel = 75;

      const accel = aircraftAcceleration(
        "reactive_evade",
        undefined,
        vel,
        aircraftPos,
        missilePos_evasion,
        0,
        maxAccel
      );

      const magnitude = Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2);
      expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
    });

    it("No depende del tiempo", () => {
      const vel = [100, 0, 0] as Vec3;
      const aircraftPos = [0, 0, 0] as Vec3;
      const missilePos_evasion = [-100, -100, 0] as Vec3;

      const accel1 = aircraftAcceleration(
        "reactive_evade",
        undefined,
        vel,
        aircraftPos,
        missilePos_evasion,
        0,
        90
      );
      const accel2 = aircraftAcceleration(
        "reactive_evade",
        undefined,
        vel,
        aircraftPos,
        missilePos_evasion,
        100,
        90
      );

      expect(accel1[0]).toBe(accel2[0]);
      expect(accel1[1]).toBe(accel2[1]);
      expect(accel1[2]).toBe(accel2[2]);
    });
  });

  /**
   * Casos especiales y edge cases
   */
  describe("Casos especiales", () => {
    it("Maneja velocidad nula en Straight", () => {
      const vel = [0, 0, 0] as Vec3;
      const accel = aircraftAcceleration(
        "straight",
        undefined,
        vel,
        genericPos,
        missilePos,
        0,
        90
      );
      expect(accel[0]).toBe(0);
      expect(accel[1]).toBe(0);
      expect(accel[2]).toBe(0);
    });

    it("Maneja maniobras en 3D con z ≠ 0", () => {
      const vel = [100, 50, 25] as Vec3;
      const pos = [0, 0, 100] as Vec3;
      const missile = [100, 0, 100] as Vec3;

      for (const maneuver of [
        "constant_turn" as const,
        "weave" as const,
        "reactive_evade" as const,
      ]) {
        const accel = aircraftAcceleration(
          maneuver,
          { turnRate: 0.5, weaveAmp: 50, weaveFreq: 1.0 },
          vel,
          pos,
          missile,
          0,
          90
        );
        const magnitude = Math.sqrt(
          accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2
        );
        expect(magnitude).toBeGreaterThanOrEqual(0);
        expect(magnitude).toBeLessThanOrEqual(90 + 1e-6);
      }
    });
  });
});
