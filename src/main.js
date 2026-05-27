import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
  friction: 0.5,
  restitution: 0.3,
  contactEquationStiffness: 1000,
});
world.addContactMaterial(wheelGroundContactMaterial);

// --- Bike Visuals ---
function createBikeMesh() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 1.2);
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff4444 });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  const seatGeo = new THREE.BoxGeometry(0.4, 0.1, 0.5);
  const seatMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const seatMesh = new THREE.Mesh(seatGeo, seatMat);
  seatMesh.position.set(0, 0.25, -0.1);
  group.add(seatMesh);

  const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
  const handleMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
  const handleMesh = new THREE.Mesh(handleGeo, handleMat);
  handleMesh.rotation.z = Math.PI / 2;
  handleMesh.position.set(0, 0.4, 0.4);
  group.add(handleMesh);

  return group;
}

function createWheelMesh() {
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 24);
  const wheelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
  const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
  wheelMesh.rotation.z = Math.PI / 2;
  wheelMesh.castShadow = true;

  const stripeGeo = new THREE.BoxGeometry(0.05, 0.35, 0.25);
  const stripeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  wheelMesh.add(stripe);

  return wheelMesh;
}

// --- Environment ---
const stars = [];
function createGround() {
  const geometry = new THREE.PlaneGeometry(1000, 1000);
  const material = new THREE.MeshPhongMaterial({ color: 0x44aa44 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const shape = new CANNON.Plane();
  const body = new CANNON.Body({ mass: 0, material: groundMaterial });
  body.addShape(shape);
  body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(body);
}

function createRamp(x, z, rotation) {
  const width = 4;
  const height = 0.5;
  const depth = 8;

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, height / 2, z);
  mesh.rotation.x = rotation;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(x, height / 2, z);
  body.quaternion.setFromEuler(rotation, 0, 0);
  world.addBody(body);
}

function createStar(x, z) {
  const geometry = new THREE.OctahedronGeometry(0.5);
  const material = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0x444400 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, 1, z);
  mesh.castShadow = true;
  scene.add(mesh);
  stars.push(mesh);
}

createGround();
createRamp(0, -10, -0.3);
createRamp(10, -20, -0.2);
createRamp(-10, -30, -0.4);

for (let i = 0; i < 20; i++) {
  createStar((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 100 - 50);
}

// --- Bike Physics ---
const chassisShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.2, 0.6));
const chassisBody = new CANNON.Body({ mass: 150 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 4, 0);

const bikeMesh = createBikeMesh();
scene.add(bikeMesh);

const vehicle = new CANNON.RaycastVehicle({
  chassisBody: chassisBody,
});

const wheelOptions = {
  radius: 0.3,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 30,
  suspensionRestLength: 0.3,
  frictionSlip: 5,
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 1),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

// Front wheel
wheelOptions.chassisConnectionPointLocal.set(0, -0.1, 0.5);
vehicle.addWheel(wheelOptions);

// Back wheel
wheelOptions.chassisConnectionPointLocal.set(0, -0.1, -0.5);
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
    const distance = star.position.distanceTo(bikeMesh.position);

    if (distance < 1.5) {
      scene.remove(star);
      stars.splice(i, 1);
      score++;
      if (scoreElement) scoreElement.innerText = score;
    }

    star.rotation.y += 0.05;
  }
}

// --- Controls ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function handleControls() {
  const maxSteerVal = 0.5;
  const maxForce = 1000;
  const brakeForce = 100;

  vehicle.setSteeringValue(0, 0);
  vehicle.applyEngineForce(0, 0);
  vehicle.applyEngineForce(0, 1);
  vehicle.setBrake(0, 0);
  vehicle.setBrake(0, 1);

  if (keys['a'] || keys['arrowleft']) {
    vehicle.setSteeringValue(maxSteerVal, 0);
  } else if (keys['d'] || keys['arrowright']) {
    vehicle.setSteeringValue(-maxSteerVal, 0);
  }

  if (keys['w'] || keys['arrowup']) {
    vehicle.applyEngineForce(-maxForce, 1);
  } else if (keys['s'] || keys['arrowdown']) {
    vehicle.applyEngineForce(maxForce, 1);
  }

  if (keys[' ']) {
    vehicle.setBrake(brakeForce, 0);
    vehicle.setBrake(brakeForce, 1);
  }

  if (keys['r']) {
    chassisBody.position.set(0, 4, 0);
    chassisBody.quaternion.set(0, 0, 0, 1);
    chassisBody.velocity.set(0, 0, 0);
    chassisBody.angularVelocity.set(0, 0, 0);
  }
}

// --- Animation & Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  world.step(1/60);
  handleControls();
  checkCollisions();

  // Stabilize bike (keep it upright)
  const euler = new CANNON.Vec3();
  chassisBody.quaternion.toEuler(euler);
  const uprightQuaternion = new CANNON.Quaternion();
  uprightQuaternion.setFromEuler(0, euler.y, 0);
  chassisBody.quaternion.slerp(uprightQuaternion, 0.1, chassisBody.quaternion);

  bikeMesh.position.copy(chassisBody.position);
  bikeMesh.quaternion.copy(chassisBody.quaternion);

  for (let i = 0; i < vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i);
    const t = vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(t.position);
    wheelMeshes[i].quaternion.copy(t.quaternion);
  }

  // Follow Camera
  const cameraOffset = new THREE.Vector3(0, 3, 8);
  const bikeQuat = new THREE.Quaternion(bikeMesh.quaternion.x, bikeMesh.quaternion.y, bikeMesh.quaternion.z, bikeMesh.quaternion.w);
  const relativeCameraOffset = cameraOffset.clone().applyQuaternion(bikeQuat);
  const cameraPosition = new THREE.Vector3().copy(bikeMesh.position).add(relativeCameraOffset);
  camera.position.copy(cameraPosition);
  camera.lookAt(bikeMesh.position);

  renderer.render(scene, camera);
}

animate();
