import React, { useState, useCallback, useRef } from 'react';
import { PhysicsParams, PhysicsState, DataPoint, ExperimentPreset } from './types';
import SimulationCanvas from './components/SimulationCanvas';
import ControlPanel from './components/ControlPanel';
import Graphs from './components/Graphs';
import ExperimentPanel from './components/ExperimentPanel';
import CrashTestCanvas from './components/CrashTestCanvas';
import EducationPanel from './components/EducationPanel';
import EmbedHelper from './components/EmbedHelper';
import { ShieldAlert, Compass, Sparkles, BookOpen, Code, Lightbulb, CheckCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'crashtest' | 'textbook' | 'embed'>('sandbox');

  // --- 1. Physics Sandbox State ---
  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>({
    mass: 50,
    frictionCoeff: 0.05,
    appliedForce: 0,
    objectType: 'puck',
  });

  const [physicsState, setPhysicsState] = useState<PhysicsState>({
    position: 0,
    velocity: 0,
    acceleration: 0,
    appliedForce: 0,
    frictionForce: 0,
    netForce: 0,
  });

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Vector Arrow show settings
  const [showVectors, setShowVectors] = useState({
    forces: true,
    velocity: true,
    acceleration: false,
  });

  // --- 2. Crash Test Lab State ---
  const [crashSpeed, setCrashSpeed] = useState<number>(2); // 1 = Low, 2 = Med, 3 = High
  const [seatbeltOn, setSeatbeltOn] = useState<boolean>(false);

  // Sync state updates from the animation loop in SimulationCanvas
  const handleUpdatePhysicsState = useCallback((newState: Partial<PhysicsState>) => {
    setPhysicsState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Log data points for the real-time plots
  const handleLogDataPoint = useCallback((
    vel: number,
    applied: number,
    friction: number,
    net: number
  ) => {
    setDataPoints((prev) => {
      const timeStamp = prev.length > 0 ? prev[prev.length - 1].time + 0.1 : 0;
      const nextPoints = [
        ...prev,
        {
          time: parseFloat(timeStamp.toFixed(1)),
          velocity: vel,
          appliedForce: applied,
          frictionForce: friction,
          netForce: net,
        },
      ];
      // Keep only last 150 points for memory & rendering speed
      if (nextPoints.length > 150) {
        return nextPoints.slice(nextPoints.length - 150);
      }
      return nextPoints;
    });
  }, []);

  // Load a guided lab experiment preset
  const handleLoadPreset = (preset: ExperimentPreset) => {
    setActivePresetId(preset.id);
    setPhysicsParams({
      mass: preset.mass,
      frictionCoeff: preset.frictionCoeff,
      appliedForce: preset.appliedForce,
      objectType: preset.objectType,
    });
    setPhysicsState({
      position: 0,
      velocity: 0,
      acceleration: 0,
      appliedForce: preset.appliedForce,
      frictionForce: 0,
      netForce: 0,
    });
    setDataPoints([]);
    setIsPaused(false);
  };

  // Trigger a temporary physical push/kick
  const kickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleApplyKick = (direction: 'left' | 'right') => {
    // Clear any pending kick timeouts
    if (kickTimeoutRef.current) clearTimeout(kickTimeoutRef.current);

    const kickForce = direction === 'right' ? 180 : -180;
    
    // Set parameters to apply kick immediately
    setPhysicsParams((prev) => ({ ...prev, appliedForce: kickForce }));
    setActivePresetId(null); // release strict adherence to preset

    // Remove the force after 250 milliseconds (showing inertia keeps it moving!)
    kickTimeoutRef.current = setTimeout(() => {
      setPhysicsParams((prev) => ({ ...prev, appliedForce: 0 }));
    }, 250);
  };

  const handleResetSandbox = () => {
    setPhysicsState({
      position: 0,
      velocity: 0,
      acceleration: 0,
      appliedForce: physicsParams.appliedForce,
      frictionForce: 0,
      netForce: 0,
    });
    setDataPoints([]);
    setActivePresetId(null);
  };

  const handleToggleVectors = (key: 'forces' | 'velocity' | 'acceleration', value: boolean) => {
    setShowVectors((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Header Banner */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 shadow-lg p-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Newton's First Law Simulation
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Interactive Lab
              </span>
            </h1>
            <p className="text-slate-400 text-sm">Educational Interactive Module • Physics 101</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hidden sm:block">
              <span className="text-[10px] text-slate-500 uppercase font-bold block leading-tight">Current Law</span>
              <span className="text-emerald-400 font-mono text-xs font-bold">Law of Inertia</span>
            </div>

            {/* Navigation tabs */}
            <nav className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('sandbox')}
                id="tab-sandbox"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial flex items-center justify-center gap-1.5 ${
                  activeTab === 'sandbox'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                1D Sandbox
              </button>
              <button
                onClick={() => setActiveTab('crashtest')}
                id="tab-crashtest"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial flex items-center justify-center gap-1.5 ${
                  activeTab === 'crashtest'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Crash Test Lab
              </button>
              <button
                onClick={() => setActiveTab('textbook')}
                id="tab-textbook"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial flex items-center justify-center gap-1.5 ${
                  activeTab === 'textbook'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Quiz & Theory
              </button>
              <button
                onClick={() => setActiveTab('embed')}
                id="tab-embed"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial flex items-center justify-center gap-1.5 ${
                  activeTab === 'embed'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Embed Code
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 2. Main Content Canvas Space */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-y-auto space-y-6">

        {/* TAB 1: Physics Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left/Middle Column (Canvas, graphs, experiments) */}
            <div className="xl:col-span-2 space-y-6">
              {/* Simulation Screen */}
              <SimulationCanvas
                params={physicsParams}
                state={physicsState}
                onUpdateState={handleUpdatePhysicsState}
                isPaused={isPaused}
                showVectors={showVectors}
                onLogDataPoint={handleLogDataPoint}
              />

              {/* Dynamic Force & Velocity Graphs */}
              <Graphs dataPoints={dataPoints} />

              {/* Presets and Lab Challenges */}
              <ExperimentPanel
                onLoadPreset={handleLoadPreset}
                activePresetId={activePresetId}
              />
            </div>

            {/* Right Column: Physical Controls */}
            <div className="space-y-6">
              <div className="sticky top-6">
                <ControlPanel
                  params={physicsParams}
                  onChangeParams={(p) => {
                    setPhysicsParams((prev) => ({ ...prev, ...p }));
                    setActivePresetId(null); // disconnect preset if slider changes
                  }}
                  isPaused={isPaused}
                  onTogglePlayPause={() => setIsPaused(!isPaused)}
                  onReset={handleResetSandbox}
                  onApplyKick={handleApplyKick}
                  showVectors={showVectors}
                  onChangeVectors={handleToggleVectors}
                />
                
                {/* Summary Info Card */}
                <div className="bg-blue-600 p-6 rounded-xl text-white shadow-lg mt-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-300 fill-amber-300" /> Key Concept • Inertia
                  </h4>
                  <p className="text-[13px] font-medium leading-relaxed">
                    "An object in motion tends to stay in motion at a constant velocity, and an object at rest tends to remain at rest, unless acted upon by an unbalanced force."
                  </p>
                  <p className="text-[11px] text-blue-100/90 leading-relaxed pt-2 border-t border-blue-500">
                    💡 <strong>Quick Lab Practice:</strong> Slide <strong>Friction Coeff (μ)</strong> to <strong>0.00</strong>. Tap <strong>"Push Right ▶"</strong>, then let the applied force drop back to 0. Notice how the object glides infinitely with zero deceleration!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Crash Test Lab (The Seatbelt Inertia Demo) */}
        {activeTab === 'crashtest' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* The canvas frame (spanning 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-6">
              <CrashTestCanvas launchSpeed={crashSpeed} seatbeltOn={seatbeltOn} />
            </div>

            {/* Crash lab sidebar controls */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Crash Lab Configuration
                </h3>

                {/* 1. Launch Speed */}
                <div className="space-y-2">
                  <label htmlFor="crash-speed-select" className="text-xs font-bold text-slate-700 block">
                    1. Select Crash Speed (Forward Inertia)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 1, label: 'Low', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
                      { val: 2, label: 'Medium', color: 'border-amber-200 bg-amber-50 text-amber-800' },
                      { val: 3, label: 'High', color: 'border-red-200 bg-red-50 text-red-800' },
                    ].map((sp) => (
                      <button
                        key={sp.val}
                        onClick={() => setCrashSpeed(sp.val)}
                        id={`btn-crash-speed-${sp.val}`}
                        className={`py-2 px-3 border text-xs font-bold rounded-xl transition ${
                          crashSpeed === sp.val
                            ? `${sp.color} ring-2 ring-blue-500/20 border-blue-500`
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Seatbelt Toggle */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    2. Seatbelt Status (External Restraining Force)
                  </label>
                  
                  <button
                    onClick={() => setSeatbeltOn(!seatbeltOn)}
                    id="btn-toggle-seatbelt"
                    className={`w-full p-4 border rounded-2xl text-left transition flex items-center justify-between group ${
                      seatbeltOn
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950'
                        : 'border-red-600 bg-red-50/60 text-red-950'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs flex items-center gap-1">
                        {seatbeltOn ? '✅ Seatbelt ON (Active)' : '❌ Seatbelt OFF (None)'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        {seatbeltOn
                          ? 'The strap applies an external force to halt the passenger with the car.'
                          : 'No external force acts on the passenger. They keep moving forward!'}
                      </p>
                    </div>
                    <div className="w-10 h-6 bg-slate-200 rounded-full p-0.5 transition duration-200 relative flex items-center">
                      <div
                        className={`w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                          seatbeltOn ? 'translate-x-4 bg-emerald-600' : 'translate-x-0 bg-red-600'
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Academic Context on Crash Demonstration */}
                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-indigo-500" />
                    How this demonstrates Newton's 1st Law:
                  </h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-500 leading-normal">
                    <li>
                      When the car speeds down the road, both the car and the passenger block share the <strong>same forward inertia (velocity)</strong>.
                    </li>
                    <li>
                      At collision, the wall applies a <strong>massive external force</strong> to the car's front frame, decelerating it to 0mph instantly.
                    </li>
                    <li>
                      If the seatbelt is <strong>OFF</strong>, there is no external stopping force acting on the passenger block. By inertia, it must continue traveling forward at original velocity, catapulting off the roof!
                    </li>
                  </ul>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 3: Academic Explainer and Quiz */}
        {activeTab === 'textbook' && <EducationPanel />}

        {/* TAB 4: Google Sites Embed Assistant */}
        {activeTab === 'embed' && (
          <EmbedHelper appUrl={(import.meta as any).env?.VITE_APP_URL || ''} />
        )}

      </main>

      {/* 3. Global Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-4 shrink-0 text-center text-[10px] font-mono">
        <div className="max-w-7xl mx-auto px-4">
          Newton's First Law Interactive Simulator • Built with React, Tailwind, and Canvas API • Highly optimized for Google Sites iframe embeds.
        </div>
      </footer>

    </div>
  );
}
