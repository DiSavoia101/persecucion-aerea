/**
 * Grupo 6 — Cadenas LaTeX para renderizar con KaTeX.
 * Cada clave corresponde a una sección de la fundamentación teórica.
 */

export const FORMULAS = {
  // 1. Modelo vectorial
  posVelAvion: String.raw`\vec{r}_A=(x_A,\,y_A,\,z_A) \qquad \vec{v}_A=(v_{xA},\,v_{yA},\,v_{zA})`,
  posVelMisil: String.raw`\vec{r}_M=(x_M,\,y_M,\,z_M) \qquad \vec{v}_M=(v_{xM},\,v_{yM},\,v_{zM})`,
  estadoGeneral: String.raw`\mathbf{X}=\left[\vec{r}_A,\ \vec{v}_A,\ \vec{r}_M,\ \vec{v}_M\right]`,

  // 2. Ecuaciones diferenciales de movimiento
  edoMovimiento: String.raw`\dot{\vec{r}}_A=\vec{v}_A \qquad \dot{\vec{v}}_A=\vec{a}_A \qquad \dot{\vec{r}}_M=\vec{v}_M \qquad \dot{\vec{v}}_M=\vec{a}_M`,

  // 3. Geometría del encuentro
  vectorRelativo: String.raw`\vec{r}_{rel}=\vec{r}_A-\vec{r}_M`,
  rango: String.raw`R=\lVert \vec{r}_{rel}\rVert`,
  velocidadRelativa: String.raw`\vec{v}_{rel}=\vec{v}_A-\vec{v}_M`,
  velocidadAproximacion: String.raw`V_c=-\frac{\vec{r}_{rel}\cdot\vec{v}_{rel}}{R}`,
  rotacionLOS: String.raw`\vec{\omega}_{LOS}=\frac{\vec{r}_{rel}\times\vec{v}_{rel}}{R^{2}}`,

  // 4. Persecución pura
  versorLOS: String.raw`\hat{r}_{rel}=\frac{\vec{r}_{rel}}{R}`,

  // 5. Navegación proporcional
  pnVectorial: String.raw`\vec{a}_M=N\left(\vec{\omega}_{LOS}\times\vec{v}_M\right)`,
  pn2D: String.raw`a_M=N\,V_c\,\dot{\lambda}`,

  // 6. Maniobras de evasión
  aceleracionLateral: String.raw`\vec{a}_A\perp\vec{v}_A \qquad \lVert\vec{a}_A\rVert\le a_{max}`,
  serpenteo: String.raw`a_A(t)=a_0\,\sin(\omega t)`,

  // 7. Integración numérica
  euler: String.raw`\mathbf{X}_{n+1}=\mathbf{X}_n+h\,f(t_n,\mathbf{X}_n)`,
  rk4K: String.raw`\begin{aligned}
k_1&=f(t_n,\,\mathbf{X}_n)\\
k_2&=f\!\left(t_n+\tfrac{h}{2},\ \mathbf{X}_n+\tfrac{h}{2}k_1\right)\\
k_3&=f\!\left(t_n+\tfrac{h}{2},\ \mathbf{X}_n+\tfrac{h}{2}k_2\right)\\
k_4&=f\!\left(t_n+h,\ \mathbf{X}_n+h\,k_3\right)
\end{aligned}`,
  rk4Paso: String.raw`\mathbf{X}_{n+1}=\mathbf{X}_n+\frac{h}{6}\left(k_1+2k_2+2k_3+k_4\right)`,

  // 8. Detección de intercepción
  distancia: String.raw`R=\lVert\vec{r}_A-\vec{r}_M\rVert`,
  condicionImpacto: String.raw`R\le \text{hitRadius}\ \Rightarrow\ \text{intercepción}`,

  // 9. Clasificación del sistema
  sistemaNoLineal: String.raw`\dot{\mathbf{X}}=f(\mathbf{X})`,
  perturbacion: String.raw`\delta\mathbf{X}=\mathbf{X}-\mathbf{X}^{*}`,
  sistemaHomogeneo: String.raw`\delta\dot{\mathbf{X}}=A\,\delta\mathbf{X}`,
  sistemaNoHomogeneo: String.raw`\delta\dot{\mathbf{X}}=A\,\delta\mathbf{X}+B\,u`,

  // 10. Estabilidad por autovalores
  autovalores: String.raw`\det(A-\lambda I)=0`,
  criterioEstabilidad: String.raw`\operatorname{Re}(\lambda_i)<0\ \forall i\ \Rightarrow\ \text{estable} \qquad \exists\,i:\operatorname{Re}(\lambda_i)>0\ \Rightarrow\ \text{inestable}`,
} as const;

export type FormulaKey = keyof typeof FORMULAS;
