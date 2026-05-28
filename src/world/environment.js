import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Colors } from './materials';

export function setupRenderer(renderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(Colors.Sky);
}

export const Themes = {
    SUNSET: {
        sky: 0xff7e5f,
        fog: 0xfeb47b,
        grass: 0x2d5a27,
        sun: 0xffd194,
        exposure: 1.0
    },
    NEON_CITY: {
        sky: 0x0a0a2a,
        fog: 0x1a1a4a,
        grass: 0x05051a,
        sun: 0x4cc9f0,
        exposure: 0.8
    }
};

export function setupEnvironment(scene, world, themeName = 'SUNSET') {
    const theme = Themes[themeName] || Themes.SUNSET;

    scene.children.forEach(c => {
        if (c.isLight || c.isMesh || c.isGroup) scene.remove(c);
    });

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, themeName === 'NEON_CITY' ? 0.3 : 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(theme.sun, 1.2);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    if (themeName === 'NEON_CITY') {
        const pLight = new THREE.PointLight(0xf72585, 2, 100);
        pLight.position.set(0, 10, 0);
        scene.add(pLight);
    }

    // Ground Plane
    const groundGeo = new THREE.CircleGeometry(500, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: theme.grass });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Physics Ground
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.y = -2;
    world.addBody(groundBody);

    // Fog & Clear Color
    scene.fog = new THREE.Fog(theme.fog, 50, 300);
}
