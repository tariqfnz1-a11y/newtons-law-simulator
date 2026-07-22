import React from 'react';
import { PhysicsParams, ObjectType } from '../types';
import { Play, Pause, RotateCcw, Zap, Eye, EyeOff } from 'lucide-react';

interface ControlPanelProps {
  params: PhysicsParams;
  onChangeParams: (newParams: Partial<PhysicsParams>) => void;
  isPaused: boolean;
  onTogglePlayPause: () => void;
  onReset: () => void;
  onApplyKick: (direction: 'left' | 'right') => void;
  showVectors: {
    forces: boolean;
    velocity: boolean;
    acceleration: boolean;
  };
  onChangeVectors: (key: 'forces' | 'velocity' | 'acceleration', value: boolean) => void;
}

export default function ControlPanel({
  params,
  onChangeParams,
  isPaused,
  onTogglePlayPause,
  onReset,
  onApplyKick,
  showVectors,
  onChangeVectors,
}: ControlPanelProps) {
  
  const objectPresets = [
    {
      id: 'spacecraft' as ObjectType,
      name: 'Spacecraft',
      desc: 'Perfect for Zero-Friction vacuum simulations.',
      icon: '🚀',
      defaultMass: 80,
      defaultFriction: 0.0,
    },
    {
      id: 'puck' as ObjectType,
      name: 'Hockey Puck',
      desc: 'Slick low-friction sliding on a polished surface.',
      icon: '🥏',
      defaultMass: 10,
      defaultFriction: 0.05,
    },
    {
      id: 'bowling_ball' as ObjectType,
      name: 'Bowling Ball',
      desc: 'Heavy sphere with rotational rolling velocity.',
      icon: '🎳',
      defaultMass: 25,
      defaultFriction: 0.12,
    },
    {
      id: 'crate' as ObjectType,
      name: 'Wooden Crate',
      desc: 'Classic physics block with high surface contact.',
      icon: '📦',
      defaultMass: 50,
      defaultFriction: 0.35,
    },
  ];

  const handleSelectObject = (obj: typeof objectPresets[0]) => {
    onChangeParams({
      objectType: obj.id,
      mass: obj.defaultMass,
      frictionCoeff: obj.defaultFriction,
    });
  };

  const frictionPresets = [
    { name: 'Space (μ=0)', val: 0 },
    { name: 'Ice (μ=0.05)', val: 0.05 },
    { name: 'Wood (μ=0.25)', val: 0.25 },
    { name: 'Sandpaper (μ=0.6)', val: 0.6 },
  ];

  const massPresets = [
    { name: 'Light (10kg)', val: 10 },
    { name: 'Medium (50kg)', val: 50 },
    { name: 'Heavy (150kg)', val: 150 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
      
      {/* 1. Object Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Select Object & Base Preset
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {objectPresets.map((obj) => (
            <button
              key={obj.id}
              onClick={() => handleSelectObject(obj)}
              id={`obj-select-${obj.id}`}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-[105px] group ${
                params.objectType === obj.id
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-2xl group-hover:scale-110 transition duration-200">{obj.icon}</span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    params.objectType === obj.id
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {params.objectType === obj.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">{obj.name}</h4>
                <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 mt-0.5">{obj.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Sliders (Mass & Friction) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Configure Physics Parameters
          </h3>

          {/* Mass Slider */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="mass-slider" className="text-xs font-bold text-slate-700">Mass (m)</label>
              <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {params.mass} kg
              </span>
            </div>
            <input
              type="range"
              id="mass-slider"
              min="5"
              max="200"
              step="5"
              value={params.mass}
              onChange={(e) => onChangeParams({ mass: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between gap-1 mt-2.5">
              {massPresets.map((m) => (
                <button
                  key={m.name}
                  onClick={() => onChangeParams({ mass: m.val })}
                  id={`mass-preset-${m.val}`}
                  className="px-2 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Friction Slider */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="friction-slider" className="text-xs font-bold text-slate-700">Friction Coeff. (μ)</label>
              <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {params.frictionCoeff.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              id="friction-slider"
              min="0.00"
              max="0.80"
              step="0.01"
              value={params.frictionCoeff}
              onChange={(e) => onChangeParams({ frictionCoeff: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between gap-1 mt-2.5">
              {frictionPresets.map((f) => (
                <button
                  key={f.name}
                  onClick={() => onChangeParams({ frictionCoeff: f.val })}
                  id={`friction-preset-${f.val}`}
                  className="px-1.5 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Thrust & Force Controls */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Apply Net External Forces
          </h3>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col h-[calc(100%-24px)] justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="force-slider" className="text-xs font-bold text-slate-700">Continuous Force (F_app)</label>
                <span className="text-sm font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {params.appliedForce > 0 ? '+' : ''}
                  {params.appliedForce} N
                </span>
              </div>
              <input
                type="range"
                id="force-slider"
                min="-200"
                max="200"
                step="5"
                value={params.appliedForce}
                onChange={(e) => onChangeParams({ appliedForce: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] font-semibold text-slate-400 px-1 mt-1">
                <span>← Push Left (-200N)</span>
                <span>Off (0N)</span>
                <span>Push Right (+200N) →</span>
              </div>
            </div>

            {/* Instant tactile impulse push buttons */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                ⚡ Impulse Actions (Quick Taps)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onApplyKick('left')}
                  id="btn-kick-left"
                  className="py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                >
                  ◀ Push Left
                </button>
                <button
                  onClick={() => onChangeParams({ appliedForce: 0 })}
                  id="btn-force-zero"
                  className="py-1.5 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-xs rounded-lg transition"
                >
                  Release (0N)
                </button>
                <button
                  onClick={() => onApplyKick('right')}
                  id="btn-kick-right"
                  className="py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition shadow-sm"
                >
                  Push Right ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Playback and HUD Layer Overlays */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-slate-100 gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlayPause}
            id="btn-play-pause"
            className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition shadow-md ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-amber-500 hover:bg-amber-400'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" /> RESUME SIM
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" /> PAUSE SIM
              </>
            )}
          </button>
          
          <button
            onClick={onReset}
            id="btn-reset-sim"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> RESET STATE
          </button>
        </div>

        {/* Dynamic Vector Visibilities */}
        <div className="flex flex-wrap gap-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">
            Toggle HUD Vectors:
          </span>
          
          <button
            onClick={() => onChangeVectors('forces', !showVectors.forces)}
            id="btn-toggle-vector-forces"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1 ${
              showVectors.forces
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {showVectors.forces ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Forces (F)
          </button>

          <button
            onClick={() => onChangeVectors('velocity', !showVectors.velocity)}
            id="btn-toggle-vector-velocity"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1 ${
              showVectors.velocity
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {showVectors.velocity ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Velocity (v)
          </button>

          <button
            onClick={() => onChangeVectors('acceleration', !showVectors.acceleration)}
            id="btn-toggle-vector-acceleration"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1 ${
              showVectors.acceleration
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            {showVectors.acceleration ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Accel (a)
          </button>
        </div>
      </div>

    </div>
  );
}
