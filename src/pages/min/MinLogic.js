import { parseValue } from "../../utils/math";

export function buildMinModel({ consInputs, objInputs, kObjInput }) {
  const sense = ">=";
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

  const kLine = parseValue(kObjInput);
  if (kLine == null) throw new Error("En MIN, k est obligatoire (ex: 24).");
  if (!isFinite(kLine)) throw new Error("k invalide.");

  const model = {
    mode: "min",
    cons,
    obj: { p, q, kLine },
    /* plus proche du PDF exemple 2 */
    viewBox: { xmin: -1, xmax: 4, ymin: 0, ymax: 4.8, pad: 48 },
  };

  const linesForTable = cons
    .map((c) => ({ A: c.A, B: c.B, C: c.C }))
    .concat([{ A: p, B: q, C: kLine }]);

  return { model, linesForTable };
}