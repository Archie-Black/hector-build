import { dispatch } from "./swarm";
import { dream } from "./dream";
import { sense } from "./soma";
import { snapshot } from "./kpis";
import { graphSize } from "./memory";
import { tape } from "./broker";

export function wake() {
  return { soma: sense(), kpis: snapshot(), graph: graphSize(), bus: tape().length };
}

export { dispatch, dream, sense, snapshot as kpis };
