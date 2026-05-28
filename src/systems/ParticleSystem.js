import * as THREE from 'three';

export class FXManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    emitNitro(pos, dir) {
        for (let i = 0; i < 5; i++) {
            this.createParticle(pos, 0xf72585, 0.4);
        }
    }

    emitDriftSparks(pos, dir) {
        for (let i = 0; i < 3; i++) {
            this.createParticle(pos, 0xffbe0b, 0.2);
        }
    }

    createParticle(pos, color, size) {
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos).add(new THREE.Vector3(
            (Math.random()-0.5)*0.5,
            (Math.random()-0.5)*0.5,
            (Math.random()-0.5)*0.5
        ));
        this.scene.add(p);
        this.particles.push({
            mesh: p,
            life: 1.0,
            vel: new THREE.Vector3((Math.random()-0.5)*2, Math.random()*2, (Math.random()-0.5)*2)
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt * 2;
            p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
            p.mesh.material.opacity = p.life;
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
}
