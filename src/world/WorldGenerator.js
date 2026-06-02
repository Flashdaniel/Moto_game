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

    generateCityBlock(x, z) {
        // Re-purposing "CityBlock" to "DirtBiome"
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        // Ground (Grass)
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Grass);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Scattered Rocks and Hills instead of Buildings
        for (let i = 0; i < 8; i++) {
            const bx = (Math.random() - 0.5) * 80;
            const bz = (Math.random() - 0.5) * 80;

            // Skip if too close to center (where track usually is)
            if (Math.abs(bx) < 15 && Math.abs(bz) < 15) continue;

            const isTree = Math.random() > 0.4;
            if (isTree) {
                this.addTree(group, bx, 0, bz);
            } else {
                this.addRock(group, bx, 0, bz, x, z);
            }
        }

        this.scene.add(group);
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
