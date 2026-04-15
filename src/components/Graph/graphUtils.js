import { fmtEqEQ, fmtSmart } from "../../utils/math";

/* ==================== CORE MATH ==================== */
function violated(con, p) {
  const eps = 1e-9;
  const s = con.sense || "<=";
  const L = con.A * p.x + con.B * p.y;
  if (s === "<=") return L > con.C + eps;
  return L < con.C - eps;
}

function intersectEq(l1, l2) {
  const det = l1.A * l2.B - l2.A * l1.B;
  if (Math.abs(det) < 1e-12) return null;
  const x = (l1.C * l2.B - l2.C * l1.B) / det;
  const y = (l1.A * l2.C - l2.A * l1.C) / det;
  return { x, y };
}

function uniq(points) {
  const out = [];
  const eps = 1e-7;
  for (const p of points) {
    if (!p || !isFinite(p.x) || !isFinite(p.y)) continue;
    let ok = true;
    for (const q of out) {
      if (Math.abs(p.x - q.x) < eps && Math.abs(p.y - q.y) < eps) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(p);
  }
  return out;
}

function feasiblePoint(p, consAll) {
  for (const c of consAll) if (violated(c, p)) return false;
  return true;
}

function convexHull(points) {
  if (points.length <= 1) return points.slice();
  const pts = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 1e-12) lower.pop();
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 1e-12) upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function objVal(pt, p, q) {
  return p * pt.x + q * pt.y;
}

function solveLP2D(model) {
  const consAll = model.cons.map((c) => ({ ...c }));
  const x1NonNeg = { A: 1, B: 0, C: 0, sense: ">=" };
  const x2NonNeg = { A: 0, B: 1, C: 0, sense: ">=" };
  consAll.push(x1NonNeg, x2NonNeg);

  const cand = [];
  for (let i = 0; i < consAll.length; i++) {
    for (let j = i + 1; j < consAll.length; j++) {
      const p = intersectEq(consAll[i], consAll[j]);
      if (p) cand.push(p);
    }
  }

  const feasVerts = uniq(cand).filter((p) => feasiblePoint(p, consAll));
  if (feasVerts.length === 0) return { error: "Aucun point faisable trouvé." };

  let best = null;
  for (const pt of feasVerts) {
    const v = objVal(pt, model.obj.p, model.obj.q);
    if (!best) best = { pt, v };
    else if (model.mode === "max" ? v > best.v : v < best.v) best = { pt, v };
  }

  const hull = feasVerts.length >= 3 ? convexHull(feasVerts) : null;
  return { feasVerts, hull, best };
}

function segPointsInBox(line, box) {
  const { xmin, xmax, ymin, ymax } = box;
  const pts = [];

  if (Math.abs(line.B) > 1e-12) {
    let y = (line.C - line.A * xmin) / line.B;
    if (y >= ymin - 1e-9 && y <= ymax + 1e-9) pts.push({ x: xmin, y });
    y = (line.C - line.A * xmax) / line.B;
    if (y >= ymin - 1e-9 && y <= ymax + 1e-9) pts.push({ x: xmax, y });
  }

  if (Math.abs(line.A) > 1e-12) {
    let x = (line.C - line.B * ymin) / line.A;
    if (x >= xmin - 1e-9 && x <= xmax + 1e-9) pts.push({ x, y: ymin });
    x = (line.C - line.B * ymax) / line.A;
    if (x >= xmin - 1e-9 && x <= xmax + 1e-9) pts.push({ x, y: ymax });
  }

  const u = uniq(pts);
  if (u.length < 2) return null;

  if (u.length > 2) {
    let bi = 0, bj = 1, bd = -1;
    for (let i = 0; i < u.length; i++) {
      for (let j = i + 1; j < u.length; j++) {
        const dx = u[i].x - u[j].x;
        const dy = u[i].y - u[j].y;
        const d = dx * dx + dy * dy;
        if (d > bd) {
          bd = d;
          bi = i;
          bj = j;
        }
      }
    }
    return [u[bi], u[bj]];
  }

  return [u[0], u[1]];
}

/* ==================== HELPERS ==================== */
function arrowHead(ctx, x, y, angle, size = 8) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function worldNormalToCanvas(worldToCanvas, p, nx, ny) {
  const c0 = worldToCanvas(p);
  const c1 = worldToCanvas({ x: p.x + nx, y: p.y + ny });
  let vx = c1.x - c0.x;
  let vy = c1.y - c0.y;
  const L = Math.hypot(vx, vy) || 1;
  return { x: vx / L, y: vy / L };
}

function drawTicksForbidden(ctx, con, box, scale, worldToCanvas) {
  const seg = segPointsInBox(con, box);
  if (!seg) return;

  const { A, B } = con;
  const nLen = Math.hypot(A, B) || 1;
  let nx = A / nLen;
  let ny = B / nLen;

  const forbiddenSign = con.sense === "<=" ? 1 : -1;
  nx *= forbiddenSign;
  ny *= forbiddenSign;

  const p0 = seg[0];
  const p1 = seg[1];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;

  const stepWorld = 16 / scale;
  const nSteps = Math.max(1, Math.floor(L / stepWorld));

  ctx.save();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;

  for (let i = 0; i <= nSteps; i++) {
    const s = (i / nSteps) * L;
    const wp = { x: p0.x + ux * s, y: p0.y + uy * s };
    const cp = worldToCanvas(wp);
    const nv = worldNormalToCanvas(worldToCanvas, wp, nx, ny);

    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y);
    ctx.lineTo(cp.x + nv.x * 12, cp.y + nv.y * 12);
    ctx.stroke();
  }

  ctx.restore();
}

function drawText(ctx, text, x, y, font = "16px Times New Roman, serif") {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawEqNearLine(ctx, seg, worldToCanvas, text, t, nx, ny, offsetPx, font = "16px Times New Roman, serif") {
  const p0 = seg[0];
  const p1 = seg[1];

  const wp = {
    x: p0.x + (p1.x - p0.x) * t,
    y: p0.y + (p1.y - p0.y) * t,
  };

  const cp = worldToCanvas(wp);
  const nv = worldNormalToCanvas(worldToCanvas, wp, nx, ny);

  const x = cp.x + nv.x * offsetPx;
  const y = cp.y + nv.y * offsetPx;

  drawText(ctx, text, x, y, font);
}

function drawFeasibleRegionMax(ctx, poly, worldToCanvas) {
  if (!poly || poly.length < 3) return;

  const p0 = worldToCanvas(poly[0]);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < poly.length; i++) {
    const p = worldToCanvas(poly[i]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();

  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.strokeStyle = "#d46a49";
  ctx.lineWidth = 4;
  ctx.stroke();

  const cc = worldToCanvas({ x: 1.55, y: 2.0 });

  ctx.fillStyle = "#ff0000";
  ctx.font = "700 36px Times New Roman, serif";
  ctx.fillText("S", cc.x - 10, cc.y + 10);

  ctx.restore();
}

function drawSolutionBox(ctx, lines, x, y) {
  ctx.save();
  ctx.font = "700 18px Times New Roman, serif";

  const padX = 16;
  const padY = 12;
  const lineH = 26;
  const maxW = Math.max(...lines.map((t) => ctx.measureText(t).width));
  const boxW = maxW + padX * 2;
  const boxH = lines.length * lineH + padY * 2;

  ctx.fillStyle = "#1565c0";
  ctx.fillRect(x, y, boxW, boxH);

  ctx.fillStyle = "#fff";
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padX, y + padY + (i + 1) * lineH - 8);
  });

  ctx.restore();
}

/* ==================== MAIN DRAW ==================== */
export function drawGraph(ctx, viewport, model) {
  const solved = solveLP2D(model);
  if (solved.error) return { error: solved.error };

  const { best, hull } = solved;
  const isMax = model.mode === "max";
  const isMin = model.mode === "min";

  const box = model.viewBox || { xmin: -2, xmax: 7, ymin: -2, ymax: 7 };
  const { xmin, xmax, ymin, ymax } = box;

  const W = viewport.width;
  const H = viewport.height;

  const graphW = isMax ? 430 : 380;
  const graphH = isMax ? 420 : 380;

  const xr = xmax - xmin;
  const yr = ymax - ymin;
  const scale = Math.min(graphW / xr, graphH / yr);

  const plotW = xr * scale;
  const plotH = yr * scale;

  const left = (W - plotW) / 2;
  const bottom = (H - plotH) / 2;

  const worldToCanvas = (p) => ({
    x: left + (p.x - xmin) * scale,
    y: H - (bottom + (p.y - ymin) * scale),
  });

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  const axisColor = "#e35b36";
  const xAxisVisible = ymin <= 0 && ymax >= 0;
  const yAxisVisible = xmin <= 0 && xmax >= 0;

  /* AXES */
  ctx.save();
  ctx.strokeStyle = axisColor;
  ctx.fillStyle = axisColor;
  ctx.lineWidth = 1.4;

  if (xAxisVisible) {
    const a = worldToCanvas({ x: xmin, y: 0 });
    const b = worldToCanvas({ x: xmax, y: 0 });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    arrowHead(ctx, b.x, b.y, 0, 8);
  }

  if (yAxisVisible) {
    const a = worldToCanvas({ x: 0, y: ymin });
    const b = worldToCanvas({ x: 0, y: ymax });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    arrowHead(ctx, b.x, b.y, -Math.PI / 2, 8);
  }

  ctx.restore();

  /* TICKS */
  ctx.save();
  ctx.strokeStyle = axisColor;
  ctx.fillStyle = "#111";
  ctx.font = "13px Times New Roman, serif";

  if (xAxisVisible) {
    const y0 = worldToCanvas({ x: 0, y: 0 }).y;
    for (let x = Math.ceil(xmin); x <= Math.floor(xmax); x++) {
      const p = worldToCanvas({ x, y: 0 });
      ctx.beginPath();
      ctx.moveTo(p.x, y0 - 6);
      ctx.lineTo(p.x, y0 + 6);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(String(x), p.x, y0 + 8);
    }
  }

  if (yAxisVisible) {
    const x0 = worldToCanvas({ x: 0, y: 0 }).x;
    for (let y = Math.ceil(ymin); y <= Math.floor(ymax); y++) {
      const p = worldToCanvas({ x: 0, y });
      ctx.beginPath();
      ctx.moveTo(x0 - 6, p.y);
      ctx.lineTo(x0 + 6, p.y);
      ctx.stroke();

      if (y !== 0) {
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(String(y), x0 - 10, p.y);
      }
    }
  }

  ctx.restore();

  /* LABELS AXES */
  ctx.save();
  ctx.fillStyle = "#ff2a00";
  ctx.font = "18px Times New Roman, serif";

  if (xAxisVisible) {
    const p = worldToCanvas({ x: xmax, y: 0 });
    ctx.fillText("x₁", p.x + 8, p.y + 6);
  }

  if (yAxisVisible) {
    const p = worldToCanvas({ x: 0, y: ymax });
    ctx.fillText("x₂", p.x - 10, p.y - 10);
  }

  ctx.restore();

  /* DROITES */
  const segs = model.cons.map((line) => {
    const seg = segPointsInBox(line, box);
    if (!seg) return null;
    const a = worldToCanvas(seg[0]);
    const b = worldToCanvas(seg[1]);

    ctx.save();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();

    return seg;
  });

  /* HACHURES */
  model.cons.forEach((c) => drawTicksForbidden(ctx, c, box, scale, worldToCanvas));

  /* EQUATIONS */
  if (isMax) {
    if (segs[1]) {
      /* -2x1 + x2 = 1 */
      drawEqNearLine(
        ctx,
        segs[1],
        worldToCanvas,
        fmtEqEQ(model.cons[1].A, model.cons[1].B, model.cons[1].C),
        0.78,
        -1,
        -1,
        18
      );
    }

    if (segs[0]) {
      /* 4x1 - 3x2 = 2 */
      drawEqNearLine(
        ctx,
        segs[0],
        worldToCanvas,
        fmtEqEQ(model.cons[0].A, model.cons[0].B, model.cons[0].C),
        0.82,
        1,
        -1,
        18
      );
    }

    if (segs[2]) {
      /* -6x1 + 14x2 = 35 */
      drawEqNearLine(
        ctx,
        segs[2],
        worldToCanvas,
        fmtEqEQ(model.cons[2].A, model.cons[2].B, model.cons[2].C),
        0.88,
        1,
        -1,
        18
      );
    }
  }

  if (isMin) {
    drawText(ctx, fmtEqEQ(model.cons[0].A, model.cons[0].B, model.cons[0].C), left - 8, bottom + 32, "15px Times New Roman, serif");
    drawText(ctx, fmtEqEQ(model.cons[1].A, model.cons[1].B, model.cons[1].C), left - 65, bottom + 150, "15px Times New Roman, serif");
    drawText(ctx, fmtEqEQ(model.cons[2].A, model.cons[2].B, model.cons[2].C), left + 285, bottom + 165, "15px Times New Roman, serif");
  }

  /* REGION */
  if (isMax && hull) drawFeasibleRegionMax(ctx, hull, worldToCanvas);

  /* OBJECTIF */
  const { p, q, kLine } = model.obj;

  const objBaseSeg = segPointsInBox({ A: p, B: q, C: kLine }, box);
  if (objBaseSeg) {
    const a = worldToCanvas(objBaseSeg[0]);
    const b = worldToCanvas(objBaseSeg[1]);
    ctx.save();
    ctx.strokeStyle = "#df6b4c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  const objOptSeg = segPointsInBox({ A: p, B: q, C: best.v }, box);
  if (objOptSeg) {
    const a = worldToCanvas(objOptSeg[0]);
    const b = worldToCanvas(objOptSeg[1]);
    ctx.save();
    ctx.strokeStyle = "#df6b4c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  /* POINT OPTIMUM */
  const cBest = worldToCanvas(best.pt);

  ctx.save();
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(cBest.x, cBest.y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* GUIDES */
  ctx.save();
  ctx.strokeStyle = "#df6b4c";
  ctx.lineWidth = 1.1;
  ctx.setLineDash([4, 4]);

  const px = worldToCanvas({ x: best.pt.x, y: 0 });
  const py = worldToCanvas({ x: 0, y: best.pt.y });

  ctx.beginPath();
  ctx.moveTo(cBest.x, cBest.y);
  ctx.lineTo(px.x, px.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cBest.x, cBest.y);
  ctx.lineTo(py.x, py.y);
  ctx.stroke();

  ctx.restore();

  /* FLECHE MAX */
  if (isMax) {
    ctx.save();
    ctx.strokeStyle = "#df6b4c";
    ctx.fillStyle = "#df6b4c";
    ctx.lineWidth = 2;
    const to = { x: cBest.x + 50, y: cBest.y };
    ctx.beginPath();
    ctx.moveTo(cBest.x, cBest.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    arrowHead(ctx, to.x, to.y, 0, 8);
    ctx.restore();
  }

  /* BOITE SOLUTION */
  if (isMax) {
    drawSolutionBox(
      ctx,
      [`x₁ = ${fmtSmart(best.pt.x)}`, `x₂ = ${fmtSmart(best.pt.y)}`],
      cBest.x + 110,
      cBest.y - 16
    );
  } else {
    drawSolutionBox(
      ctx,
      [`x₁ = ${fmtSmart(best.pt.x)}  et  x₂ = ${fmtSmart(best.pt.y)}`],
      cBest.x + 80,
      cBest.y - 10
    );
  }

  return { best };
}