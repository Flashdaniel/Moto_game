import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog = new THREE.Fog(0x1a1a1a, 10, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(20, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096);
scene.add(sunLight);

// --- Physics ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

const groundMaterial = new CANNON.Material('ground');
const wheelMaterial = new CANNON.Material('wheel');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial, wheelMaterial, {
  friction: 0.95,
  restitution: 0.05,
  contactEquationStiffness: 100000,
});
world.addContactMaterial(wheelGroundContactMaterial);

// --- Realistic Bike ---
function createBikeMesh() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 1.0, roughness: 0.1 });

  const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 1.5);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  const forkGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
  const fork = new THREE.Mesh(forkGeo, metalMat);
  fork.position.set(0, 0, 0.6);
  fork.rotation.x = 0.4;
  group.add(fork);

  const headlightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 5 });
  const headlight = new THREE.Mesh(headlightGeo, headlightMat);
  headlight.position.set(0, 0.4, 0.75);
  group.add(headlight);

  return group;
}

function createWheelMesh() {
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.castShadow = true;
  return wheel;
}

// --- World ---
function createGround() {
  const geometry = new THREE.PlaneGeometry(2000, 2000);
  const material = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const trackGeo = new THREE.PlaneGeometry(20, 2000);
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8 });
  const track = new THREE.Mesh(trackGeo, trackMat);
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.01;
  track.receiveShadow = true;
  scene.add(track);

  const shape = new CANNON.Plane();
  const body = new CANNON.Body({ mass: 0, material: groundMaterial });
  body.addShape(shape);
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(body);
}

function createCrate(x, z) {
  const geo = new THREE.BoxGeometry(2, 2, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 1, z);
  mesh.castShadow = true;
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(x, 1, z);
  world.addBody(body);
}

createGround();
for (let i = 0; i < 50; i++) {
  createCrate(12, -i * 30);
  createCrate(-12, -i * 30);
}

// --- Vehicle ---
const chassisShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.3, 0.75));
const chassisBody = new CANNON.Body({ mass: 500 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 5, 0);
chassisBody.linearDamping = 0.4;
chassisBody.angularDamping = 0.6;

const bikeMesh = createBikeMesh();
scene.add(bikeMesh);

const vehicle = new CANNON.RaycastVehicle({ chassisBody });
const wheelOptions = {
  radius: 0.35,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 60,
  suspensionRestLength: 0.3,
  frictionSlip: 20,
  dampingRelaxation: 3,
  dampingCompression: 5,
  maxSuspensionForce: 1000000,
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

// --- Pointer Lock & Controls ---
let isLocked = false;
document.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === renderer.domElement;
});

const input = { forward: false, backward: false, steering: 0 };
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
  if (isLocked) {
    mouseX -= e.movementX * 0.002;
    mouseY -= e.movementY * 0.002;
    mouseY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, mouseY));
  }
});

const speedometer = document.getElementById('speedometer');
const compass = document.getElementById('compass');

function animate() {
  requestAnimationFrame(animate);
  world.step(1/60);

  // Input
  input.forward = !!keys['w'];
  input.backward = !!keys['s'];
  if (keys['a']) input.steering = 1;
  else if (keys['d']) input.steering = -1;
  else input.steering = 0;

  // Physics
  const force = 4000;
  const steer = 0.45;
  vehicle.setSteeringValue(input.steering * steer, 0);
  if (input.forward) {
    vehicle.applyEngineForce(-force, 1);
    vehicle.setBrake(0, 0);
    vehicle.setBrake(0, 1);
  } else if (input.backward) {
    vehicle.setBrake(500, 0);
    vehicle.setBrake(500, 1);
    vehicle.applyEngineForce(force * 0.5, 1);
  } else {
    vehicle.applyEngineForce(0, 1);
    vehicle.setBrake(20, 0);
    vehicle.setBrake(20, 1);
  }

  // Stabilization
  const euler = new CANNON.Vec3();
  chassisBody.quaternion.toEuler(euler);
  const upright = new CANNON.Quaternion();
  upright.setFromEuler(0, euler.y, 0);
  chassisBody.quaternion.slerp(upright, 0.2, chassisBody.quaternion);

  // Update Meshes
  bikeMesh.position.copy(chassisBody.position);
  bikeMesh.quaternion.copy(chassisBody.quaternion);
  for (let i = 0; i < 2; i++) {
    vehicle.updateWheelTransform(i);
    const t = vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(t.position);
    wheelMeshes[i].quaternion.copy(t.quaternion);
  }

  // Tactical Camera (First Person/Tight Third Person Hybrid)
  const cameraOffset = new THREE.Vector3(0, 1.2, -0.2); // First Person-ish
  const bikeQuat = new THREE.Quaternion(bikeMesh.quaternion.x, bikeMesh.quaternion.y, bikeMesh.quaternion.z, bikeMesh.quaternion.w);
  const camPos = new THREE.Vector3().copy(bikeMesh.position).add(cameraOffset.applyQuaternion(bikeQuat));

  camera.position.copy(camPos);

  // Mouse Look
  const lookAtTarget = new THREE.Vector3(0, 0, 10);
  const lookQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(mouseY, mouseX, 0, 'YXZ'));
  lookAtTarget.applyQuaternion(lookQuat).applyQuaternion(bikeQuat);
  camera.lookAt(new THREE.Vector3().copy(camPos).add(lookAtTarget));

  // HUD
  const speed = Math.abs(chassisBody.velocity.length() * 3.6);
  if (speedometer) speedometer.innerText = Math.floor(speed).toString().padStart(3, '0');

  renderer.render(scene, camera);
}
animate();
