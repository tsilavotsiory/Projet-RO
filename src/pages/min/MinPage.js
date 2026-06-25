// D:\projet-ro\src\pages\min\MinPage.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import "./MinStyle.css";
import { useLocation, useNavigate } from "react-router-dom";
import { parseValue, parseCoeff, fmtEqIneq, fmtExpr, fmtSmart } from "../../utils/math";
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
  return { A: "", B: "", C: "", sense: ">=" }; // ✅ sens modifiable
}

const BTN_GRAY = { background: "#0b1220", borderColor: "rgba(255,255,255,.10)", color: "#e5e7eb" };

export default function MinPage({ view }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [m, setM] = useState(3);
  const [consInputs, setConsInputs] = useState(() => Array.from({ length: 3 }, () => makeCon()));
  const [objInputs, setObjInputs] = useState({ p: "", q: "" });
  const [kObj, setKObj] = useState("");

  // Graph
  const [graphModel, setGraphModel] = useState(null);

  const animRef = useRef({ raf: 0 });
  const [status, setStatus] = useState("Saisis les coefficients, puis clique sur « Voir le graphe ».");

  // ✅ cleanup animation
  useEffect(() => {
    const anim = animRef.current;
    return () => {
      if (anim.raf) cancelAnimationFrame(anim.raf);
      anim.raf = 0;
    };
  }, []);

  // Ajuste le nombre de contraintes
  useEffect(() => {
    setConsInputs((prev) => {
      const nextM = clampInt(m, 1, 12);
      if (prev.length === nextM) return prev;
      if (prev.length < nextM) return prev.concat(Array.from({ length: nextM - prev.length }, () => makeCon()));
      return prev.slice(0, nextM);
    });
  }, [m]);

  // Restore (FORM)
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
        sense: c?.sense ?? ">=", // ✅ restore sens
      }));
      setConsInputs(restored);
      if (typeof saved.m !== "number") setM(restored.length || 3);
    }

    if (saved.objInputs) setObjInputs(saved.objInputs);
    if (typeof saved.kObj === "string") setKObj(saved.kObj);
  }, [view]);

  // ✅ Auto graphe + solution + animation
  const startAutoGraph = useCallback((baseModel) => {
    if (!baseModel) {
      setGraphModel(null);
      setStatus("Erreur: aucun modèle chargé. Reviens à la saisie puis clique « Voir le graphe ».");
      return;
    }

    if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
    animRef.current.raf = 0;

    setGraphModel({
      ...baseModel,
      autoViewBox: true,
      scaleCm: null,
      showSolution: true,
      animT: 0,
    });

    const start = performance.now();
    const dur = 900;

    const loop = (now) => {
      const t = Math.max(0, Math.min(1, (now - start) / dur));
      setGraphModel((prev) => (prev ? { ...prev, showSolution: true, animT: t } : prev));
      if (t < 1) animRef.current.raf = requestAnimationFrame(loop);
      else animRef.current.raf = 0;
    };

    animRef.current.raf = requestAnimationFrame(loop);
    setStatus("");
  }, []);

  // Graph init + écoute storage (GRAPH)
  useEffect(() => {
    if (view !== "graph") return;

    const fromNav = location.state?.model;
    const base = fromNav || loadFull()?.model || null;

    startAutoGraph(base);

    function refresh() {
      const b = loadFull()?.model || null;
      startAutoGraph(b);
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
  }, [view, location.state, startAutoGraph]);

  // Preview (ignore lignes vides) + p,q,k obligatoires
  const preview = useMemo(() => {
    const consParsed = consInputs
      .map((row) => {
        const rawA = String(row?.A ?? "").trim();
        const rawB = String(row?.B ?? "").trim();
        const rawC = String(row?.C ?? "").trim();
        const allEmpty = rawA === "" && rawB === "" && rawC === "";
        if (allEmpty) return null;

        const sense = row?.sense === "<=" ? "<=" : ">=";

        return {
          A: parseCoeff(rawA),
          B: parseCoeff(rawB),
          C: parseValue(rawC),
          sense,
        };
      })
      .filter(Boolean);

    if (consParsed.length === 0) return null;
    if (consParsed.some((L) => L.C == null)) return null;

    const okCons = consParsed.every((x) => Number.isFinite(x.A) && Number.isFinite(x.B) && Number.isFinite(x.C));
    if (!okCons) return null;

    const p = parseValue(objInputs.p);
    const q = parseValue(objInputs.q);
    const k = parseValue(kObj);

    if (p == null || q == null || k == null) return null;
    if (!Number.isFinite(p) || !Number.isFinite(q) || !Number.isFinite(k)) return null;

    return {
      lines: consParsed.map((L) => fmtEqIneq(L.A, L.B, L.C, L.sense)), // ✅ sens par contrainte
      obj: { p, q, k },
    };
  }, [consInputs, objInputs, kObj]);

  // Construit + persist le modèle pour le graphe
  const buildAndPersist = useCallback(
    (showErrors) => {
      try {
        const res = buildMinModel({ consInputs, objInputs, kObjInput: kObj });
        const enriched = { ...res.model, extraPoints: [] };

        saveFull({
          m: consInputs.length,
          consInputs,
          objInputs,
          kObj,
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

  function goGraph() {
    const current = buildAndPersist(true);
    if (!current) return;
    navigate("/min/graphe", { state: { model: current } });
  }

  function backToForm() {
    navigate("/min");
  }

  function clearInputsOnly() {
    const nextCons = consInputs.map(() => makeCon());
    const nextObj = { p: "", q: "" };

    setConsInputs(nextCons);
    setObjInputs(nextObj);
    setKObj("");

    localStorage.removeItem(KEY);
    emitChanged();

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

        {status?.startsWith("Erreur:") && (
          <div className="status">
            <span className="pillErr">{status}</span>
          </div>
        )}

        <div className="graphGrid">
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
        <h1 className="pageTitle">MIN — Saisie</h1>

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
            <div className="label">Contraintes (A·x₁ + B·x₂ ? C)</div>

            <div className="actionsRow" style={{ marginTop: 8, marginBottom: 6 }}>
              <button className="btn" onClick={clearInputsOnly} style={BTN_GRAY}>
                Effacer la saisie
              </button>
            </div>

            {consInputs.map((c, i) => (
              <div key={i} style={{ marginTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 1fr", gap: 12 }}>
                  <input
                    className="input"
                    placeholder={`A${i + 1}`}
                    value={c.A}
                    onChange={(e) =>
                      setConsInputs((p) => p.map((v, idx) => (idx === i ? { ...v, A: e.target.value } : v)))
                    }
                  />
                  <input
                    className="input"
                    placeholder={`B${i + 1}`}
                    value={c.B}
                    onChange={(e) =>
                      setConsInputs((p) => p.map((v, idx) => (idx === i ? { ...v, B: e.target.value } : v)))
                    }
                  />

                  {/* ✅ choix du sens ≥ ou ≤ */}
                  <select
                    className="input"
                    value={c.sense || ">="}
                    onChange={(e) =>
                      setConsInputs((p) =>
                        p.map((v, idx) => (idx === i ? { ...v, sense: e.target.value } : v))
                      )
                    }
                    style={{ textAlign: "center", fontWeight: 900, cursor: "pointer" }}
                    aria-label="sens de la contrainte"
                  >
                    <option value=">=">≥</option>
                    <option value="<=">≤</option>
                  </select>

                  <input
                    className="input"
                    placeholder={`C${i + 1}`}
                    value={c.C}
                    onChange={(e) =>
                      setConsInputs((p) => p.map((v, idx) => (idx === i ? { ...v, C: e.target.value } : v)))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="sep">
            <div className="label">Objectif MIN (p·x₁ + q·x₂)</div>
            <div className="row2" style={{ marginTop: 10 }}>
              <input
                className="input"
                placeholder="p"
                value={objInputs.p}
                onChange={(e) => setObjInputs((o) => ({ ...o, p: e.target.value }))}
              />
              <input
                className="input"
                placeholder="q"
                value={objInputs.q}
                onChange={(e) => setObjInputs((o) => ({ ...o, q: e.target.value }))}
              />
            </div>

            <div className="label" style={{ marginTop: 12 }}>
              Droite objectif (graphe) : p·x₁ + q·x₂ = k
            </div>
            <input className="input" placeholder="k (ex: 24)" value={kObj} onChange={(e) => setKObj(e.target.value)} />
          </div>

          <div className="eqBox">
            <div className="eqBoxTitle">Modèle</div>
            {!preview ? (
              <div className="eqLines">Complète au moins 1 contrainte (C obligatoire) + p,q + k pour afficher l’aperçu.</div>
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
                  MIN ({fmtExpr(preview.obj.p, preview.obj.q)})
                </div>
                <div className="eqLines" style={{ marginTop: 6, fontWeight: 800 }}>
                  Droite objectif : {fmtExpr(preview.obj.p, preview.obj.q)} = {fmtSmart(preview.obj.k)}
                </div>
              </>
            )}
          </div>

          <div className="sep">
            <div className="actionsRow">
              <button className="btn" onClick={goGraph} disabled={!preview} style={BTN_GRAY}>
                Voir le graphe →
              </button>
            </div>

            <div className="status">{status?.startsWith("Erreur:") ? <span className="pillErr">{status}</span> : status}</div>
          </div>
        </div>
      </div>
    </div>
  );
}