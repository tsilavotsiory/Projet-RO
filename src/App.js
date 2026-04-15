import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import MaxPage from "./pages/max/MaxPage";
import MinPage from "./pages/min/MinPage";

const GLOBAL_CSS = `
:root{
  --navH: 72px;

  --bg:#f6f7fb;
  --text:#0f172a;
  --muted:#475569;
  --primary:#2563eb;
  --primary2:#1d4ed8;
  --danger:#ef4444;

  --border: rgba(15,23,42,.12);
  --card: rgba(255,255,255,.90);
  --cardSolid:#fff;

  --shadow: 0 22px 70px rgba(15,23,42,.12);
  --radius: 18px;

  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
}

*{ box-sizing:border-box; }
html, body, #root{ height:100%; }
body{
  margin:0;
  overflow: hidden;
  color:var(--text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  background:
    radial-gradient(1200px 520px at 12% -18%, rgba(37,99,235,.14), transparent 60%),
    radial-gradient(900px 420px at 95% 0%, rgba(239,68,68,.10), transparent 55%),
    var(--bg);
}

.mainView{
  height: calc(100vh - var(--navH));
  overflow: hidden;
}

.container{
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 18px;
  height: 100%;
  overflow: hidden;
}

.card{
  background: var(--card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel{ padding: 16px; }

.pageTitle{
  margin: 0;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: .2px;
}
.pageSub{
  margin-top: 6px;
  color: var(--muted);
  font-weight: 700;
  font-size: 13px;
}

.sep{
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15,23,42,.14);
}

.row2{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
.row3{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; }

@media (max-width: 860px){
  .row2, .row3{ grid-template-columns: 1fr; }
}

.label{
  font-size: 12px;
  color: var(--muted);
  font-weight: 900;
  letter-spacing: .7px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.hint{
  color: var(--muted);
  font-size: 12px;
  margin-top: 6px;
  font-weight: 650;
}

.input, .select{
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.95);
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.input:focus, .select:focus{
  border-color: rgba(37,99,235,.55);
  box-shadow: 0 0 0 4px rgba(37,99,235,.12);
}

.btn{
  border: 1px solid var(--border);
  background: var(--cardSolid);
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 900;
  transition: transform .08s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;
}
.btn:active{ transform: translateY(1px); }
.btn:disabled{ opacity:.55; cursor:not-allowed; }

.btnPrimary{
  border-color: rgba(37,99,235,.35);
  background: linear-gradient(180deg, rgba(37,99,235,.98), rgba(29,78,216,.98));
  color: #fff;
  box-shadow: 0 18px 44px rgba(37,99,235,.18);
}

.actionsRow{
  display:flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.pillErr{
  display:inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(239,68,68,.30);
  background: rgba(239,68,68,.08);
  color: #991b1b;
  font-weight: 900;
  font-size: 12px;
}

.eqBox{
  margin-top: 14px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.78);
}
.eqBoxTitle{
  font-weight: 950;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .9px;
  color: var(--muted);
  margin-bottom: 8px;
}
.eqRow{ display:flex; gap: 10px; align-items:flex-start; }
.brace{ font-family:"Times New Roman", serif; line-height:1; transform-origin: top; user-select:none; }
.eqLines{ font-family: var(--mono); font-size: 14px; line-height: 1.75; }

.status{
  margin-top: 12px;
  color: var(--muted);
  font-weight: 750;
  font-size: 13px;
}

/* Canvas compact comme PDF */
.graphCanvas{
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: #fff;
}

/* TABLE */
.tableWrap{ position: relative; margin-top: 14px; }
.plTable{
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255,255,255,.92);
}
.plTable thead th{
  background: rgba(248,250,252,.96);
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .9px;
  font-weight: 950;
  border-bottom: 1px solid var(--border);
  padding: 12px;
}
.plTable td{
  padding: 12px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.plTable tr:last-child td{ border-bottom: none; }

.eqCell{ text-align:left; font-family: var(--mono); color: rgba(15,23,42,.92); }
.dataCell{
  text-align:center;
  cursor:pointer;
  user-select:none;
  transition: background .15s ease, outline .15s ease;
}
.dataCell:hover{ background: rgba(37,99,235,.06); }
.dataCell.active{
  outline: 2px solid rgba(37,99,235,.85);
  outline-offset: -2px;
  background: rgba(37,99,235,.08);
}

.editor{
  position:absolute;
  z-index:50;
  width:270px;
  border-radius:16px;
  border:1px solid rgba(37,99,235,.35);
  background: rgba(255,255,255,.96);
  box-shadow: 0 22px 70px rgba(15,23,42,.18);
  padding:10px;
}
.editorRow{
  display:grid;
  grid-template-columns: 105px 1fr;
  gap: 8px;
  align-items:center;
}
.editorActions{
  display:flex;
  gap: 8px;
  margin-top: 10px;
}
.editorActions button{ flex: 1; }
`;

export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <BrowserRouter>
        <Navbar />
        <div className="mainView">
          <Routes>
            <Route path="/" element={<Navigate to="/max" replace />} />

            <Route path="/max" element={<MaxPage view="form" />} />
            <Route path="/max/graphe" element={<MaxPage view="graph" />} />

            <Route path="/min" element={<MinPage view="form" />} />
            <Route path="/min/graphe" element={<MinPage view="graph" />} />

            <Route path="*" element={<Navigate to="/max" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}