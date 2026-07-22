export type ObjectType = 'crate' | 'spacecraft' | 'puck' | 'bowling_ball';

export interface PhysicsParams {
  mass: number;         // kg
  frictionCoeff: number; // mu
  appliedForce: number;  // N
  objectType: ObjectType;
}

export interface PhysicsState {
  position: number;     // meters
  velocity: number;     // m/s
  acceleration: number; // m/s^2
  appliedForce: number; // N
  frictionForce: number; // N
  netForce: number;     // N
}

export interface DataPoint {
  time: number;         // seconds
  velocity: number;     // m/s
  appliedForce: number;  // N
  frictionForce: number; // N
  netForce: number;     // N
}

export interface ExperimentPreset {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  mass: number;
  frictionCoeff: number;
  appliedForce: number;
  objectType: ObjectType;
  instructions: string[];
  successCriteria: string;
  checkExplanation: string;
}
