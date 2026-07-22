import React, { useRef, useEffect, useState } from 'react';

interface CrashTestCanvasProps {
  launchSpeed: number; // 1 to 3 (Low, Med, High)
  seatbeltOn: boolean;
}

export default function CrashTestCanvas({ launchSpeed, seatbeltOn }: CrashTestCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 350 });
  const [testState, setTestState] = useState<'idle' | 'running' | 'crashed'>('idle');

  // Animation and physics state in refs
  const stateRef = useRef({
    carX: 80,
    carY: 210,
    carW: 130,
    carH: 50,
    carVel: 0,
    
    passX: 130,
    passY: 180, // on top of the car (carY - passH)
    passW: 30,
    passH: 30,
    passVelX: 0,
    passVelY: 0,
    isDetached: false,
    hasLanded: false,

    wallX: 520,
    impactTime: 0,
    screenShake: 0,
  });

  const speedMultiplier = 120; // scale speeds to pixels/sec
  const targetSpeed = launchSpeed * speedMultiplier;

  // Initialize and Reset Simulation
  const resetSimulation = () => {
    const state = stateRef.current;
    state.carX = 80;
    state.carVel = 0;
    
    state.passX = 130;
    state.passY = 180;
    state.passVelX = 0;
    state.passVelY = 0;
    state.isDetached = false;
    state.hasLanded = false;
    state.screenShake = 0;
    
    setTestState('idle');
  };

  const startSimulation = () => {
    resetSimulation();
    stateRef.current.carVel = targetSpeed;
    stateRef.current.passVelX = targetSpeed;
    setTestState('running');
  };

  useEffect(() => {
    resetSimulation();
  }, [launchSpeed, seatbeltOn]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 400),
        height: Math.max(height, 300),
      });
      // Adjust wall position relative to width
      stateRef.current.wallX = Math.max(width - 150, 450);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Frame simulation loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      let dt = (now - lastTime) / 1000;
      if (dt > 0.1) dt = 0.1;
      lastTime = now;

      const state = stateRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // --- UPDATE PHYSICS ---
          if (testState === 'running') {
            if (!state.isDetached) {
              // Car and passenger drive together
              state.carX += state.carVel * dt;
              state.passX = state.carX + 50; // offset passenger over the cabin

              // Check collision with Wall
              if (state.carX + state.carW >= state.wallX) {
                // Impact! Car stops instantly
                state.carX = state.wallX - state.carW;
                state.carVel = 0;
                state.impactTime = now;
                state.screenShake = launchSpeed * 8; // shake magnitude based on speed

                if (seatbeltOn) {
                  // Seatbelt ON: passenger is strapped and stops with the car
                  state.passVelX = 0;
                  state.passX = state.carX + 50;
                  setTestState('crashed');
                } else {
                  // Seatbelt OFF: passenger is NOT strapped, flies off the roof!
                  state.isDetached = true;
                  // Keep pre-crash velocity
                  state.passVelX = targetSpeed;
                  state.passVelY = -60 * launchSpeed; // slight upwards bump from impact
                  setTestState('crashed');
                }
              }
            }
          }

          // If passenger flew off the car, simulate free-fall parabolic flight
          if (state.isDetached) {
            // Apply horizontal speed
            state.passX += state.passVelX * dt;
            
            if (!state.hasLanded) {
              // Apply gravity vertically
              const gravity = 450; // pixels/sec^2
              state.passVelY += gravity * dt;
              state.passY += state.passVelY * dt;

              // Check ground landing (floor is at y=210 + carHeight = 260)
              const groundY = 230; // landing flat
              if (state.passY >= groundY) {
                state.passY = groundY;
                state.passVelY = 0;
                state.hasLanded = true;
              }
            } else {
              // Once on ground, experience sliding friction
              const frictionDeccel = 250; // friction deceleration on the ground
              if (state.passVelX > 0) {
                state.passVelX -= frictionDeccel * dt;
                if (state.passVelX < 0) state.passVelX = 0;
                state.passX += state.passVelX * dt;
              }
            }
          }

          // Screen shake dampening
          if (state.screenShake > 0.1) {
            state.screenShake *= 0.9; // dampen
          } else {
            state.screenShake = 0;
          }

          // --- DRAWING ---
          ctx.save();
          // Apply screen shake
          if (state.screenShake > 0) {
            const dx = (Math.random() - 0.5) * state.screenShake;
            const dy = (Math.random() - 0.5) * state.screenShake;
            ctx.translate(dx, dy);
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Sky background
          const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          skyGrad.addColorStop(0, '#f1f5f9');
          skyGrad.addColorStop(1, '#cbd5e1');
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Ground track
          ctx.fillStyle = '#64748b'; // asphalt
          ctx.fillRect(0, 260, canvas.width, canvas.height - 260);
          ctx.fillStyle = '#475569'; // road top trim
          ctx.fillRect(0, 260, canvas.width, 6);

          // Yellow dashed road line
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3;
          ctx.setLineDash([20, 15]);
          ctx.beginPath();
          ctx.moveTo(0, 290);
          ctx.lineTo(canvas.width, 290);
          ctx.stroke();
          ctx.setLineDash([]); // reset

          // Draw Crash Impact Sparks / Dust if just collided
          if (testState === 'crashed' && now - state.impactTime < 500) {
            const progress = (now - state.impactTime) / 500;
            ctx.save();
            ctx.globalAlpha = 1 - progress;
            ctx.fillStyle = '#f59e0b';
            for (let i = 0; i < 12; i++) {
              const sparkX = state.wallX + (Math.random() - 0.5) * 40 - 15;
              const sparkY = 230 + (Math.random() - 0.5) * 50;
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, 4 + Math.random() * 6, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // Draw Solid Wooden Obstacle (Wall)
          ctx.fillStyle = '#7c2d12'; // deep reddish brown
          ctx.fillRect(state.wallX, 100, 30, 160);
          // Highlight metal brackets on wall
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(state.wallX - 3, 110, 6, 12);
          ctx.fillRect(state.wallX - 3, 175, 6, 12);
          ctx.fillRect(state.wallX - 3, 240, 6, 12);

          // Draw Car shadow
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.beginPath();
          ctx.ellipse(state.carX + state.carW/2, 260, state.carW/2 + 5, 8, 0, 0, Math.PI*2);
          ctx.fill();

          // Draw Passenger Block shadow if flying
          if (state.isDetached && !state.hasLanded) {
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.beginPath();
            ctx.ellipse(state.passX + state.passW/2, 261, 15, 4, 0, 0, Math.PI*2);
            ctx.fill();
          }

          // Draw the crash car
          drawCar(ctx, state.carX, state.carY, state.carW, state.carH, testState === 'crashed');

          // Draw Passenger Block (The test dummy / box)
          drawPassenger(ctx, state.passX, state.passY, state.passW, state.passH, seatbeltOn, state.isDetached);

          // Draw Vector HUD for the Crash test
          drawCrashVectors(ctx, state);

          ctx.restore();
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [testState, launchSpeed, seatbeltOn]);

  // Car painting helper
  const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isCrashed: boolean) => {
    ctx.save();
    
    // Wheels
    const drawWheel = (wx: number) => {
      ctx.fillStyle = '#0f172a'; // tires
      ctx.beginPath();
      ctx.arc(wx, y + h, 16, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8'; // hubcap
      ctx.beginPath();
      ctx.arc(wx, y + h, 7, 0, Math.PI*2);
      ctx.fill();
    };

    drawWheel(x + 25);
    drawWheel(x + w - 25);

    // Car Body Gradient
    const carGrad = ctx.createLinearGradient(x, y, x + w, y);
    if (isCrashed) {
      carGrad.addColorStop(0, '#ef4444'); // red
      carGrad.addColorStop(0.8, '#b91c1c');
      carGrad.addColorStop(1, '#450a0a'); // charred front
    } else {
      carGrad.addColorStop(0, '#ef4444'); // brilliant red
      carGrad.addColorStop(1, '#b91c1c');
    }
    ctx.fillStyle = carGrad;

    // Body Shape
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + h/3);
    ctx.quadraticCurveTo(x + 5, y + 2, x + 15, y); // hood rear
    ctx.lineTo(x + w - 40, y); // roof line
    ctx.quadraticCurveTo(x + w - 15, y + h/4, x + w, y + h/2); // windshield slant
    ctx.lineTo(x + w, y + h); // front fender
    ctx.closePath();
    ctx.fill();

    // Windows
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(x + 25, y + 6);
    ctx.lineTo(x + 60, y + 6);
    ctx.lineTo(x + 60, y + h/2);
    ctx.lineTo(x + 20, y + h/2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 65, y + 6);
    ctx.lineTo(x + w - 30, y + 6);
    ctx.lineTo(x + w - 15, y + h/2);
    ctx.lineTo(x + 65, y + h/2);
    ctx.closePath();
    ctx.fill();

    // Headlights
    ctx.fillStyle = isCrashed ? '#78716c' : '#fef08a';
    ctx.beginPath();
    ctx.arc(x + w, y + h/2 + 3, 5, -Math.PI/2, Math.PI/2);
    ctx.fill();

    // Crash Crumple effect on front nose
    if (isCrashed) {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(x + w - 5, y + h/2);
      ctx.lineTo(x + w - 15, y + h/2 + 5);
      ctx.lineTo(x + w - 10, y + h - 5);
      ctx.lineTo(x + w, y + h - 10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  // Passenger painting helper
  const drawPassenger = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    hasSeatbelt: boolean,
    isDetached: boolean
  ) => {
    ctx.save();
    
    // Wooden dummy box
    ctx.fillStyle = isDetached ? '#ea580c' : '#d97706'; // warning orange if flying
    ctx.fillRect(x, y, w, h);
    
    // Outline dummy
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Dummy stripes (smiley face/warning symbol for test dummy)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2 - 2, 4, 0, Math.PI*2);
    ctx.fill();
    // Warning symbol cross segments
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + w - 4, y + h - 4);
    ctx.moveTo(x + w - 4, y + 4);
    ctx.lineTo(x + 4, y + h - 4);
    ctx.stroke();

    // Mass text on dummy
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('20kg', x + w/2, y + h/2 + 10);

    // Seatbelt harness overlay
    if (hasSeatbelt && !isDetached) {
      ctx.strokeStyle = '#1e293b'; // Black strap
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Diagonal strap
      ctx.moveTo(x - 3, y - 1);
      ctx.lineTo(x + w + 3, y + h + 1);
      // Secondary cross strap
      ctx.moveTo(x + w + 3, y - 1);
      ctx.lineTo(x - 3, y + h + 1);
      ctx.stroke();

      // Belt clip highlight
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + w/2 - 4, y + h/2 - 4, 8, 8);
    }

    ctx.restore();
  };

  // Vectors drawn on top of the elements to explain physical forces
  const drawCrashVectors = (ctx: CanvasRenderingContext2D, state: any) => {
    ctx.save();

    // 1. Before impact vectors
    if (testState === 'running') {
      const scale = 0.5;
      
      // Car Velocity Vector (Blue arrow starting from car hood)
      drawArrow(ctx, state.carX + state.carW, state.carY + state.carH/2, state.carX + state.carW + state.carVel * scale, state.carY + state.carH/2, '#3B82F6', 'v_car');
      
      // Passenger Velocity Vector (Blue arrow starting from passenger center)
      drawArrow(ctx, state.passX + state.passW, state.passY + state.passH/2, state.passX + state.passW + state.passVelX * scale, state.passY + state.passH/2, '#06B6D4', 'v_passenger');
    }

    // 2. Collision vectors
    if (testState === 'crashed') {
      const now = performance.now();
      const elapsed = now - state.impactTime;

      // Show huge collision forces for 1.2 seconds
      if (elapsed < 1200) {
        // Car experiences massive stopping force from the wall (Red Arrow pointing Left!)
        drawArrow(
          ctx,
          state.wallX - 5,
          state.carY + state.carH/2,
          state.wallX - 180,
          state.carY + state.carH/2,
          '#EF4444',
          'Huge Stopping Force from Wall!',
          4
        );

        if (seatbeltOn) {
          // Seatbelt applies stopping force to the passenger (Red Arrow pointing Left!)
          drawArrow(
            ctx,
            state.passX,
            state.passY + state.passH/2,
            state.passX - 80,
            state.passY + state.passH/2,
            '#F43F5E',
            'Seatbelt Force!',
            3
          );
        } else {
          // Seatbelt is OFF: Net force on passenger is ZERO! (Show text explaining this)
          ctx.fillStyle = '#ea580c';
          ctx.font = 'bold 11px monospace';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.fillText('No Seatbelt = ZERO Net Force on Passenger!', state.passX - 80, state.passY - 15);
          
          // Passenger continues flying with its original horizontal velocity vector!
          if (state.passVelX > 5) {
            drawArrow(
              ctx,
              state.passX + state.passW,
              state.passY + state.passH/2,
              state.passX + state.passW + state.passVelX * 0.4,
              state.passY + state.passH/2,
              '#3B82F6',
              'v_inertia (keeps moving!)',
              2
            );
          }
        }
      }
    }

    ctx.restore();
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fx: number,
    fy: number,
    tx: number,
    ty: number,
    color: string,
    label: string,
    width: number = 2
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    const head = 8;
    const angle = Math.atan2(ty - fy, tx - fx);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - head * Math.cos(angle - Math.PI/6), ty - head * Math.sin(angle - Math.PI/6));
    ctx.lineTo(tx - head * Math.cos(angle + Math.PI/6), ty - head * Math.sin(angle + Math.PI/6));
    ctx.closePath();
    ctx.fill();

    // label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(label, tx > fx ? tx + 5 : tx - 45, ty - 6);

    ctx.restore();
  };

  return (
    <div className="flex flex-col w-full h-full border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-inner relative">
      {/* Simulation Header Indicators */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg text-[11px] font-mono text-slate-200 shadow-md border border-slate-700/50 z-10 space-y-1">
        <div className="font-bold text-sky-400 mb-1 flex items-center">
          <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
          CRASH TEST LAB: INERTIA ACCIDENT
        </div>
        <div>
          <span>Car Velocity:</span>{' '}
          <span className="text-emerald-400 font-bold">
            {stateRef.current.carVel.toFixed(0)} px/s
          </span>
        </div>
        <div>
          <span>Passenger Vel:</span>{' '}
          <span className="text-cyan-400 font-bold">
            {stateRef.current.passVelX.toFixed(0)} px/s
          </span>
        </div>
        <div>
          <span>Seatbelt Status:</span>{' '}
          <span className={seatbeltOn ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {seatbeltOn ? 'ON (ACTIVE)' : 'OFF (NONE)'}
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg max-w-[280px] text-xs text-slate-800 shadow-md border border-slate-200 z-10">
        {testState === 'idle' && (
          <p className="font-medium">
            💡 Ready. Press <strong className="text-emerald-600">LAUNCH TEST VEHICLE</strong> to begin the experiment.
          </p>
        )}
        {testState === 'running' && (
          <p className="font-semibold text-amber-600 animate-pulse">
            ⚠️ Car is speeding towards wall! Passenger and car share equal forward inertia.
          </p>
        )}
        {testState === 'crashed' && (
          <div>
            {seatbeltOn ? (
              <p className="font-medium text-emerald-700">
                ✅ <strong>Seatbelt Saved the Passenger!</strong> The seatbelt applied an external stopping force, matching the car's deceleration.
              </p>
            ) : (
              <p className="font-medium text-red-700">
                🚨 <strong>Inertia Launch!</strong> Because NO external force acted on the passenger, it continued moving forward at pre-crash speed, flying off the roof.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Control overlay at the bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700/50 shadow-xl">
        <button
          onClick={startSimulation}
          disabled={testState === 'running'}
          id="btn-launch-crash-test"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
        >
          🚀 LAUNCH TEST VEHICLE
        </button>
        <button
          onClick={resetSimulation}
          id="btn-reset-crash-test"
          className="px-4 py-2 bg-slate-700 text-slate-100 rounded-lg text-sm font-semibold hover:bg-slate-600 transition"
        >
          🔄 RESET TEST
        </button>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="w-full flex-grow relative" style={{ minHeight: '320px' }}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block"
        />
      </div>
    </div>
  );
}
