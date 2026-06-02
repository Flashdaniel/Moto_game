import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Materials, Colors } from './materials';

/**
 * MotoRush Kids - Chunk & Prop System
 */
export class WorldGenerator {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.chunks = new Map();
        this.chunkSize = 100;

        this.buildingGeo = new THREE.BoxGeometry(20, 1, 20);
    }

    generateCityBlock(x, z) {
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        // Ground
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Grass);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Grid of roads
        const roadWidth = 15;

        // Horizontal Road
        const roadH = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, roadWidth), Materials.Road);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.y = 0.05;
        group.add(roadH);

        // Vertical Road
        const roadV = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, this.chunkSize), Materials.Road);
        roadV.rotation.x = -Math.PI / 2;
        roadV.position.y = 0.1;
        group.add(roadV);

        // Buildings
        for (let i = 0; i < 4; i++) {
            const bx = (i < 2 ? -1 : 1) * 30;
            const bz = (i % 2 === 0 ? -1 : 1) * 30;
            const h = 20 + Math.random() * 40;

            const b = new THREE.Mesh(this.buildingGeo, Materials.Building);
            b.scale.y = h;
            b.position.set(bx, h / 2, bz);
            b.castShadow = true;
            group.add(b);

            // Physics
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(new CANNON.Box(new CANNON.Vec3(10, h/2, 10)));
            body.position.set(x * this.chunkSize + bx, h/2, z * this.chunkSize + bz);
            this.world.addBody(body);
        }

        // Streetlights
        for (let j = -1; j <= 1; j += 2) {
            this.addStreetLight(group, j * (roadWidth/2 + 2), 0, 10);
            this.addStreetLight(group, j * (roadWidth/2 + 2), 0, -10);
        }

        this.scene.add(group);
    }

    addStreetLight(group, x, y, z) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8), Materials.Building);
        pole.position.set(x, 4, z);
        group.add(pole);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 1), Materials.Building);
        lamp.position.set(x, 8, z);
        group.add(lamp);

        const light = new THREE.PointLight(0xffffaa, 5, 30);
        light.position.set(x, 7.5, z);
        group.add(light);
    }

    generateBeach(x, z) {
        const group = new THREE.Group();
        group.position.set(x * this.chunkSize, 0, z * this.chunkSize);

        const sand = new THREE.Mesh(new THREE.PlaneGeometry(this.chunkSize, this.chunkSize), Materials.Sand);
        sand.rotation.x = -Math.PI / 2;
        sand.receiveShadow = true;
        group.add(sand);

        this.scene.add(group);
    }
}
