import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfca311); // Golden Hour Sky
scene.fog = new THREE.FogExp2(0xfca311, 0.005);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.exposure = 1.5;
document.body.appendChild(renderer.domElement);

// --- Lighting (Cinematic Golden Hour) ---
const ambientLight = new THREE.AmbientLight(0xffdca0, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffe0b0, 4.0);
sunLight.position.set(100, 40, 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -150;
sunLight.shadow.camera.right = 150;
sunLight.shadow.camera.top = 150;
sunLight.shadow.camera.bottom = -150;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// Environment Map for Realtime Reflections
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const skyScene = new THREE.Scene();
skyScene.background = new THREE.Color(0xfca311);
const skyLight = new THREE.DirectionalLight(0xffffff, 1);
skyLight.position.set(1, 1, 1);
skyScene.add(skyLight);
const renderTarget = pmremGenerator.fromScene(skyScene);
scene.environment = renderTarget.texture;

// --- Physics ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

const groundMaterial = new CANNON.Material('ground');
const wheelMaterial = new CANNON.Material('wheel');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial, wheelMaterial, {
  friction: 1.0,
  restitution: 0.05,
  contactEquationStiffness: 1000000,
});
world.addContactMaterial(wheelGroundContactMaterial);

// --- High-Fidelity Realistic Bike ---
function createBikeMesh() {
  const group = new THREE.Group();
  const paintMat = new THREE.MeshPhysicalMaterial({ color: 0xaa0000, metalness: 0.8, roughness: 0.1, clearcoat: 1.0 });
  const chromeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.05 });
  const engineMat = new THREE.MeshPhysicalMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.3 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.5), paintMat);
  body.castShadow = true;
  group.add(body);

  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), paintMat);
  tank.scale.set(1, 0.8, 1.4);
  tank.position.set(0, 0.35, 0.1);
  group.add(tank);

  // Engine
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.6), chromeMat);
  engine.position.set(0, -0.1, 0);
  group.add(engine);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2), chromeMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.25, -0.25, -0.4);
  group.add(exhaust);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.7), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  seat.position.set(0, 0.28, -0.3);
  group.add(seat);

  // Handlebars & Forks
  const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), chromeMat);
  forkL.position.set(0.15, 0.3, 0.7);
  forkL.rotation.x = 0.2;
  group.add(forkL);

  const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), chromeMat);
  forkR.position.set(-0.15, 0.3, 0.7);
  forkR.rotation.x = 0.2;
  group.add(forkR);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), chromeMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 0.8, 0.6);
  group.add(handleBar);

  const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1), chromeMat);
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.6, 0.8);
  group.add(headlight);

  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  glass.position.set(0, 0.6, 0.86);
  group.add(glass);

  return group;
}

function createWheelMesh() {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 16, 100), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }));
  tire.rotation.y = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 32), new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 }));
  rim.rotation.z = Math.PI / 2;
  group.add(rim);
  return group;
}

// --- World ---
function createBuilding(x, z) {
  const h = 10 + Math.random() * 30;
  const w = 8 + Math.random() * 5;
  const d = 8 + Math.random() * 5;
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Add windows
  const winGeo = new THREE.PlaneGeometry(0.5, 0.8);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
  for (let i = 0; i < 5; i++) {
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(x + w / 2 + 0.01, h - 5 - (i * 3), z);
    win.rotation.y = Math.PI / 2;
    scene.add(win);
  }
}

function createPalmTree(x, z) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 5), new THREE.MeshStandardMaterial({ color: 0x664422 }));
  trunk.position.set(x, 2.5, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), leafMat);
    leaf.scale.set(1.5, 0.2, 0.5);
    leaf.position.set(x, 5, z);
    leaf.rotation.y = (i * Math.PI * 2) / 5;
    leaf.rotation.z = 0.4;
    scene.add(leaf);
  }
}

function createGround() {
  const geometry = new THREE.PlaneGeometry(2000, 2000);
  const material = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.8 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const track = new THREE.Mesh(new THREE.PlaneGeometry(15, 2000), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }));
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.01;
  track.receiveShadow = true;
  scene.add(track);

  // Sidewalks
  const sidewalkL = new THREE.Mesh(new THREE.PlaneGeometry(5, 2000), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  sidewalkL.rotation.x = -Math.PI / 2;
  sidewalkL.position.set(-10, 0.02, 0);
  scene.add(sidewalkL);

  const sidewalkR = new THREE.Mesh(new THREE.PlaneGeometry(5, 2000), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  sidewalkR.rotation.x = -Math.PI / 2;
  sidewalkR.position.set(10, 0.02, 0);
  scene.add(sidewalkR);

  // Populate city
  for (let z = -1000; z < 1000; z += 40) {
    if (Math.abs(z) < 10) continue;
    createBuilding(-25 - Math.random() * 10, z);
    createBuilding(25 + Math.random() * 10, z);
    createPalmTree(-10, z + 10);
    createPalmTree(10, z + 10);
  }

  const body = new CANNON.Body({ mass: 0, material: groundMaterial });
  body.addShape(new CANNON.Plane());
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(body);
}
createGround();

// --- Physics Vehicle ---
const chassisBody = new CANNON.Body({ mass: 450 });
chassisBody.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 0.35, 0.8)));
chassisBody.position.set(0, 5, 0);
chassisBody.linearDamping = 0.5;
chassisBody.angularDamping = 0.7;

const bikeMesh = createBikeMesh();
scene.add(bikeMesh);

const vehicle = new CANNON.RaycastVehicle({ chassisBody });
const wheelOptions = {
  radius: 0.47,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 60,
  suspensionRestLength: 0.35,
  frictionSlip: 15,
  dampingRelaxation: 4.0,
  dampingCompression: 6.0,
  maxSuspensionForce: 1000000,
  axleLocal: new CANNON.Vec3(1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(0, -0.1, 0.75),
  maxSuspensionTravel: 0.25,
};

vehicle.addWheel(wheelOptions);
wheelOptions.chassisConnectionPointLocal.set(0, -0.1, -0.75);
vehicle.addWheel(wheelOptions);
vehicle.addToWorld(world);

const wheelMeshes = [createWheelMesh(), createWheelMesh()];
wheelMeshes.forEach(m => scene.add(m));

// --- Controls ---
const keys = {};
const input = { steering: 0 };
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let isLocked = false;
document.addEventListener('click', () => renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange', () => isLocked = document.pointerLockElement === renderer.domElement);

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  if (isLocked) {
    mouseX -= e.movementX * 0.002;
    mouseY -= e.movementY * 0.002;
    mouseY = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, mouseY));
  }
});

function animate() {
  requestAnimationFrame(animate);
  world.step(1/60);

  // Handling
  input.steering = 0;
  if (keys['a']) input.steering = 1;
  if (keys['d']) input.steering = -1;

  vehicle.setSteeringValue(input.steering * 0.45, 0);

  if (keys['w']) {
    vehicle.applyEngineForce(-4000, 1);
    vehicle.setBrake(0, 0);
    vehicle.setBrake(0, 1);
  } else if (keys['s']) {
    vehicle.setBrake(600, 0);
    vehicle.setBrake(600, 1);
    vehicle.applyEngineForce(2000, 1);
  } else {
    vehicle.applyEngineForce(0, 1);
    vehicle.setBrake(40, 0);
    vehicle.setBrake(40, 1);
  }

  if (keys['r']) {
    chassisBody.position.set(0, 5, 0);
    chassisBody.quaternion.set(0, 0, 0, 1);
    chassisBody.velocity.set(0, 0, 0);
    chassisBody.angularVelocity.set(0, 0, 0);
  }

  // Refined Stabilization
  const euler = new CANNON.Vec3();
  chassisBody.quaternion.toEuler(euler);
  const targetLean = -input.steering * 0.25;
  const upright = new CANNON.Quaternion();
  upright.setFromEuler(targetLean, euler.y, 0);
  chassisBody.quaternion.slerp(upright, 0.2, chassisBody.quaternion);

  // Sync Meshes
  bikeMesh.position.copy(chassisBody.position);
  bikeMesh.quaternion.copy(chassisBody.quaternion);
  for (let i = 0; i < 2; i++) {
    vehicle.updateWheelTransform(i);
    const t = vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(t.position);
    wheelMeshes[i].quaternion.copy(t.quaternion);
  }

  // Camera Effects
  const velocity = chassisBody.velocity.length();
  const speedRatio = Math.min(velocity / 40, 1.0);
  camera.fov = 75 + (speedRatio * 15);
  camera.updateProjectionMatrix();

  const shake = (Math.random() - 0.5) * speedRatio * 0.05;

  const bikeQuat = new THREE.Quaternion(bikeMesh.quaternion.x, bikeMesh.quaternion.y, bikeMesh.quaternion.z, bikeMesh.quaternion.w);
  const lookQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(mouseY, mouseX, 0, 'YXZ'));
  const finalCamQuat = bikeQuat.clone().multiply(lookQuat);
  const relOffset = new THREE.Vector3(shake, 1.8 + shake, 5).applyQuaternion(finalCamQuat);
  camera.position.lerp(new THREE.Vector3().copy(bikeMesh.position).add(relOffset), 0.15);
  camera.lookAt(bikeMesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)));

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
