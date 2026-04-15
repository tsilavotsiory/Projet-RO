import { parseValue } from "../../utils/math";

export function buildMaxModel({ consInputs, objInputs }) {
  const sense = "<=";
  const m = 3;

  const cons = [];
  for (let i = 0; i < m; i++) {
    const A = parseValue(consInputs[i]?.A);
    const B = parseValue(consInputs[i]?.B);
    const C = parseValue(consInputs[i]?.C);

    if (A == null || B == null || C == null) throw new Error("Saisis A, B, C pour les 3 contraintes.");
    if (!isFinite(A) || !isFinite(B) || !isFinite(C)) throw new Error("Coefficients invalides (ex: 3/0).");
    cons.push({ A, B, C, sense });
  }

  const p = parseValue(objInputs.p);
  const q = parseValue(objInputs.q);
  if (p == null || q == null) throw new Error("Saisis p et q.");
  if (!isFinite(p) || !isFinite(q)) throw new Error("Objectif invalide.");

  const kLine = 0;

  const model = {
    mode: "max",
    cons,
    obj: { p, q, kLine },
    /* plus proche du PDF exemple 1 */
    viewBox: { xmin: -2, xmax: 7, ymin: -1.5, ymax: 7, pad: 48 },
  };

  const linesForTable = cons
    .map((c) => ({ A: c.A, B: c.B, C: c.C }))
    .concat([{ A: p, B: q, C: kLine }]);

  return { model, linesForTable };
}