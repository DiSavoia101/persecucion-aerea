import { useEffect, useMemo, useState } from "react";
import type { SimulationResult } from "../shared/types";
import { GridView2D, Trajectory3D, DistancePlot } from "../graphs";

type DisplayId = "grid" | "trajectory" | "distance";
type LayoutPreset = "balanced" | "threeLarge" | "distanceLarge";

const defaultOrder: DisplayId[] = ["grid", "trajectory", "distance"];
const defaultVisible: Record<DisplayId, boolean> = { grid: true, trajectory: true, distance: true };

function loadWorkspacePrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem("taccon-workspace-prefs") ?? "{}");
    const visible = Object.fromEntries(defaultOrder.map((id) => [id, typeof saved.visible?.[id] === "boolean" ? saved.visible[id] : defaultVisible[id]])) as Record<DisplayId, boolean>;
    const validOrder = Array.isArray(saved.order) &&
      saved.order.length === defaultOrder.length &&
      new Set(saved.order).size === defaultOrder.length &&
      saved.order.every((id: unknown) => defaultOrder.includes(id as DisplayId));
    const validLayouts: LayoutPreset[] = ["balanced", "threeLarge", "distanceLarge"];
    return {
      order: validOrder ? saved.order as DisplayId[] : defaultOrder,
      visible: Object.values(visible).some(Boolean) ? visible : defaultVisible,
      layout: validLayouts.includes(saved.layout) ? saved.layout as LayoutPreset : "balanced",
      showToolbar: saved.showToolbar !== false,
      showInspector: saved.showInspector === true,
    };
  } catch {
    return { order: defaultOrder, visible: defaultVisible, layout: "balanced" as LayoutPreset, showToolbar: true, showInspector: false };
  }
}

interface GraphWorkspaceProps {
  result: SimulationResult;
  currentFrame: number;
  onEvent?: (message: string) => void;
  demoSignal?: number;
  focusSignal?: number;
  layoutSignal?: number;
  escapeSignal?: number;
  resetSignal?: number;
  inspectorSignal?: number;
  cleanSignal?: number;
}

const displayInfo: Record<DisplayId, {
  code: string;
  title: string;
  name: string;
  description: string;
  accent: "amber" | "cyan" | "hud";
  panelClass: string;
  dotClass: string;
}> = {
  grid: {
    code: "VISOR 01",
    title: "CENITAL 2D",
    name: "GridView2D",
    description: "Vista cenital | Grilla táctica",
    accent: "amber",
    panelClass: "mil-panel-amber",
    dotClass: "bg-amber-glow",
  },
  trajectory: {
    code: "VISOR 02",
    title: "TRAYECTORIA 3D",
    name: "Trajectory3D",
    description: "Espacio de misión | Three.js",
    accent: "cyan",
    panelClass: "mil-panel-cyan",
    dotClass: "bg-cyan-glow",
  },
  distance: {
    code: "VISOR 03",
    title: "RANGO vs TIEMPO",
    name: "DistancePlot",
    description: "Distancia R(t) | Análisis de intercepción",
    accent: "hud",
    panelClass: "",
    dotClass: "bg-hud",
  },
};

export default function GraphWorkspace({ result, currentFrame, onEvent, demoSignal = 0, focusSignal = 0, layoutSignal = 0, escapeSignal = 0, resetSignal = 0, inspectorSignal = 0, cleanSignal = 0 }: GraphWorkspaceProps) {
  const [initialPrefs] = useState(loadWorkspacePrefs);
  const [order, setOrder] = useState<DisplayId[]>(initialPrefs.order);
  const [visible, setVisible] = useState<Record<DisplayId, boolean>>(initialPrefs.visible);
  const [focused, setFocused] = useState<DisplayId | null>(null);
  const [layout, setLayout] = useState<LayoutPreset>(initialPrefs.layout);
  const [showInspector, setShowInspector] = useState(initialPrefs.showInspector);
  const [showToolbar, setShowToolbar] = useState(initialPrefs.showToolbar);
  const [dragging, setDragging] = useState<DisplayId | null>(null);
  const [dropTarget, setDropTarget] = useState<DisplayId | null>(null);

  const visibleDisplays = order.filter((id) => visible[id]);
  const primaryLengths = [
    result.time.length,
    result.aircraft.position.length,
    result.aircraft.velocity.length,
    result.missile.position.length,
    result.missile.velocity.length,
    result.distance.length,
    result.closingVelocity.length,
    result.losAngle.length,
  ];
  const arraysAligned = primaryLengths.every((length) => length === result.time.length);

  useEffect(() => {
    try {
      localStorage.setItem("taccon-workspace-prefs", JSON.stringify({ order, visible, layout, showToolbar, showInspector }));
    } catch {
    }
  }, [layout, order, showInspector, showToolbar, visible]);

  useEffect(() => {
    if (demoSignal === 0) return;
    setVisible({ grid: true, trajectory: true, distance: true });
    setFocused(null);
    setLayout("balanced");
  }, [demoSignal]);

  useEffect(() => {
    if (focusSignal === 0) return;
    setFocused((current) => {
      const visibleIds = order.filter((id) => visible[id]);
      if (visibleIds.length === 0) return null;
      if (visibleIds.length === 1) return current === visibleIds[0] ? null : visibleIds[0];
      const currentIndex = current ? visibleIds.indexOf(current) : -1;
      return visibleIds[(currentIndex + 1) % visibleIds.length];
    });
  }, [focusSignal]);

  useEffect(() => {
    if (layoutSignal === 0) return;
    setFocused(null);
    setLayout((current) => current === "balanced" ? "threeLarge" : current === "threeLarge" ? "distanceLarge" : "balanced");
  }, [layoutSignal]);

  useEffect(() => {
    if (escapeSignal === 0) return;
    setFocused(null);
  }, [escapeSignal]);

  useEffect(() => {
    if (resetSignal === 0) return;
    setOrder(defaultOrder);
    setVisible(defaultVisible);
    setLayout("balanced");
    setFocused(null);
    setShowToolbar(true);
    setShowInspector(false);
  }, [resetSignal]);

  useEffect(() => {
    if (inspectorSignal === 0) return;
    setShowInspector((value) => !value);
  }, [inspectorSignal]);

  useEffect(() => {
    if (cleanSignal === 0) return;
    setShowInspector(false);
    setShowToolbar(false);
    setFocused(null);
  }, [cleanSignal]);

  const workspaceClass = useMemo(() => {
    if (focused || visibleDisplays.length === 1) return "grid-cols-1 grid-rows-1";
    if (visibleDisplays.length === 2) return "grid-cols-2 grid-rows-1";
    if (layout === "threeLarge") return "grid-cols-[2fr_1fr] grid-rows-2";
    if (layout === "distanceLarge") return "grid-cols-2 grid-rows-[0.75fr_1.25fr]";
    return "grid-cols-2 grid-rows-[1fr_0.8fr]";
  }, [focused, layout, visibleDisplays.length]);

  const toggleVisible = (id: DisplayId) => {
    if (visible[id] && visibleDisplays.length === 1) {
      onEvent?.("No se puede ocultar el último visor");
      return;
    }
    setVisible((current) => ({ ...current, [id]: !current[id] }));
    if (focused === id) setFocused(null);
    onEvent?.(`Visor ${visible[id] ? "oculto" : "visible"}: ${displayInfo[id].code}`);
  };

  const move = (id: DisplayId, direction: -1 | 1) => {
    setOrder((current) => {
      const from = current.indexOf(id);
      const to = Math.min(Math.max(0, from + direction), current.length - 1);
      if (from === to) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      onEvent?.(`Visor movido: ${displayInfo[id].code}`);
      return next;
    });
  };

  const dropOn = (target: DisplayId) => {
    if (!dragging || dragging === target) return;
    setOrder((current) => {
      const targetIndex = current.indexOf(target);
      const next = current.filter((id) => id !== dragging);
      next.splice(targetIndex, 0, dragging);
      return next;
    });
    onEvent?.(`Visor reordenado: ${displayInfo[dragging].code}`);
    setDragging(null);
    setDropTarget(null);
  };

  const copySummary = async () => {
    const summary = [
      `Fuente: mock`,
      `Frames: ${result.time.length}`,
      `Frame actual: ${currentFrame}`,
      `Tiempo: ${(result.time[currentFrame] ?? 0).toFixed(2)} / ${(result.time.at(-1) ?? 0).toFixed(2)} s`,
      `Distancia actual: ${(result.distance[currentFrame] ?? 0).toFixed(1)} m`,
      `Distancia mínima: ${result.outcome.minDistance.toFixed(1)} m`,
      `Intercepción: ${result.outcome.intercepted ? "sí" : "no"}`,
      `Integrador: ${result.metadata.integrator.toUpperCase()}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      onEvent?.("Resumen del inspector copiado");
    } catch {
      onEvent?.("No se pudo copiar el resumen");
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden tactical-grid">
      <div className="workspace-toolbar">
        <button onClick={() => setShowToolbar((value) => !value)} className="hud-mini-button" title="Mostrar u ocultar controles del área de visores">
          {showToolbar ? "OCULTAR CONTROLES" : "MOSTRAR CONTROLES"}
        </button>
        <span className="tac-label tac-label-hud">ÁREA DE VISORES</span>
        {showToolbar && <>
        <div className="flex items-center gap-1">
          {order.map((id) => (
            <button
              key={id}
              onClick={() => toggleVisible(id)}
              className={`hud-mini-button ${visible[id] ? "hud-mini-button-active" : ""}`}
              title={visible[id] && visibleDisplays.length === 1 ? "Debe quedar al menos un visor visible" : undefined}
            >
              {displayInfo[id].code.replace("VISOR ", "V")}
            </button>
          ))}
        </div>
        <span className="h-3 w-px bg-slate-steel" />
        {(["balanced", "threeLarge", "distanceLarge"] as LayoutPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setFocused(null);
              setLayout(preset);
              onEvent?.(`Distribución: ${preset === "balanced" ? "Balanceada" : preset === "threeLarge" ? "3D dominante" : "Análisis de distancia"}`);
            }}
            className={`hud-mini-button ${layout === preset && !focused ? "hud-mini-button-active" : ""}`}
          >
            {preset === "balanced" ? "BALANCEADO" : preset === "threeLarge" ? "3D DOMINANTE" : "DISTANCIA"}
          </button>
        ))}
        <button onClick={() => {
          setShowInspector((value) => !value);
          onEvent?.(`Inspector ${showInspector ? "cerrado" : "abierto"}`);
        }} className={`hud-mini-button ml-auto ${showInspector ? "hud-mini-button-active" : ""}`}>
          INSPECTOR
        </button>
        </>}
      </div>

      {showInspector && (
        <div className="result-inspector">
          <InspectorCell label="FUENTE" value="MOCK" />
          <InspectorCell label="FRAMES" value={String(result.time.length)} />
          <InspectorCell label="FRAME ACTUAL" value={String(currentFrame)} />
          <InspectorCell label="TIEMPO ACTUAL" value={`${(result.time[currentFrame] ?? 0).toFixed(2)}s`} />
          <InspectorCell label="TIEMPO TOTAL" value={`${(result.time.at(-1) ?? 0).toFixed(2)}s`} />
          <InspectorCell label="DISTANCIA ACTUAL" value={`${(result.distance[currentFrame] ?? 0).toFixed(1)}m`} />
          <InspectorCell label="INTEGRADOR" value={result.metadata.integrator.toUpperCase()} />
          <InspectorCell label="ARREGLOS" value={arraysAligned ? "ALINEADOS" : "REVISAR"} warning={!arraysAligned} />
          <InspectorCell label="R MIN" value={`${result.outcome.minDistance.toFixed(1)}m`} />
          <InspectorCell label="INTERCEPCIÓN" value={result.outcome.intercepted ? `SÍ · ${result.outcome.interceptTime?.toFixed(2)}s` : "NO"} />
          <button onClick={copySummary} className="hud-mini-button">COPIAR RESUMEN</button>
        </div>
      )}

      <div className={`workspace-grid flex-1 min-h-0 p-3 grid gap-2 overflow-hidden ${workspaceClass}`}>
        {visibleDisplays.map((id) => {
          if (focused && focused !== id) return null;
          const info = displayInfo[id];
          const spanClass = getSpanClass(id, visibleDisplays.length, layout, focused);

          return (
            <section
              key={id}
              draggable
              onDragStart={() => setDragging(id)}
              onDragEnd={() => {
                setDragging(null);
                setDropTarget(null);
              }}
              onDragEnter={() => setDropTarget(id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(id)}
              className={`mil-panel ${info.panelClass} p-0 flex flex-col min-h-0 relative ${spanClass} ${dragging === id ? "display-dragging" : ""} ${dropTarget === id && dragging !== id ? "display-drop-target" : ""}`}
            >
              <div className="mil-corners flex flex-col min-h-0 h-full">
                <div className="display-toolbar">
                  <div className={`w-1.5 h-1.5 pulse-dot ${info.dotClass}`} />
                  <span className="tac-label">{info.code}</span>
                  <span className="text-[8px] text-mist tracking-widest">{info.title}</span>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => move(id, -1)} className="hud-icon-button" title="Mover antes" aria-label={`Mover ${info.code} antes`}>◂</button>
                    <button onClick={() => move(id, 1)} className="hud-icon-button" title="Mover después" aria-label={`Mover ${info.code} después`}>▸</button>
                    <button onClick={() => {
                      setFocused(focused === id ? null : id);
                      onEvent?.(`${focused === id ? "Foco restaurado" : "Visor enfocado"}: ${info.code}`);
                    }} className="hud-icon-button" title={focused === id ? "Restaurar" : "Enfocar"}>
                      {focused === id ? "RESTAURAR" : "ENFOCAR"}
                    </button>
                    <button onClick={() => toggleVisible(id)} className="hud-icon-button" title="Ocultar">OCULTAR</button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 p-2 graph-container">
                  {id === "grid" && <GridView2D result={result} currentFrame={currentFrame} />}
                  {id === "trajectory" && <Trajectory3D result={result} currentFrame={currentFrame} />}
                  {id === "distance" && <DistancePlot result={result} currentFrame={currentFrame} />}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function getSpanClass(id: DisplayId, visibleCount: number, layout: LayoutPreset, focused: DisplayId | null) {
  if (focused || visibleCount < 3) return "";
  if (layout === "balanced" && id === "distance") return "col-span-2";
  if (layout === "threeLarge" && id === "trajectory") return "row-span-2";
  if (layout === "distanceLarge" && id === "distance") return "col-span-2";
  return "";
}

function InspectorCell({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <div>
      <span className="text-ash">{label}: </span>
      <span className={warning ? "text-danger" : "text-hud"}>{value}</span>
    </div>
  );
}
