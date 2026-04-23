// D:\projet-ro\src\components\Table\tableUtils.js
export function computeOther(line, givenVar, givenVal) {
  const { A, B, C } = line;
  const eps = 1e-12;

  const a0 = Math.abs(A) < eps;
  const b0 = Math.abs(B) < eps;

  // Cas invalide: 0x1 + 0x2 = C
  if (a0 && b0) throw new Error("A=0 et B=0 : droite invalide.");

  // ----- Droite verticale: A x1 = C  => x1 = C/A
  if (b0 && !a0) {
    const x1 = C / A;

    // si l'utilisateur a donné x1, on peut accepter n'importe quelle valeur MAIS le bon x1 est fixe
    // on retourne toujours le point cohérent
    if (givenVar === "x1") return { x1, x2: givenVal }; // x2 quelconque (on utilise la valeur donnée)
    return { x1, x2: givenVal }; // x2 donné (cohérent)
  }

  // ----- Droite horizontale: B x2 = C => x2 = C/B
  if (a0 && !b0) {
    const x2 = C / B;
    if (givenVar === "x2") return { x1: givenVal, x2 }; // x1 quelconque
    return { x1: givenVal, x2 }; // x1 donné
  }

  // ----- Cas général
  if (givenVar === "x1") {
    const x1 = givenVal;
    const x2 = (C - A * x1) / B;
    return { x1, x2 };
  }

  const x2 = givenVal;
  const x1 = (C - B * x2) / A;
  return { x1, x2 };
}