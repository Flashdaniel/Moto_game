import * as THREE from 'three';

export const Colors = {
    Road: 0x333333,
    Curb: 0xdddddd,
    Grass: 0x4d7a27,
    Sand: 0xd2b48c,
    Asphalt: 0x222222,
    SkyDay: 0x87ceeb,
    SkySunset: 0xff7e5f,
    SkyNight: 0x0a0a2a,
    NeonPink: 0xf72585,
    NeonBlue: 0x4cc9f0,
    Gold: 0xffbe0b
};

export const Materials = {
    Road: new THREE.MeshStandardMaterial({ color: Colors.Asphalt, roughness: 0.8, metalness: 0.1 }),
    Curb: new THREE.MeshStandardMaterial({ color: Colors.Curb, roughness: 0.8 }),
    Grass: new THREE.MeshStandardMaterial({ color: Colors.Grass, roughness: 1.0 }),
    Sand: new THREE.MeshStandardMaterial({ color: Colors.Sand, roughness: 1.0 }),
    Building: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 }),
    NeonPink: new THREE.MeshStandardMaterial({ color: Colors.NeonPink, emissive: Colors.NeonPink, emissiveIntensity: 2 }),
    NeonBlue: new THREE.MeshStandardMaterial({ color: Colors.NeonBlue, emissive: Colors.NeonBlue, emissiveIntensity: 2 }),
    Coin: new THREE.MeshStandardMaterial({ color: Colors.Gold, metalness: 0.9, roughness: 0.1, emissive: Colors.Gold, emissiveIntensity: 0.5 })
};
