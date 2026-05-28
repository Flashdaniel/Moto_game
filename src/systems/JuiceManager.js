import * as THREE from 'three';

export class JuiceManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.shakeAmount = 0;
    }

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    update(dt) {
        if (this.shakeAmount > 0) {
            const s = this.shakeAmount;
            this.camera.position.x += (Math.random() - 0.5) * s;
            this.camera.position.y += (Math.random() - 0.5) * s;
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.01) this.shakeAmount = 0;
        }
    }
}
