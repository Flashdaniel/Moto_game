import * as THREE from 'three';
import { Motorcycle } from './Motorcycle';

/**
 * MotoRush Kids - AI Racer with Human-like Behavior
 * Features: Rubber-banding, Path following, Strategic Mistakes
 */
export class AIRacer extends Motorcycle {
    constructor(world, scene, trackCurve, options = {}) {
        super(world, scene, { ...options, isPlayer: false });
        this.trackCurve = trackCurve;
        this.progress = Math.random() * 0.05;
        this.skill = options.skill || 0.5;
        this.mistakeTimer = 0;
        this.isMakingMistake = false;

        // Rubber band parameters
        this.baseSpeed = 0.01 + (this.skill * 0.005);
    }

    updateAI(playerProgress, dt) {
        // 1. Rubber-Banding Logic
        // Calculate distance from player in track units [0,1]
        let delta = playerProgress - this.progress;
        // Handle wrap around
        if (delta > 0.5) delta -= 1.0;
        if (delta < -0.5) delta += 1.0;

        // If AI is behind, speed up significantly. If ahead, slow down.
        const catchUpFactor = delta > 0 ? 2.5 : 0.7;
        const speedMultiplier = 1.0 + (delta * catchUpFactor);

        // 2. "Human-like" Mistakes
        this.mistakeTimer -= dt;
        if (this.mistakeTimer <= 0) {
            this.isMakingMistake = Math.random() > (0.7 + this.skill * 0.2);
            this.mistakeTimer = 2 + Math.random() * 5;
        }

        // 3. Move along spline
        const moveStep = this.baseSpeed * speedMultiplier * dt;
        this.progress = (this.progress + moveStep) % 1.0;

        const targetPos = this.trackCurve.getPointAt((this.progress + 0.03) % 1.0);

        // AI Inputs
        const currentPos = this.chassisBody.position;
        const toTarget = new THREE.Vector2(targetPos.x - currentPos.x, targetPos.z - currentPos.z).normalize();

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.chassisBody.quaternion);
        const forward2D = new THREE.Vector2(forward.x, forward.z).normalize();

        const cross = forward2D.x * toTarget.y - forward2D.y * toTarget.x;

        const input = {
            forward: true,
            backward: false,
            left: cross > 0.1,
            right: cross < -0.1,
            nitro: Math.random() > 0.98 && delta < 0, // Boost if behind
            drift: Math.abs(cross) > 0.4 && this.speed > 40
        };

        // Inject mistake (steering the wrong way)
        if (this.isMakingMistake) {
            input.left = !input.left;
            input.right = !input.right;
        }

        super.update(input, dt);
    }
}
