import { useMemo } from "react";
import type { SimulationResult } from "../shared/types";

interface EventNavigatorProps {
  result: SimulationResult;
  currentFrame: number;
  onSeek: (frame: number) => void;
  disabled?: boolean;
  onDisabledAttempt?: () => void;
}

interface MissionMilestone {
  id: string;
  label: string;
  detail: string;
  frame: number;
  time: number;
  tone: "launch" | "closest" | "outcome";
}

function closestFrame(time: number[], target: number) {
  if (time.length === 0 || !Number.isFinite(target)) return 0;

  let closest = 0;
  for (let frame = 1; frame < time.length; frame += 1) {
    if (Math.abs(time[frame] - target) < Math.abs(time[closest] - target)) {
      closest = frame;
    }
  }
  return closest;
}

export default function EventNavigator({
  result,
  currentFrame,
  onSeek,
  disabled = false,
  onDisabledAttempt,
}: EventNavigatorProps) {
  const milestones = useMemo<MissionMilestone[]>(() => {
    const lastFrame = Math.max(0, result.time.length - 1);
    const closestApproachFrame = closestFrame(result.time, result.outcome.minDistanceTime);
    const outcomeTime = result.outcome.interceptTime ?? result.time[lastFrame] ?? 0;
    const outcomeFrame = closestFrame(result.time, outcomeTime);

    const candidates: MissionMilestone[] = [
      {
        id: "launch",
        label: "INICIO",
        detail: "Condiciones iniciales",
        frame: 0,
        time: result.time[0] ?? 0,
        tone: "launch",
      },
      {
        id: "closest",
        label: "RANGO MIN",
        detail: `${result.outcome.minDistance.toFixed(1)} m`,
        frame: closestApproachFrame,
        time: result.time[closestApproachFrame] ?? result.outcome.minDistanceTime,
        tone: "closest",
      },
      {
        id: "outcome",
        label: result.outcome.intercepted ? "INTERCEPCIÓN" : "FIN",
        detail: result.outcome.intercepted ? "Impacto registrado" : "Sin intercepción",
        frame: outcomeFrame,
        time: result.time[outcomeFrame] ?? outcomeTime,
        tone: "outcome",
      },
    ];

    return candidates.filter(
      (milestone, index) =>
        candidates.findIndex((candidate) => candidate.frame === milestone.frame) === index,
    );
  }, [result]);

  const activeIndex = milestones.reduce((selected, milestone, index) => {
    const selectedDistance = Math.abs(milestones[selected].frame - currentFrame);
    const candidateDistance = Math.abs(milestone.frame - currentFrame);
    return candidateDistance < selectedDistance ? index : selected;
  }, 0);

  const jumpTo = (frame: number) => {
    if (disabled) {
      onDisabledAttempt?.();
      return;
    }
    onSeek(frame);
  };

  const jumpRelative = (direction: -1 | 1) => {
    const nextIndex = (activeIndex + direction + milestones.length) % milestones.length;
    jumpTo(milestones[nextIndex].frame);
  };

  return (
    <div className={`event-navigator ${disabled ? "event-navigator-disabled" : ""}`}>
      <div className="event-navigator-heading">
        <span className="tac-label tac-label-hud">HITOS DE MISION</span>
        <span>Saltos sincronizados a los tres visores</span>
      </div>

      <button type="button" className="event-nav-arrow" onClick={() => jumpRelative(-1)} aria-label="Ir al hito anterior">
        ANT
      </button>

      <div className="event-navigator-track">
        {milestones.map((milestone, index) => {
          const active = index === activeIndex;
          return (
            <button
              type="button"
              key={milestone.id}
              className={`event-milestone event-milestone-${milestone.tone} ${active ? "event-milestone-active" : ""}`}
              onClick={() => jumpTo(milestone.frame)}
              aria-current={active ? "step" : undefined}
            >
              <span className="event-milestone-node" />
              <strong>{milestone.label}</strong>
              <span>{milestone.detail}</span>
              <time>T+{milestone.time.toFixed(2)}s | F{milestone.frame}</time>
            </button>
          );
        })}
      </div>

      <button type="button" className="event-nav-arrow" onClick={() => jumpRelative(1)} aria-label="Ir al siguiente hito">
        SIG
      </button>
    </div>
  );
}
