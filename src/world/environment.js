import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function setupRenderer(renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
}

export const DayNightCycle = {
    time: 0.5, // 0 to 1
    duration: 120, // seconds for full cycle

    update(dt, scene, sun) {
        this.time = (this.time + dt / this.duration) % 1.0;

        const angle = this.time * Math.PI * 2;
        sun.position.set(Math.cos(angle) * 100, Math.sin(angle) * 100, 50);

        // Dynamic Lighting Colors
        const dayColor = new THREE.Color(0x87ceeb);
        const sunsetColor = new THREE.Color(0xff7e5f);
        const nightColor = new THREE.Color(0x0a0a2a);

        let currentColor;
        if (this.time > 0.3 && this.time < 0.7) { // Day
            currentColor = dayColor;
            sun.intensity = 1.2;
        } else if ((this.time >= 0.2 && this.time <= 0.3) || (this.time >= 0.7 && this.time <= 0.8)) { // Golden Hour
            currentColor = sunsetColor;
            sun.intensity = 0.8;
        } else { // Night
            currentColor = nightColor;
            sun.intensity = 0.1;
        }

        scene.fog.color.lerp(currentColor, 0.05);
        scene.background = currentColor;
    }
};

export function setupEnvironment(scene, world) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.castShadow = true;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);

    return { sun };
}
