import * as THREE from 'three';

export class FXManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    emitNitro(pos, dir) {
        // Cyan/Green nitro for Dirt Bike
        for (let i = 0; i < 5; i++) {
            this.createParticle(pos, 0x39FF14, 0.4);
        }
    }

    emitDriftSparks(pos, dir) {
        // Brown dirt particles instead of sparks
        for (let i = 0; i < 8; i++) {
            this.createParticle(pos, 0x5d4037, 0.3);
        }
    }

    emitDirtSpray(pos, speed) {
        if (speed < 5) return;
        const count = Math.min(5, Math.floor(speed / 10));
        for (let i = 0; i < count; i++) {
            this.createParticle(pos, 0x8d6e63, 0.25);
        }
    }

    createParticle(pos, color, size) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos).add(new THREE.Vector3(
            (Math.random()-0.5)*1.0,
            (Math.random()-0.5)*0.5,
            (Math.random()-0.5)*1.0
        ));
        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 1.0,
            vel: new THREE.Vector3((Math.random()-0.5)*4, Math.random()*3, (Math.random()-0.5)*4)
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt * 1.5; // Slower fade for dirt
            p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
            p.vel.y -= 9.8 * dt; // Gravity on dirt particles
            p.mesh.material.opacity = p.life;
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
}
