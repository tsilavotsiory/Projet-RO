import React, { useEffect, useRef } from "react";
import { drawGraph } from "./graphUtils";

export default function GraphCanvas({ model, onError }) {
  const ref = useRef(null);
  const roRef = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(10, Math.round(rect.width));
      const cssH = Math.max(10, Math.round(rect.height));
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cssW, cssH);

     /* if (!model) {
        ctx.fillStyle = "#64748b";
        ctx.font = "16px Inter, Arial";
        ctx.fillText("Aucun modèle chargé. Reviens à la saisie puis clique “Voir le graphe”.", 22, 34);
        return;
      }*/
     if (!model) return;

      const res = drawGraph(ctx, { width: cssW, height: cssH }, model);
      if (res?.error) onError?.(res.error);
    };

    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(() => render());
    roRef.current.observe(canvas);

    render();

    return () => roRef.current?.disconnect();
  }, [model, onError]);

  return <canvas ref={ref} className="graphCanvas" />;
}