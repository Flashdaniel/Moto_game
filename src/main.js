import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// --- Physics World ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

// --- Materials ---
const groundMaterial = new CANNON.Material('ground');
const wheelMaterial = new CANNON.Material('wheel');
const wheelGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial, wheelMaterial, {
  friction: 0.8,
  restitution: 0.3,
  contactEquationStiffness: 1000,
});
world.addContactMaterial(wheelGroundContactMaterial);

// Cel Shading Outlines
function createOutline(mesh, thickness = 0.05) {
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMaterial);
  outlineMesh.scale.multiplyScalar(1 + thickness);
  return outlineMesh;
}

// --- Bike Visuals ---
function createBikeMesh() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xff3333 });
  const seatMat = new THREE.MeshToonMaterial({ color: 0x222222 });
  const metalMat = new THREE.MeshToonMaterial({ color: 0xcccccc });

  const bodyGeo = new THREE.BoxGeometry(0.5, 0.5, 1.4);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.add(createOutline(bodyMesh, 0.08));
  group.add(bodyMesh);

  const engineGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 6);
  const engineMesh = new THREE.Mesh(engineGeo, metalMat);
  engineMesh.rotation.z = Math.PI / 2;
  engineMesh.position.set(0, -0.1, 0);
  engineMesh.add(createOutline(engineMesh, 0.15));
  group.add(engineMesh);

  const seatGeo = new THREE.BoxGeometry(0.4, 0.1, 0.5);
  const seatMesh = new THREE.Mesh(seatGeo, seatMat);
  seatMesh.position.set(0, 0.25, 0.3);
  seatMesh.add(createOutline(seatMesh, 0.1));
  group.add(seatMesh);

  const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
  const handleMesh = new THREE.Mesh(handleGeo, metalMat);
  handleMesh.rotation.z = Math.PI / 2;
  handleMesh.position.set(0, 0.4, -0.4);
  handleMesh.add(createOutline(handleMesh, 0.2));
  group.add(handleMesh);

  const shieldGeo = new THREE.BoxGeometry(0.4, 0.4, 0.05);
  const shieldMat = new THREE.MeshToonMaterial({ color: 0x3399ff, transparent: true, opacity: 0.6 });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.set(0, 0.5, -0.5);
  shieldMesh.rotation.x = 0.5;
  group.add(shieldMesh);

  return group;
}

function createWheelMesh() {
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 24);
  const wheelMat = new THREE.MeshToonMaterial({ color: 0x111111 });
  const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
  wheelMesh.rotation.z = Math.PI / 2;
  wheelMesh.castShadow = true;
  wheelMesh.add(createOutline(wheelMesh, 0.05));

  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.21, 12);
  const rimMat = new THREE.MeshToonMaterial({ color: 0xffffff });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelMesh.add(rim);

  return wheelMesh;
}

// --- Environment ---
const stars = [];

function createCloud(x, y, z) {
  const group = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff });
  const geos = [
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.SphereGeometry(1.5, 8, 8),
    new THREE.SphereGeometry(1, 8, 8)
  ];
  const positions = [[-1.2, 0, 0], [0, 0.2, 0], [1.2, 0, 0]];
  geos.forEach((geo, i) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...positions[i]);
    group.add(mesh);
  });
  group.position.set(x, y, z);
  scene.add(group);
}

function createTree(x, z) {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
  const trunkMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.add(createOutline(trunk, 0.1));
  group.add(trunk);
  const leavesGeo = new THREE.ConeGeometry(1.5, 3, 6);
  const leavesMat = new THREE.MeshToonMaterial({ color: 0x228B22 });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 2;
  leaves.add(createOutline(leaves, 0.05));
  group.add(leaves);
  group.position.set(x, 1, z);
  scene.add(group);
}

function createGround() {
  const geometry = new THREE.PlaneGeometry(1000, 1000);
  const material = new THREE.MeshToonMaterial({ color: 0x55cc55 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.position.y = -0.01;
  scene.add(mesh);

  const trackGeo = new THREE.PlaneGeometry(12, 1000);
  const trackMat = new THREE.MeshToonMaterial({ color: 0x444444 });
  const trackMesh = new THREE.Mesh(trackGeo, trackMat);
  trackMesh.rotation.x = -Math.PI / 2;
  trackMesh.receiveShadow = true;
  scene.add(trackMesh);

  const lineGeo = new THREE.PlaneGeometry(0.2, 1000);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
  const lineMesh = new THREE.Mesh(lineGeo, lineMat);
  lineMesh.rotation.x = -Math.PI / 2;
  lineMesh.position.y = 0.01;
  scene.add(lineMesh);

  const shape = new CANNON.Plane();
  const body = new CANNON.Body({ mass: 0, material: groundMaterial });
  body.addShape(shape);
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(body);
}

function createRamp(x, z, rotation) {
  const width = 6;
  const height = 0.5;
  const depth = 10;
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshToonMaterial({ color: 0xffcc33 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, height / 2, z);
  mesh.rotation.x = rotation;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(createOutline(mesh, 0.02));
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(x, height / 2, z);
  body.quaternion.setFromEuler(rotation, 0, 0);
  world.addBody(body);
}

function createStar(x, z) {
  const geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
  const material = new THREE.MeshToonMaterial({ color: 0xffff00 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, 1.5, z);
  mesh.castShadow = true;
  mesh.add(createOutline(mesh, 0.1));
  scene.add(mesh);
  stars.push(mesh);
}

// Populate
createGround();
for (let i = 0; i < 10; i++) {
  const side = i % 2 === 0 ? 1 : -1;
  createRamp(side * 2, -20 - i * 40, -0.25);
}
for (let i = 0; i < 50; i++) {
  createStar((Math.random() - 0.5) * 8, -i * 10);
}
for (let i = 0; i < 40; i++) {
  const side = i % 2 === 0 ? 1 : -1;
  createTree(side * (10 + Math.random() * 20), -i * 20);
}
for (let i = 0; i < 15; i++) {
  createCloud((Math.random()-0.5)*100, 10 + Math.random()*10, (Math.random()-0.5)*200);
}

// --- Bike Physics ---
const chassisShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.2, 0.6));
const chassisBody = new CANNON.Body({ mass: 150 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 4, 0);
chassisBody.linearDamping = 0.5;
chassisBody.angularDamping = 0.5;

const bikeMesh = createBikeMesh();
scene.add(bikeMesh);

const vehicle = new CANNON.RaycastVehicle({ chassisBody });

const wheelOptions = {
  radius: 0.35,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 40,
  suspensionRestLength: 0.35,
  frictionSlip: 10,
  dampingRelaxation: 2.5,
  dampingCompression: 4.5,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 1),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

wheelOptions.chassisConnectionPointLocal.set(0, -0.1, -0.6); // Front
vehicle.addWheel(wheelOptions);
wheelOptions.chassisConnectionPointLocal.set(0, -0.1, 0.6); // Rear
vehicle.addWheel(wheelOptions);

vehicle.addToWorld(world);

const wheelMeshes = [];
vehicle.wheelInfos.forEach(() => {
  const mesh = createWheelMesh();
  scene.add(mesh);
  wheelMeshes.push(mesh);
});

// --- Scoring ---
let score = 0;
const scoreElement = document.getElementById('score');
function checkCollisions() {
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    if (star.position.distanceTo(bikeMesh.position) < 1.8) {
      scene.remove(star);
      stars.splice(i, 1);
      score++;
      if (scoreElement) scoreElement.innerText = score;
    }
    star.rotation.y += 0.05;
    star.rotation.x += 0.02;
  }
}

// --- Modern Controls ---
const input = {
  forward: false,
  backward: false,
  steering: 0, // -1 to 1
  reset: false
};

// Keyboard
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  updateInputFromKeys();
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  updateInputFromKeys();
});

function updateInputFromKeys() {
  input.forward = !!(keys['w'] || keys['arrowup']);
  input.backward = !!(keys['s'] || keys['arrowdown'] || keys[' ']);
  input.reset = !!keys['r'];

  if (keys['a'] || keys['arrowleft']) input.steering = 0.6;
  else if (keys['d'] || keys['arrowright']) input.steering = -0.6;
  else input.steering = 0;
}

// Virtual Joystick & Buttons
const joystickBase = document.getElementById('joystick-base');
const joystickHandle = document.getElementById('joystick-handle');
const btnGas = document.getElementById('btn-gas');
const btnBrake = document.getElementById('btn-brake');
const btnReset = document.getElementById('btn-reset');

let joystickActive = false;

const handleJoystick = (e) => {
  if (!joystickActive) return;
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  let dx = clientX - centerX;
  let dy = clientY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = rect.width / 2;

  if (distance > maxRadius) {
    dx *= maxRadius / distance;
    dy *= maxRadius / distance;
  }

  joystickHandle.style.transform = `translate(${dx}px, ${dy}px)`;
  input.steering = (-dx / maxRadius) * 0.6;
};

joystickBase.addEventListener('mousedown', () => joystickActive = true);
joystickBase.addEventListener('touchstart', (e) => { joystickActive = true; e.preventDefault(); });
window.addEventListener('mousemove', handleJoystick);
window.addEventListener('touchmove', (e) => { handleJoystick(e); e.preventDefault(); }, { passive: false });
window.addEventListener('mouseup', () => {
  joystickActive = false;
  joystickHandle.style.transform = 'translate(0, 0)';
  if (!keys['a'] && !keys['d']) input.steering = 0;
});
window.addEventListener('touchend', () => {
  joystickActive = false;
  joystickHandle.style.transform = 'translate(0, 0)';
  if (!keys['a'] && !keys['d']) input.steering = 0;
});

btnGas.addEventListener('mousedown', () => input.forward = true);
btnGas.addEventListener('touchstart', (e) => { input.forward = true; e.preventDefault(); });
btnGas.addEventListener('mouseup', () => { if (!keys['w']) input.forward = false; });
btnGas.addEventListener('touchend', () => { if (!keys['w']) input.forward = false; });

btnBrake.addEventListener('mousedown', () => input.backward = true);
btnBrake.addEventListener('touchstart', (e) => { input.backward = true; e.preventDefault(); });
btnBrake.addEventListener('mouseup', () => { if (!keys['s'] && !keys[' ']) input.backward = false; });
btnBrake.addEventListener('touchend', () => { if (!keys['s'] && !keys[' ']) input.backward = false; });

btnReset.addEventListener('click', () => {
  chassisBody.position.set(0, 4, 0);
  chassisBody.quaternion.set(0, 0, 0, 1);
  chassisBody.velocity.set(0, 0, 0);
  chassisBody.angularVelocity.set(0, 0, 0);
});

function handlePhysicsControls() {
  const maxForce = 2000;
  const brakeForce = 250;

  vehicle.setSteeringValue(input.steering, 0); // Front wheel

  if (input.forward) {
    vehicle.applyEngineForce(maxForce, 1); // Rear wheel
    vehicle.setBrake(0, 0);
    vehicle.setBrake(0, 1);
  } else if (input.backward) {
    vehicle.setBrake(brakeForce, 0);
    vehicle.setBrake(brakeForce, 1);
    vehicle.applyEngineForce(-maxForce * 0.5, 1); // Reverse a bit
  } else {
    vehicle.applyEngineForce(0, 1);
    vehicle.setBrake(5, 0); // Gentle friction
    vehicle.setBrake(5, 1);
  }

  if (input.reset) {
    chassisBody.position.set(0, 4, 0);
    chassisBody.quaternion.set(0, 0, 0, 1);
    chassisBody.velocity.set(0, 0, 0);
    chassisBody.angularVelocity.set(0, 0, 0);
  }
}

// --- Animation ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  world.step(1/60);
  handlePhysicsControls();
  checkCollisions();

  const euler = new CANNON.Vec3();
  chassisBody.quaternion.toEuler(euler);
  const uprightQuaternion = new CANNON.Quaternion();
  uprightQuaternion.setFromEuler(0, euler.y, 0);
  chassisBody.quaternion.slerp(uprightQuaternion, 0.15, chassisBody.quaternion);

  bikeMesh.position.copy(chassisBody.position);
  bikeMesh.quaternion.copy(chassisBody.quaternion);

  for (let i = 0; i < vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i);
    const t = vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(t.position);
    wheelMeshes[i].quaternion.copy(t.quaternion);
  }

  const cameraOffset = new THREE.Vector3(0, 2.5, 7);
  const bikeQuat = new THREE.Quaternion(bikeMesh.quaternion.x, bikeMesh.quaternion.y, bikeMesh.quaternion.z, bikeMesh.quaternion.w);
  const relativeCameraOffset = cameraOffset.clone().applyQuaternion(bikeQuat);
  const cameraPosition = new THREE.Vector3().copy(bikeMesh.position).add(relativeCameraOffset);
  camera.position.lerp(cameraPosition, 0.1);
  camera.lookAt(bikeMesh.position.clone().add(new THREE.Vector3(0, 1, 0)));

  renderer.render(scene, camera);
}
animate();
