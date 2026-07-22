import React, { useRef, useEffect, useState } from 'react';
import { PhysicsParams, PhysicsState, ObjectType } from '../types';

interface SimulationCanvasProps {
  params: PhysicsParams;
  state: PhysicsState;
  onUpdateState: (newState: Partial<PhysicsState>) => void;
  isPaused: boolean;
  showVectors: {
    forces: boolean;
    velocity: boolean;
    acceleration: boolean;
  };
  onLogDataPoint: (velocity: number, applied: number, friction: number, net: number) => void;
}

export default function SimulationCanvas({
  params,
  state,
  onUpdateState,
  isPaused,
  showVectors,
  onLogDataPoint,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 350 });
  
  // Keep physics values in refs for the animation loop to avoid dependency lag
  const physicsRef = useRef({
    position: state.position,
    velocity: state.velocity,
    acceleration: state.acceleration,
    params,
    isPaused,
  });

  // Keep track of rotation for the rolling bowling ball
  const ballRotationRef = useRef(0);
  // Keep track of star offsets for parallax
  const starOffsetRef = useRef(0);
  const timeRef = useRef(performance.now());
  const dataLogThrottleRef = useRef(0);

  // Sync props to refs
  useEffect(() => {
    physicsRef.current.position = state.position;
    physicsRef.current.velocity = state.velocity;
    physicsRef.current.acceleration = state.acceleration;
    physicsRef.current.params = params;
    physicsRef.current.isPaused = isPaused;
  }, [state.position, state.velocity, state.acceleration, params, isPaused]);

  // Handle ResizeObserver for responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Ensure reasonable defaults
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 250),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main physics & rendering loop
  useEffect(() => {
    let animationFrameId: number;

    const step = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      // Calculate time step (cap dt to avoid physics exploding when switching tabs)
      let dt = (now - timeRef.current) / 1000;
      if (dt > 0.1) dt = 0.1; 
      timeRef.current = now;

      const current = physicsRef.current;
      const g = 9.81; // Gravity m/s^2

      let nextPos = current.position;
      let nextVel = current.velocity;
      let nextAcc = current.acceleration;
      let applied = current.params.appliedForce;
      let friction = 0;
      let netForce = 0;

      if (!current.isPaused) {
        const mass = current.params.mass;
        const mu = current.params.frictionCoeff;
        const normalForce = mass * g;

        // Determine friction
        if (Math.abs(nextVel) > 0.001) {
          // Kinetic Friction: opposes direction of velocity
          const frictionDir = nextVel > 0 ? -1 : 1;
          const maxKineticFriction = mu * normalForce;
          friction = frictionDir * maxKineticFriction;
          
          // Net force including applied and kinetic friction
          netForce = applied + friction;
          nextAcc = netForce / mass;
          
          // Integrate velocity
          const prevVel = nextVel;
          nextVel += nextAcc * dt;

          // If velocity changed sign, friction stopped it
          if (prevVel * nextVel < 0 && Math.abs(applied) <= Math.abs(friction)) {
            nextVel = 0;
            nextAcc = 0;
            friction = -applied;
            netForce = 0;
          }
        } else {
          // Stationary object: Static Friction matches applied force up to max static friction
          nextVel = 0;
          const maxStaticFriction = mu * normalForce;
          
          if (Math.abs(applied) <= maxStaticFriction) {
            friction = -applied;
            netForce = 0;
            nextAcc = 0;
          } else {
            // Overcomes static friction
            const frictionDir = applied > 0 ? -1 : 1;
            friction = frictionDir * maxStaticFriction;
            netForce = applied + friction;
            nextAcc = netForce / mass;
            nextVel += nextAcc * dt;
          }
        }

        // Update position
        nextPos += nextVel * dt;

        // Keep ball rolling rotation
        if (current.params.objectType === 'bowling_ball') {
          // Circumference = 2 * PI * r. Let radius r = 30px (approx 0.5 meters in sim scale)
          // angle += dx / r
          ballRotationRef.current += (nextVel * dt * 40) / 30;
        }

        // Parallax stars scrolling
        if (current.params.objectType === 'spacecraft') {
          starOffsetRef.current = (starOffsetRef.current + nextVel * dt * 10) % canvas.width;
        }

        // Throttle sending updates back to React to keep UI responsive
        // and avoid infinite render loops
        onUpdateState({
          position: nextPos,
          velocity: nextVel,
          acceleration: nextAcc,
          appliedForce: applied,
          frictionForce: friction,
          netForce: netForce,
        });

        // Log data points for graphs at roughly 10Hz
        dataLogThrottleRef.current += dt;
        if (dataLogThrottleRef.current >= 0.1) {
          onLogDataPoint(nextVel, applied, friction, netForce);
          dataLogThrottleRef.current = 0;
        }
      } else {
        // Paused state: compute current forces but do not integrate position/velocity
        const mass = current.params.mass;
        const mu = current.params.frictionCoeff;
        const normalForce = mass * g;

        if (Math.abs(nextVel) > 0.001) {
          const frictionDir = nextVel > 0 ? -1 : 1;
          friction = frictionDir * mu * normalForce;
          netForce = applied + friction;
          nextAcc = netForce / mass;
        } else {
          const maxStaticFriction = mu * normalForce;
          if (Math.abs(applied) <= maxStaticFriction) {
            friction = -applied;
            netForce = 0;
            nextAcc = 0;
          } else {
            const frictionDir = applied > 0 ? -1 : 1;
            friction = frictionDir * maxStaticFriction;
            netForce = applied + friction;
            nextAcc = netForce / mass;
          }
        }

        onUpdateState({
          appliedForce: applied,
          frictionForce: friction,
          netForce: netForce,
          acceleration: nextAcc,
        });
      }

      // --- DRAWING CODE ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isSpace = current.params.objectType === 'spacecraft';
      
      // Draw background
      if (isSpace) {
        drawSpaceBackground(ctx, canvas.width, canvas.height, starOffsetRef.current);
      } else {
        drawEarthBackground(ctx, canvas.width, canvas.height, nextPos, current.params.frictionCoeff);
      }

      // Object dimensions and drawing constants
      const objWidth = 100;
      const objHeight = 70;
      const objX = canvas.width / 2 - objWidth / 2; // Keep object centered on screen, scroll background
      const objY = canvas.height - 110; // floor height is canvas.height - 40

      // Draw object shadow/ground friction indicators
      if (!isSpace) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, objY + objHeight, 45, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the selected object
      ctx.save();
      ctx.translate(canvas.width / 2, objY + objHeight / 2);
      
      switch (current.params.objectType) {
        case 'crate':
          drawCrate(ctx, objWidth, objHeight);
          break;
        case 'spacecraft':
          drawSpacecraft(ctx, objWidth, objHeight, current.params.appliedForce, nextVel);
          break;
        case 'puck':
          drawPuck(ctx, objWidth, objHeight);
          break;
        case 'bowling_ball':
          ctx.rotate(ballRotationRef.current);
          drawBowlingBall(ctx, 35); // Radius 35
          break;
      }
      ctx.restore();

      // Draw Vector Arrows
      const vectorY = objY - 30;
      const centerItemX = canvas.width / 2;

      // 1. Forces Vector (Applied, Friction, Net Force)
      if (showVectors.forces) {
        // Draw scale: 1 pixel = 0.5 Newton
        const forceScale = 0.75;

        // Applied Force Arrow (Green, starts at center and points in direction of applied force)
        if (Math.abs(applied) > 0.1) {
          drawVectorArrow(
            ctx,
            centerItemX,
            vectorY,
            centerItemX + applied * forceScale,
            vectorY,
            '#10B981', // green-500
            `F_app: ${applied.toFixed(1)} N`,
            applied > 0 ? 'right' : 'left',
            1
          );
        }

        // Friction Force Arrow (Red, starts at center and points opposite to velocity or applied force)
        if (Math.abs(friction) > 0.1) {
          drawVectorArrow(
            ctx,
            centerItemX,
            vectorY + 20,
            centerItemX + friction * forceScale,
            vectorY + 20,
            '#EF4444', // red-500
            `F_fric: ${friction.toFixed(1)} N`,
            friction > 0 ? 'right' : 'left',
            1
          );
        }

        // Net Force Arrow (Purple, thicker, offset slightly higher)
        if (Math.abs(netForce) > 0.1) {
          drawVectorArrow(
            ctx,
            centerItemX,
            vectorY - 25,
            centerItemX + netForce * forceScale,
            vectorY - 25,
            '#8B5CF6', // purple-500
            `F_net: ${netForce.toFixed(1)} N`,
            netForce > 0 ? 'right' : 'left',
            2
          );
        }
      }

      // 2. Velocity Vector (Blue, drawn at the bottom or middle, scale: 1 px = 5 m/s)
      if (showVectors.velocity && Math.abs(nextVel) > 0.01) {
        const velScale = 12;
        const velY = objY + objHeight / 2;
        drawVectorArrow(
          ctx,
          centerItemX,
          velY,
          centerItemX + nextVel * velScale,
          velY,
          '#3B82F6', // blue-500
          `v: ${nextVel.toFixed(2)} m/s`,
          nextVel > 0 ? 'right' : 'left',
          2,
          true // outline glow
        );
      }

      // 3. Acceleration Vector (Yellow, drawn below the object, scale: 1 px = 15 m/s^2)
      if (showVectors.acceleration && Math.abs(nextAcc) > 0.01) {
        const accScale = 25;
        const accY = objY + objHeight + 25;
        drawVectorArrow(
          ctx,
          centerItemX,
          accY,
          centerItemX + nextAcc * accScale,
          accY,
          '#F59E0B', // amber-500
          `a: ${nextAcc.toFixed(2)} m/s²`,
          nextAcc > 0 ? 'right' : 'left',
          1.5
        );
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [showVectors, onUpdateState, onLogDataPoint]);

  // --- Background Drawing Helpers ---
  
  const drawSpaceBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    starOffset: number
  ) => {
    // Deep cosmos gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#020617'); // slate-950
    skyGrad.addColorStop(0.7, '#0f172a'); // slate-900
    skyGrad.addColorStop(1, '#1e293b'); // slate-800
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars generation based on starOffset
    ctx.fillStyle = '#ffffff';
    const drawStarLayer = (count: number, speedMult: number, size: number, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      for (let i = 0; i < count; i++) {
        // Pseudo-random star positioning using deterministic formula
        const starX = (Math.abs(Math.sin(i * 12345.67)) * width * 3 - starOffset * speedMult) % width;
        const starY = (Math.abs(Math.cos(i * 98765.43)) * (height - 60));
        ctx.beginPath();
        ctx.arc(starX < 0 ? starX + width : starX, starY, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    drawStarLayer(30, 0.2, 0.8, 0.4); // Far stars
    drawStarLayer(15, 0.6, 1.3, 0.7); // Mid stars
    drawStarLayer(5, 1.2, 2.0, 0.9);  // Close stars

    // Distant cosmic gas/nebula
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const nebulaGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 250);
    nebulaGrad.addColorStop(0, 'rgba(139, 92, 246, 0.1)'); // violet
    nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Floating reference space dust (gives speed sensation)
    ctx.fillStyle = '#64748b'; // slate-500
    const dustX = (width * 1.5 - starOffset * 1.5) % width;
    ctx.fillRect(dustX < 0 ? dustX + width : dustX, height / 2, 8, 2);
    const dustX2 = (width * 0.8 - starOffset * 1.5) % width;
    ctx.fillRect(dustX2 < 0 ? dustX2 + width : dustX2, height * 0.25, 12, 1.5);
  };

  const drawEarthBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    position: number,
    frictionCoeff: number
  ) => {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#bae6fd'); // sky-200
    skyGrad.addColorStop(0.6, '#f0f9ff'); // sky-50
    skyGrad.addColorStop(0.85, '#e0f2fe'); // sky-100
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const cloudOffset = (position * 1.5) % width;
    const drawCloud = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.8, cy - r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.8, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.5, cy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    };
    
    ctx.save();
    ctx.translate(-cloudOffset, 0);
    drawCloud(width * 0.3, 50, 20);
    drawCloud(width * 1.3, 50, 20);
    drawCloud(width * 0.8, 80, 25);
    drawCloud(width * 1.8, 80, 25);
    ctx.restore();

    // Floor surface definition (Ground)
    const floorY = height - 40;
    
    // Choose floor color and texture based on friction
    let surfaceColor = '#cbd5e1'; // slate-300 (Default low friction ice-like)
    let groundColor = '#94a3b8';  // slate-400
    let surfaceLabel = 'LOW FRICTION ICE';
    
    if (frictionCoeff > 0.01 && frictionCoeff < 0.15) {
      surfaceColor = '#bae6fd'; // Ice / Puck floor
      groundColor = '#38bdf8';
      surfaceLabel = 'SLIPPERY ICE (LOW)';
    } else if (frictionCoeff >= 0.15 && frictionCoeff < 0.4) {
      surfaceColor = '#cbd5e1'; // Wood/Polished floor
      groundColor = '#64748b';
      surfaceLabel = 'NORMAL SURFACE (MID)';
    } else if (frictionCoeff >= 0.4) {
      surfaceColor = '#a16207'; // Grass / sand / rough gravel
      groundColor = '#713f12';
      surfaceLabel = 'ROUGH SAND/GRASS (HIGH)';
    }

    // Ground Bed
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, floorY, width, 40);

    // Surface layer
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(0, floorY, width, 6);

    // Draw reference meter lines (scrolling horizontal track!)
    const pScale = 40; // 40 pixels = 1 meter
    const trackOffset = (position * pScale) % width;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.font = '10px monospace';
    
    // Draw grid markers
    const startIdx = Math.floor(position) - 15;
    const endIdx = Math.floor(position) + 15;
    
    for (let i = startIdx; i <= endIdx; i++) {
      const gridX = width / 2 + (i - position) * pScale;
      if (gridX >= -50 && gridX <= width + 50) {
        // Meter tic mark
        ctx.fillRect(gridX, floorY + 6, 2, 8);
        ctx.fillText(`${i}m`, gridX + 4, floorY + 16);
        
        // Add subtle road stripes/grass blades
        if (frictionCoeff >= 0.4) {
          ctx.fillStyle = '#4d7c0f'; // green-700 grass blades
          ctx.fillRect(gridX + 10, floorY - 3, 2, 3);
          ctx.fillRect(gridX + 25, floorY - 4, 1.5, 4);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        } else if (frictionCoeff === 0) {
          // Sparkly ice patterns
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(gridX + 15, floorY + 1, 6, 1);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        }
      }
    }

    // Display Surface Label in bottom-right corner of background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`SURFACE: ${surfaceLabel} (μ = ${frictionCoeff.toFixed(2)})`, width - 180, floorY - 12);
  };

  // --- Object Specific Renderers ---

  const drawCrate = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Standard wood crate
    const grad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
    grad.addColorStop(0, '#d97706'); // amber-600
    grad.addColorStop(1, '#78350f'); // amber-900
    ctx.fillStyle = grad;
    ctx.fillRect(-w/2, -h/2, w, h);

    // Border highlights
    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.lineWidth = 3;
    ctx.strokeRect(-w/2 + 1.5, -h/2 + 1.5, w - 3, h - 3);

    // Wooden cross planks (X)
    ctx.strokeStyle = '#451a03'; // dark brown
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w/2 + 5, -h/2 + 5);
    ctx.lineTo(w/2 - 5, h/2 - 5);
    ctx.moveTo(w/2 - 5, -h/2 + 5);
    ctx.lineTo(-w/2 + 5, h/2 - 5);
    ctx.stroke();

    // Wood panel horizontal lines
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w/2, -h/6);
    ctx.lineTo(w/2, -h/6);
    ctx.moveTo(-w/2, h/6);
    ctx.lineTo(w/2, h/6);
    ctx.stroke();

    // Mass Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`${physicsRef.current.params.mass} kg`, 0, 0);
    ctx.shadowBlur = 0; // reset
  };

  const drawSpacecraft = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    appliedForce: number,
    velocity: number
  ) => {
    // Sleek sci-fi spacecraft pointing right
    ctx.save();
    
    // Draw engine flame if thrusters are applied (either positive or negative force)
    if (Math.abs(appliedForce) > 1) {
      const isPushingRight = appliedForce > 0;
      ctx.save();
      
      // Position flame behind appropriate engine
      ctx.translate(isPushingRight ? -w/2 : w/2, 0);
      ctx.rotate(isPushingRight ? 0 : Math.PI);
      
      // Animated flame length
      const flameLength = 20 + Math.min(Math.abs(appliedForce) * 0.15, 45) + Math.sin(Date.now() * 0.05) * 4;
      const flameGrad = ctx.createLinearGradient(0, 0, -flameLength, 0);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.2, '#f59e0b'); // Orange
      flameGrad.addColorStop(0.8, '#ef4444'); // Red
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.quadraticCurveTo(-flameLength * 0.6, -18, -flameLength, 0);
      ctx.quadraticCurveTo(-flameLength * 0.6, 18, 0, 12);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }

    // Ship Body (Sleek aerodynamic space capsule)
    const shipGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    shipGrad.addColorStop(0, '#475569'); // slate-600
    shipGrad.addColorStop(0.4, '#e2e8f0'); // slate-200
    shipGrad.addColorStop(0.8, '#cbd5e1'); // slate-300
    shipGrad.addColorStop(1, '#94a3b8'); // slate-400
    ctx.fillStyle = shipGrad;

    ctx.beginPath();
    ctx.moveTo(-w/2, -h/4);
    ctx.lineTo(-w/2, h/4);
    ctx.lineTo(0, h/2);
    ctx.lineTo(w/2, 0); // nose cone pointing right
    ctx.lineTo(0, -h/2);
    ctx.closePath();
    ctx.fill();

    // Wings / Thruster fins
    ctx.fillStyle = '#ef4444'; // Red fins
    ctx.beginPath();
    ctx.moveTo(-w/2, -h/4);
    ctx.lineTo(-w/2 - 8, -h/2);
    ctx.lineTo(-w/4, -h/4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-w/2, h/4);
    ctx.lineTo(-w/2 - 8, h/2);
    ctx.lineTo(-w/4, h/4);
    ctx.closePath();
    ctx.fill();

    // Cockpit windshield
    ctx.fillStyle = '#38bdf8'; // sky blue glass
    ctx.beginPath();
    ctx.moveTo(w/10, -h/6);
    ctx.lineTo(w/3, 0);
    ctx.lineTo(w/10, h/6);
    ctx.closePath();
    ctx.fill();

    // Spacecraft symbol
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-w/6, 0, 6, 0, Math.PI*2);
    ctx.fill();

    // Mass text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${physicsRef.current.params.mass}kg`, -w/10, h/4 + 6);

    ctx.restore();
  };

  const drawPuck = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Ice Hockey puck seen in side perspective (thin flat cylinder)
    const puckHeight = 25;
    
    // Bottom shadow lip
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(0, puckHeight/2, w/2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Side extruded face
    const sideGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    sideGrad.addColorStop(0, '#18181b');
    sideGrad.addColorStop(0.5, '#3f3f46');
    sideGrad.addColorStop(1, '#18181b');
    ctx.fillStyle = sideGrad;
    ctx.fillRect(-w/2, -puckHeight/2, w, puckHeight);

    // Top surface cap
    ctx.fillStyle = '#27272a'; // zinc-800
    ctx.beginPath();
    ctx.ellipse(0, -puckHeight/2, w/2, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top inner groove ring
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -puckHeight/2, w/3, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Mass details
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${physicsRef.current.params.mass}kg`, 0, -puckHeight/2 + 3);
  };

  const drawBowlingBall = (ctx: CanvasRenderingContext2D, r: number) => {
    // Beautiful rolling bowling ball
    const radGrad = ctx.createRadialGradient(-r/3, -r/3, r/6, 0, 0, r);
    radGrad.addColorStop(0, '#312e81'); // indigo-950/deep violet highlights
    radGrad.addColorStop(0.5, '#4f46e5'); // indigo-600
    radGrad.addColorStop(1, '#1e1b4b'); // indigo-900
    ctx.fillStyle = radGrad;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Three finger holes that spin
    ctx.fillStyle = '#0f172a';
    
    // Hole 1 (Thumb)
    ctx.beginPath();
    ctx.arc(-10, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Hole 2 (Index)
    ctx.beginPath();
    ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Hole 3 (Middle)
    ctx.beginPath();
    ctx.arc(10, -10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Subtle gloss curve reflection (doesn't rotate!)
    ctx.save();
    ctx.rotate(-ballRotationRef.current); // counteract ball rotation so sheen stays in place!
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r - 5, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    // Mass overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${physicsRef.current.params.mass}kg`, 0, 10);
    ctx.restore();
  };

  // --- Vector Drawing Helper ---
  
  const drawVectorArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label: string,
    direction: 'left' | 'right',
    lineWidth: number = 2.5,
    glow: boolean = false
  ) => {
    const minArrowLength = 20;
    
    // If arrow is too short, don't render or cap it
    const length = Math.abs(toX - fromX);
    if (length < 3) return;

    // Enforce a visual minimum so the head is visible
    if (length < minArrowLength) {
      toX = fromX + (direction === 'right' ? minArrowLength : -minArrowLength);
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    // Optional glowing backplate
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    }

    // Draw main line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    const arrowHeadSize = 6 + lineWidth;
    ctx.beginPath();
    if (toX > fromX) {
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - arrowHeadSize, toY - arrowHeadSize * 0.6);
      ctx.lineTo(toX - arrowHeadSize, toY + arrowHeadSize * 0.6);
    } else {
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX + arrowHeadSize, toY - arrowHeadSize * 0.6);
      ctx.lineTo(toX + arrowHeadSize, toY + arrowHeadSize * 0.6);
    }
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Label Text
    ctx.fillStyle = '#1e293b'; // Slate-800 text
    ctx.font = 'bold 10px monospace';
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 4;
    
    ctx.textAlign = toX > fromX ? 'left' : 'right';
    const textPadding = 6;
    ctx.fillText(label, toX + (toX > fromX ? textPadding : -textPadding), toY + 3);
    
    ctx.restore();
  };

  return (
    <div className="relative w-full border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-inner flex flex-col">
      {/* HUD overlay in the top left */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg text-[11px] font-mono text-slate-200 shadow-lg border border-slate-700/50 z-10 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Position (x):</span>
          <span className="text-emerald-400 font-bold">{state.position.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Velocity (v):</span>
          <span className="text-sky-400 font-bold">{state.velocity.toFixed(2)} m/s</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Acceleration (a):</span>
          <span className="text-amber-400 font-bold">{state.acceleration.toFixed(2)} m/s²</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1">
          <span className="text-slate-400">Net Force (F_net):</span>
          <span className="text-violet-400 font-bold">{state.netForce.toFixed(1)} N</span>
        </div>
      </div>

      {/* Physics state commentary overlay in the top-right */}
      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg max-w-[240px] text-xs text-white shadow-lg border border-slate-700/50 z-10 text-right">
        {Math.abs(state.velocity) < 0.01 && Math.abs(state.appliedForce) < 0.1 ? (
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
            <span className="font-semibold text-emerald-400">At Rest.</span> Net Force is <span className="font-mono">0</span>. It remains at rest.
          </div>
        ) : Math.abs(state.netForce) < 0.1 && Math.abs(state.velocity) > 0.01 ? (
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500 mr-2 animate-pulse"></span>
            <span className="font-semibold text-sky-400">Constant Velocity!</span> Net Force is <span className="font-mono">0</span>. Frictionless Inertia!
          </div>
        ) : state.netForce > 0.1 ? (
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-2"></span>
            Accelerating <span className="font-semibold text-violet-400">Right →</span>. A net external force is changing its motion.
          </div>
        ) : state.netForce < -0.1 ? (
          <div>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
            {state.velocity > 0.01 ? (
              <span>Decelerating (Friction braking).</span>
            ) : (
              <span>Accelerating <span className="font-semibold text-red-400">← Left</span>.</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Canvas Mount Container */}
      <div ref={containerRef} className="w-full flex-grow relative" style={{ minHeight: '320px' }}>
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block cursor-crosshair"
        />
      </div>
    </div>
  );
}
