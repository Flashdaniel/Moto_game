import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Materials, Colors } from './materials';

export class TrackManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.collectibles = [];
    }

    createTrack(points) {
        this.curve = new THREE.CatmullRomCurve3(points, true);

        const trackSamples = 800; // Increased resolution
        const width = 18; // Wider track for easier navigation
        const vertices = [];
        const indices = [];

        for (let i = 0; i <= trackSamples; i++) {
            const t = i / trackSamples;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

            // Removed undulation for smooth urban roads
            const p1 = pos.clone().add(side.clone().multiplyScalar(width / 2));
            const p2 = pos.clone().add(side.clone().multiplyScalar(-width / 2));

            vertices.push(p1.x, p1.y, p1.z);
            vertices.push(p2.x, p2.y, p2.z);

            if (i < trackSamples) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, Materials.Road);
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        // Physics - Optimized collision mesh using fewer, larger bodies
        const physicsStep = 10; // Only one body every 10 samples
        for (let i = 0; i < trackSamples; i += physicsStep) {
            const t = (i + physicsStep / 2) / trackSamples;
            if (t > 1) break;

            const p = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);

            const body = new CANNON.Body({ mass: 0 });
            // Larger boxes to cover more distance
            const boxLength = (this.curve.getLength() / trackSamples) * physicsStep;
            body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, 0.5, boxLength / 2)));
            body.position.set(p.x, p.y - 0.45, p.z);

            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
            body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            this.world.addBody(body);
        }

        this.addDecorations();
    }

    addDecorations() {
        for (let i = 0; i < 80; i++) {
            const t = Math.random();
            const pos = this.curve.getPointAt(t);
            const sideOffset = (Math.random() - 0.5) * 12;
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

            const finalPos = pos.clone().add(side.multiplyScalar(sideOffset));

            if (Math.random() > 0.9) this.createBoostPad(finalPos);
            else if (Math.random() > 0.5) this.createCoin(finalPos);
            else if (Math.random() > 0.95) this.createRamp(pos, tangent);
        }
    }

    createCoin(pos) {
        const geo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
        const mesh = new THREE.Mesh(geo, Materials.Coin);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 2.0, 0));
        mesh.rotation.x = Math.PI / 2;
        this.scene.add(mesh);
        this.collectibles.push({ mesh, type: 'coin', radius: 2.0, active: true });
    }

    createBoostPad(pos) {
        const geo = new THREE.PlaneGeometry(5, 5);
        const mesh = new THREE.Mesh(geo, Materials.NeonGreen);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 0.1, 0));
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.collectibles.push({ mesh, type: 'boost', radius: 3, active: true });
    }

    createRamp(pos, tangent) {
        const width = 10;
        const length = 14;
        const height = 3; // Lower height for safer jumping
        const geo = new THREE.BoxGeometry(width, height, length);
        const mesh = new THREE.Mesh(geo, Materials.Road);

        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        mesh.quaternion.copy(quat);
        mesh.rotation.x -= 0.35; // Gentler slope

        mesh.position.copy(pos).add(new THREE.Vector3(0, height/2 - 0.5, 0));
        this.scene.add(mesh);

        const body = new CANNON.Body({ mass: 0 });
        body.addShape(new CANNON.Box(new CANNON.Vec3(width/2, height/2, length/2)));
        body.position.copy(mesh.position);
        body.quaternion.copy(mesh.quaternion);
        this.world.addBody(body);
    }

    getNearestT(pos) {
        let minDist = Infinity;
        let nearestT = 0;
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const p = this.curve.getPointAt(t);
            const d = p.distanceTo(pos);
            if (d < minDist) {
                minDist = d;
                nearestT = t;
            }
        }
        return nearestT;
    }

    checkCollisions(playerPos, onCollect) {
        this.collectibles.forEach(c => {
            if (!c.active) return;
            const dist = playerPos.distanceTo(c.mesh.position);
            if (dist < c.radius) {
                c.active = false;
                c.mesh.visible = false;
                onCollect(c.type);
            }
            if (c.type === 'coin') {
                c.mesh.rotation.y += 0.05;
            }
        });
    }
}
