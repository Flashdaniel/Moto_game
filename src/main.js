import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sunny San Andreas sky
scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// --- Lighting (Golden Hour / Sunny) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5e1, 1.5);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096);
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

// --- Physics ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

const groundMaterial = new CANNON.Material('ground');
const wheelMaterial = new CANNON.Material('wheel');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial, wheelMaterial, {
  friction: 0.8,
  restitution: 0.2,
});
world.addContactMaterial(wheelGroundContactMaterial);

// --- GTA Urban Elements ---
function createBuilding(x, z, w, h, d, color = 0xcccccc) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Simple windows
  const winGeo = new THREE.PlaneGeometry(0.5, 0.5);
  const winMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x111111 });
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < Math.floor(h/2); j++) {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(x + w/2 + 0.01, j*2 + 1, z - d/2 + i*d/5 + d/10);
      win.rotation.y = Math.PI / 2;
      scene.add(win);
    }
  }

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(x, h / 2, z);
  world.addBody(body);
}

function createPalmTree(x, z) {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 6, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  group.add(trunk);

  const leafGeo = new THREE.BoxGeometry(3, 0.1, 0.5);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 3;
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.rotation.z = 0.2;
    group.add(leaf);
  }

  group.position.set(x, 3, z);
  scene.add(group);
}

function createStreetLight(x, z) {
  const group = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  group.add(pole);

  const armGeo = new THREE.BoxGeometry(1.5, 0.1, 0.1);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(0.7, 3, 0);
  group.add(arm);

  const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2 });
  const light = new THREE.Mesh(lightGeo, lightMat);
  light.position.set(1.4, 2.9, 0);
  group.add(light);

  group.position.set(x, 3, z);
  scene.add(group);
}

// --- World ---
function createGround() {
  const geometry = new THREE.PlaneGeometry(2000, 2000);
  const material = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Sidewalks
  const sideGeo = new THREE.PlaneGeometry(30, 2000);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const sideLeft = new THREE.Mesh(sideGeo, sideMat);
  sideLeft.rotation.x = -Math.PI / 2;
  sideLeft.position.set(-25, 0.01, 0);
  scene.add(sideLeft);

  const sideRight = new THREE.Mesh(sideGeo, sideMat);
  sideRight.rotation.x = -Math.PI / 2;
  sideRight.position.set(25, 0.01, 0);
  scene.add(sideRight);

  const shape = new CANNON.Plane();
  const body = new CANNON.Body({ mass: 0, material: groundMaterial });
  body.addShape(shape);
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(body);
}

createGround();

// City Block
for (let i = 0; i < 10; i++) {
  createBuilding(40, -i * 40, 20, 10 + Math.random() * 30, 20, 0x999999);
  createBuilding(-40, -i * 40, 20, 10 + Math.random() * 30, 20, 0xaaaaaa);
  createPalmTree(12, -i * 20 - 10);
  createPalmTree(-12, -i * 20 - 10);
  createStreetLight(10, -i * 40);
  createStreetLight(-10, -i * 40);
}

// --- Bike ---
function createBikeMesh() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.7, roughness: 0.2 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 });

  const bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 1.4);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const tankGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const tank = new THREE.Mesh(tankGeo, bodyMat);
  tank.scale.set(1, 0.8, 1.5);
  tank.position.set(0, 0.3, 0);
  group.add(tank);

  const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0);
  const handle = new THREE.Mesh(handleGeo, chromeMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.5, 0.4);
  group.add(handle);

  return group;
}

function createWheelMesh() {
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 32);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.castShadow = true;
  return wheel;
}

const chassisBody = new CANNON.Body({ mass: 400 });
chassisBody.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 0.3, 0.7)));
chassisBody.position.set(0, 5, 0);
const bikeMesh = createBikeMesh();
scene.add(bikeMesh);

const vehicle = new CANNON.RaycastVehicle({ chassisBody });
const wheelOptions = {
  radius: 0.35,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 40,
  suspensionRestLength: 0.3,
  frictionSlip: 10,
  axleLocal: new CANNON.Vec3(1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(0, -0.1, 0.7),
  maxSuspensionTravel: 0.2,
};
vehicle.addWheel(wheelOptions);
wheelOptions.chassisConnectionPointLocal.set(0, -0.1, -0.7);
vehicle.addWheel(wheelOptions);
vehicle.addToWorld(world);

const wheelMeshes = [createWheelMesh(), createWheelMesh()];
wheelMeshes.forEach(m => scene.add(m));

// --- Pointer Lock & Modern Controls ---
let isLocked = false;
document.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === renderer.domElement;
});

let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
  if (isLocked) {
    mouseX -= e.movementX * 0.002;
    mouseY -= e.movementY * 0.002;
    mouseY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, mouseY));
  }
});

const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function animate() {
  requestAnimationFrame(animate);
  world.step(1/60);

  const steer = 0.5;
  const force = 3000;
  vehicle.setSteeringValue(0, 0);
  if (keys['a']) vehicle.setSteeringValue(steer, 0);
  if (keys['d']) vehicle.setSteeringValue(-steer, 0);

  vehicle.applyEngineForce(0, 1);
  if (keys['w']) vehicle.applyEngineForce(-force, 1);
  if (keys['s']) vehicle.applyEngineForce(force, 1);

  // Stabilize
  const euler = new CANNON.Vec3();
  chassisBody.quaternion.toEuler(euler);
  const upright = new CANNON.Quaternion();
  upright.setFromEuler(0, euler.y, 0);
  chassisBody.quaternion.slerp(upright, 0.1, chassisBody.quaternion);

  bikeMesh.position.copy(chassisBody.position);
  bikeMesh.quaternion.copy(chassisBody.quaternion);
  for (let i = 0; i < 2; i++) {
    vehicle.updateWheelTransform(i);
    const t = vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(t.position);
    wheelMeshes[i].quaternion.copy(t.quaternion);
  }

  // Modern Mouse Look Camera
  const cameraOffset = new THREE.Vector3(0, 1.8, 4.5);
  const bikeQuat = new THREE.Quaternion(bikeMesh.quaternion.x, bikeMesh.quaternion.y, bikeMesh.quaternion.z, bikeMesh.quaternion.w);

  // Calculate relative offset considering mouse rotation
  const lookQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(mouseY, mouseX, 0, 'YXZ'));
  const finalCamQuat = bikeQuat.clone().multiply(lookQuat);

  const relOffset = cameraOffset.clone().applyQuaternion(finalCamQuat);
  const targetCamPos = new THREE.Vector3().copy(bikeMesh.position).add(relOffset);

  camera.position.lerp(targetCamPos, 0.15);
  camera.lookAt(bikeMesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)));

  renderer.render(scene, camera);
}
animate();
