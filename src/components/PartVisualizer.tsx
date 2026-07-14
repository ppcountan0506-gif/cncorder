import React from "react";
import { DrawingAnalysis, QuotationConfig } from "../types";

interface PartVisualizerProps {
  config: QuotationConfig;
  analysis: DrawingAnalysis;
  materialColor: string;
}

export default function PartVisualizer({ config, analysis, materialColor }: PartVisualizerProps) {
  // Let's create an aspect ratio bounding box for the SVG
  const svgWidth = 500;
  const svgHeight = 320;
  const padding = 40;

  const partLength = config.length;
  const partWidth = config.width;

  // Calculate dynamic scale to fit the plate in the SVG canvas
  const maxDim = Math.max(partLength, partWidth);
  const scale = (Math.min(svgWidth, svgHeight) - padding * 2) / (maxDim || 1);

  // Center the part in the canvas
  const widthInPixels = partLength * scale;
  const heightInPixels = partWidth * scale;
  const x0 = (svgWidth - widthInPixels) / 2;
  const y0 = (svgHeight - heightInPixels) / 2;

  // External corner radius
  const extR = 0.25 * scale;

  // Large central pocket (window)
  // Let's assume pocket size from drawing analysis, or adapt to part size
  let pocketW = 6.120;
  let pocketH = 3.120;
  
  // Safety guard: central pocket should not exceed plate size
  if (pocketW >= partLength - 0.5) pocketW = Math.max(0.5, partLength - 1.0);
  if (pocketH >= partWidth - 0.5) pocketH = Math.max(0.5, partWidth - 1.0);

  const pocketW_px = pocketW * scale;
  const pocketH_px = pocketH * scale;
  const pocketX = x0 + (widthInPixels - pocketW_px) / 2;
  const pocketY = y0 + (heightInPixels - pocketH_px) / 2;
  const pocketR = 0.25 * scale;

  // Calculate hole positions (8 mounting holes)
  // According to drawing: 4 corners and 4 on top/bottom edges
  const holePositions: { x: number; y: number }[] = [];
  const holeOffset = 0.28 * scale; // offset from edges

  if (analysis.holes.count > 0) {
    const corners = [
      { x: x0 + holeOffset, y: y0 + holeOffset },
      { x: x0 + widthInPixels - holeOffset, y: y0 + holeOffset },
      { x: x0 + holeOffset, y: y0 + heightInPixels - holeOffset },
      { x: x0 + widthInPixels - holeOffset, y: y0 + heightInPixels - holeOffset },
    ];
    holePositions.push(...corners);

    // 4 additional side holes
    if (analysis.holes.count >= 8) {
      holePositions.push(
        { x: x0 + widthInPixels * 0.3, y: y0 + holeOffset },
        { x: x0 + widthInPixels * 0.7, y: y0 + holeOffset },
        { x: x0 + widthInPixels * 0.3, y: y0 + heightInPixels - holeOffset },
        { x: x0 + widthInPixels * 0.7, y: y0 + heightInPixels - holeOffset }
      );
    }
  }

  // Calculate 10 square slots positions (.310 SQ)
  const slotPositions: { x: number; y: number; size: number }[] = [];
  const slotSize = 0.310 * scale;
  
  if (analysis.slots.count > 0) {
    // Array them along the horizontal margins of the frame
    // 5 slots on top-ish row, 5 slots on bottom-ish row
    const countPerRow = Math.ceil(analysis.slots.count / 2);
    for (let i = 0; i < countPerRow; i++) {
      const step = widthInPixels / (countPerRow + 1);
      // Top row slots
      slotPositions.push({
        x: x0 + step * (i + 1) - slotSize / 2,
        y: y0 + (pocketY - y0) / 2 - slotSize / 2,
        size: slotSize
      });
      // Bottom row slots
      if (slotPositions.length < analysis.slots.count) {
        slotPositions.push({
          x: x0 + step * (i + 1) - slotSize / 2,
          y: pocketY + pocketH_px + (y0 + heightInPixels - (pocketY + pocketH_px)) / 2 - slotSize / 2,
          size: slotSize
        });
      }
    }
  }

  const holeRadius = 0.10 * scale; // Ø.201

  return (
    <div className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center p-4">
      {/* Visualizer Header */}
      <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
          Dynamic Vector Preview (1:{scale.toFixed(1)})
        </span>
      </div>

      <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500">
        Unit: {analysis.unit === "inch" ? "Inches (in)" : "Millimeters (mm)"}
      </div>

      {/* Main SVG Drawing Canvas */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-64 md:h-72 mt-4"
        style={{ contentVisibility: "auto" }}
      >
        <defs>
          {/* Metal Shader Gradient */}
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={materialColor} stopOpacity="1" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#475569" stopOpacity="1" />
          </linearGradient>
          {/* Grid pattern for background */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Technical Grid Background */}
        <rect width={svgWidth} height={svgHeight} fill="url(#grid)" rx="8" />

        {/* Center Lines */}
        <line
          x1={svgWidth / 2}
          y1={y0 - 15}
          x2={svgWidth / 2}
          y2={y0 + heightInPixels + 15}
          stroke="#ef4444"
          strokeWidth="0.75"
          strokeDasharray="6,4,2,4"
          opacity="0.5"
        />
        <line
          x1={x0 - 15}
          y1={svgHeight / 2}
          x2={x0 + widthInPixels + 15}
          y2={svgHeight / 2}
          stroke="#ef4444"
          strokeWidth="0.75"
          strokeDasharray="6,4,2,4"
          opacity="0.5"
        />

        {/* Main Part Body (Plate) */}
        <rect
          x={x0}
          y={y0}
          width={widthInPixels}
          height={heightInPixels}
          rx={extR}
          fill="url(#metalGradient)"
          stroke="#f8fafc"
          strokeWidth="1.5"
          className="transition-all duration-300"
        />

        {/* Central Pocket (镂空 Window Cutout) */}
        <rect
          x={pocketX}
          y={pocketY}
          width={pocketW_px}
          height={pocketH_px}
          rx={pocketR}
          fill="#020617" // cut-through showing background
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="2,2"
          className="transition-all duration-300"
        />

        {/* Square slots (.310 SQ) */}
        {slotPositions.map((pos, idx) => (
          <rect
            key={`slot-${idx}`}
            x={pos.x}
            y={pos.y}
            width={pos.size}
            height={pos.size}
            fill="#090d16"
            stroke="#475569"
            strokeWidth="1"
            className="transition-all duration-300"
          />
        ))}

        {/* Mounting Holes (8x Ø.201) */}
        {holePositions.map((pos, idx) => (
          <g key={`hole-${idx}`} className="transition-all duration-300">
            {/* Center crosshair */}
            <line x1={pos.x - 6} y1={pos.y} x2={pos.x + 6} y2={pos.y} stroke="#64748b" strokeWidth="0.5" />
            <line x1={pos.x} y1={pos.y - 6} x2={pos.x} y2={pos.y + 6} stroke="#64748b" strokeWidth="0.5" />
            {/* Drill hole circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={holeRadius}
              fill="#090d16"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* --- DIMENSION LINES & CALLOUTS --- */}
        {/* Horizontal Dimension: LENGTH */}
        <g stroke="#38bdf8" strokeWidth="1">
          {/* Left extension line */}
          <line x1={x0} y1={y0 + heightInPixels} x2={x0} y2={y0 + heightInPixels + 25} opacity="0.6" />
          {/* Right extension line */}
          <line x1={x0 + widthInPixels} y1={y0 + heightInPixels} x2={x0 + widthInPixels} y2={y0 + heightInPixels + 25} opacity="0.6" />
          {/* Dimension arrow line */}
          <line x1={x0 + 5} y1={y0 + heightInPixels + 20} x2={x0 + widthInPixels - 5} y2={y0 + heightInPixels + 20} />
          {/* Arrowheads */}
          <polygon points={`${x0},${y0 + heightInPixels + 20} ${x0 + 6},${y0 + heightInPixels + 17} ${x0 + 6},${y0 + heightInPixels + 23}`} fill="#38bdf8" />
          <polygon points={`${x0 + widthInPixels},${y0 + heightInPixels + 20} ${x0 + widthInPixels - 6},${y0 + heightInPixels + 17} ${x0 + widthInPixels - 6},${y0 + heightInPixels + 23}`} fill="#38bdf8" />
        </g>
        <text
          x={x0 + widthInPixels / 2}
          y={y0 + heightInPixels + 15}
          fill="#38bdf8"
          fontSize="11"
          fontFamily="monospace"
          textAnchor="middle"
          className="font-bold select-none"
        >
          L: {partLength.toFixed(3)}&quot;
        </text>

        {/* Vertical Dimension: WIDTH */}
        <g stroke="#38bdf8" strokeWidth="1">
          {/* Top extension line */}
          <line x1={x0} y1={y0} x2={x0 - 25} y2={y0} opacity="0.6" />
          {/* Bottom extension line */}
          <line x1={x0} y1={y0 + heightInPixels} x2={x0 - 25} y2={y0 + heightInPixels} opacity="0.6" />
          {/* Dimension arrow line */}
          <line x1={x0 - 20} y1={y0 + 5} x2={x0 - 20} y2={y0 + heightInPixels - 5} />
          {/* Arrowheads */}
          <polygon points={`${x0 - 20},${y0} ${x0 - 23},${y0 + 6} ${x0 - 17},${y0 + 6}`} fill="#38bdf8" />
          <polygon points={`${x0 - 20},${y0 + heightInPixels} ${x0 - 23},${y0 + heightInPixels - 6} ${x0 - 17},${y0 + heightInPixels - 6}`} fill="#38bdf8" />
        </g>
        <text
          x={x0 - 28}
          y={y0 + heightInPixels / 2 + 4}
          fill="#38bdf8"
          fontSize="11"
          fontFamily="monospace"
          textAnchor="end"
          className="font-bold select-none"
        >
          W: {partWidth.toFixed(3)}&quot;
        </text>

        {/* Thickness Indicator in corner */}
        <rect
          x={x0 + 12}
          y={y0 + 12}
          width="90"
          height="18"
          rx="4"
          fill="#020617"
          stroke="#475569"
          strokeWidth="0.5"
          opacity="0.8"
        />
        <text
          x={x0 + 18}
          y={y0 + 24}
          fill="#e2e8f0"
          fontSize="9"
          fontFamily="monospace"
          className="select-none"
        >
          T = {config.thickness.toFixed(3)}&quot; (Thickness)
        </text>

        {/* Hole callout annotation leader line */}
        {holePositions.length > 0 && (
          <g stroke="#64748b" strokeWidth="0.75" opacity="0.8">
            <line
              x1={holePositions[1].x}
              y1={holePositions[1].y}
              x2={holePositions[1].x + 25}
              y2={holePositions[1].y - 25}
            />
            <line
              x1={holePositions[1].x + 25}
              y1={holePositions[1].y - 25}
              x2={holePositions[1].x + 75}
              y2={holePositions[1].y - 25}
            />
            <circle cx={holePositions[1].x} cy={holePositions[1].y} r="1.5" fill="#64748b" />
            <text
              x={holePositions[1].x + 28}
              y={holePositions[1].y - 29}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="start"
              className="select-none"
            >
              8x Ø.201 Mounting Holes
            </text>
          </g>
        )}

        {/* Square Slot callout */}
        {slotPositions.length > 0 && (
          <g stroke="#64748b" strokeWidth="0.75" opacity="0.8">
            <line
              x1={slotPositions[1].x + slotSize / 2}
              y1={posInYOffsetForSlot(slotPositions[1])}
              x2={slotPositions[1].x + 10}
              y2={y0 + heightInPixels + 25}
            />
            <line
              x1={slotPositions[1].x + 10}
              y1={y0 + heightInPixels + 25}
              x2={slotPositions[1].x - 60}
              y2={y0 + heightInPixels + 25}
            />
            <circle cx={slotPositions[1].x + slotSize / 2} cy={posInYOffsetForSlot(slotPositions[1])} r="1.5" fill="#64748b" />
            <text
              x={slotPositions[1].x - 55}
              y={y0 + heightInPixels + 34}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="start"
              className="select-none"
            >
              10x .310 SQ Slots
            </text>
          </g>
        )}
      </svg>

      {/* Quick Visualizer Footer Info */}
      <div className="w-full flex justify-between items-center px-2 mt-2 border-t border-slate-800/80 pt-3">
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-mono">HOLES</div>
          <div className="text-sm font-semibold text-slate-300 font-mono">{analysis.holes.count}</div>
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-mono">POCKETS</div>
          <div className="text-sm font-semibold text-slate-300 font-mono">
            {analysis.pockets.reduce((sum, p) => sum + p.count, 0)}
          </div>
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-mono">SLOTS</div>
          <div className="text-sm font-semibold text-slate-300 font-mono">{analysis.slots.count}</div>
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="text-center">
          <div className="text-[10px] text-slate-500 font-mono">COMPLEXITY</div>
          <div className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {analysis.complexity}
          </div>
        </div>
      </div>
    </div>
  );
}

function posInYOffsetForSlot(slot: { y: number; size: number }) {
  return slot.y + slot.size / 2;
}
