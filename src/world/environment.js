import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function setupRenderer(renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
}

export const DayNightCycle = {
    time: 0.4, // Start at late morning
    duration: 180, // 3 minutes for full cycle

    update(dt, scene, sun) {
        this.time = (this.time + dt / this.duration) % 1.0;

        // 0.0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight
        // Shift angle so sin is positive during "day" (0.0 to 0.5)
        const angle = this.time * Math.PI * 2;
        sun.position.set(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200,
            100
        );

        const dayColor = new THREE.Color(0x87ceeb);
        const sunsetColor = new THREE.Color(0xff7e5f);
        const nightColor = new THREE.Color(0x0a0a2a);

        let currentColor;
        let intensity;

        if (this.time < 0.4) { // Day
            currentColor = dayColor;
            intensity = 1.2;
        } else if (this.time < 0.6) { // Sunset / Evening
            const t = (this.time - 0.4) / 0.2;
            currentColor = dayColor.clone().lerp(sunsetColor, t);
            intensity = 1.2 - t * 0.8;
        } else if (this.time < 0.9) { // Night
            currentColor = nightColor;
            intensity = 0.1;
        } else { // Sunrise
            const t = (this.time - 0.9) / 0.1;
            currentColor = nightColor.clone().lerp(dayColor, t);
            intensity = 0.1 + t * 1.1;
        }

        sun.intensity = intensity;
        scene.fog.color.copy(currentColor);
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
