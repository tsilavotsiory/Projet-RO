export function computeOther(line, givenVar, givenVal) {
  const { A, B, C } = line;
  const eps = 1e-12;

  if (givenVar === "x1") {
    if (Math.abs(B) < eps) throw new Error("B=0 : impossible d'isoler x2 si x1 est donné.");
    const x1 = givenVal;
    const x2 = (C - A * x1) / B;
    return { x1, x2 };
  }

  if (Math.abs(A) < eps) throw new Error("A=0 : impossible d'isoler x1 si x2 est donné.");
  const x2 = givenVal;
  const x1 = (C - B * x2) / A;
  return { x1, x2 };
}