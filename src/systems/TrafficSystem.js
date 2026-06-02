import * as THREE from 'three';

export class TrafficSystem {
    constructor(scene) {
        this.scene = scene;
        this.vehicles = [];
        this.boxGeo = new THREE.BoxGeometry(2, 1.5, 4);
    }

    spawn(x, z, direction) {
        const color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
        const mesh = new THREE.Mesh(this.boxGeo, mat);

        mesh.position.set(x, 0.75, z);
        if (direction === 'v') mesh.rotation.y = Math.PI / 2;

        this.scene.add(mesh);
        this.vehicles.push({ mesh, direction, speed: 5 + Math.random() * 5 });
    }

    update(dt) {
        this.vehicles.forEach(v => {
            if (v.direction === 'h') v.mesh.position.x += v.speed * dt;
            else v.mesh.position.z += v.speed * dt;

            // Simple Wrap around for the "semi-open" feel
            if (Math.abs(v.mesh.position.x) > 200) v.mesh.position.x = -v.mesh.position.x;
            if (Math.abs(v.mesh.position.z) > 200) v.mesh.position.z = -v.mesh.position.z;
        });
    }
}
