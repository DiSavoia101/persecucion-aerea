/**
 * Tests unitarios para guidance.ts
 * Verifica que las leyes de guiado del misil funcionan correctamente
 */

import { describe, it, expect } from "vitest";
import {
  missileAccelPurePursuit,
  missileAccelProportionalNav,
} from "../guidance";

type Vec3 = [number, number, number];

describe("Leyes de Guiado del Misil", () => {
  /**
   * Persecución pura: el misil apunta hacia la posición del avión
   */
  describe("Persecución Pura (Pure Pursuit)", () => {
    it("No acelera si avión y misil están en la misma posición", () => {
      const pos = [100, 100, 0] as Vec3;
      const vel = [10, 10, 0] as Vec3;
      const accel = missileAccelPurePursuit(pos, vel, pos, vel);
      expect(Math.abs(accel[0])).toBeLessThan(1e-5);
      expect(Math.abs(accel[1])).toBeLessThan(1e-5);
      expect(Math.abs(accel[2])).toBeLessThan(1e-5);
    });

    it("Acelera hacia el avión cuando está en línea recta", () => {
      const rA = [100, 0, 0] as Vec3; // Avión adelante en eje x
      const vA = [0, 0, 0] as Vec3;
      const rM = [0, 0, 0] as Vec3; // Misil en origen
      const vM = [10, 0, 0] as Vec3; // Yendo en eje x

      const accel = missileAccelPurePursuit(rA, vA, rM, vM, 1.0);
      // Debe haber aceleración (no es colineal con vM)
      expect(Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2)).toBeGreaterThan(
        0
      );
    });

    it("Respeta el límite de aceleración máxima", () => {
      const rA = [1000, 1000, 0] as Vec3; // Avión muy lejos
      const vA = [0, 0, 0] as Vec3;
      const rM = [0, 0, 0] as Vec3;
      const vM = [10, 0, 0] as Vec3;
      const maxAccel = 50;

      const accel = missileAccelPurePursuit(rA, vA, rM, vM, 1.0, maxAccel);
      const magnitude = Math.sqrt(
        accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2
      );
      expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
    });

    it("Aceleración es perpendicular a la velocidad", () => {
      const rA = [50, 50, 0] as Vec3;
      const vA = [0, 0, 0] as Vec3;
      const rM = [0, 0, 0] as Vec3;
      const vM = [10, 0, 0] as Vec3; // Vel en eje x

      const accel = missileAccelPurePursuit(rA, vA, rM, vM);
      // dot(a, v) ≈ 0
      const dot = accel[0] * vM[0] + accel[1] * vM[1] + accel[2] * vM[2];
      expect(Math.abs(dot)).toBeLessThan(1e-6);
    });
  });

  /**
   * Navegación Proporcional (PN)
   */
  describe("Navegación Proporcional (Proportional Navigation)", () => {
    it("No acelera si velocidades relativas son nulas", () => {
      const pos = [100, 100, 0] as Vec3;
      const vel = [10, 10, 0] as Vec3;
      const accel = missileAccelProportionalNav(
        pos,
        vel,
        pos,
        vel,
        4,
        300
      );
      expect(Math.abs(accel[0])).toBeLessThan(1e-5);
      expect(Math.abs(accel[1])).toBeLessThan(1e-5);
      expect(Math.abs(accel[2])).toBeLessThan(1e-5);
    });

    it("Acelera cuando hay rotación de LOS", () => {
      // Avión se aleja hacia arriba
      const rA = [100, 100, 0] as Vec3;
      const vA = [0, 10, 0] as Vec3;
      // Misil persigue desde origen
      const rM = [0, 0, 0] as Vec3;
      const vM = [20, 0, 0] as Vec3;

      const accel = missileAccelProportionalNav(rA, vA, rM, vM, 4);
      const magnitude = Math.sqrt(
        accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2
      );
      expect(magnitude).toBeGreaterThan(0);
    });

    it("La aceleración aumenta con la constante de navegación N", () => {
      const rA = [100, 100, 0] as Vec3;
      const vA = [0, 10, 0] as Vec3;
      const rM = [0, 0, 0] as Vec3;
      const vM = [20, 0, 0] as Vec3;

      const accelN3 = missileAccelProportionalNav(rA, vA, rM, vM, 3);
      const accelN5 = missileAccelProportionalNav(rA, vA, rM, vM, 5);

      const magN3 = Math.sqrt(
        accelN3[0] ** 2 + accelN3[1] ** 2 + accelN3[2] ** 2
      );
      const magN5 = Math.sqrt(
        accelN5[0] ** 2 + accelN5[1] ** 2 + accelN5[2] ** 2
      );

      expect(magN5).toBeGreaterThan(magN3);
    });

    it("Respeta el límite de aceleración máxima", () => {
      const rA = [100, 100, 0] as Vec3;
      const vA = [100, 100, 0] as Vec3; // Velocidad relativa grande
      const rM = [0, 0, 0] as Vec3;
      const vM = [0, 0, 0] as Vec3;
      const maxAccel = 50;

      const accel = missileAccelProportionalNav(rA, vA, rM, vM, 10, maxAccel);
      const magnitude = Math.sqrt(
        accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2
      );
      expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
    });

    it("Aceleración es perpendicular a la velocidad", () => {
      const rA = [100, 100, 0] as Vec3;
      const vA = [0, 10, 0] as Vec3;
      const rM = [0, 0, 0] as Vec3;
      const vM = [20, 0, 0] as Vec3;

      const accel = missileAccelProportionalNav(rA, vA, rM, vM);
      // dot(a, v) debe ser cercano a 0
      const dot = accel[0] * vM[0] + accel[1] * vM[1] + accel[2] * vM[2];
      expect(Math.abs(dot)).toBeLessThan(1);
    });

    it("PN en 3D: funciona con z ≠ 0", () => {
      const rA = [100, 100, 50] as Vec3;
      const vA = [0, 10, 5] as Vec3;
      const rM = [0, 0, 0] as Vec3;
      const vM = [20, 0, 0] as Vec3;

      const accel = missileAccelProportionalNav(rA, vA, rM, vM, 4);
      const magnitude = Math.sqrt(
        accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2
      );
      expect(magnitude).toBeGreaterThan(0);
      expect(magnitude).toBeLessThanOrEqual(300 + 1e-6);
    });
  });

  /**
   * Comparación: PP vs PN
   */
  describe("Comparación Pure Pursuit vs Proportional Navigation", () => {
    it("Ambas respetan maxAccel", () => {
      const rA = [1000, 1000, 0] as Vec3;
      const vA = [50, 50, 0] as Vec3;
      const rM = [0, 0, 0] as Vec3;
      const vM = [100, 0, 0] as Vec3;
      const maxAccel = 200;

      const accelPP = missileAccelPurePursuit(rA, vA, rM, vM, 1.0, maxAccel);
      const accelPN = missileAccelProportionalNav(
        rA,
        vA,
        rM,
        vM,
        4,
        maxAccel
      );

      const magPP = Math.sqrt(accelPP[0] ** 2 + accelPP[1] ** 2 + accelPP[2] ** 2);
      const magPN = Math.sqrt(accelPN[0] ** 2 + accelPN[1] ** 2 + accelPN[2] ** 2);

      expect(magPP).toBeLessThanOrEqual(maxAccel + 1e-6);
      expect(magPN).toBeLessThanOrEqual(maxAccel + 1e-6);
    });
  });
});
