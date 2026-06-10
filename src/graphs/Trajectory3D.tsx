/**
 * Trajectory3D.tsx — Gráfico 2 (escena 3D). Grupo 4.
 * Proyecto: Simulación de Persecución Avión–Misil — Modelado y Simulación.
 *
 * Contrato (Grupo 1, types.ts):
 *   <Trajectory3D result={SimulationResult} currentFrame={number} />
 *
 * Reglas del documento (sección 4 y 7.2) que este componente respeta:
 *   - Es un componente independiente: solo consume `result` y `currentFrame`.
 *   - NO calcula física: toda posición/velocidad/distancia ya viene en `result`.
 *   - Dibuja el rastro completo hasta currentFrame + marcador en la posición actual.
 *   - Objetos orientados según velocity[currentFrame].
 *   - Grilla en el piso (z=0) + sombras proyectadas para leer la altura.
 *   - Cámara orbitable por el usuario (OrbitControls).
 *
 * Convención de ejes: los datos están en el plano x-y (z=0 para 2D). En el mundo
 * de three.js el "piso" es x-z, así que mapeamos dato.y -> altura (mundo.y) y
 * dato.z -> mundo.z. Helper: dataToWorld().
 *
 * Stack (sección 2): three + @react-three/fiber + @react-three/drei.
 *   npm i three @react-three/fiber @react-three/drei
 *   npm i -D @types/three
 *
 * Paleta común propuesta a los Grupos 4/5 (mismo avión/mismo misil en los 3 gráficos):
 *   avión = ámbar #ffb02e · misil = rojo #ff3b3b · LOS = azul #6f86b0
 */

import { useMemo, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport, Line, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { GraphProps, Vec3, SimulationResult } from "../shared/types";

/* ─────────────────────────── Configuración visual ─────────────────────────── */

const COLORS = {
  aircraft: "#ffb02e",
  aircraftDark: "#c77f12",
  missile: "#ff3b3b",
  missileDark: "#b51d1d",
  missileBody: "#e8edf5",
  trailAircraft: "#ffc766",
  trailMissile: "#ff6b6b",
  los: "#6f86b0",
  hit: "#ff5c8a",
  floor: "#0e1521",
  grid: "#2a3a52",
  gridSection: "#3a4f6f",
} as const;

/** Escala mundo: los datos llegan en metros (cientos–miles). Reduce a una escena cómoda. */
const SCALE = 0.04;

/** dato [x,y,z] (plano x-y) -> posición de three.js [x, altura, z]. */
function dataToWorld(p: Vec3): [number, number, number] {
  return [p[0] * SCALE, p[1] * SCALE, p[2] * SCALE];
}

/** Cuaternión que apunta el +X local de un mesh hacia el vector velocidad. */
const X_AXIS = new THREE.Vector3(1, 0, 0);
function quatFromVelocity(v: Vec3): THREE.Quaternion {
  const dir = new THREE.Vector3(v[0], v[1], v[2]);
  if (dir.lengthSq() < 1e-9) return new THREE.Quaternion();
  dir.normalize();
  return new THREE.Quaternion().setFromUnitVectors(X_AXIS, dir);
}

function clampFrame(result: SimulationResult, f: number): number {
  const n = result.time.length;
  return Math.max(0, Math.min(Math.round(f), n - 1));
}

/* ─────────────────────────── Modelos 3D ─────────────────────────── */

/** Avión: fuselaje + cono de nariz + cabina + alas delta + cola + deriva. Morro = +X. */
function AircraftModel(props: ThreeElements["group"]) {
  return (
    <group {...props} scale={0.62}>
      {/* fuselaje */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.75, 7, 20]} />
        <meshStandardMaterial color={COLORS.aircraft} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* nariz */}
      <mesh position={[4.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.55, 2.2, 20]} />
        <meshStandardMaterial color={COLORS.aircraft} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* cabina */}
      <mesh position={[2.4, 0.5, 0]} scale={[1.6, 0.7, 0.9]}>
        <sphereGeometry args={[0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a0e16" metalness={0.2} roughness={0.1} />
      </mesh>
      {/* alas delta (dos triángulos extruidos espejados) */}
      <DeltaWing y={-0.08} mirror={false} length={5.2} chord={3.8} color={COLORS.aircraftDark} />
      <DeltaWing y={-0.08} mirror={true} length={5.2} chord={3.8} color={COLORS.aircraftDark} />
      {/* cola horizontal */}
      <DeltaWing x={-3.4} mirror={false} length={1.9} chord={1.4} color={COLORS.aircraftDark} />
      <DeltaWing x={-3.4} mirror={true} length={1.9} chord={1.4} color={COLORS.aircraftDark} />
      {/* deriva vertical */}
      <mesh position={[-3.3, 0.9, 0]} castShadow>
        <boxGeometry args={[1.4, 1.8, 0.12]} />
        <meshStandardMaterial color={COLORS.aircraftDark} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Ala triangular reutilizable (se extiende sobre +Z o -Z según `mirror`). */
function DeltaWing({
  x = -0.3, y = 0, length, chord, color, mirror,
}: { x?: number; y?: number; length: number; chord: number; color: string; mirror: boolean }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(chord * 0.42, 0);
    shape.lineTo(-chord * 0.58, 0);
    shape.lineTo(-chord * 0.58, length);
    shape.lineTo(chord * 0.26, length * 0.12);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
  }, [length, chord]);
  return (
    <mesh
      geometry={geo}
      position={[x, y, 0]}
      rotation={[mirror ? Math.PI / 2 : -Math.PI / 2, 0, 0]}
      castShadow
    >
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Misil: tubo + ojiva roja + banda + 4 aletas. Morro = +X. */
function MissileModel(props: ThreeElements["group"]) {
  const fins = useMemo(() => [0, 1, 2, 3].map((i) => (i * Math.PI) / 2), []);
  return (
    <group {...props} scale={0.7}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 5.2, 18]} />
        <meshStandardMaterial color={COLORS.missileBody} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[3.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.34, 1.5, 18]} />
        <meshStandardMaterial color={COLORS.missile} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.36, 0.36, 0.6, 18]} />
        <meshStandardMaterial color={COLORS.missile} metalness={0.4} roughness={0.4} />
      </mesh>
      {fins.map((ang, i) => (
        <mesh
          key={i}
          position={[-2.2, Math.cos(ang) * 0.55, Math.sin(ang) * 0.55]}
          rotation={[ang, 0, 0]}
          castShadow
        >
          <boxGeometry args={[1.3, 1.0, 0.06]} />
          <meshStandardMaterial color={COLORS.missile} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────── Rastros y estela ─────────────────────────── */

/** Línea que crece: dibuja position[0..currentFrame]. */
function Trail({
  positions, currentFrame, color, opacity = 0.9,
}: { positions: Vec3[]; currentFrame: number; color: string; opacity?: number }) {
  const points = useMemo(
    () => positions.slice(0, currentFrame + 1).map(dataToWorld),
    [positions, currentFrame],
  );
  if (points.length < 2) return null;
  return <Line points={points} color={color} lineWidth={2} transparent opacity={opacity} />;
}

/** Proyección del rastro sobre el piso (sombra-camino). */
function ShadowTrail({
  positions, currentFrame,
}: { positions: Vec3[]; currentFrame: number }) {
  const points = useMemo(
    () =>
      positions.slice(0, currentFrame + 1).map((p) => {
        const w = dataToWorld(p);
        return [w[0], 0.05, w[2]] as [number, number, number];
      }),
    [positions, currentFrame],
  );
  if (points.length < 2) return null;
  return <Line points={points} color="#000000" lineWidth={1} transparent opacity={0.16} />;
}

/** Estela de partículas detrás del misil (se desvanece hacia atrás). */
const PUFFS = 22;
function MissileWake({ positions, currentFrame }: { positions: Vec3[]; currentFrame: number }) {
  const items = useMemo(() => {
    const out: { pos: [number, number, number]; opacity: number; scale: number; color: string }[] = [];
    for (let p = 0; p < PUFFS; p++) {
      const idx = currentFrame - p;
      if (idx < 0) break;
      const f = 1 - p / PUFFS;
      out.push({
        pos: dataToWorld(positions[idx]),
        opacity: 0.5 * f * f,
        scale: 0.4 + (1 - f) * 1.4,
        color: p < 4 ? "#fff0c0" : "#ff7a3d",
      });
    }
    return out;
  }, [positions, currentFrame]);
  return (
    <>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos} scale={it.scale}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial
            color={it.color}
            transparent
            opacity={it.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

/* ─────────────────────────── Sombra-disco bajo cada objeto ─────────────────────────── */

function GroundBlob({ at }: { at: [number, number, number] }) {
  const scale = Math.max(0.5, 1 + at[1] * 0.012);
  return (
    <mesh position={[at[0], 0.06, at[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <circleGeometry args={[2, 24]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
    </mesh>
  );
}

/* ─────────────────────────── Marcador de impacto ─────────────────────────── */

function HitMarker({ at, visible }: { at: [number, number, number]; visible: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.6;
  });
  if (!visible) return null;
  return (
    <group position={at}>
      <mesh ref={ring}>
        <ringGeometry args={[1.2, 1.7, 32]} />
        <meshBasicMaterial color={COLORS.hit} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={COLORS.hit} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color={COLORS.hit} intensity={30} distance={40} />
    </group>
  );
}

/* ─────────────────────────── Contenido de la escena ─────────────────────────── */

function SceneContent({ result, currentFrame }: GraphProps) {
  const f = clampFrame(result, currentFrame);

  const aircraftPos = dataToWorld(result.aircraft.position[f]);
  const missilePos = dataToWorld(result.missile.position[f]);
  const aircraftQuat = useMemo(() => quatFromVelocity(result.aircraft.velocity[f]), [result, f]);
  const missileQuat = useMemo(() => quatFromVelocity(result.missile.velocity[f]), [result, f]);

  const intercepted =
    result.outcome.intercepted &&
    result.outcome.interceptTime != null &&
    result.time[f] >= result.outcome.interceptTime - 1e-6;

  return (
    <>
      {/* Luces */}
      <hemisphereLight args={["#9fb8ff", "#0a0e16", 0.55]} />
      <directionalLight
        position={[60, 90, 40]}
        intensity={1.7}
        color="#fff2d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-50, 30, -60]} intensity={0.5} color="#4f7bff" />

      {/* Piso + grilla (detalle pedido en 7.2) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.95} metalness={0} />
      </mesh>
      <Grid
        position={[0, 0.02, 0]}
        args={[1200, 1200]}
        cellSize={10}
        cellThickness={0.6}
        cellColor={COLORS.grid}
        sectionSize={50}
        sectionThickness={1}
        sectionColor={COLORS.gridSection}
        fadeDistance={400}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Rastros y sus sombras */}
      <Trail positions={result.aircraft.position} currentFrame={f} color={COLORS.trailAircraft} />
      <Trail positions={result.missile.position} currentFrame={f} color={COLORS.trailMissile} />
      <ShadowTrail positions={result.aircraft.position} currentFrame={f} />
      <ShadowTrail positions={result.missile.position} currentFrame={f} />

      {/* Estela del misil */}
      <MissileWake positions={result.missile.position} currentFrame={f} />

      {/* Línea de visión (LOS) punteada */}
      <Line
        points={[aircraftPos, missilePos]}
        color={COLORS.los}
        lineWidth={1.5}
        dashed
        dashScale={3}
        transparent
        opacity={0.6}
      />

      {/* Sombras-disco */}
      <GroundBlob at={aircraftPos} />
      <GroundBlob at={missilePos} />

      {/* Objetos */}
      <AircraftModel position={aircraftPos} quaternion={aircraftQuat} />
      <MissileModel position={missilePos} quaternion={missileQuat} />

      {/* Impacto */}
      <HitMarker at={missilePos} visible={intercepted} />

      {/* Cámara orbitable */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={12}
        maxDistance={400}
        target={[
          result.aircraft.position[Math.floor(result.time.length / 2)][0] * SCALE * 0.7,
          result.missile.position[0][1] * SCALE * 0.45,
          0,
        ]}
      />
      <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
        <GizmoViewport axisColors={["#ff6b6b", "#7ee787", "#79c0ff"]} labelColor="#0a0e16" />
      </GizmoHelper>
    </>
  );
}

/* ─────────────────────────── Componente exportado ─────────────────────────── */

/**
 * <Trajectory3D result={...} currentFrame={...} />
 * Componente de la sección 7.2. Recibe el SimulationResult completo y el índice
 * del instante a mostrar. No mantiene estado de tiempo: ese lo provee la UI (Grupo 3).
 */
export default function Trajectory3D({ result, currentFrame }: GraphProps) {
  const initialCam = useMemo<[number, number, number]>(() => {
    const cx = result.aircraft.position[Math.floor(result.time.length / 2)][0] * SCALE * 0.7;
    const cy = result.missile.position[0][1] * SCALE * 0.45;
    return [cx - 34, cy + 40, 78];
  }, [result]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 360, background: "#0a0e16", borderRadius: 12 }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: initialCam, fov: 48, near: 0.1, far: 5000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <color attach="background" args={["#0a0e16"]} />
        <fogExp2 attach="fog" args={["#0a0e16", 0.00018]} />
        <SceneContent result={result} currentFrame={currentFrame} />
      </Canvas>
    </div>
  );
}
