import React from 'react';
import { ExperimentPreset, ObjectType } from '../types';
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface ExperimentPanelProps {
  onLoadPreset: (preset: ExperimentPreset) => void;
  activePresetId: string | null;
}

export default function ExperimentPanel({ onLoadPreset, activePresetId }: ExperimentPanelProps) {
  const experiments: ExperimentPreset[] = [
    {
      id: 'zero_friction_glide',
      name: 'Experiment A: Frictionless Deep Space',
      shortDescription: 'Discover constant velocity under ZERO net force.',
      description: 'See the purest proof of Newton\'s First Law. If there is no friction, an object keeps moving at the exact same velocity forever without needing any continuous push.',
      mass: 80,
      frictionCoeff: 0.0,
      appliedForce: 0,
      objectType: 'spacecraft',
      instructions: [
        'Press "Push Right" (Impulse Tap) or slide "Continuous Force" to apply a brief thrust.',
        'Now release the force back to 0N (Click "Release (0N)").',
        'Watch the ship and the Velocity line on the graph carefully.',
        'Observe how the Net Force drops to 0N, but the ship continues coasting at a constant speed indefinitely!'
      ],
      successCriteria: 'You will see the Velocity graph line become a perfectly flat, horizontal line once you release the force. This shows that moving objects do not naturally slow down unless an external force acts on them!',
      checkExplanation: 'Since space has no air or friction (μ = 0), once the thruster stops, the net force is exactly 0. According to Newton\'s 1st Law, the ship keeps moving at a constant speed in a straight line forever.'
    },
    {
      id: 'heavy_vs_light_inertia',
      name: 'Experiment B: Heavy vs. Light Inertia',
      shortDescription: 'Examine how mass acts as a resistance to acceleration.',
      description: 'Mass is the physical measure of inertia. Heavy objects resist starting and stopping much more than light objects. Let\'s verify how mass affects our ability to change velocity.',
      mass: 180,
      frictionCoeff: 0.0,
      appliedForce: 150,
      objectType: 'crate',
      instructions: [
        'Notice that the crate is set to an extremely heavy mass of 180kg.',
        'With continuous force at +150N, observe how slowly it takes to gain speed.',
        'Now select the Ice Hockey Puck or decrease mass to 10kg.',
        'Notice how quickly the 10kg puck speeds up under the same +150N force!'
      ],
      successCriteria: 'The heavy 180kg crate has high inertia, so its acceleration is very small (around 0.83 m/s²). The light 10kg puck has low inertia, so it accelerates almost instantly at 15 m/s²!',
      checkExplanation: 'More mass means more inertia. Both require exactly ZERO force to KEEP moving on ice, but the heavier one requires a much larger force to START moving, speed up, or come to a halt.'
    },
    {
      id: 'friction_arrest',
      name: 'Experiment C: Sliding Friction (Braking)',
      shortDescription: 'Explore why objects stop in the real world.',
      description: 'Why do blocks on earth always stop when we stop pushing them? Not because inertia runs out, but because friction is an active external force working against the motion.',
      mass: 50,
      frictionCoeff: 0.35,
      appliedForce: 0,
      objectType: 'crate',
      instructions: [
        'Give the crate a massive push to the right (click "Push Right" multiple times or slide Force to +200N).',
        'Once it has gained good speed, quickly release the force to 0N.',
        'Observe the red friction vector opposing the motion and the velocity dropping rapidly.',
        'See the downward-sloping line on the Velocity vs. Time graph.'
      ],
      successCriteria: 'Friction is an external force. When you stop pushing, the Net Force is negative (opposing motion), which creates negative acceleration and halts the crate.',
      checkExplanation: 'In daily life, friction is almost always present. It acts as an external force slowing things down. Without friction, a kicked soccer ball or sliding block would slide forever!'
    },
    {
      id: 'balanced_equilibrium',
      name: 'Experiment D: Balanced Forces (Equilibrium)',
      shortDescription: 'Maintain constant speed with multiple forces active.',
      description: 'Can an object move at constant speed even if forces are acting on it? Yes, as long as the forces are perfectly balanced, making the Net Force exactly zero!',
      mass: 25,
      frictionCoeff: 0.20,
      appliedForce: 0,
      objectType: 'bowling_ball',
      instructions: [
        'Give the bowling ball a big shove to the right to get it rolling.',
        'Look at the HUD to see the kinetic friction force (which will be -49N, calculated as μ * m * g = 0.2 * 25 * 9.8).',
        'Now adjust the "Continuous Force" slider to exactly +49N (positive) to match the friction.',
        'Check the Net Force in the HUD: It should be exactly 0N!',
        'Watch the ball roll at constant velocity indefinitely.'
      ],
      successCriteria: 'Net Force is exactly 0N. The green Applied Force arrow and the red Friction Force arrow are equal and opposite. The ball maintains constant speed in dynamic equilibrium.',
      checkExplanation: 'Newton\'s First Law applies to NET force. If forces are balanced, the net force is zero, which is physically identical to being in frictionless outer space!'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-bold text-slate-800">
          Guided Physics Lab Experiments
        </h2>
      </div>
      
      <p className="text-xs text-slate-500 leading-relaxed">
        Select an experiment to auto-configure the sandbox, then follow the structured lab instructions below to observe Newton\'s 1st Law in action.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {experiments.map((exp) => {
          const isActive = activePresetId === exp.id;
          return (
            <div
              key={exp.id}
              className={`border rounded-2xl p-4 transition flex flex-col justify-between ${
                isActive
                  ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-slate-800 leading-tight">
                    {exp.name}
                  </h3>
                  {isActive && (
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active Lab
                    </span>
                  )}
                </div>
                
                <p className="text-xs font-medium text-blue-600 mt-1">
                  {exp.shortDescription}
                </p>
                
                <p className="text-xs text-slate-500 mt-2 leading-normal">
                  {exp.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="flex gap-2 text-[10px] font-mono text-slate-400">
                  <span>m = {exp.mass}kg</span>
                  <span>•</span>
                  <span>μ = {exp.frictionCoeff.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => onLoadPreset(exp)}
                  id={`btn-load-preset-${exp.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                  }`}
                >
                  Load Experiment <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive instruction manual if an experiment is selected */}
      {activePresetId && (
        <div className="mt-6 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          {experiments.map((exp) => {
            if (exp.id !== activePresetId) return null;
            return (
              <div key={exp.id} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="p-1 bg-blue-500/20 rounded text-blue-400 font-bold font-mono text-xs">
                    STEP-BY-STEP LAB PROTOCOL
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    🔬 Follow these tasks in the simulator above:
                  </h4>
                  <ol className="space-y-2">
                    {exp.instructions.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-xs text-slate-300 leading-normal">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> SUCCESS CRITERIA:
                  </div>
                  <p className="text-xs text-emerald-300/90 leading-normal">
                    {exp.successCriteria}
                  </p>
                </div>

                <div className="p-3.5 bg-blue-950/40 border border-blue-900/30 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> SCIENCE BEHIND THE SIMULATION:
                  </div>
                  <p className="text-xs text-blue-200/90 leading-normal">
                    {exp.checkExplanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
