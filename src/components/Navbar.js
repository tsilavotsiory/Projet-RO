import React from "react";
import { NavLink } from "react-router-dom";

const shell = {
  height: "var(--navH)",
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "rgba(246,247,251,.72)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(15,23,42,.12)",
  display: "flex",
  alignItems: "center",
};

const inner = {
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto",
  padding: "0 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const brand = { display: "flex", alignItems: "center", gap: 12 };
const dot = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "linear-gradient(180deg, #2563eb, #60a5fa)",
  boxShadow: "0 10px 22px rgba(37,99,235,.25)",
};

const linkBase = {
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,.12)",
  background: "rgba(255,255,255,.85)",
  fontWeight: 950,
  letterSpacing: ".6px",
};

export default function Navbar() {
  return (
    <header style={shell}>
      <div style={inner}>
        <div style={brand}>
          <div style={dot} />
          <div>
            <div style={{ fontWeight: 950 }}>Projet RO — PL Graphique</div>
            <div style={{ fontSize: 12, fontWeight: 750, color: "rgba(71,85,105,1)" }}>
              MAX / MIN — style PDF
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 10 }}>
          <NavLink
            to="/max"
            style={({ isActive }) => ({
              ...linkBase,
              color: isActive ? "#1d4ed8" : "#0f172a",
              background: isActive ? "rgba(37,99,235,.10)" : "rgba(255,255,255,.85)",
              borderColor: isActive ? "rgba(37,99,235,.35)" : "rgba(15,23,42,.12)",
            })}
          >
            MAX
          </NavLink>

          <NavLink
            to="/min"
            style={({ isActive }) => ({
              ...linkBase,
              color: isActive ? "#1d4ed8" : "#0f172a",
              background: isActive ? "rgba(37,99,235,.10)" : "rgba(255,255,255,.85)",
              borderColor: isActive ? "rgba(37,99,235,.35)" : "rgba(15,23,42,.12)",
            })}
          >
            MIN
          </NavLink>
        </nav>
      </div>
    </header>
  );
}