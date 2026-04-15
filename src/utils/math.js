export function senseSymbol(sense) {
  return sense === ">=" ? "\u2265" : "\u2264"; // ≥ / ≤
}

export function xSub(i) {
  // x₁ / x₂
  return i === 1 ? "x\u2081" : "x\u2082";
}

// Accept: "3/2", "-3/2", " 3 / 2 ", decimals "." or ","
export function parseValue(str) {
  if (str == null) return null;
  let s = String(str).trim();
  if (s === "") return null;
  s = s.replace(",", ".");

  if (/^[+-]?\d+(\.\d+)?$/.test(s)) return +s;

  if (s.includes("/")) {
    const parts = s.split("/").map((p) => p.trim().replace(",", "."));
    if (parts.length !== 2) return NaN;
    const num = parseValue(parts[0]);
    const den = parseValue(parts[1]);
    if (num == null || den == null) return NaN;
    if (!isFinite(num) || !isFinite(den) || den === 0) return NaN;
    return num / den;
  }
  return NaN;
}

export function approxFraction(x, maxDen = 60) {
  if (!isFinite(x)) return null;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const rint = Math.round(x);
  if (Math.abs(x - rint) < 1e-10) return { num: sign * rint, den: 1 };

  let h1 = 1, h0 = 0, k1 = 0, k0 = 1;
  let b = x;

  for (let i = 0; i < 30; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDen) break;

    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;

    const frac = h1 / k1;
    if (Math.abs(frac - x) < 1e-12) break;

    const rem = b - a;
    if (rem === 0) break;
    b = 1 / rem;
  }
  if (k1 === 0) return null;
  return { num: sign * h1, den: k1 };
}

export function fmtSmart(x) {
  const eps = 1e-10;
  if (!isFinite(x)) return "—";
  if (Math.abs(x) < eps) return "0";

  const f = approxFraction(x, 60);
  if (f) {
    const v = f.num / f.den;
    if (Math.abs(v - x) < 1e-9) {
      if (f.den === 1) return String(f.num);
      return `${f.num}/${f.den}`;
    }
  }
  return (Math.round(x * 100) / 100).toFixed(2);
}

// version FR (3,5 au lieu de 3.5) — garde fractions
export function fmtSmartFR(x) {
  const s = fmtSmart(x);
  if (s.includes("/")) return s;
  return s.replace(".", ",");
}

function fmtTerm(k, v) {
  if (k === 0) return "";
  if (k === 1) return `${v}`;
  if (k === -1) return `-${v}`;
  return `${k}${v}`;
}

export function fmtExpr(A, B) {
  const v1 = xSub(1),
    v2 = xSub(2);
  const a = Number(A),
    b = Number(B);
  const t1 = fmtTerm(a, v1);
  const t2 = fmtTerm(Math.abs(b), v2);

  if (!t1 && !t2) return "0";
  if (!t1) return b < 0 ? `-${t2}` : t2;
  if (!t2) return t1;
  return b < 0 ? `${t1} - ${t2}` : `${t1} + ${t2}`;
}

export function fmtEqEQ(A, B, C) {
  return `${fmtExpr(A, B)} = ${C}`;
}

export function fmtEqIneq(A, B, C, sense) {
  return `${fmtExpr(A, B)} ${senseSymbol(sense)} ${C}`;
}