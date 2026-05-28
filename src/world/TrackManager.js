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

        const trackSamples = 600;
        const width = 12;
        const vertices = [];
        const indices = [];

        for (let i = 0; i <= trackSamples; i++) {
            const t = i / trackSamples;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

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

        // Add Curbs (Visual)
        const curbGeo = new THREE.BufferGeometry();
        // Simple logic: extrude edges slightly up
        const curbVertices = [];
        for (let i = 0; i < vertices.length; i += 6) {
            // Left edge
            curbVertices.push(vertices[i], vertices[i+1]+0.2, vertices[i+2]);
            // Right edge
            curbVertices.push(vertices[i+3], vertices[i+4]+0.2, vertices[i+5]);
        }
        // ... (Simplified for brevity, just adding some side markers)
        const markerGeo = new THREE.BoxGeometry(0.5, 0.2, 2);
        const markerMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        for (let i = 0; i < trackSamples; i += 10) {
            const t = i / trackSamples;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

            [1, -1].forEach(dir => {
                const m = new THREE.Mesh(markerGeo, markerMat);
                m.position.copy(pos).add(side.clone().multiplyScalar(dir * (width/2)));
                const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
                m.quaternion.copy(q);
                this.scene.add(m);
            });
        }

        // Physics
        for (let i = 0; i < trackSamples; i += 2) {
            const t = i / trackSamples;
            const p = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);

            const body = new CANNON.Body({ mass: 0 });
            body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, 0.5, 2)));
            body.position.set(p.x, p.y - 0.5, p.z);

            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
            body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
            this.world.addBody(body);
        }

        this.addDecorations();
    }

    addDecorations() {
        for (let i = 0; i < 60; i++) {
            const t = Math.random();
            const pos = this.curve.getPointAt(t);
            const sideOffset = (Math.random() - 0.5) * 8;
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

            const finalPos = pos.clone().add(side.multiplyScalar(sideOffset));

            if (Math.random() > 0.85) this.createBoostPad(finalPos);
            else if (Math.random() > 0.4) this.createCoin(finalPos);
            else if (Math.random() > 0.95) this.createRamp(pos, tangent);
        }
    }

    createCoin(pos) {
        const geo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
        const mesh = new THREE.Mesh(geo, Materials.Coin);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 1.2, 0));
        mesh.rotation.x = Math.PI / 2;
        this.scene.add(mesh);
        this.collectibles.push({ mesh, type: 'coin', radius: 1.5 });
    }

    createBoostPad(pos) {
        const geo = new THREE.PlaneGeometry(4, 4);
        const mesh = new THREE.Mesh(geo, Materials.BoostPad);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 0.1, 0));
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.collectibles.push({ mesh, type: 'boost', radius: 2 });
    }

    createRamp(pos, tangent) {
        const geo = new THREE.BoxGeometry(6, 2, 4);
        const mesh = new THREE.Mesh(geo, Materials.Road);
        mesh.position.copy(pos).add(new THREE.Vector3(0, 0.5, 0));
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        mesh.quaternion.copy(quat);
        mesh.rotation.x -= 0.3; // Angle up
        this.scene.add(mesh);

        // Physics Ramp
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(new CANNON.Box(new CANNON.Vec3(3, 1, 2)));
        body.position.copy(mesh.position);
        body.quaternion.copy(mesh.quaternion);
        this.world.addBody(body);
    }
}
