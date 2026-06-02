import * as THREE from 'three';
import { inputManager } from './InputManager';

/**
 * MotoRush Kids - Cinematic Camera System
 */
export class CameraSystem {
    constructor(camera) {
        this.camera = camera;
        this.target = null;
        this.offset = new THREE.Vector3(0, 3, -7);
        this.lookAtOffset = new THREE.Vector3(0, 1, 5);

        this.currentPos = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();

        this.mouseRotation = new THREE.Euler(0, 0, 0);
        this.isIntro = true;
        this.introTimer = 0;
    }

    setTarget(obj) {
        this.target = obj;
    }

    update(dt, speed, isNitro) {
        if (!this.target) return;

        if (this.isIntro) {
            this.updateIntro(dt);
            return;
        }

        const playerPos = this.target.position;
        const playerQuat = this.target.quaternion;

        // Mouse Look Integration
        this.mouseRotation.y -= inputManager.mouse.x * 0.0001;
        inputManager.mouse.x = 0; // Reset delta

        // Calculate Ideal Camera Transform
        const combinedQuat = new THREE.Quaternion().setFromEuler(this.mouseRotation).multiply(playerQuat);
        const idealOffset = this.offset.clone().applyQuaternion(combinedQuat);
        const idealPos = playerPos.clone().add(idealOffset);

        this.currentPos.lerp(idealPos, 0.1);
        this.camera.position.copy(this.currentPos);

        const idealLookAt = playerPos.clone().add(this.lookAtOffset.clone().applyQuaternion(combinedQuat));
        this.currentLookAt.lerp(idealLookAt, 0.15);
        this.camera.lookAt(this.currentLookAt);

        // Dynamic FOV
        const targetFOV = 70 + (speed * 0.2) + (isNitro ? 15 : 0);
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.05);
        this.camera.updateProjectionMatrix();
    }

    updateIntro(dt) {
        this.introTimer += dt;
        const radius = 20;
        const angle = this.introTimer * 0.5;

        if (this.target) {
            this.camera.position.set(
                this.target.position.x + Math.cos(angle) * radius,
                10,
                this.target.position.z + Math.sin(angle) * radius
            );
            this.camera.lookAt(this.target.position);
        }

        if (this.introTimer > 3) {
            this.isIntro = false;
        }
    }
}
