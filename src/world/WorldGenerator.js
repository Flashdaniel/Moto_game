import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Materials, Colors } from './materials';

/**
 * MotoRush Kids - Chunk & Prop System
 * Handles procedural generation of the semi-open world.
 */
export class WorldGenerator {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.chunks = new Map();
        this.chunkSize = 100;
    }

    generateCityBlock(x, z) {
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        // Ground
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Grass);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Grid of roads & buildings
        const roadWidth = 15;
        const sidewalkWidth = 4;

        // Horizontal Road
        const roadH = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, roadWidth), Materials.Road);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.y = 0.01;
        group.add(roadH);

        // Vertical Road
        const roadV = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, this.chunkSize), Materials.Road);
        roadV.rotation.x = -Math.PI / 2;
        roadV.position.y = 0.02;
        group.add(roadV);

        // Buildings (Procedural low-poly PS2 style)
        for (let i = 0; i < 4; i++) {
            const bx = (i < 2 ? -1 : 1) * 30;
            const bz = (i % 2 === 0 ? -1 : 1) * 30;
            const h = 10 + Math.random() * 30;
            const bGeo = new THREE.BoxGeometry(20, h, 20);
            const bMat = Materials.Building.clone();
            bMat.color.setHSL(Math.random(), 0.2, 0.4);

            const b = new THREE.Mesh(bGeo, bMat);
            b.position.set(bx, h / 2, bz);
            b.castShadow = true;
            group.add(b);

            // Add Neon signs for Night
            if (Math.random() > 0.5) {
                const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), Math.random() > 0.5 ? Materials.NeonPink : Materials.NeonBlue);
                sign.position.set(bx + (bx < 0 ? 10.1 : -10.1), h * 0.8, bz);
                sign.rotation.y = bx < 0 ? Math.PI/2 : -Math.PI/2;
                group.add(sign);
            }

            // Physics for building
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(new CANNON.Box(new CANNON.Vec3(10, h/2, 10)));
            body.position.set(x * this.chunkSize + bx, h/2, z * this.chunkSize + bz);
            this.world.addBody(body);
        }

        // Add Streetlights
        this.addStreetLight(group, -roadWidth/2 - 2, 0, 10);
        this.addStreetLight(group, roadWidth/2 + 2, 0, -10);

        this.scene.add(group);
    }

    addStreetLight(group, x, y, z) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8), Materials.Building);
        pole.position.set(x, 4, z);
        group.add(pole);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 2), Materials.Building);
        lamp.position.set(x, 8, z);
        group.add(lamp);

        const light = new THREE.PointLight(0xffffaa, 1, 20);
        light.position.set(x, 7.5, z);
        group.add(light);
    }

    generateBeach(x, z) {
        // Similar to city but with sand and palms
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        const sand = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Sand);
        sand.rotation.x = -Math.PI / 2;
        group.add(sand);

        this.scene.add(group);
    }
}
