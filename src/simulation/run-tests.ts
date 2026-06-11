/**
 * Test Runner Manual — Ejecuta los tests sin Vitest
 * Compatible con ambiente sin npm/node disponible
 * 
 * Demuestra que todos los módulos del Grupo 2 funcionan correctamente
 */

import { eulerStep, rk4Step } from "./integrators";
import {
  missileAccelPurePursuit,
  missileAccelProportionalNav,
} from "./guidance";
import { aircraftAcceleration } from "./maneuvers";
import { systemDerivatives } from "./dynamics";
import { simulate, analyzeStability } from "./index";
import { mockConfig } from "../shared/mockResult";
import type { Vec3 } from "../shared/types";

// ============================================================================
// UTILIDADES DE TEST
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
let testCount = 0;
let passCount = 0;

function test(name: string, fn: () => void) {
  testCount++;
  try {
    fn();
    results.push({ name, passed: true });
    passCount++;
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error}`);
  }
}

function expect(value: any) {
  return {
    toBe: (expected: any) => {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`);
      }
    },
    toBeCloseTo: (expected: number, decimals = 0) => {
      const factor = Math.pow(10, decimals);
      if (Math.abs(value - expected) > 1 / factor) {
        throw new Error(
          `Expected ${expected}±${1 / factor}, got ${value}`
        );
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (value <= expected) {
        throw new Error(`Expected > ${expected}, got ${value}`);
      }
    },
    toBeLessThan: (expected: number) => {
      if (value >= expected) {
        throw new Error(`Expected < ${expected}, got ${value}`);
      }
    },
    toBeLessThanOrEqual: (expected: number) => {
      if (value > expected) {
        throw new Error(`Expected <= ${expected}, got ${value}`);
      }
    },
    toHaveLength: (len: number) => {
      if (!Array.isArray(value) || value.length !== len) {
        throw new Error(`Expected length ${len}, got ${value?.length}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
  };
}

function describe(name: string, fn: () => void) {
  console.log(`\n📋 ${name}`);
  fn();
}

// ============================================================================
// TESTS: Integradores
// ============================================================================

describe("Integradores Numéricos", () => {
  test("Euler: aproxima decaimiento exponencial", () => {
    const derivativeFn = (state: number[]) => [state[0] * -1];
    const dt = 0.01;
    let state = [1.0];
    for (let i = 0; i < 100; i++) {
      state = eulerStep(state, derivativeFn, dt);
    }
    const expected = Math.exp(-1);
    const error = Math.abs(state[0] - expected) / expected;
    if (error > 0.1) throw new Error(`Error demasiado grande: ${error}`);
  });

  test("RK4: conserva energía en oscilador armónico", () => {
    const derivativeFn = (state: number[]) => [state[1], -state[0]];
    const dt = 0.01;
    let state = [1, 0];
    for (let i = 0; i < 200; i++) {
      state = rk4Step(state, derivativeFn, dt);
    }
    const energy = state[0] ** 2 + state[1] ** 2;
    expect(energy).toBeCloseTo(1, 1);
  });

  test("Movimiento rectilíneo uniforme", () => {
    const state = [0, 0, 0, 10, 5, 0];
    const derivativeFn = (s: number[]) => [s[3], s[4], s[5], 0, 0, 0];
    const dt = 0.1;
    let s = state;
    for (let i = 0; i < 10; i++) {
      s = rk4Step(s, derivativeFn, dt);
    }
    expect(s[0]).toBeCloseTo(10, 0);
    expect(s[1]).toBeCloseTo(5, 0);
  });

  test("RK4 es más preciso que Euler", () => {
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

    if (errorRK4 >= errorEuler) {
      throw new Error(
        `RK4 no es más preciso: RK4=${errorRK4}, Euler=${errorEuler}`
      );
    }
  });
});

// ============================================================================
// TESTS: Guiado del Misil
// ============================================================================

describe("Leyes de Guiado del Misil", () => {
  test("Pure Pursuit: sin aceleración si están en la misma posición", () => {
    const pos = [100, 100, 0] as Vec3;
    const vel = [10, 10, 0] as Vec3;
    const accel = missileAccelPurePursuit(pos, vel, pos, vel);
    if (Math.abs(accel[0]) > 1e-5 || Math.abs(accel[1]) > 1e-5) {
      throw new Error("Debería haber cero aceleración");
    }
  });

  test("Pure Pursuit: respeta maxAccel", () => {
    const rA = [1000, 1000, 0] as Vec3;
    const vA = [0, 0, 0] as Vec3;
    const rM = [0, 0, 0] as Vec3;
    const vM = [10, 0, 0] as Vec3;
    const maxAccel = 50;

    const accel = missileAccelPurePursuit(rA, vA, rM, vM, 1.0, maxAccel);
    const magnitude = Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2);
    expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
  });

  test("Proportional Nav: acelera con rotación de LOS", () => {
    const rA = [100, 100, 0] as Vec3;
    const vA = [0, 10, 0] as Vec3;
    const rM = [0, 0, 0] as Vec3;
    const vM = [20, 0, 0] as Vec3;

    const accel = missileAccelProportionalNav(rA, vA, rM, vM, 4);
    const magnitude = Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2);
    expect(magnitude).toBeGreaterThan(0);
  });

  test("PN: navConstant mayor → aceleración mayor", () => {
    const rA = [100, 100, 0] as Vec3;
    const vA = [0, 10, 0] as Vec3;
    const rM = [0, 0, 0] as Vec3;
    const vM = [20, 0, 0] as Vec3;

    const accelN3 = missileAccelProportionalNav(rA, vA, rM, vM, 3);
    const accelN5 = missileAccelProportionalNav(rA, vA, rM, vM, 5);

    const magN3 = Math.sqrt(accelN3[0] ** 2 + accelN3[1] ** 2 + accelN3[2] ** 2);
    const magN5 = Math.sqrt(accelN5[0] ** 2 + accelN5[1] ** 2 + accelN5[2] ** 2);

    if (magN5 <= magN3) {
      throw new Error(`PN con N=5 debería ser mayor que N=3: ${magN5} vs ${magN3}`);
    }
  });
});

// ============================================================================
// TESTS: Maniobras del Avión
// ============================================================================

describe("Maniobras de Evasión del Avión", () => {
  test("Straight: sin aceleración", () => {
    const vel = [100, 0, 0] as Vec3;
    const accel = aircraftAcceleration(
      "straight",
      undefined,
      vel,
      [0, 0, 0],
      [100, 0, 0],
      0,
      90
    );
    expect(accel[0]).toBe(0);
    expect(accel[1]).toBe(0);
    expect(accel[2]).toBe(0);
  });

  test("Constant Turn: perpendicular a velocidad", () => {
    const vel = [100, 0, 0] as Vec3;
    const accel = aircraftAcceleration(
      "constant_turn",
      { turnRate: 0.5 },
      vel,
      [0, 0, 0],
      [100, 0, 0],
      0,
      90
    );
    const dot = accel[0] * vel[0] + accel[1] * vel[1] + accel[2] * vel[2];
    if (Math.abs(dot) > 1) throw new Error("Aceleración no es perpendicular");
  });

  test("Weave: senoidal en el tiempo", () => {
    const vel = [100, 0, 0] as Vec3;
    const params = { weaveAmp: 50, weaveFreq: Math.PI };

    const accel_t0 = aircraftAcceleration(
      "weave",
      params,
      vel,
      [0, 0, 0],
      [100, 0, 0],
      0,
      1000
    );
    const accel_tpi2 = aircraftAcceleration(
      "weave",
      params,
      vel,
      [0, 0, 0],
      [100, 0, 0],
      Math.PI / 2,
      1000
    );

    const mag_t0 = Math.sqrt(accel_t0[0] ** 2 + accel_t0[1] ** 2 + accel_t0[2] ** 2);
    const mag_tpi2 = Math.sqrt(
      accel_tpi2[0] ** 2 + accel_tpi2[1] ** 2 + accel_tpi2[2] ** 2
    );

    if (mag_tpi2 <= mag_t0 * 2) {
      throw new Error(`Weave no es suficientemente senoidal: ${mag_t0} vs ${mag_tpi2}`);
    }
  });

  test("Reactive Evade: respeta maxAccel", () => {
    const vel = [100, 0, 0] as Vec3;
    const maxAccel = 75;

    const accel = aircraftAcceleration(
      "reactive_evade",
      undefined,
      vel,
      [0, 0, 0],
      [-100, -100, 0],
      0,
      maxAccel
    );

    const magnitude = Math.sqrt(accel[0] ** 2 + accel[1] ** 2 + accel[2] ** 2);
    expect(magnitude).toBeLessThanOrEqual(maxAccel + 1e-6);
  });
});

// ============================================================================
// TESTS: Función de Derivadas
// ============================================================================

describe("Función de Derivadas del Sistema", () => {
  test("Derivada tiene 12 componentes", () => {
    const config = {
      aircraft: {
        position: [0, 0, 0] as Vec3,
        velocity: [100, 0, 0] as Vec3,
        maneuver: "straight" as const,
        maxAccel: 90,
      },
      missile: {
        position: [200, 100, 0] as Vec3,
        velocity: [-50, -50, 0] as Vec3,
        guidanceLaw: "proportional_nav" as const,
        navConstant: 4,
        maxAccel: 300,
      },
      simulation: {
        dt: 0.01,
        maxTime: 10,
        hitRadius: 15,
        integrator: "rk4" as const,
      },
    };

    const state = [0, 0, 0, 100, 0, 0, 200, 100, 0, -50, -50, 0];
    const derivs = systemDerivatives(state, config, 0);

    expect(derivs).toHaveLength(12);
  });

  test("dr/dt = v", () => {
    const config = {
      aircraft: {
        position: [0, 0, 0] as Vec3,
        velocity: [100, 50, 0] as Vec3,
        maneuver: "straight" as const,
        maxAccel: 90,
      },
      missile: {
        position: [200, 100, 0] as Vec3,
        velocity: [-30, -40, 0] as Vec3,
        guidanceLaw: "proportional_nav" as const,
        navConstant: 4,
        maxAccel: 300,
      },
      simulation: {
        dt: 0.01,
        maxTime: 10,
        hitRadius: 15,
        integrator: "rk4" as const,
      },
    };

    const state = [0, 0, 0, 100, 50, 0, 200, 100, 0, -30, -40, 0];
    const derivs = systemDerivatives(state, config, 0);

    expect(derivs[0]).toBe(100);
    expect(derivs[1]).toBe(50);
    expect(derivs[6]).toBe(-30);
    expect(derivs[7]).toBe(-40);
  });
});

// ============================================================================
// TESTS: Función Principal simulate()
// ============================================================================

describe("Función simulate() - Simulación Completa", () => {
  test("Retorna resultado con estructura correcta", () => {
    const result = simulate(mockConfig);

    if (!result.time || !result.aircraft || !result.missile || !result.distance) {
      throw new Error("Estructura incorrecta del resultado");
    }
  });

  test("Todas las arrays tienen el mismo tamaño", () => {
    const result = simulate(mockConfig);
    const len = result.time.length;

    if (
      result.aircraft.position.length !== len ||
      result.aircraft.velocity.length !== len ||
      result.aircraft.speed.length !== len ||
      result.missile.position.length !== len ||
      result.missile.velocity.length !== len ||
      result.missile.speed.length !== len ||
      result.missile.accelCommand.length !== len ||
      result.distance.length !== len ||
      result.closingVelocity.length !== len ||
      result.losAngle.length !== len
    ) {
      throw new Error("Arrays no sincronizadas");
    }
  });

  test("time[0] es cero", () => {
    const result = simulate(mockConfig);
    expect(result.time[0]).toBe(0);
  });

  test("Posiciones iniciales coinciden con config", () => {
    const result = simulate(mockConfig);
    const initialAircraftPos = result.aircraft.position[0];
    const initialMissilePos = result.missile.position[0];

    expect(initialAircraftPos[0]).toBeCloseTo(mockConfig.aircraft.position[0], 2);
    expect(initialAircraftPos[1]).toBeCloseTo(mockConfig.aircraft.position[1], 2);
    expect(initialMissilePos[0]).toBeCloseTo(mockConfig.missile.position[0], 2);
  });

  test("Distancia es la magnitud del vector relativo", () => {
    const result = simulate(mockConfig);

    for (let i = 0; i < Math.min(10, result.time.length); i++) {
      const posA = result.aircraft.position[i];
      const posM = result.missile.position[i];

      const dx = posA[0] - posM[0];
      const dy = posA[1] - posM[1];
      const dz = posA[2] - posM[2];

      const expectedDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const error = Math.abs(result.distance[i] - expectedDistance) / expectedDistance;

      if (error > 0.01) {
        throw new Error(
          `Distancia incorrecta en i=${i}: ${result.distance[i]} vs ${expectedDistance}`
        );
      }
    }
  });

  test("minDistance es el valor mínimo en distance[]", () => {
    const result = simulate(mockConfig);
    const minDist = Math.min(...result.distance);

    const error = Math.abs(result.outcome.minDistance - minDist) / minDist;
    if (error > 0.01) {
      throw new Error(
        `minDistance incorrecto: ${result.outcome.minDistance} vs ${minDist}`
      );
    }
  });

  test("Detección de intercepción", () => {
    const result = simulate(mockConfig);

    if (result.outcome.intercepted) {
      if (result.outcome.interceptTime === null) {
        throw new Error("interceptTime debe ser != null si interceptó");
      }
      if (result.outcome.minDistance > mockConfig.simulation.hitRadius + 1) {
        throw new Error("Intercepción detectada pero distancia mínima > hitRadius");
      }
    }
  });

  test("Determinismo: misma config produce idéntico resultado", () => {
    const result1 = simulate(mockConfig);
    const result2 = simulate(mockConfig);

    if (result1.distance.length !== result2.distance.length) {
      throw new Error("Número de pasos diferente");
    }

    for (let i = 0; i < result1.distance.length; i++) {
      if (Math.abs(result1.distance[i] - result2.distance[i]) > 1e-10) {
        throw new Error(`Resultado no determinista en índice ${i}`);
      }
    }
  });

  test("metadata.steps = time.length", () => {
    const result = simulate(mockConfig);
    if (result.metadata.steps !== result.time.length) {
      throw new Error("metadata.steps no coincide con time.length");
    }
  });
});

// ============================================================================
// TESTS: analyzeStability
// ============================================================================

describe("analyzeStability() - Análisis de Estabilidad", () => {
  test("Retorna StabilityResult válido", () => {
    const result = analyzeStability(mockConfig);

    if (
      !result.eigenvalues ||
      typeof result.isStable !== "boolean" ||
      result.navConstant === undefined
    ) {
      throw new Error("StabilityResult inválido");
    }
  });

  test("N >= 3 es estable", () => {
    const config = { ...mockConfig };
    config.missile = { ...config.missile, navConstant: 3 };

    const result = analyzeStability(config);
    if (!result.isStable) {
      throw new Error("N=3 debería ser estable");
    }
  });

  test("N < 3 es inestable", () => {
    const config = { ...mockConfig };
    config.missile = { ...config.missile, navConstant: 2 };

    const result = analyzeStability(config);
    if (result.isStable) {
      throw new Error("N=2 debería ser inestable");
    }
  });
});

// ============================================================================
// RESUMEN DE RESULTADOS
// ============================================================================

console.log("\n");
console.log("═".repeat(70));
console.log("📊 RESUMEN DE TESTS DEL GRUPO 2");
console.log("═".repeat(70));
console.log(`Total de tests: ${testCount}`);
console.log(`✅ Pasados: ${passCount}`);
console.log(`❌ Fallidos: ${testCount - passCount}`);

if (passCount === testCount) {
  console.log("\n🎉 ¡TODOS LOS TESTS PASARON! 🎉");
  console.log("\n✅ El trabajo del Grupo 2 está completamente validado:");
  console.log("   ✓ Integradores numéricos (Euler, RK4)");
  console.log("   ✓ Leyes de guiado (Pure Pursuit, Proportional Navigation)");
  console.log("   ✓ Maniobras de evasión (Straight, Turn, Weave, Reactive)");
  console.log("   ✓ Función de derivadas del sistema");
  console.log("   ✓ Simulación completa (simulate)");
  console.log("   ✓ Análisis de estabilidad (analyzeStability)");
} else {
  console.log("\n⚠️ Algunos tests fallaron:");
  for (const result of results) {
    if (!result.passed) {
      console.log(`   ❌ ${result.name}`);
      if (result.error) console.log(`      ${result.error}`);
    }
  }
}

console.log("\n" + "═".repeat(70));
