import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Materials, Colors } from './materials';

/**
 * MotoRush Kids - Dirt Track & Nature World Generator
 */
export class WorldGenerator {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.chunks = new Map();
        this.chunkSize = 100;
    }

    generateCityBlock(x, z, trackCurve) {
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        // Ground (Asphalt for city)
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Road);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Buildings for urban feel
        for (let i = 0; i < 6; i++) {
            const bx = (Math.random() - 0.5) * 80;
            const bz = (Math.random() - 0.5) * 80;

            const worldPos = new THREE.Vector3(x * this.chunkSize + bx, 0, z * this.chunkSize + bz);

            // Smarter Track Avoidance
            let tooClose = false;
            if (trackCurve) {
                // Check multiple points on curve? No, just find nearest
                const samples = 20;
                for(let j=0; j<=samples; j++) {
                    const p = trackCurve.getPointAt(j/samples);
                    if (p.distanceTo(worldPos) < 20) {
                        tooClose = true;
                        break;
                    }
                }
            }
            if (tooClose) continue;

            const w = 5 + Math.random() * 10;
            const h = 15 + Math.random() * 40;
            const d = 5 + Math.random() * 10;

            const buildingGeo = new THREE.BoxGeometry(w, h, d);
            const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({
                color: [0x555555, 0x444466, 0x333333, 0x777788][Math.floor(Math.random()*4)],
                roughness: 0.2,
                metalness: 0.5
            }));
            building.position.set(bx, h/2, bz);
            group.add(building);

            // Add windows
            const windowGeo = new THREE.PlaneGeometry(0.5, 0.5);
            const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
            for(let j=0; j<20; j++) {
                const win = new THREE.Mesh(windowGeo, windowMat);
                win.position.set(bx + w/2 + 0.01, Math.random() * h, bz + (Math.random()-0.5)*d);
                win.rotation.y = Math.PI/2;
                group.add(win);
            }

            // Physics for building
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)));
            const bWorldPos = group.position.clone().add(building.position);
            body.position.set(bWorldPos.x, bWorldPos.y, bWorldPos.z);
            this.world.addBody(body);
        }

        // Add palm trees
        for(let i=0; i<4; i++) {
            const px = (Math.random()-0.5)*80;
            const pz = (Math.random()-0.5)*80;
            if (Math.abs(px) < 15 && Math.abs(pz) < 15) continue;
            this.addPalmTree(group, px, 0, pz);
        }

        this.scene.add(group);
    }

    addPalmTree(group, x, y, z) {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 3, z);
        group.add(trunk);

        const leavesGeo = new THREE.SphereGeometry(2, 8, 4);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, 6, z);
        leaves.scale.set(1.5, 0.3, 1.5);
        group.add(leaves);
    }

    addTree(group, x, y, z) {
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 2, z);
        group.add(trunk);

        const leavesGeo = new THREE.ConeGeometry(3, 8, 8);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, 8, z);
        group.add(leaves);

        // Physics for trunk
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(new CANNON.Cylinder(0.5, 0.8, 4, 8));
        const worldPos = group.position.clone().add(new THREE.Vector3(x, 2, z));
        body.position.set(worldPos.x, worldPos.y, worldPos.z);
        this.world.addBody(body);
    }

    addRock(group, x, y, z, chunkX, chunkZ) {
        const size = 2 + Math.random() * 5;
        const rockGeo = new THREE.IcosahedronGeometry(size, 0);
        const rock = new THREE.Mesh(rockGeo, Materials.Rock);
        rock.position.set(x, size/2, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(rock);

        const body = new CANNON.Body({ mass: 0 });
        body.addShape(new CANNON.Sphere(size * 0.8));
        const worldPos = group.position.clone().add(new THREE.Vector3(x, size/2, z));
        body.position.set(worldPos.x, worldPos.y, worldPos.z);
        this.world.addBody(body);
    }

    generateBeach(x, z) {
        // Re-purposing "Beach" to "DustyCanyon"
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        const sand = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Sand);
        sand.rotation.x = -Math.PI / 2;
        sand.receiveShadow = true;
        group.add(sand);

        // Giant rock formations
        for(let i=0; i<3; i++) {
            const rx = (Math.random() - 0.5) * 60;
            const rz = (Math.random() - 0.5) * 60;
            this.addRock(group, rx, 0, rz, x, z);
        }

        this.scene.add(group);
    }
}
