/**
 * Trajectory3D.tsx — Gráfico 2 (escena 3D).
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

import { useMemo } from "react";
import { Canvas, type ThreeElements } from "@react-three/fiber";
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

/* ─────────────────────────── Cielo (gradiente + estrellas + sol) ─────────────────────────── */

const SKY_VERT = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = `
  varying vec3 vWorldPosition;
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 horizonColor;
  uniform float offset;
  uniform float exponent;
  void main() {
    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
    float t = max(pow(max(h, 0.0), exponent), 0.0);
    vec3 sky = mix(bottomColor, topColor, t);
    float band = exp(-abs(h) * 6.0);
    sky = mix(sky, horizonColor, band * 0.55);
    gl_FragColor = vec4(sky, 1.0);
  }
`;

/** Posición del sol bajo, usada también para orientar la luz direccional principal. */
export const SUN_DIRECTION: [number, number, number] = [-70, 55, -110];

function Sky() {
  const skyUniforms = useMemo(() => ({
    topColor: { value: new THREE.Color("#0a1228") },
    bottomColor: { value: new THREE.Color("#3a3f5c") },
    horizonColor: { value: new THREE.Color("#ffb37a") },
    offset: { value: 60 },
    exponent: { value: 0.7 },
  }), []);

  // Estrellas: posiciones deterministas, mitad superior del cielo.
  const starPositions = useMemo(() => {
    const STAR_COUNT = 900;
    const pos = new Float32Array(STAR_COUNT * 3);
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 2200;
      const theta = rnd() * Math.PI * 2;
      const phi = rnd() * Math.PI * 0.45;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) + 200;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, []);

  const sunPos = SUN_DIRECTION;

  // Cordillera lejana (silueta), da profundidad al horizonte
  const mountainGeo = useMemo(() => {
    const SEGS = 64, R = 1900;
    const verts: number[] = [], colors: number[] = [];
    let seed = 555;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const baseCol = new THREE.Color("#141c30");
    const peakCol = new THREE.Color("#232c4a");
    for (let i = 0; i < SEGS; i++) {
      const a0 = (i / SEGS) * Math.PI * 2;
      const a1 = ((i + 1) / SEGS) * Math.PI * 2;
      const h0 = 60 + rnd() * 220;
      const h1 = 60 + rnd() * 220;
      const x0 = Math.cos(a0) * R, z0 = Math.sin(a0) * R;
      const x1 = Math.cos(a1) * R, z1 = Math.sin(a1) * R;
      verts.push(x0,-5,z0,  x0,h0,z0,  x1,-5,z1);
      verts.push(x1,-5,z1,  x0,h0,z0,  x1,h1,z1);
      const c0 = baseCol.clone().lerp(peakCol, h0/280);
      const c1 = baseCol.clone().lerp(peakCol, h1/280);
      colors.push(baseCol.r,baseCol.g,baseCol.b, c0.r,c0.g,c0.b, baseCol.r,baseCol.g,baseCol.b);
      colors.push(baseCol.r,baseCol.g,baseCol.b, c0.r,c0.g,c0.b, c1.r,c1.g,c1.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Nubes lejanas (sprites con textura radial generada en canvas)
  const cloudTexture = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const ctx = cv.getContext("2d")!;
    const grad = ctx.createRadialGradient(64,64,0, 64,64,64);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(cv);
  }, []);

  const clouds = useMemo(() => {
    let seed = 777;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    return Array.from({ length: 14 }, () => {
      const dist = 900 + rnd() * 900;
      const ang = rnd() * Math.PI * 2;
      const height = 150 + rnd() * 250;
      const warm = rnd() < 0.4;
      const sc = 300 + rnd() * 500;
      return {
        pos: [Math.cos(ang)*dist, height, Math.sin(ang)*dist] as [number, number, number],
        scale: [sc, sc * (0.45 + rnd()*0.25), 1] as [number, number, number],
        color: warm ? "#ffd9b0" : "#ffffff",
        opacity: 0.18 + rnd()*0.18,
      };
    });
  }, []);

  return (
    <>
      <mesh>
        <sphereGeometry args={[2400, 32, 16]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          uniforms={skyUniforms}
          vertexShader={SKY_VERT}
          fragmentShader={SKY_FRAG}
        />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#cfe0ff" size={2.2} sizeAttenuation={false} transparent opacity={0.55} fog={false} />
      </points>
      {/* Sol bajo + halo */}
      <mesh position={sunPos} rotation={[0, Math.atan2(-sunPos[0], -sunPos[2]), 0]}>
        <circleGeometry args={[70, 32]} />
        <meshBasicMaterial color="#fff1d6" fog={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={sunPos} rotation={[0, Math.atan2(-sunPos[0], -sunPos[2]), 0]}>
        <circleGeometry args={[220, 32]} />
        <meshBasicMaterial color="#ff9d5c" fog={false} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Cordillera lejana */}
      <mesh geometry={mountainGeo}>
        <meshBasicMaterial vertexColors fog side={THREE.DoubleSide} />
      </mesh>

      {/* Nubes */}
      {clouds.map((c, i) => (
        <sprite key={i} position={c.pos} scale={c.scale}>
          <spriteMaterial
            map={cloudTexture}
            color={c.color}
            transparent
            opacity={c.opacity}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}
    </>
  );
}



function GroundBlob({ at }: { at: [number, number, number] }) {
  const scale = Math.max(0.5, 1 + at[1] * 0.012);
  return (
    <mesh position={[at[0], 0.06, at[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <circleGeometry args={[2, 24]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
    </mesh>
  );
}

/* ─────────────────────────── Explosión al impacto ───────────────────────────
   Animada según tau = (time[f] - interceptTime) / EXPLOSION_DURATION, no según
   frames "reales": así crece/decae correctamente al mover el scrubber, en
   cualquier dirección. visible solo si tau ∈ [0, 1]. */

export const EXPLOSION_DURATION = 1.6; // segundos de simulación

const DEBRIS_N = 14;
function makeDebris() {
  let seed = 99001;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  return Array.from({ length: DEBRIS_N }, () => {
    const theta = rnd() * Math.PI * 2;
    const phi = Math.acos(2 * rnd() - 1);
    const dir: [number, number, number] = [
      Math.sin(phi) * Math.cos(theta),
      Math.abs(Math.sin(phi) * Math.sin(theta)) * 1.2 + 0.2,
      Math.cos(phi),
    ];
    const spin: [number, number, number] = [rnd() * 8, rnd() * 8, rnd() * 8];
    const scale = 0.5 + rnd();
    return { dir, spin, scale };
  });
}

const EMBER_N = 40;
function makeEmbers() {
  let seed = 4242;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  return Array.from({ length: EMBER_N }, () => {
    const theta = rnd() * Math.PI * 2;
    const r = rnd();
    return { dx: Math.cos(theta) * r, dz: Math.sin(theta) * r, dy: 0.5 + rnd() * 1.0, sp: 0.6 + rnd() * 1.2 };
  });
}

function Explosion({ at, tau }: { at: [number, number, number]; tau: number }) {
  const debris = useMemo(makeDebris, []);
  const emberDirs = useMemo(makeEmbers, []);
  const visible = tau >= 0 && tau <= 1;

  const grow = Math.min(1, tau / 0.35);
  const fade = tau < 0.35 ? 1 : Math.max(0, 1 - (tau - 0.35) / 0.45);
  const easedGrow = 1 - Math.pow(1 - grow, 3);
  const outerScale = 0.5 + easedGrow * 9;
  const coreScale = 0.3 + easedGrow * 5;

  const swT = Math.min(1, tau / 0.6);
  const shockScale = 1 + swT * 26;
  const shockOpacity = 0.6 * (1 - swT);

  const smokeScale = 1 + tau * 7;
  const smokeY = tau * 6;
  const smokeOpacity = 0.35 * Math.sin(Math.min(1, Math.max(0, tau)) * Math.PI);

  const blastIntensity = 250 * Math.max(0, 1 - tau / 0.3);

  const t = tau * EXPLOSION_DURATION;

  // Embers: posiciones según t, con fade y titileo
  const emberPositions = useMemo(() => {
    const arr = new Float32Array(EMBER_N * 3);
    for (let i = 0; i < EMBER_N; i++) {
      const e = emberDirs[i];
      const speed = 10 * e.sp;
      arr[i*3]   = e.dx * speed * t;
      arr[i*3+1] = e.dy * speed * t - 0.5 * 14 * t * t;
      arr[i*3+2] = e.dz * speed * t;
    }
    return arr;
  }, [emberDirs, t]);
  const emberOpacity = Math.max(0, 1 - tau / 0.8) * (0.6 + 0.4 * Math.sin(tau * 40));

  if (!visible) return null;

  return (
    <group position={at}>
      {/* Bola de fuego */}
      <mesh scale={outerScale}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial color="#ff5a1f" transparent opacity={0.55 * fade} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={coreScale}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial color="#fff2c0" transparent opacity={0.85 * fade} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Destello inicial, muy breve */}
      <mesh scale={1 + tau * 30}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={Math.max(0, 1 - tau / 0.12) * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Onda de choque, plana sobre el piso */}
      <mesh scale={shockScale} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 1.12, 48]} />
        <meshBasicMaterial color="#ffe0a0" transparent opacity={shockOpacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Segunda onda de choque, más amplia y demorada */}
      {tau > 0.1 && (() => {
        const sw2T = Math.min(1, (tau - 0.1) / 0.5);
        return (
          <mesh scale={1 + sw2T * 18} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1, 1.08, 48]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5 * (1 - sw2T)} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })()}

      {/* Chispas / embers */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffaa33" size={0.6} transparent opacity={emberOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* Humo */}
      <mesh scale={smokeScale} position={[0, smokeY, 0]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshBasicMaterial color="#44403a" transparent opacity={smokeOpacity} depthWrite={false} />
      </mesh>

      {/* Destello */}
      <pointLight color="#ffaa55" intensity={blastIntensity} distance={120} />

      {/* Escombros */}
      {tau < 0.95 && debris.map((d, i) => {
        const x = d.dir[0] * 14 * t;
        const z = d.dir[2] * 14 * t;
        const y = Math.max(0, d.dir[1] * 14 * t - 0.5 * 18 * t * t);
        return (
          <mesh
            key={i}
            position={[x, y, z]}
            rotation={[d.spin[0] * t, d.spin[1] * t, d.spin[2] * t]}
            scale={d.scale}
            castShadow
          >
            <icosahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color="#3a3a3a" emissive="#ff5500" emissiveIntensity={0.6} roughness={0.8} />
          </mesh>
        );
      })}
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

  const interceptT = result.outcome.interceptTime;
  const hasIntercept = result.outcome.intercepted && interceptT != null;
  const tau = hasIntercept ? (result.time[f] - interceptT) / EXPLOSION_DURATION : -1;
  const hideObjects = hasIntercept && tau >= 0 && tau < 0.5;

  return (
    <>
      {/* Cielo: gradiente de atardecer + estrellas + sol */}
      <Sky />

      {/* Luces */}
      <hemisphereLight args={["#6f86b0", "#1a1530", 0.6]} />
      <directionalLight
        position={SUN_DIRECTION}
        intensity={1.9}
        color="#ffd9a8"
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
      <directionalLight position={[60, 40, 80]} intensity={0.6} color="#4f7bff" />

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

      {/* Objetos (ocultos durante el destello principal de la explosión) */}
      {!hideObjects && <AircraftModel position={aircraftPos} quaternion={aircraftQuat} />}
      {!hideObjects && <MissileModel position={missilePos} quaternion={missileQuat} />}

      {/* Impacto: explosión animada por tiempo */}
      <Explosion at={missilePos} tau={tau} />

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
        <color attach="background" args={["#0a1228"]} />
        <fogExp2 attach="fog" args={["#0a1228", 0.00012]} />
        <SceneContent result={result} currentFrame={currentFrame} />
      </Canvas>
    </div>
  );
}
