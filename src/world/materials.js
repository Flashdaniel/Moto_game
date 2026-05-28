import * as THREE from 'three';

export const Colors = {
    Road: 0x5a5a5a,
    Grass: 0x74c365,
    Sky: 0x4cc9f0,
    Nitro: 0xf72585,
    Coin: 0xffbe0b,
    Boost: 0x4361ee
};

export const Materials = {
    Road: new THREE.MeshStandardMaterial({ color: Colors.Road, roughness: 0.8 }),
    Grass: new THREE.MeshStandardMaterial({ color: Colors.Grass, roughness: 1.0 }),
    Coin: new THREE.MeshStandardMaterial({ color: Colors.Coin, metalness: 0.9, roughness: 0.1, emissive: Colors.Coin, emissiveIntensity: 0.5 }),
    BoostPad: new THREE.MeshStandardMaterial({ color: Colors.Boost, emissive: Colors.Boost, emissiveIntensity: 1.0, transparent: true, opacity: 0.8 }),
    NitroBar: new THREE.MeshBasicMaterial({ color: Colors.Nitro })
};
