import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./MinStyle.css";
import { useLocation, useNavigate } from "react-router-dom";
import { parseValue, fmtEqIneq, fmtExpr } from "../../utils/math";
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
  try { return JSON.parse(raw); } catch { return null; }
}

export default function MinPage({ view }) {
  const navigate = useNavigate();
  const location = useLocation();
  const m = 3;

  const [consInputs, setConsInputs] = useState(() => Array.from({ length: 3 }, () => ({ A: "", B: "", C: "" })));
  const [objInputs, setObjInputs] = useState({ p: "", q: "" });
  const [kObj, setKObj] = useState("");

  const [linesForTable, setLinesForTable] = useState(null);
  const [cellData, setCellData] = useState({});
  const [model, setModel] = useState(null);

  const [graphModel, setGraphModel] = useState(null);
  const [status, setStatus] = useState("Saisis les coefficients, puis génère le tableau.");

  // FORM load
  useEffect(() => {
    if (view !== "form") return;
    const saved = loadFull();
    if (!saved) return;
    if (saved.consInputs) setConsInputs(saved.consInputs);
    if (saved.objInputs) setObjInputs(saved.objInputs);
    if (typeof saved.kObj === "string") setKObj(saved.kObj);
    if (saved.cellData) setCellData(saved.cellData);
    if (saved.model) {
      setModel(saved.model);
      setLinesForTable(saved.linesForTable || null);
    }
  }, [view]);

  // GRAPH listen
  useEffect(() => {
    if (view !== "graph") return;

    const fromNav = location.state?.model;
    if (fromNav) {
      setGraphModel(fromNav);
    } else {
      const saved = loadFull();
      setGraphModel(saved?.model || null);
    }

    function refresh() {
      const saved = loadFull();
      setGraphModel(saved?.model || null);
    }

    function onCustom(e) {
      if (e?.detail?.key === KEY) refresh();
    }
    function onStorage(e) {
      if (e.key === KEY) refresh();
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
    const consParsed = consInputs.map((c) => ({ A: parseValue(c.A), B: parseValue(c.B), C: parseValue(c.C) }));
    const p = parseValue(objInputs.p);
    const q = parseValue(objInputs.q);

    const okCons = consParsed.every((x) => Number.isFinite(x.A) && Number.isFinite(x.B) && Number.isFinite(x.C));
    const okObj = Number.isFinite(p) && Number.isFinite(q);
    if (!okCons || !okObj) return null;

    return { lines: consParsed.map((L) => fmtEqIneq(L.A, L.B, L.C, sense)), obj: { p, q } };
  }, [consInputs, objInputs]);

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

  function generateTable() {
    const enriched = buildAndPersist(cellData, true);
    if (enriched) setStatus("Tableau généré. Le graphe se met à jour automatiquement.");
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

  if (view === "graph") {
    return (
      <div className="container">
        <div className="card panel graphCard">
          <div className="graphHeader">
            <div>
              <h1 className="pageTitle">MIN — Graphe</h1>
              <div className="pageSub">Équations nettes + visibles.</div>
            </div>

            <div className="actionsRow">
              <button className="btn" onClick={backToForm}>← Retour</button>
            </div>
          </div>

          {!graphModel && (
            <div className="sep">
              <span className="pillErr">Aucun modèle chargé. Reviens sur MIN et génère le tableau.</span>
            </div>
          )}

          <div className="graphStage">
            <GraphCanvas model={graphModel} onError={(msg) => setStatus("Erreur: " + msg)} />
          </div>

          <div className="status">
            {status.startsWith("Erreur:") ? <span className="pillErr">{status}</span> : status}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card panel formCard">
        <h1 className="pageTitle">MIN — Saisie & Tableau (3 contraintes fixes)</h1>

        <div className="formScroll">
          <div className="sep">
            <div className="label">Contraintes (A·x₁ + B·x₂ ≥ C)</div>
            {consInputs.map((c, i) => (
              <div className="row3" key={i} style={{ marginTop: 10 }}>
                <input className="input" placeholder={`A${i + 1}`} value={c.A}
                  onChange={(e) => setConsInputs((p) => p.map((v, idx) => idx === i ? { ...v, A: e.target.value } : v))}
                />
                <input className="input" placeholder={`B${i + 1}`} value={c.B}
                  onChange={(e) => setConsInputs((p) => p.map((v, idx) => idx === i ? { ...v, B: e.target.value } : v))}
                />
                <input className="input" placeholder={`C${i + 1}`} value={c.C}
                  onChange={(e) => setConsInputs((p) => p.map((v, idx) => idx === i ? { ...v, C: e.target.value } : v))}
                />
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

          <div className="eqBox">
            <div className="eqBoxTitle">Modèle</div>
            {!preview ? (
              <div className="eqLines">Complète A,B,C,p,q pour afficher l’aperçu.</div>
            ) : (
              <>
                <div className="eqRow">
                  <span className="brace" style={{ fontSize: 62, transform: `scaleY(${Math.max(1, m / 3)})` }}>{"{"}</span>
                  <div className="eqLines">{preview.lines.map((l, idx) => <div key={idx}>{l}</div>)}</div>
                </div>
                <div className="eqLines" style={{ marginTop: 10, fontWeight: 900 }}>
                  MIN ({fmtExpr(preview.obj.p, preview.obj.q)})
                </div>
              </>
            )}
          </div>

          <div className="sep">
            <div className="actionsRow">
              <button className="btn btnPrimary" onClick={generateTable}>Générer / Mettre à jour</button>
              <button className="btn" onClick={goGraph} disabled={!preview}>Voir le graphe →</button>
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

            <div className="status">
              {status.startsWith("Erreur:") ? <span className="pillErr">{status}</span> : status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}