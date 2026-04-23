// D:\projet-ro\src\pages\min\MinPage.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import "./MinStyle.css";
import { useLocation, useNavigate } from "react-router-dom";
import { parseValue, parseCoeff, fmtEqIneq } from "../../utils/math";
import Table from "../../components/Table/Table";
import GraphCanvas from "../../components/Graph/GraphCanvas";
import { buildMinModel } from "./MinLogic";

const KEY = "pl:min:full";
const EVENT_NAME = "pl:stateChanged";

function emitChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key: KEY } }));
}
function saveFull(full) {
  localStorage.setItem(KEY, JSON.stringify({ ...full, ts: Date.now() }));
  emitChanged();
}
function loadFull() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clampInt(n, a, b) {
  n = Number(n);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, Math.round(n)));
}

function makeCon() {
  return { A: "", B: "", C: "" };
}

const BTN_BLUE = { background: "#2563eb", borderColor: "#2563eb", color: "#fff" };
const BTN_GRAY = { background: "#0b1220", borderColor: "rgba(255,255,255,.10)", color: "#e5e7eb" };

function parseMaybeNum(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const v = Number(t.replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

export default function MinPage({ view }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [m, setM] = useState(3);
  const [consInputs, setConsInputs] = useState(() => Array.from({ length: 3 }, () => makeCon()));
  const [objInputs, setObjInputs] = useState({ p: "", q: "" });
  const [kObj, setKObj] = useState("");

  const [linesForTable, setLinesForTable] = useState(null);
  const [cellData, setCellData] = useState({});
  const [model, setModel] = useState(null);

  // graph
  const [graphBaseModel, setGraphBaseModel] = useState(null);
  const [graphModel, setGraphModel] = useState(null);

  const [scaleCmInputs, setScaleCmInputs] = useState({ xUnitCm: "", yUnitCm: "" });

  const animRef = useRef({ raf: 0 });

  const [status, setStatus] = useState("Saisis les coefficients, puis affiche le tableau.");

  useEffect(() => {
    setConsInputs((prev) => {
      const nextM = clampInt(m, 1, 12);
      if (prev.length === nextM) return prev;
      if (prev.length < nextM) return prev.concat(Array.from({ length: nextM - prev.length }, () => makeCon()));
      return prev.slice(0, nextM);
    });
  }, [m]);

  useEffect(() => {
    if (view !== "form") return;
    const saved = loadFull();
    if (!saved) return;

    if (typeof saved.m === "number") setM(saved.m);

    if (saved.consInputs) {
      const restored = saved.consInputs.map((c) => ({
        A: c?.A ?? "",
        B: c?.B ?? "",
        C: c?.C ?? "",
      }));
      setConsInputs(restored);
      if (typeof saved.m !== "number") setM(restored.length || 3);
    }

    if (saved.objInputs) setObjInputs(saved.objInputs);
    if (typeof saved.kObj === "string") setKObj(saved.kObj);
    if (saved.cellData) setCellData(saved.cellData);

    if (saved.model) {
      setModel(saved.model);
      setLinesForTable(saved.linesForTable || null);
    }
  }, [view]);

  useEffect(() => {
    if (view !== "graph") return;

    const fromNav = location.state?.model;
    const base = fromNav || loadFull()?.model || null;

    setGraphBaseModel(base);
    setGraphModel(null);
    setScaleCmInputs({ xUnitCm: "", yUnitCm: "" });

    function refreshBaseOnly() {
      setGraphBaseModel(loadFull()?.model || null);
    }
    function onCustom(e) {
      if (e?.detail?.key === KEY) refreshBaseOnly();
    }
    function onStorage(e) {
      if (e.key === KEY) refreshBaseOnly();
    }

    window.addEventListener(EVENT_NAME, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [view, location.state]);

  const preview = useMemo(() => {
    const sense = ">=";
    const consParsed = consInputs
      .map((c) => ({ A: parseCoeff(c.A), B: parseCoeff(c.B), C: parseValue(c.C), sense }))
      .filter((L) => !(L.A == null && L.B == null && L.C == null));

    const p = parseCoeff(objInputs.p);
    const q = parseCoeff(objInputs.q);
    const k = parseValue(kObj);

    const anyMissingC = consParsed.some((L) => L.C == null);
    if (anyMissingC) return null;

    const okCons = consParsed.length > 0 && consParsed.every((x) => Number.isFinite(x.A) && Number.isFinite(x.B) && Number.isFinite(x.C));
    const okObj = Number.isFinite(p) && Number.isFinite(q) && Number.isFinite(k);

    if (!okCons || !okObj) return null;

    return {
      lines: consParsed.map((L) => fmtEqIneq(L.A, L.B, L.C, sense)),
      obj: { p, q, k },
    };
  }, [consInputs, objInputs, kObj]);

  const buildAndPersist = useCallback(
    (nextCellData, showErrors) => {
      try {
        const res = buildMinModel({ consInputs, objInputs, kObjInput: kObj });

        const extraPoints = Object.values(nextCellData || {})
          .map((v) => v?.pt)
          .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

        const enriched = { ...res.model, extraPoints };

        setModel(enriched);
        setLinesForTable(res.linesForTable);

        saveFull({
          m: consInputs.length,
          consInputs,
          objInputs,
          kObj,
          cellData: nextCellData || {},
          linesForTable: res.linesForTable,
          model: enriched,
        });

        return enriched;
      } catch (e) {
        if (showErrors) setStatus("Erreur: " + e.message);
        return null;
      }
    },
    [consInputs, objInputs, kObj]
  );

  function showTable() {
    const enriched = buildAndPersist(cellData, true);
    if (enriched) setStatus("Tableau affiché.");
  }

  useEffect(() => {
    if (!model) return;
    buildAndPersist(cellData, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consInputs, objInputs, kObj]);

  function handleCellDataChange(next) {
    setCellData(next);
    if (!model) return;
    buildAndPersist(next, false);
  }

  function goGraph() {
    const current = model || buildAndPersist(cellData, true);
    if (!current) return;
    navigate("/min/graphe", { state: { model: current } });
  }

  function backToForm() {
    navigate("/min");
  }

  function applyGraphScale() {
    if (!graphBaseModel) {
      setStatus("Erreur: aucun modèle chargé.");
      return;
    }

    const xUnitCm = parseMaybeNum(scaleCmInputs.xUnitCm);
    const yUnitCm = parseMaybeNum(scaleCmInputs.yUnitCm);

    if (Number.isNaN(xUnitCm) || Number.isNaN(yUnitCm)) {
      setStatus("Erreur: valeur invalide. Exemple: 500");
      return;
    }

    if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
    animRef.current.raf = 0;

    const next = {
      ...graphBaseModel,
      autoViewBox: true,
      scaleCm: {
        xUnitCm: xUnitCm == null ? null : xUnitCm,
        yUnitCm: yUnitCm == null ? null : yUnitCm,
      },
      showSolution: false,
      animT: 0,
    };

    setGraphModel(next);
    setStatus("Graphe généré.");
  }

  function showSolution() {
    if (!graphModel) {
      setStatus("Génère d’abord le graphe.");
      return;
    }

    const start = performance.now();
    const dur = 900;

    const loop = (now) => {
      const t = Math.max(0, Math.min(1, (now - start) / dur));
      setGraphModel((prev) => (prev ? { ...prev, showSolution: true, animT: t } : prev));
      if (t < 1) animRef.current.raf = requestAnimationFrame(loop);
      else animRef.current.raf = 0;
    };

    if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
    animRef.current.raf = requestAnimationFrame(loop);
    setStatus("");
  }

  function clearTableData() {
    const next = {};
    setCellData(next);
    if (model) buildAndPersist(next, false);

    const saved = loadFull() || {};
    saveFull({
      ...saved,
      m: consInputs.length,
      consInputs,
      objInputs,
      kObj,
      cellData: next,
      linesForTable: saved.linesForTable || linesForTable,
      model: saved.model || model,
    });

    setStatus("Tableau vidé.");
  }

  // ✅ effacer saisie (contraintes + objectif + k), placé sous "Contraintes"
  function clearInputsOnly() {
    const nextCons = consInputs.map(() => makeCon());
    const nextObj = { p: "", q: "" };

    setConsInputs(nextCons);
    setObjInputs(nextObj);
    setKObj("");

    const saved = loadFull() || {};
    saveFull({
      ...saved,
      m: nextCons.length,
      consInputs: nextCons,
      objInputs: nextObj,
      kObj: "",
      cellData: saved.cellData || cellData,
      linesForTable: saved.linesForTable || linesForTable,
      model: saved.model || model,
    });

    setStatus("Saisie effacée.");
  }

  // ================= VIEW GRAPH =================
  if (view === "graph") {
    return (
      <div className="graphFullRoot">
        <div className="graphTopBar">
          <div>
            <div className="graphTitle">MIN — Graphe</div>
          </div>

          <div className="actionsRow">
            <button className="btn" onClick={backToForm} style={BTN_GRAY}>
              ← Retour
            </button>
          </div>
        </div>

        <div className="graphGrid">
          <aside className="graphLeft">
            <div className="label">Graduations</div>

            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Axe x : pas (ex: 500)"
                value={scaleCmInputs.xUnitCm}
                onChange={(e) => setScaleCmInputs((s) => ({ ...s, xUnitCm: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Axe y : pas (ex: 1000)"
                value={scaleCmInputs.yUnitCm}
                onChange={(e) => setScaleCmInputs((s) => ({ ...s, yUnitCm: e.target.value }))}
              />

              <button className="btn btnPrimary" onClick={applyGraphScale} style={BTN_BLUE} disabled={!graphBaseModel}>
                Générer le graphe
              </button>

              <button className="btn" onClick={showSolution} style={BTN_GRAY} disabled={!graphModel}>
                Montrer la solution
              </button>
            </div>

            {status?.startsWith("Erreur:") && (
              <div className="status" style={{ marginTop: 12 }}>
                <span className="pillErr">{status}</span>
              </div>
            )}
          </aside>

          <section className="graphRight">
            <GraphCanvas model={graphModel} onError={(msg) => setStatus("Erreur: " + msg)} />
          </section>
        </div>
      </div>
    );
  }

  // ================= VIEW FORM =================
  return (
    <div className="container">
      <div className="card panel formCard">
        <h1 className="pageTitle">MIN — Saisie & Tableau</h1>

        <div className="formScroll">
          <div className="sep">
            <div className="label">Nombre de contraintes</div>
            <div className="row2" style={{ marginTop: 10 }}>
              <input
                className="input"
                type="number"
                min={1}
                max={12}
                value={m}
                onChange={(e) => setM(clampInt(e.target.value, 1, 12))}
              />
              <div style={{ fontSize: 13, color: "rgba(148,163,184,1)", fontWeight: 650, alignSelf: "center" }}>
                (1 à 12)
              </div>
            </div>
          </div>

          <div className="sep">
            <div className="label">Contraintes (A·x₁ + B·x₂ ≥ C)</div>

            <div className="actionsRow" style={{ marginTop: 8, marginBottom: 6 }}>
              <button className="btn" onClick={clearInputsOnly} style={BTN_GRAY}>
                Effacer la saisie
              </button>
            </div>

            {consInputs.map((c, i) => (
              <div className="row3" key={i} style={{ marginTop: 10 }}>
                <input className="input" placeholder={`A${i + 1}`} value={c.A} onChange={(e) => setConsInputs((p) => p.map((v, idx) => (idx === i ? { ...v, A: e.target.value } : v)))} />
                <input className="input" placeholder={`B${i + 1}`} value={c.B} onChange={(e) => setConsInputs((p) => p.map((v, idx) => (idx === i ? { ...v, B: e.target.value } : v)))} />
                <input className="input" placeholder={`C${i + 1}`} value={c.C} onChange={(e) => setConsInputs((p) => p.map((v, idx) => (idx === i ? { ...v, C: e.target.value } : v)))} />
              </div>
            ))}
          </div>

          <div className="sep">
            <div className="label">Objectif MIN (p·x₁ + q·x₂)</div>
            <div className="row2" style={{ marginTop: 10 }}>
              <input className="input" placeholder="p" value={objInputs.p} onChange={(e) => setObjInputs((o) => ({ ...o, p: e.target.value }))} />
              <input className="input" placeholder="q" value={objInputs.q} onChange={(e) => setObjInputs((o) => ({ ...o, q: e.target.value }))} />
            </div>

            <div className="label" style={{ marginTop: 12 }}>
              Droite objectif (tableau) : p·x₁ + q·x₂ = k
            </div>
            <input className="input" placeholder="k (ex: 24)" value={kObj} onChange={(e) => setKObj(e.target.value)} />
          </div>

          {/* ✅ MODÈLE sous Objectif + k */}
          <div className="eqBox">
            <div className="eqBoxTitle">Modèle</div>
            {!preview ? (
              <div className="eqLines">
                Complète au moins 1 contrainte (C obligatoire) + p,q + k pour afficher l’aperçu.
              </div>
            ) : (
              <>
                <div className="eqRow">
                  <span className="brace" style={{ fontSize: 62, transform: `scaleY(${Math.max(1, preview.lines.length / 3)})` }}>
                    {"{"}
                  </span>
                  <div className="eqLines">
                    {preview.lines.map((l, idx) => (
                      <div key={idx}>{l}</div>
                    ))}
                  </div>
                </div>

                <div className="eqLines" style={{ marginTop: 10, fontWeight: 900 }}>
                  MIN ({preview.obj.p}x₁ + {preview.obj.q}x₂)
                </div>
                <div className="eqLines" style={{ marginTop: 6, fontWeight: 800 }}>
                  Droite objectif : {preview.obj.p}x₁ + {preview.obj.q}x₂ = {preview.obj.k}
                </div>
              </>
            )}
          </div>

          <div className="sep">
            <div className="actionsRow">
              <button className="btn btnPrimary" onClick={showTable} style={BTN_BLUE}>
                Afficher tableau
              </button>

              <button className="btn" onClick={goGraph} disabled={!preview} style={BTN_GRAY}>
                Voir le graphe →
              </button>

              <button className="btn" onClick={clearTableData} style={BTN_GRAY} disabled={!linesForTable}>
                Vider tableau
              </button>
            </div>

            {linesForTable && (
              <Table
                linesForTable={linesForTable}
                cellData={cellData}
                setCellData={setCellData}
                setStatus={setStatus}
                onCellDataChange={handleCellDataChange}
              />
            )}

            <div className="status">{status.startsWith("Erreur:") ? <span className="pillErr">{status}</span> : status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}