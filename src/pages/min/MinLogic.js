// D:\projet-ro\src\pages\min\MinLogic.js
import { parseValue, parseCoeff } from "../../utils/math";

export function buildMinModel({ consInputs, objInputs, kObjInput }) {
  const sense = ">=";
  const cons = [];

  for (let i = 0; i < consInputs.length; i++) {
    const row = consInputs[i] || {};

    const A = parseCoeff(row.A);
    const B = parseCoeff(row.B);
    const C = parseValue(row.C);

    const allEmpty =
      (row.A ?? "").toString().trim() === "" &&
      (row.B ?? "").toString().trim() === "" &&
      (row.C ?? "").toString().trim() === "";
    if (allEmpty) continue;

    if (C == null) {
      throw new Error(`Contrainte ${i + 1}: C est obligatoire (A/B peuvent être vides = 0).`);
    }

    if (!isFinite(A) || !isFinite(B) || !isFinite(C)) {
      throw new Error("Coefficients invalides (ex: 3/0).");
    }

    if (Math.abs(A) < 1e-12 && Math.abs(B) < 1e-12) {
      throw new Error(`Contrainte ${i + 1}: A et B ne peuvent pas être tous les deux nuls.`);
    }

    cons.push({ A, B, C, sense });
  }

  if (cons.length === 0) {
    throw new Error("Aucune contrainte valide. Remplis au moins une contrainte.");
  }

  const p = parseValue(objInputs.p);
  const q = parseValue(objInputs.q);
  if (p == null || q == null) throw new Error("Saisis p et q.");
  if (!isFinite(p) || !isFinite(q)) throw new Error("Objectif invalide.");

  // ✅ k obligatoire en MIN
  const kLine = parseValue(kObjInput);
  if (kLine == null) throw new Error("En MIN, k est obligatoire (ex: 24).");
  if (!isFinite(kLine)) throw new Error("k invalide.");

  const model = {
    mode: "min",
    cons,
    obj: { p, q, kLine },
    viewBox: { xmin: -1, xmax: 4, ymin: 0, ymax: 4.8, pad: 48 },
  };

  const linesForTable = cons
    .map((c) => ({ A: c.A, B: c.B, C: c.C }))
    .concat([{ A: p, B: q, C: kLine }]);

  return { model, linesForTable };
}