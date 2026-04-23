import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import MaxPage from "./pages/max/MaxPage";
import MinPage from "./pages/min/MinPage";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

:root{
  --navH: 72px;

  /* Palette plus sombre */
  --bg: #0b1220;
  --text-main: #e5e7eb;
  --text-muted: #a3adc2;
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --danger: #ef4444;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  --border-color: rgba(255,255,255,.10);
  --card-bg: rgba(17, 24, 39, 0.78);
  --card-solid-bg: rgba(17, 24, 39, 1);
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 20px;

  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,.4);
  --shadow-md: 0 8px 22px rgba(0,0,0,.35);
  --shadow-lg: 0 18px 45px rgba(0,0,0,.45);
  --shadow-focus: 0 0 0 4px rgba(37, 99, 235, 0.25);

  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

*{ box-sizing: border-box; }
html, body, #root{ height: 100%; }
body{
  margin: 0;
  overflow: hidden;
  color: var(--text-main);
  font-family: var(--sans);
  background-color: var(--bg);
  background-image:
    radial-gradient(1200px 520px at 10% -10%, rgba(37,99,235,.18), transparent 55%),
    radial-gradient(1000px 520px at 95% 10%, rgba(245,158,11,.12), transparent 60%);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.mainView{
  height: calc(100vh - var(--navH));
  overflow: hidden;
}
.container{
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-5);
  height: 100%;
  overflow: hidden;
}

.card{
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.panel{ padding: var(--space-5); }

.pageTitle{
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.pageSub{
  margin-top: var(--space-1);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
}
.sep{
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px dashed rgba(255,255,255,.14);
}

.row2, .row3 { display:grid; gap: var(--space-3); }
.row2 { grid-template-columns: 1fr 1fr; }
.row3 { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 860px){
  .row2, .row3 { grid-template-columns: 1fr; }
}

.label{
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.input, .select{
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(2,6,23,.35);
  color: var(--text-main);
  font-family: var(--sans);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input:focus, .select:focus{
  border-color: var(--primary);
  box-shadow: var(--shadow-focus);
}

.btn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(2,6,23,.25);
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
}
.btn:hover:not(:disabled) {
  filter: brightness(1.05);
}
.btn:active{ transform: translateY(1px); }
.btn:disabled{ opacity: 0.5; cursor: not-allowed; }

.btn.btnPrimary{
  border-color: transparent;
  background-color: var(--primary);
  color: #fff;
}
.btn.btnPrimary:hover:not(:disabled){
  background-color: var(--primary-dark);
  box-shadow: var(--shadow-md);
}

.actionsRow{ display:flex; gap: var(--space-3); flex-wrap: wrap; align-items: center; }

.pillErr{
  display:inline-flex;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  border: 1px solid var(--danger);
  background: rgba(239,68,68,.10);
  color: #fecaca;
  font-weight: 700;
  font-size: 12px;
}
.status{
  margin-top: var(--space-4);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
}

.eqBox{
  margin-top: var(--space-5);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(2,6,23,.22);
}
.eqBoxTitle{
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
}
.eqRow{ display:flex; gap: var(--space-3); align-items:flex-start; }
.brace{ font-family:"Times New Roman", serif; font-size: 62px; line-height:1; transform-origin: top; user-select:none; color: rgba(226,232,240,.75); }
.eqLines{ font-family: var(--mono); font-size: 15px; line-height: 1.8; }

.tableWrap{ position: relative; margin-top: var(--space-5); }
.plTable{
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: rgba(2,6,23,.22);
}
.plTable thead th{
  background: rgba(2,6,23,.35);
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .05em;
  font-weight: 700;
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,.12);
}
.plTable thead th:nth-child(n+2) { text-align: center; }
.plTable td{
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid rgba(255,255,255,.10);
}
.plTable tr:last-child td{ border-bottom: none; }
.eqCell{ text-align:left; font-family: var(--mono); }
.dataCell{
  text-align:center;
  cursor:pointer;
  user-select:none;
  transition: background .15s;
  border-radius: 4px;
}
.dataCell:hover{ background: rgba(37, 99, 235, 0.10); }
.dataCell.active{
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  background: rgba(37, 99, 235, 0.14);
}

.editor{
  position:absolute;
  z-index:50;
  width:270px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(17,24,39,1);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  animation: fadeInUp 0.2s ease-out;
}
.editorRow{
  display:grid;
  grid-template-columns: 105px 1fr;
  gap: var(--space-2);
  align-items:center;
}
.editorActions{
  display:flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.editorActions button{ flex: 1; }

.graphCanvas{
  width: 100%;
  height: 100%;
  display: block;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255,255,255,.12);
  background: #fff;
}
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