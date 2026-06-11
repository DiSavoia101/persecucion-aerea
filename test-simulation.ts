/**
 * Test simple de la simulación del Grupo 2.
 * Ejecutar con: npx ts-node test-simulation.ts
 */

import { simulate } from "./src/simulation/index";
import { mockConfig } from "./src/shared/mockResult";

console.log("=== Prueba de Simulación (Grupo 2) ===\n");
console.log("Configuración:", JSON.stringify(mockConfig, null, 2));

console.log("\nEjecutando simulate(mockConfig)...\n");
const result = simulate(mockConfig);

console.log("✅ Simulación completada\n");
console.log("Resultados:");
console.log("- Pasos de simulación:", result.metadata.steps);
console.log("- Tiempo total:", result.time[result.time.length - 1], "s");
console.log("- Interceptado:", result.outcome.intercepted);
console.log("- Tiempo de intercepción:", result.outcome.interceptTime, "s");
console.log("- Distancia mínima:", result.outcome.minDistance, "m");
console.log("- Tiempo de distancia mínima:", result.outcome.minDistanceTime, "s");

// Verifica que las arrays tengan el mismo tamaño (sincronización)
const lengths = {
  time: result.time.length,
  aircraftPos: result.aircraft.position.length,
  aircraftVel: result.aircraft.velocity.length,
  aircraftSpeed: result.aircraft.speed.length,
  missilePos: result.missile.position.length,
  missileVel: result.missile.velocity.length,
  missileSpeed: result.missile.speed.length,
  missileAccel: result.missile.accelCommand.length,
  distance: result.distance.length,
  closingVel: result.closingVelocity.length,
  losAngle: result.losAngle.length,
};

console.log("\n✅ Sincronización de arrays:");
const allEqual = Object.values(lengths).every(v => v === lengths.time);
if (allEqual) {
  console.log("  Todas las arrays tienen", lengths.time, "elementos ✓");
} else {
  console.log("  ❌ INCONSISTENCIA:", lengths);
}

// Muestra primeros y últimos puntos
console.log("\nPrimera posición del avión:", result.aircraft.position[0]);
console.log("Última posición del avión:", result.aircraft.position[result.aircraft.position.length - 1]);
console.log("Primera posición del misil:", result.missile.position[0]);
console.log("Última posición del misil:", result.missile.position[result.missile.position.length - 1]);
console.log("Distancia inicial:", result.distance[0], "m");
console.log("Distancia final:", result.distance[result.distance.length - 1], "m");

console.log("\n✅ Todas las pruebas pasaron");
