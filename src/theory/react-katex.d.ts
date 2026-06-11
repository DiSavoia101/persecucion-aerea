declare module "react-katex" {
  import type { ReactNode } from "react";

  interface KatexProps {
    children?: ReactNode;
    math?: string;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
  }

  export function BlockMath(props: KatexProps): ReactNode;
  export function InlineMath(props: KatexProps): ReactNode;
}
