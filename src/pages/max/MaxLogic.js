// D:\projet-ro\src\pages\max\MaxLogic.js
import { parseValue, parseCoeff } from "../../utils/math";

export function buildMaxModel({ consInputs, objInputs }) {
  const cons = [];

  for (let i = 0; i < consInputs.length; i++) {
    const row = consInputs[i] || {};
    const rawA = String(row.A ?? "").trim();
    const rawB = String(row.B ?? "").trim();
    const rawC = String(row.C ?? "").trim();

    const allEmpty = rawA === "" && rawB === "" && rawC === "";
    if (allEmpty) continue;

    const A = parseCoeff(row.A); // "" => 0
    const B = parseCoeff(row.B); // "" => 0
    const C = parseValue(row.C); // C obligatoire si ligne utilisée
    const sense = row.sense === ">=" ? ">=" : "<=";

    if (C == null) throw new Error(`Contrainte ${i + 1}: C est obligatoire.`);
    if (!isFinite(A) || !isFinite(B) || !isFinite(C)) throw new Error("Coefficients invalides.");
    if (Math.abs(A) < 1e-12 && Math.abs(B) < 1e-12) {
      throw new Error(`Contrainte ${i + 1}: A et B ne peuvent pas être tous les deux nuls.`);
    }

    cons.push({ A, B, C, sense });
  }

  if (cons.length === 0) throw new Error("Aucune contrainte valide.");

  const p = parseValue(objInputs.p);
  const q = parseValue(objInputs.q);
  if (p == null || q == null) throw new Error("Saisis p et q.");
  if (!isFinite(p) || !isFinite(q)) throw new Error("Objectif invalide.");

  // ✅ on n'a plus de champ "k" => on démarre l'animation à kLine = 0
  const kLine = 0;

  const model = {
    mode: "max",
    cons,
    obj: { p, q, kLine },
    viewBox: { xmin: -2, xmax: 7, ymin: -2, ymax: 7, pad: 48 },
  };

  return { model };
}