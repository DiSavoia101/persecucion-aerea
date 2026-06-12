import { useEffect, useState } from "react";

export interface GraphTheme {
  aircraft: string;
  missile: string;
  los: string;
  distance: string;
  cursor: string;
  currentPoint: string;
  minDist: string;
  intercept: string;
  gridLight: string;
  bg: string;
  paper: string;
  text: string;
  axis: string;
  legend: string;
}

const FALLBACK: GraphTheme = {
  aircraft: "#ffb02e",
  missile: "#ff3b3b",
  los: "#6f86b0",
  distance: "#6f86b0",
  cursor: "rgba(255,255,255,0.35)",
  currentPoint: "#ffffff",
  minDist: "#ffd166",
  intercept: "#ff3b3b",
  gridLight: "rgba(255,255,255,0.04)",
  bg: "#0e1521",
  paper: "#131c2b",
  text: "#c9d4e8",
  axis: "#2e4060",
  legend: "rgba(14,21,33,0.82)",
};

function readTheme(): GraphTheme {
  if (typeof document === "undefined") return FALLBACK;
  const root = document.querySelector<HTMLElement>(".ui-root");
  if (!root) return FALLBACK;
  const style = getComputedStyle(root);
  const value = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const light = ["skyOps", "lightHangar", "tacticalMap", "laboratory"].includes(root.dataset.theme ?? "");

  return {
    aircraft: value("--color-amber-glow", FALLBACK.aircraft),
    missile: value("--color-threat", FALLBACK.missile),
    los: value("--color-cyan-glow", FALLBACK.los),
    distance: value("--color-hud", FALLBACK.distance),
    cursor: value("--color-mist", FALLBACK.cursor),
    currentPoint: value("--color-bright", FALLBACK.currentPoint),
    minDist: value("--color-warning", FALLBACK.minDist),
    intercept: value("--color-danger", FALLBACK.intercept),
    gridLight: light ? "rgba(25,55,70,0.07)" : "rgba(255,255,255,0.04)",
    bg: value("--color-carbon", FALLBACK.bg),
    paper: value("--color-obsidian", FALLBACK.paper),
    text: value("--color-light", FALLBACK.text),
    axis: value("--color-slate-steel", FALLBACK.axis),
    legend: light ? "rgba(255,255,255,0.82)" : "rgba(10,14,22,0.82)",
  };
}

export function useGraphTheme(): GraphTheme {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ui-root");
    if (!root) return;
    const refresh = () => setTheme(readTheme());
    const observer = new MutationObserver(refresh);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-panel-style"] });
    refresh();
    return () => observer.disconnect();
  }, []);

  return theme;
}
