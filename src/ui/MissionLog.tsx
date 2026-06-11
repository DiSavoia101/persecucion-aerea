export interface MissionEvent {
  id: number;
  time: string;
  message: string;
  tone?: "info" | "success" | "warning";
}

interface MissionLogProps {
  events: MissionEvent[];
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MissionLog({ events, onClear, open, onOpenChange }: MissionLogProps) {
  const safeEvents = Array.isArray(events) ? events.filter((event) => event?.id != null && event?.message) : [];
  return (
    <aside className={`mission-log ${open ? "mission-log-open" : ""}`}>
      <div className="mission-log-header">
        <button onClick={() => onOpenChange(!open)} className="hud-mini-button" aria-expanded={open} aria-label="Abrir o cerrar bitácora">
          BITÁCORA · {safeEvents.length}
        </button>
        {open && <button onClick={onClear} className="hud-icon-button">LIMPIAR</button>}
      </div>
      {open && (
        <div className="mission-log-events" aria-live="polite">
          {safeEvents.length === 0 && <div className="text-ash">Sin eventos de misión registrados.</div>}
          {safeEvents.map((event) => (
            <div key={event.id} className={`mission-log-event mission-log-${event.tone ?? "info"}`}>
              <span>{event.time}</span>
              <strong>&gt; {event.message}</strong>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
