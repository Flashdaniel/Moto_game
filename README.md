# 3D Moto Pro - San Andreas Edition

A high-performance, realistic 3D motorcycle game built with Three.js and Cannon-es.

## Features

- **High-Fidelity Graphics:** Cinematic "Golden Hour" lighting, procedural city environment (buildings, palm trees), and PBR (Physically Based Rendering) materials.
- **Detailed Bike Model:** Custom-built bike with engine block, chrome exhaust, alloy wheels, and functional steering geometry (forks/handlebars).
- **Advanced Physics:** `RaycastVehicle` system with heavy mass (450kg) and active stabilization that leans the bike into turns for a professional feel.
- **Immersive Camera:** Speed-dependent FOV scaling and high-speed camera shake.
- **Modern Controls:**
  - **WASD:** Move and steer.
  - **Mouse Look:** Pointer Lock API for full 360-degree camera control.
  - **R:** Reset bike position.
- **GTA-Inspired HUD:** Money, health/armor bars, and minimap UI.

## How to Run

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Build for production: `npm run build`

## Pro Tips
- Click anywhere on the screen to lock the mouse and enable 3D camera look.
- Use 'A' and 'D' to lean and steer; the bike will automatically stabilize for a smooth ride.
