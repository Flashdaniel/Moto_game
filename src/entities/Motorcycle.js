import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * MotoRush Kids - AAA Arcade Motorcycle Physics
 * Features: Auto-balancing, Steering Assist, Arcade Drifting
 */
export class Motorcycle {
    constructor(world, scene, options = {}) {
        this.world = world;
        this.scene = scene;
        this.color = options.color || 0xf72585;
        this.isPlayer = options.isPlayer || false;

        this.initPhysics(options.position || new THREE.Vector3(0, 2, 0));
        this.initVisuals();

        // Gameplay Vars
        this.speed = 0;
        this.nitroAmount = 100;
        this.nitroActive = false;
        this.isDrifting = false;
        this.driftFactor = 0;
        this.leanAmount = 0;
    }

    initPhysics(pos) {
        // Chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1.2));
        this.chassisBody = new CANNON.Body({ mass: 150 });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(pos.x, pos.y, pos.z);
        this.chassisBody.angularDamping = 0.5; // High damping for stability
        this.world.addBody(this.chassisBody);

        // Raycast Vehicle for "Magic" suspension
        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexForwardAxis: 2,
            indexRightAxis: 0,
            indexUpAxis: 1
        });

        const wheelOptions = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 50,
            suspensionRestLength: 0.5,
            frictionSlip: 3,
            dampingRelaxation: 2.5,
            dampingCompression: 4.5,
            maxSuspensionForce: 200000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
        };

        // Front Wheel
        wheelOptions.chassisConnectionPointLocal.set(0, -0.4, 1);
        this.vehicle.addWheel(wheelOptions);

        // Rear Wheel
        wheelOptions.chassisConnectionPointLocal.set(0, -0.4, -1);
        this.vehicle.addWheel(wheelOptions);

        this.vehicle.addToWorld(this.world);

        this.wheelBodies = [];
        this.vehicle.wheelInfos.forEach(() => {
            const wheelBody = new CANNON.Body({ mass: 1, type: CANNON.Body.KINEMATIC });
            wheelBody.collisionFilterGroup = 0; // No collisions for wheels
            this.wheelBodies.push(wheelBody);
        });

        // Pre-step hook for "Smart Assist"
        this.world.addEventListener('preStep', () => {
            this.applySmartAssists();
        });
    }

    initVisuals() {
        this.mesh = new THREE.Group();

        // Stylized Chassis (Kid-friendly, chunky)
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.8, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.2, metalness: 0.8 });
        this.chassisMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.chassisMesh.castShadow = true;
        this.mesh.add(this.chassisMesh);

        // Neon Trim
        const trimGeo = new THREE.BoxGeometry(0.82, 0.1, 1.8);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x4cc9f0, emissive: 0x4cc9f0, emissiveIntensity: 2 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = -0.3;
        this.mesh.add(trim);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        this.wheelMeshes = [];
        for (let i = 0; i < 2; i++) {
            const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
            this.mesh.add(wMesh);
            this.wheelMeshes.push(wMesh);
        }

        this.scene.add(this.mesh);
    }

    applySmartAssists() {
        // 1. AUTO-BALANCE: Keep the bike upright with a PID-like torque
        const up = new CANNON.Vec3(0, 1, 0);
        const chassisUp = new CANNON.Vec3(0, 1, 0);
        this.chassisBody.quaternion.vmult(chassisUp, chassisUp);

        // Calculate tilt error
        const angle = Math.acos(chassisUp.dot(up));
        if (angle > 0.01) {
            const axis = new CANNON.Vec3();
            chassisUp.cross(up, axis);
            axis.normalize();

            // Apply restoring torque (Magic Balance)
            const strength = 1500;
            this.chassisBody.torque.x += axis.x * angle * strength;
            this.chassisBody.torque.y += axis.y * angle * strength;
            this.chassisBody.torque.z += axis.z * angle * strength;
        }

        // 2. STABILITY: Apply a downward force at high speeds to "glue" to track
        const speed = this.chassisBody.velocity.length();
        const downForce = speed * 20;
        this.chassisBody.applyForce(new CANNON.Vec3(0, -downForce, 0), this.chassisBody.position);
    }

    update(input, dt) {
        const engineForce = 800; // Reduced for more control
        const maxSteer = 0.5;
        const brakeForce = 100;

        // Nitro Logic
        this.nitroActive = input.nitro && this.nitroAmount > 0;
        const currentPower = this.nitroActive ? engineForce * 2.5 : engineForce;
        if (this.nitroActive) this.nitroAmount -= 40 * dt;
        else if (this.nitroAmount < 100) this.nitroAmount += 5 * dt;

        // Arcade Drifting
        this.isDrifting = input.drift && this.speed > 5;
        if (this.isDrifting) {
            this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 1.0, 0.1);
            // Reward drift with nitro
            this.nitroAmount = Math.min(100, this.nitroAmount + 10 * dt);
        } else {
            this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 0.0, 0.2);
        }

        // Apply Forces
        const force = input.forward ? currentPower : (input.backward ? -currentPower / 2 : 0);
        this.vehicle.applyEngineForce(force, 1); // Rear wheel drive

        // Steering with Assist
        let steer = 0;
        if (input.left) steer = maxSteer;
        if (input.right) steer = -maxSteer;

        // Drifting modifies steering and friction
        const finalSteer = steer * (this.isDrifting ? 1.5 : 1.0);
        this.vehicle.setSteeringValue(finalSteer, 0); // Front wheel steer

        // Lean Visuals
        const targetLean = steer * 0.5 + (this.isDrifting ? steer * 0.3 : 0);
        this.leanAmount = THREE.MathUtils.lerp(this.leanAmount, targetLean, 0.1);
        this.chassisMesh.rotation.z = this.leanAmount;

        // Sync Mesh
        this.mesh.position.copy(this.chassisBody.position);
        this.mesh.quaternion.copy(this.chassisBody.quaternion);

        // Sync Wheels
        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            this.vehicle.updateWheelTransform(i);
            const t = this.vehicle.wheelInfos[i].worldTransform;
            this.wheelMeshes[i].position.copy(t.position);
            this.wheelMeshes[i].quaternion.copy(t.quaternion);
        }

        this.speed = this.chassisBody.velocity.length() * 2.0; // Reduced display scale for better readability
    }

    spawn(pos, quat) {
        this.chassisBody.position.copy(pos);
        if (quat) this.chassisBody.quaternion.copy(quat);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
    }
}
