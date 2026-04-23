// D:\projet-ro\src\components\Table\Table.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { parseValue, fmtSmart, fmtEqEQ } from "../../utils/math";
import { computeOther } from "./tableUtils";

const COLS = ["x₁ → x₂", "x₂ → x₁", "x₁ → x₂"];

const EDITOR_W = 270;
const EDITOR_H = 155;
const MARGIN = 10;

export default function Table({ linesForTable, cellData, setCellData, setStatus, onCellDataChange }) {
  const wrapRef = useRef(null);
  const editorRef = useRef(null);

  const [editor, setEditor] = useState({
    open: false,
    r: 0,
    c: 0,
    top: 0,
    left: 0,
    givenVar: "x1",
    raw: "",
  });

  const keyOf = (r, c) => `${r}-${c}`;
  const activeKey = useMemo(() => keyOf(editor.r, editor.c), [editor.r, editor.c]);

  const activeR = editor.open ? editor.r : -1;
  const activeC = editor.open ? editor.c : -1;

  useEffect(() => {
    function onDown(e) {
      if (!editor.open) return;
      if (editorRef.current?.contains(e.target)) return;
      const td = e.target.closest?.("td[data-r]");
      if (td) return;
      setEditor((ed) => ({ ...ed, open: false }));
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editor.open]);

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function isVertical(line) {
    const eps = 1e-12;
    return Math.abs(line.B) < eps && Math.abs(line.A) >= eps;
  }
  function isHorizontal(line) {
    const eps = 1e-12;
    return Math.abs(line.A) < eps && Math.abs(line.B) >= eps;
  }

  // ✅ NOUVELLE règle demandée:
  // - x1 = const => on met x2 = 0 (toujours)
  // - x2 = const => on met x1 = 0 (toujours)
  function autoPointForSpecialLine(line) {
    if (isVertical(line)) {
      const x = line.C / line.A;
      return { x, y: 0 };
    }
    if (isHorizontal(line)) {
      const y = line.C / line.B;
      return { x: 0, y };
    }
    return null;
  }

  function saveCellPoint(r, c, pt, raw = "auto", givenVar = "auto") {
    const display = `(${fmtSmart(pt.x)}, ${fmtSmart(pt.y)})`;

    const next = {
      ...cellData,
      [keyOf(r, c)]: {
        raw,
        givenVar,
        display,
        pt: { x: pt.x, y: pt.y },
        meta: { r, c },
      },
    };

    setCellData(next);
    onCellDataChange?.(next);
  }

  function openEditor(td) {
    const r = Number(td.dataset.r);
    const c = Number(td.dataset.c);

    const line = linesForTable[r];

    // ✅ si verticale/horizontale => on met directement (x,0) ou (0,y)
    const auto = autoPointForSpecialLine(line);
    if (auto) {
      saveCellPoint(r, c, auto, "auto", "auto");
      setStatus?.("Point ajouté automatiquement (droite x₁=const ou x₂=const).");
      return;
    }

    const defaultVar = c === 1 ? "x2" : "x1";
    const saved = cellData[keyOf(r, c)];

    const tdRect = td.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();

    let top = tdRect.bottom - wrapRect.top + 8;
    let left = tdRect.left - wrapRect.left;

    left = clamp(left, MARGIN, wrapRect.width - EDITOR_W - MARGIN);

    if (top + EDITOR_H > wrapRect.height - MARGIN) {
      top = tdRect.top - wrapRect.top - EDITOR_H - 8;
    }
    top = clamp(top, MARGIN, wrapRect.height - EDITOR_H - MARGIN);

    setEditor({
      open: true,
      r,
      c,
      top,
      left,
      givenVar: saved?.givenVar || defaultVar,
      raw: saved?.raw || "",
    });
  }

  function commit() {
    const r = editor.r,
      c = editor.c;
    const raw = editor.raw;
    const v = parseValue(raw);

    if (v === null) {
      const copy = { ...cellData };
      delete copy[keyOf(r, c)];
      setCellData(copy);
      onCellDataChange?.(copy);
      setEditor((ed) => ({ ...ed, open: false }));
      return;
    }

    if (!Number.isFinite(v)) {
      setStatus("Erreur: valeur invalide. Ex: 2, 1.5, 3/4, -4/3");
      return;
    }

    try {
      const line = linesForTable[r];
      const pt = computeOther(line, editor.givenVar, v);

      const display = `(${fmtSmart(pt.x1)}, ${fmtSmart(pt.x2)})`;

      const next = {
        ...cellData,
        [keyOf(r, c)]: {
          raw,
          givenVar: editor.givenVar,
          display,
          pt: { x: pt.x1, y: pt.x2 },
          meta: { r, c },
        },
      };

      setCellData(next);
      onCellDataChange?.(next);
      setEditor((ed) => ({ ...ed, open: false }));
    } catch (e) {
      setStatus("Erreur: " + e.message);
    }
  }

  return (
    <div className="tableWrap" ref={wrapRef}>
      <table className="plTable">
        <thead>
          <tr>
            <th>Droites</th>
            {COLS.map((h, idx) => (
              <th
                key={h}
                style={idx === activeC ? { background: "rgba(37,99,235,.10)", color: "#1d4ed8" } : undefined}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {linesForTable.map((L, r) => {
            const rowActive = r === activeR;
            return (
              <tr key={r} style={rowActive ? { background: "rgba(37,99,235,.06)" } : undefined}>
                <td
                  className="eqCell"
                  style={rowActive ? { outline: "2px solid rgba(37,99,235,.45)", outlineOffset: "-2px" } : undefined}
                >
                  {fmtEqEQ(L.A, L.B, L.C)}
                </td>

                {[0, 1, 2].map((c) => {
                  const k = keyOf(r, c);
                  const isActive = editor.open && activeKey === k;
                  const colActive = c === activeC;

                  return (
                    <td
                      key={c}
                      className={"dataCell " + (isActive ? "active" : "")}
                      data-r={r}
                      data-c={c}
                      onClick={(e) => openEditor(e.currentTarget)}
                      style={
                        colActive && !isActive ? { outline: "2px solid rgba(37,99,235,.25)", outlineOffset: "-2px" } : undefined
                      }
                      title={isVertical(L) || isHorizontal(L) ? "Clic = point auto (x₂=0 ou x₁=0)" : "Clique pour entrer une valeur"}
                    >
                      {cellData[k]?.display || ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {editor.open && (
        <div
          className="editor"
          ref={editorRef}
          style={{ top: editor.top, left: editor.left }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setEditor((ed) => ({ ...ed, open: false }));
            }
          }}
        >
          <div style={{ fontWeight: 950, fontSize: 13, marginBottom: 8, color: "#0f172a" }}>
            Ligne {editor.r + 1} — Colonne {COLS[editor.c]}
          </div>

          <div className="editorRow">
            <select
              className="select"
              value={editor.givenVar}
              onChange={(e) => setEditor((ed) => ({ ...ed, givenVar: e.target.value }))}
            >
              <option value="x1">x₁ donné</option>
              <option value="x2">x₂ donné</option>
            </select>

            <input
              className="input"
              value={editor.raw}
              onChange={(e) => setEditor((ed) => ({ ...ed, raw: e.target.value }))}
              placeholder="ex: 2 ou 1.5 ou 3/4"
              autoFocus
            />
          </div>

          <div className="editorActions">
            <button className="btn btnPrimary" onClick={commit}>
              OK
            </button>
            <button className="btn" onClick={() => setEditor((ed) => ({ ...ed, raw: "" }))}>
              Vider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}