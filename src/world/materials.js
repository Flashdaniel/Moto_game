import * as THREE from 'three';

export const Colors = {
    Road: 0x5d4037, // Dirt Brown
    Curb: 0x8d6e63,
    Grass: 0x4d7a27,
    Sand: 0xd2b48c,
    Asphalt: 0x3e2723, // Dark Dirt
    SkyDay: 0x87ceeb,
    SkySunset: 0xff7e5f,
    SkyNight: 0x0a0a2a,
    NeonPink: 0x39FF14, // Changed to Neon Green
    NeonBlue: 0xFFFF00, // Changed to Yellow
    Gold: 0xffbe0b
};

export const Materials = {
    Road: new THREE.MeshStandardMaterial({ color: Colors.Road, roughness: 1.0, metalness: 0.0 }),
    Curb: new THREE.MeshStandardMaterial({ color: Colors.Curb, roughness: 0.8 }),
    Grass: new THREE.MeshStandardMaterial({ color: Colors.Grass, roughness: 1.0 }),
    Sand: new THREE.MeshStandardMaterial({ color: Colors.Sand, roughness: 1.0 }),
    Building: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 }),
    Rock: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 }),
    NeonPink: new THREE.MeshStandardMaterial({ color: Colors.NeonPink, emissive: Colors.NeonPink, emissiveIntensity: 2 }),
    NeonBlue: new THREE.MeshStandardMaterial({ color: Colors.NeonBlue, emissive: Colors.NeonBlue, emissiveIntensity: 2 }),
    Coin: new THREE.MeshStandardMaterial({ color: Colors.Gold, metalness: 0.9, roughness: 0.1, emissive: Colors.Gold, emissiveIntensity: 0.5 }),
    Dirt: new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1.0 })
};
