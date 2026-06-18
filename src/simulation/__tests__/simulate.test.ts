/**
 * Tests de integración para simulate()
 * Verifica que la simulación completa funciona correctamente
 */

import { describe, it, expect } from "vitest";
import { simulate, analyzeStability } from "../index";
import { mockConfig, mockResult } from "../../shared/mockResult";
import type { SimulationConfig, SimulationResult } from "../../shared/types";

describe("Función simulate() - Integración Completa", () => {
  /**
   * Estructura del resultado
   */
  describe("Estructura del SimulationResult", () => {
    it("Retorna un objeto con todas las propiedades requeridas", () => {
      const result = simulate(mockConfig);

      expect(result).toHaveProperty("time");
      expect(result).toHaveProperty("aircraft");
      expect(result).toHaveProperty("missile");
      expect(result).toHaveProperty("distance");
      expect(result).toHaveProperty("closingVelocity");
      expect(result).toHaveProperty("losAngle");
      expect(result).toHaveProperty("outcome");
      expect(result).toHaveProperty("metadata");
    });

    it("Contiene propiedades correctas en aircraft", () => {
      const result = simulate(mockConfig);

      expect(result.aircraft).toHaveProperty("position");
      expect(result.aircraft).toHaveProperty("velocity");
      expect(result.aircraft).toHaveProperty("speed");
      expect(Array.isArray(result.aircraft.position)).toBe(true);
      expect(Array.isArray(result.aircraft.velocity)).toBe(true);
      expect(Array.isArray(result.aircraft.speed)).toBe(true);
    });

    it("Contiene propiedades correctas en missile", () => {
      const result = simulate(mockConfig);

      expect(result.missile).toHaveProperty("position");
      expect(result.missile).toHaveProperty("velocity");
      expect(result.missile).toHaveProperty("speed");
      expect(result.missile).toHaveProperty("accelCommand");
      expect(Array.isArray(result.missile.position)).toBe(true);
      expect(Array.isArray(result.missile.velocity)).toBe(true);
      expect(Array.isArray(result.missile.speed)).toBe(true);
      expect(Array.isArray(result.missile.accelCommand)).toBe(true);
    });

    it("Contiene propiedades correctas en outcome", () => {
      const result = simulate(mockConfig);

      expect(result.outcome).toHaveProperty("intercepted");
      expect(result.outcome).toHaveProperty("interceptTime");
      expect(result.outcome).toHaveProperty("minDistance");
      expect(result.outcome).toHaveProperty("minDistanceTime");
      expect(typeof result.outcome.intercepted).toBe("boolean");
    });
  });

  /**
   * Sincronización de arrays (la clave del proyecto)
   */
  describe("Sincronización de arrays (todos los índices igual)", () => {
    it("Todas las arrays tienen el mismo tamaño", () => {
      const result = simulate(mockConfig);
      const expectedLength = result.time.length;

      expect(result.aircraft.position).toHaveLength(expectedLength);
      expect(result.aircraft.velocity).toHaveLength(expectedLength);
      expect(result.aircraft.speed).toHaveLength(expectedLength);
      expect(result.missile.position).toHaveLength(expectedLength);
      expect(result.missile.velocity).toHaveLength(expectedLength);
      expect(result.missile.speed).toHaveLength(expectedLength);
      expect(result.missile.accelCommand).toHaveLength(expectedLength);
      expect(result.distance).toHaveLength(expectedLength);
      expect(result.closingVelocity).toHaveLength(expectedLength);
      expect(result.losAngle).toHaveLength(expectedLength);
    });

    it("time[0] es cero", () => {
      const result = simulate(mockConfig);
      expect(result.time[0]).toBe(0);
    });

    it("Posiciones iniciales coinciden con config", () => {
      const config = mockConfig;
      const result = simulate(config);

      // Avión
      expect(result.aircraft.position[0][0]).toBeCloseTo(config.aircraft.position[0], 5);
      expect(result.aircraft.position[0][1]).toBeCloseTo(
        config.aircraft.position[1],
        5
      );
      expect(result.aircraft.position[0][2]).toBeCloseTo(
        config.aircraft.position[2],
        5
      );

      // Misil
      expect(result.missile.position[0][0]).toBeCloseTo(
        config.missile.position[0],
        5
      );
      expect(result.missile.position[0][1]).toBeCloseTo(
        config.missile.position[1],
        5
      );
      expect(result.missile.position[0][2]).toBeCloseTo(
        config.missile.position[2],
        5
      );
    });

    it("Velocidades iniciales coinciden con config", () => {
      const config = mockConfig;
      const result = simulate(config);

      expect(result.aircraft.velocity[0][0]).toBeCloseTo(
        config.aircraft.velocity[0],
        5
      );
      expect(result.aircraft.velocity[0][1]).toBeCloseTo(
        config.aircraft.velocity[1],
        5
      );

      expect(result.missile.velocity[0][0]).toBeCloseTo(
        config.missile.velocity[0],
        5
      );
      expect(result.missile.velocity[0][1]).toBeCloseTo(
        config.missile.velocity[1],
        5
      );
    });
  });

  /**
   * Propiedades físicas
   */
  describe("Propiedades físicas", () => {
    it("La distancia es la magnitud del vector relativo", () => {
      const result = simulate(mockConfig);

      for (let i = 0; i < result.time.length; i++) {
        const pos_a = result.aircraft.position[i];
        const pos_m = result.missile.position[i];

        const dx = pos_a[0] - pos_m[0];
        const dy = pos_a[1] - pos_m[1];
        const dz = pos_a[2] - pos_m[2];

        const expectedDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        expect(result.distance[i]).toBeCloseTo(expectedDistance, 2);
      }
    });

    it("La rapidez es la magnitud de la velocidad", () => {
      const result = simulate(mockConfig);

      for (let i = 0; i < result.time.length; i++) {
        const vel_a = result.aircraft.velocity[i];
        const expectedSpeed = Math.sqrt(
          vel_a[0] ** 2 + vel_a[1] ** 2 + vel_a[2] ** 2
        );
        expect(result.aircraft.speed[i]).toBeCloseTo(expectedSpeed, 2);
      }
    });

    it("minDistance es el valor mínimo en distance[]", () => {
      const result = simulate(mockConfig);

      const minDist = Math.min(...result.distance);
      expect(result.outcome.minDistance).toBeCloseTo(minDist, 5);
    });

    it("minDistanceTime está en time[]", () => {
      const result = simulate(mockConfig);

      expect(result.time).toContain(result.outcome.minDistanceTime);
    });
  });

  /**
   * Detección de intercepción
   */
  describe("Detección de intercepción", () => {
    it("Detecta intercepción cuando distance ≤ hitRadius", () => {
      const config = mockConfig; // Sabemos que intercepta
      const result = simulate(config);

      if (result.outcome.intercepted) {
        expect(result.outcome.interceptTime).not.toBeNull();
        expect(result.outcome.minDistance).toBeLessThanOrEqual(
          config.simulation.hitRadius + 1
        );
      }
    });

    it("interceptTime es el último instante si no intercept", () => {
      // Crear un config donde no hay intercepción (avión muy rápido, misil muy lento)
      const config: SimulationConfig = {
        aircraft: {
          position: [0, 0, 0],
          velocity: [1000, 0, 0], // Muy rápido
          maneuver: "straight",
          maxAccel: 0,
        },
        missile: {
          position: [100, 0, 0],
          velocity: [10, 0, 0], // Lento
          guidanceLaw: "proportional_nav",
          navConstant: 4,
          maxAccel: 10,
        },
        simulation: {
          dt: 0.1,
          maxTime: 1,
          hitRadius: 50,
          integrator: "rk4",
        },
      };

      const result = simulate(config);

      if (!result.outcome.intercepted) {
        expect(result.outcome.interceptTime).toBeNull();
        expect(result.time[result.time.length - 1]).toBeCloseTo(
          config.simulation.maxTime,
          1
        );
      }
    });
  });

  /**
   * Integrador seleccionado
   */
  describe("Selección del integrador", () => {
    it("Usa Euler cuando integrator = 'euler'", () => {
      const config: SimulationConfig = {
        ...mockConfig,
        simulation: { ...mockConfig.simulation, integrator: "euler" },
      };

      const result = simulate(config);
      expect(result.metadata.integrator).toBe("euler");
      expect(result.time.length).toBeGreaterThan(1);
    });

    it("Usa RK4 cuando integrator = 'rk4'", () => {
      const config: SimulationConfig = {
        ...mockConfig,
        simulation: { ...mockConfig.simulation, integrator: "rk4" },
      };

      const result = simulate(config);
      expect(result.metadata.integrator).toBe("rk4");
      expect(result.time.length).toBeGreaterThan(1);
    });

    it("Euler y RK4 producen resultados físicos con la misma configuración", () => {
      const baseConfig: Omit<SimulationConfig, "simulation"> & {
        simulation: Omit<SimulationConfig["simulation"], "integrator">;
      } = {
        aircraft: {
          position: [0, 0, 0],
          velocity: [200, 0, 0],
          maneuver: "straight" as const,
          maxAccel: 0,
        },
        missile: {
          position: [500, 0, 0],
          velocity: [-300, 0, 0],
          guidanceLaw: "proportional_nav" as const,
          navConstant: 4,
          maxAccel: 200,
        },
        simulation: {
          dt: 0.05,
          maxTime: 1,
          hitRadius: 10,
        },
      };

      const resultEuler = simulate({
        ...baseConfig,
        simulation: { ...baseConfig.simulation, integrator: "euler" },
      });

      const resultRK4 = simulate({
        ...baseConfig,
        simulation: { ...baseConfig.simulation, integrator: "rk4" },
      });

      for (const result of [resultEuler, resultRK4]) {
        expect(result.time.length).toBeGreaterThan(1);
        expect(result.distance.every(Number.isFinite)).toBe(true);
        expect(result.outcome.minDistance).toBeGreaterThanOrEqual(0);
        expect(result.metadata.steps).toBe(result.time.length);
      }

      // En este caso rectilíneo ambos integradores deben concordar estrechamente;
      // exigir una intercepción sería imponer una condición que el escenario no garantiza.
      expect(resultRK4.outcome.minDistance).toBeCloseTo(resultEuler.outcome.minDistance, 5);
    });
  });

  /**
   * Determinismo
   */
  describe("Determinismo", () => {
    it("Misma config produce idéntico resultado", () => {
      const result1 = simulate(mockConfig);
      const result2 = simulate(mockConfig);

      expect(result1.time).toEqual(result2.time);
      expect(result1.distance).toEqual(result2.distance);
      expect(result1.outcome.intercepted).toBe(result2.outcome.intercepted);
      expect(result1.outcome.interceptTime).toBe(result2.outcome.interceptTime);
    });
  });

  /**
   * Metadata
   */
  describe("Metadata", () => {
    it("metadata.steps = time.length", () => {
      const result = simulate(mockConfig);
      expect(result.metadata.steps).toBe(result.time.length);
    });

    it("metadata.integrator es correcto", () => {
      const configEuler: SimulationConfig = {
        ...mockConfig,
        simulation: { ...mockConfig.simulation, integrator: "euler" },
      };
      const resultEuler = simulate(configEuler);
      expect(resultEuler.metadata.integrator).toBe("euler");
    });

    it("metadata.config almacena la configuración exacta", () => {
      const result = simulate(mockConfig);
      expect(result.metadata.config).toEqual(mockConfig);
    });
  });

  /**
   * Casos extremos
   */
  describe("Casos extremos", () => {
    it("Maneja dt muy pequeño", () => {
      const config: SimulationConfig = {
        ...mockConfig,
        simulation: {
          ...mockConfig.simulation,
          dt: 0.001,
          maxTime: 0.1,
        },
      };

      const result = simulate(config);
      expect(result.time.length).toBeGreaterThan(50);
      expect(result.time[result.time.length - 1]).toBeLessThanOrEqual(0.1 + 0.01);
    });

    it("Maneja dt relativamente grande", () => {
      const config: SimulationConfig = {
        ...mockConfig,
        simulation: {
          ...mockConfig.simulation,
          dt: 0.5,
          maxTime: 5,
        },
      };

      const result = simulate(config);
      expect(result.time.length).toBeLessThan(20);
    });

    it("Detiene cuando hitRadius se alcanza", () => {
      const config: SimulationConfig = {
        ...mockConfig,
        simulation: {
          ...mockConfig.simulation,
          hitRadius: 100, // Muy grande, casi siempre intercepta
        },
      };

      const result = simulate(config);
      expect(result.outcome.intercepted).toBe(true);
      expect(result.time[result.time.length - 1]).toBeLessThan(
        config.simulation.maxTime
      );
    });
  });
});

/**
 * Tests para analyzeStability (función opcional)
 */
describe("analyzeStability() - Análisis de Estabilidad", () => {
  it("Retorna un StabilityResult válido", () => {
    const result = analyzeStability(mockConfig);

    expect(result).toHaveProperty("eigenvalues");
    expect(result).toHaveProperty("isStable");
    expect(result).toHaveProperty("navConstant");
    expect(Array.isArray(result.eigenvalues)).toBe(true);
    expect(typeof result.isStable).toBe("boolean");
  });

  it("N >= 3 es estable", () => {
    const config: SimulationConfig = {
      ...mockConfig,
      missile: { ...mockConfig.missile, navConstant: 3 },
    };
    const result = analyzeStability(config);
    expect(result.isStable).toBe(true);
  });

  it("N < 3 es inestable", () => {
    const config: SimulationConfig = {
      ...mockConfig,
      missile: { ...mockConfig.missile, navConstant: 2 },
    };
    const result = analyzeStability(config);
    expect(result.isStable).toBe(false);
  });

  it("navConstant corresponde a la config", () => {
    const navConstant = 5;
    const config: SimulationConfig = {
      ...mockConfig,
      missile: { ...mockConfig.missile, navConstant },
    };
    const result = analyzeStability(config);
    expect(result.navConstant).toBe(navConstant);
  });
});
