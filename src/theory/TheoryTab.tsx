/**
 * Grupo 6 — Pestaña de fundamentos teóricos (KaTeX).
 * Acordeón expandible: justificación, método, fórmula y paso a paso por sección.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import katex from "katex";
import "katex/dist/katex.min.css";
import { FORMULAS } from "./formulas";

type Formula = { label?: string; latex: string };

type Section = {
  id: string;
  code: string;
  title: string;
  justificacion: string;
  metodo: string;
  formulas: Formula[];
  pasos: string[];
};

function Math({ latex }: { latex: string }) {
  const html = katex.renderToString(latex, {
    displayMode: true,
    throwOnError: false,
  });
  return (
    <div
      className="katex-block overflow-x-auto py-1 text-bright"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const SECTIONS: Section[] = [
  {
    id: "modelo-vectorial",
    code: "THR-02.1",
    title: "MODELO VECTORIAL EN COORDENADAS CARTESIANAS",
    justificacion:
      "La posición indica dónde está cada objeto y la velocidad cómo cambia esa posición en el tiempo. Como misil y avión se mueven continuamente, los vectores describen dirección, sentido y magnitud del movimiento con un único modelo que sirve para 2D (z = 0) y 3D.",
    metodo:
      "Cada objeto se representa con dos vectores principales: posición y velocidad. Ambos se agrupan en un estado general del sistema que se actualiza en cada instante.",
    formulas: [
      { label: "Avión", latex: FORMULAS.posVelAvion },
      { label: "Misil", latex: FORMULAS.posVelMisil },
      { label: "Estado general", latex: FORMULAS.estadoGeneral },
    ],
    pasos: [
      "Se define la posición inicial del avión.",
      "Se define la velocidad inicial del avión.",
      "Se define la posición inicial del misil.",
      "Se define la velocidad inicial del misil.",
      "Se agrupan esos datos en el estado general X.",
      "En cada instante de tiempo se actualizan posiciones y velocidades.",
    ],
  },
  {
    id: "edo-movimiento",
    code: "THR-02.2",
    title: "ECUACIONES DIFERENCIALES DE MOVIMIENTO",
    justificacion:
      "El movimiento físico se describe mediante relaciones entre posición, velocidad y aceleración. Conociendo la aceleración aplicada a cada cuerpo se puede calcular su velocidad y posición futuras.",
    metodo:
      "Ecuaciones diferenciales ordinarias: la posición cambia según la velocidad y la velocidad según la aceleración. El punto sobre la variable indica derivada respecto del tiempo.",
    formulas: [{ latex: FORMULAS.edoMovimiento }],
    pasos: [
      "Se parte del estado inicial.",
      "Se calcula la aceleración del avión según la maniobra elegida.",
      "Se calcula la aceleración del misil según la ley de guiado.",
      "Con esas aceleraciones se obtiene la variación de velocidad.",
      "Con la velocidad se obtiene la variación de posición.",
      "Se repite el proceso en pequeños intervalos de tiempo.",
    ],
  },
  {
    id: "geometria-encuentro",
    code: "THR-02.3",
    title: "GEOMETRÍA DEL ENCUENTRO",
    justificacion:
      "El misil necesita saber no solo dónde está el avión sino cómo cambia esa relación: si la distancia disminuye hay acercamiento; si la línea de visión rota, el misil no sigue un curso directo de intercepción. La geometría relativa es la base del guiado.",
    metodo:
      "Geometría vectorial: se calculan el vector relativo, el rango, la velocidad relativa, la velocidad de aproximación y la rotación de la línea de visión (LOS). Estas cantidades se evalúan en cada instante porque alimentan el guiado y el gráfico distancia–tiempo.",
    formulas: [
      { label: "Vector relativo", latex: FORMULAS.vectorRelativo },
      { label: "Rango", latex: FORMULAS.rango },
      { label: "Velocidad relativa", latex: FORMULAS.velocidadRelativa },
      { label: "Velocidad de aproximación", latex: FORMULAS.velocidadAproximacion },
      { label: "Rotación de la línea de visión", latex: FORMULAS.rotacionLOS },
    ],
    pasos: [
      "Se toma la posición del avión y se le resta la del misil para obtener el vector relativo.",
      "Se calcula su norma para obtener la distancia R.",
      "Se calcula la velocidad relativa.",
      "Se calcula la velocidad de aproximación Vc.",
      "Se calcula la rotación de la línea de visión ωLOS.",
      "Esos valores se usan para decidir cómo corrige su dirección el misil.",
    ],
  },
  {
    id: "persecucion-pura",
    code: "THR-02.4",
    title: "MÉTODO DE PERSECUCIÓN PURA",
    justificacion:
      "Es la estrategia directa: apuntar a la posición actual del objetivo. Su limitación es que no anticipa el movimiento futuro del blanco: cuando el misil llega, el avión ya se desplazó. Sirve como referencia para comparar con la navegación proporcional.",
    metodo:
      "El misil orienta siempre su movimiento hacia la posición actual del avión, es decir hacia el versor de la línea de visión.",
    formulas: [{ label: "Versor de línea de visión", latex: FORMULAS.versorLOS }],
    pasos: [
      "Se calcula el vector relativo entre avión y misil.",
      "Se normaliza para obtener la dirección hacia el avión.",
      "Se compara esa dirección con la dirección actual de la velocidad del misil.",
      "Se calcula una aceleración lateral que haga girar al misil hacia el avión.",
      "Se limita la aceleración con un valor máximo físico.",
      "Se actualizan velocidad y posición del misil.",
    ],
  },
  {
    id: "navegacion-proporcional",
    code: "THR-02.5",
    title: "NAVEGACIÓN PROPORCIONAL (PN)",
    justificacion:
      "En una trayectoria de impacto ideal la línea visual misil–avión mantiene dirección constante. Si gira, el misil debe corregir: la rotación de la LOS es la señal de error. Es la ley de guiado central del proyecto; su objetivo es anular la rotación de la LOS para quedar en curso de colisión.",
    metodo:
      "El misil acelera en proporción a la velocidad de rotación de la línea de visión, con constante de navegación N.",
    formulas: [
      { label: "Forma vectorial", latex: FORMULAS.pnVectorial },
      { label: "Forma 2D", latex: FORMULAS.pn2D },
    ],
    pasos: [
      "Se calcula el vector relativo y la velocidad relativa.",
      "Se calcula la rotación de la línea de visión ωLOS.",
      "Se toma la velocidad actual del misil.",
      "Se calcula la aceleración comandada aM = N(ωLOS × vM).",
      "Se limita la aceleración según el máximo permitido.",
      "Se actualiza el movimiento del misil.",
      "Se verifica si la distancia llegó al radio de intercepción.",
    ],
  },
  {
    id: "maniobras-evasion",
    code: "THR-02.6",
    title: "MANIOBRAS DE EVASIÓN DEL AVIÓN",
    justificacion:
      "Una aeronave no se detiene ni cambia de dirección instantáneamente: vira mediante aceleraciones laterales perpendiculares a su velocidad. Las maniobras generan escenarios distintos de simulación: no es lo mismo perseguir un vuelo recto que uno evasivo.",
    metodo:
      "Modelos de aceleración lateral para cuatro maniobras: vuelo recto, viraje constante, serpenteo senoidal y evasión reactiva. La aceleración se aplica perpendicular a la velocidad para cambiar el rumbo sin alterar bruscamente la rapidez.",
    formulas: [
      { label: "Aceleración lateral acotada", latex: FORMULAS.aceleracionLateral },
      { label: "Serpenteo senoidal", latex: FORMULAS.serpenteo },
    ],
    pasos: [
      "Se elige el tipo de maniobra.",
      "Se calcula la dirección de movimiento actual del avión.",
      "Se calcula una aceleración perpendicular a esa velocidad.",
      "Vuelo recto: aceleración cero. Viraje constante: magnitud fija.",
      "Serpenteo: la aceleración varía con una función senoidal.",
      "Evasión reactiva: la aceleración se orienta para alejarse del misil.",
      "Se limita la aceleración con maxAccel.",
      "Se actualizan velocidad y posición del avión.",
    ],
  },
  {
    id: "integracion-numerica",
    code: "THR-02.7",
    title: "INTEGRACIÓN NUMÉRICA: EULER Y RUNGE–KUTTA 4",
    justificacion:
      "Las ecuaciones diferenciales del sistema no se resuelven de forma exacta, por lo que se avanza paso a paso en el tiempo. Euler aproxima con la recta tangente (simple pero acumula error); RK4 combina cuatro pendientes y representa mejor trayectorias curvas, fundamentales cuando misil y avión cambian de dirección constantemente. El proyecto recomienda RK4 y usa Euler como alternativa didáctica.",
    metodo:
      "Euler usa una sola pendiente por paso. RK4 evalúa el sistema al inicio, dos veces en el punto medio y al final del intervalo, y promedia con pesos 1-2-2-1.",
    formulas: [
      { label: "Euler", latex: FORMULAS.euler },
      { label: "RK4 — pendientes intermedias", latex: FORMULAS.rk4K },
      { label: "RK4 — paso", latex: FORMULAS.rk4Paso },
    ],
    pasos: [
      "Se toma el estado actual del sistema.",
      "Euler: se calcula la derivada, se multiplica por h y se suma al estado.",
      "RK4: se calcula k1 (pendiente inicial).",
      "Se calculan k2 y k3 con estimaciones a mitad del intervalo.",
      "Se calcula k4 con una estimación al final del intervalo.",
      "Se combinan las cuatro pendientes con el promedio ponderado.",
      "Se actualiza el estado y se guarda en el resultado de la simulación.",
      "Se verifica si hubo intercepción; si no, y queda tiempo, se repite el ciclo.",
    ],
  },
  {
    id: "deteccion-intercepcion",
    code: "THR-02.8",
    title: "DETECCIÓN DE INTERCEPCIÓN Y DISTANCIA MÍNIMA",
    justificacion:
      "Como el tiempo avanza en pasos discretos, el misil puede no llegar exactamente a distancia cero. Por eso se usa un radio de impacto: si la distancia cae por debajo de ese umbral se considera intercepción.",
    metodo:
      "Cálculo de distancia entre dos puntos en cada paso, comparación contra hitRadius y registro de la distancia mínima alcanzada en toda la corrida.",
    formulas: [
      { label: "Distancia", latex: FORMULAS.distancia },
      { label: "Condición de impacto", latex: FORMULAS.condicionImpacto },
    ],
    pasos: [
      "En cada paso se calcula la distancia R.",
      "Se compara R con hitRadius.",
      "Si R ≤ hitRadius, se detiene la simulación y se guarda el tiempo de intercepción.",
      "Si no, se sigue simulando.",
      "En todos los pasos se compara la distancia actual con la mínima registrada.",
      "Al final se informa si hubo intercepción, cuándo ocurrió y la distancia mínima.",
    ],
  },
  {
    id: "clasificacion-sistema",
    code: "THR-02.9",
    title: "CLASIFICACIÓN: LINEAL, NO LINEAL, HOMOGÉNEO Y NO HOMOGÉNEO",
    justificacion:
      "El sistema completo es no lineal por la normalización de vectores, las divisiones por R o R², los productos vectoriales y las funciones trigonométricas. Clasificarlo conecta la simulación con la teoría de la materia y habilita el análisis con matrices y autovalores.",
    metodo:
      "Análisis de sistemas dinámicos: el sistema es no lineal en su forma completa, linealizable alrededor de una trayectoria de referencia, homogéneo si el avión no maniobra y no homogéneo si introduce maniobras externas.",
    formulas: [
      { label: "Sistema completo (no lineal)", latex: FORMULAS.sistemaNoLineal },
      { label: "Perturbación", latex: FORMULAS.perturbacion },
      { label: "Linealizado homogéneo", latex: FORMULAS.sistemaHomogeneo },
      { label: "Linealizado no homogéneo", latex: FORMULAS.sistemaNoHomogeneo },
    ],
    pasos: [
      "Se identifica el sistema completo Ẋ = f(X).",
      "Se observa que f(X) no es lineal por las operaciones mencionadas.",
      "Se elige una trayectoria nominal de referencia, por ejemplo un curso de colisión.",
      "Se definen pequeñas perturbaciones δX = X − X*.",
      "Se aproxima el sistema con la matriz A: δẊ = AδX.",
      "Sin maniobra del avión no hay entrada externa: sistema homogéneo.",
      "Con maniobra aparece el término de forzado Bu: sistema no homogéneo.",
    ],
  },
  {
    id: "estabilidad-autovalores",
    code: "THR-02.10",
    title: "ANÁLISIS DE ESTABILIDAD MEDIANTE AUTOVALORES",
    justificacion:
      "En sistemas lineales los autovalores permiten estudiar la estabilidad sin simular todos los casos: si las partes reales son negativas las perturbaciones desaparecen; si alguna es positiva, crecen. Explica por qué ciertas configuraciones de navegación proporcional son más estables que otras.",
    metodo:
      "Se estudian los autovalores de la matriz A del sistema linealizado δẊ = AδX y se analiza el signo de sus partes reales.",
    formulas: [
      { label: "Ecuación característica", latex: FORMULAS.autovalores },
      { label: "Criterio de estabilidad", latex: FORMULAS.criterioEstabilidad },
    ],
    pasos: [
      "Se toma el sistema no lineal.",
      "Se elige un punto o trayectoria de referencia.",
      "Se linealiza el sistema alrededor de esa referencia.",
      "Se obtiene la matriz A.",
      "Se calculan los autovalores de A.",
      "Se analizan sus partes reales.",
      "Se concluye si el sistema es estable o inestable.",
      "Se compara esa conclusión con lo observado en los gráficos.",
    ],
  },
];

function SectionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-1 bg-hud" />
        <span className="text-[9px] font-bold tracking-[0.2em] text-hud">{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function TheoryTab() {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOpen = openIds.size === SECTIONS.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mil-panel p-6 mb-4">
        <div className="mil-corners">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-hud" />
              <span className="tac-label tac-label-hud">FUNDAMENTACIÓN TEÓRICA</span>
              <span className="text-[8px] text-mist ml-2">[THR-02]</span>
            </div>
            <button
              onClick={() =>
                setOpenIds(allOpen ? new Set() : new Set(SECTIONS.map((section) => section.id)))
              }
              className="hud-mini-button"
            >
              {allOpen ? "CONTRAER TODO" : "EXPANDIR TODO"}
            </button>
          </div>
          <div className="mil-divider mb-4" />
          <p className="text-mist text-[11px] leading-relaxed tracking-wide">
            MODELO MATEMÁTICO DE LA PERSECUCIÓN AVIÓN–MISIL: ECUACIONES DE MOVIMIENTO,
            GEOMETRÍA DEL ENCUENTRO, LEYES DE GUIADO, INTEGRACIÓN NUMÉRICA,
            CLASIFICACIÓN DEL SISTEMA Y ANÁLISIS DE ESTABILIDAD.
            SELECCIONÁ UNA SECCIÓN PARA VER JUSTIFICACIÓN, MÉTODO, FÓRMULA Y PASO A PASO.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {SECTIONS.map((section, index) => {
          const open = openIds.has(section.id);
          return (
            <div key={section.id} className="mil-panel">
              <button
                onClick={() => toggle(section.id)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer group"
              >
                <span className="text-[8px] text-mist tracking-[0.15em] w-16 flex-shrink-0">
                  [{section.code}]
                </span>
                <span
                  className={`text-[10px] font-bold tracking-[0.15em] flex-1 transition-colors ${
                    open ? "text-hud" : "text-mist group-hover:text-bright"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")} · {section.title}
                </span>
                <motion.span
                  animate={{ rotate: open ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[10px] ${open ? "text-hud" : "text-ash"}`}
                >
                  ▸
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5">
                      <div className="mil-divider mb-4" />

                      <SectionBlock label="JUSTIFICACIÓN">
                        <p className="text-mist text-[11px] leading-relaxed">
                          {section.justificacion}
                        </p>
                      </SectionBlock>

                      <SectionBlock label="MÉTODO">
                        <p className="text-mist text-[11px] leading-relaxed">{section.metodo}</p>
                      </SectionBlock>

                      {section.formulas.length > 0 && (
                        <SectionBlock label="FÓRMULA">
                          <div className="border border-slate-steel/60 bg-obsidian/40 px-3 py-2">
                            {section.formulas.map((formula) => (
                              <div key={formula.latex} className="py-1">
                                {formula.label && (
                                  <span className="text-[8px] text-ash tracking-[0.2em]">
                                    {formula.label.toUpperCase()}
                                  </span>
                                )}
                                <Math latex={formula.latex} />
                              </div>
                            ))}
                          </div>
                        </SectionBlock>
                      )}

                      <SectionBlock label="PASO A PASO">
                        <ol className="flex flex-col gap-1.5">
                          {section.pasos.map((paso, pasoIndex) => (
                            <li key={paso} className="flex items-start gap-2 text-[11px] text-mist leading-relaxed">
                              <span className="text-hud text-[9px] font-bold w-6 flex-shrink-0 pt-0.5">
                                {String(pasoIndex + 1).padStart(2, "0")}
                              </span>
                              <span>{paso}</span>
                            </li>
                          ))}
                        </ol>
                      </SectionBlock>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
