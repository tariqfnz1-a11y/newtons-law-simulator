import React, { useMemo } from 'react';
import { DataPoint } from '../types';

interface GraphsProps {
  dataPoints: DataPoint[];
  maxPoints?: number;
}

export default function Graphs({ dataPoints, maxPoints = 120 }: GraphsProps) {
  // Use the latest maxPoints points
  const points = useMemo(() => {
    if (dataPoints.length <= maxPoints) return dataPoints;
    return dataPoints.slice(dataPoints.length - maxPoints);
  }, [dataPoints, maxPoints]);

  // Calculate dynamic bounds for Velocity graph
  const velBounds = useMemo(() => {
    if (points.length === 0) return { min: -10, max: 10 };
    const values = points.map((p) => p.velocity);
    let min = Math.min(...values);
    let max = Math.max(...values);
    
    // Add margin
    const diff = max - min;
    if (diff < 2) {
      min -= 1;
      max += 1;
    } else {
      min -= diff * 0.15;
      max += diff * 0.15;
    }
    // ensure symmetric boundaries around 0 if it crosses or is close
    if (min < 0 || max < 0) {
      const absMax = Math.max(Math.abs(min), Math.abs(max));
      return { min: -absMax, max: absMax };
    }
    return { min: 0, max: Math.max(5, max) };
  }, [points]);

  // Calculate bounds for Force graph (-250N to 250N is standard, or auto-scale)
  const forceBounds = useMemo(() => {
    if (points.length === 0) return { min: -200, max: 200 };
    const forces = points.flatMap((p) => [p.appliedForce, p.frictionForce, p.netForce]);
    let min = Math.min(...forces, -100);
    let max = Math.max(...forces, 100);
    const absMax = Math.max(Math.abs(min), Math.abs(max));
    return { min: -absMax - 20, max: absMax + 20 };
  }, [points]);

  // Helper to convert data point to SVG coordinate
  const getSvgPath = (
    data: DataPoint[],
    getValue: (p: DataPoint) => number,
    bounds: { min: number; max: number },
    w: number,
    h: number
  ) => {
    if (data.length < 2) return '';
    const pointsCount = data.length;
    
    return data
      .map((p, idx) => {
        const x = (idx / (pointsCount - 1)) * w;
        const val = getValue(p);
        // Map val to y coordinate (y=0 is top, y=h is bottom)
        const y = h - ((val - bounds.min) / (bounds.max - bounds.min)) * h;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const graphWidth = 360;
  const graphHeight = 130;

  // Render a reference zero horizontal line
  const getZeroLineY = (bounds: { min: number; max: number }, h: number) => {
    if (bounds.min <= 0 && bounds.max >= 0) {
      return h - ((0 - bounds.min) / (bounds.max - bounds.min)) * h;
    }
    return null;
  };

  const velZeroY = getZeroLineY(velBounds, graphHeight);
  const forceZeroY = getZeroLineY(forceBounds, graphHeight);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Velocity vs Time Graph */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            Velocity vs. Time (m/s)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
        </div>
        
        <div className="relative border border-slate-100 rounded-lg bg-slate-50 overflow-hidden h-[130px] flex items-center justify-center">
          {points.length < 2 ? (
            <span className="text-xs text-slate-400 font-medium">Awaiting simulation data...</span>
          ) : (
            <svg className="w-full h-full p-1" viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1={graphHeight * 0.25} x2={graphWidth} y2={graphHeight * 0.25} stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={graphHeight * 0.5} x2={graphWidth} y2={graphHeight * 0.5} stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={graphHeight * 0.75} x2={graphWidth} y2={graphHeight * 0.75} stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Zero Line */}
              {velZeroY !== null && (
                <line
                  x1="0"
                  y1={velZeroY}
                  x2={graphWidth}
                  y2={velZeroY}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data Path */}
              <path
                d={getSvgPath(points, (p) => p.velocity, velBounds, graphWidth, graphHeight)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Boundaries labels */}
          {points.length >= 2 && (
            <>
              <div className="absolute top-1 left-2 text-[9px] font-mono font-bold text-slate-500 bg-white/70 px-1 rounded">
                {velBounds.max.toFixed(1)} m/s
              </div>
              <div className="absolute bottom-1 left-2 text-[9px] font-mono font-bold text-slate-500 bg-white/70 px-1 rounded">
                {velBounds.min.toFixed(1)} m/s
              </div>
              {velZeroY !== null && (
                <div 
                  className="absolute left-2 text-[8px] font-mono text-slate-400 bg-white/50 px-1 rounded"
                  style={{ top: `${(velZeroY / graphHeight) * 100 - 6}%` }}
                >
                  0.0
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 italic leading-tight">
          💡 If there is no friction (μ=0) and applied force is 0, velocity will be a perfectly horizontal line (inertia!).
        </p>
      </div>

      {/* 2. Forces vs Time Graph */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"></span>
            Forces vs. Time (N)
          </h3>
          <div className="flex gap-2 text-[9px] font-semibold">
            <span className="text-emerald-600 flex items-center gap-0.5">● Applied</span>
            <span className="text-red-500 flex items-center gap-0.5">● Friction</span>
            <span className="text-violet-600 flex items-center gap-0.5">● Net</span>
          </div>
        </div>

        <div className="relative border border-slate-100 rounded-lg bg-slate-50 overflow-hidden h-[130px] flex items-center justify-center">
          {points.length < 2 ? (
            <span className="text-xs text-slate-400 font-medium">Awaiting simulation data...</span>
          ) : (
            <svg className="w-full h-full p-1" viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1={graphHeight * 0.25} x2={graphWidth} y2={graphHeight * 0.25} stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={graphHeight * 0.5} x2={graphWidth} y2={graphHeight * 0.5} stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={graphHeight * 0.75} x2={graphWidth} y2={graphHeight * 0.75} stroke="#f1f5f9" strokeWidth="1" />

              {/* Zero Line */}
              {forceZeroY !== null && (
                <line
                  x1="0"
                  y1={forceZeroY}
                  x2={graphWidth}
                  y2={forceZeroY}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Applied Force Path (Green) */}
              <path
                d={getSvgPath(points, (p) => p.appliedForce, forceBounds, graphWidth, graphHeight)}
                fill="none"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Friction Force Path (Red) */}
              <path
                d={getSvgPath(points, (p) => p.frictionForce, forceBounds, graphWidth, graphHeight)}
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Net Force Path (Purple - Bold!) */}
              <path
                d={getSvgPath(points, (p) => p.netForce, forceBounds, graphWidth, graphHeight)}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Boundaries labels */}
          {points.length >= 2 && (
            <>
              <div className="absolute top-1 left-2 text-[9px] font-mono font-bold text-slate-500 bg-white/70 px-1 rounded">
                {forceBounds.max.toFixed(0)} N
              </div>
              <div className="absolute bottom-1 left-2 text-[9px] font-mono font-bold text-slate-500 bg-white/70 px-1 rounded">
                {forceBounds.min.toFixed(0)} N
              </div>
              {forceZeroY !== null && (
                <div 
                  className="absolute left-2 text-[8px] font-mono text-slate-400 bg-white/50 px-1 rounded"
                  style={{ top: `${(forceZeroY / graphHeight) * 100 - 6}%` }}
                >
                  0 N
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-2 italic leading-tight">
          💡 Newton's 1st Law states that constant motion requires <strong>zero Net Force (purple line = 0)</strong>!
        </p>
      </div>
    </div>
  );
}
