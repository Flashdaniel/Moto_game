import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Motorcycle {
    constructor(world, scene, options = {}) {
        this.world = world;
        this.scene = scene;
        this.color = options.color || 0xf72585;
        this.isPlayer = options.isPlayer || false;

        this.initPhysics(options.position || new THREE.Vector3(0, 2, 0));
        this.initVisuals();

        this.speed = 0;
        this.nitroAmount = 100;
        this.nitroActive = false;
        this.isDrifting = false;
        this.leanAmount = 0;
    }

    initPhysics(pos) {
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.4, 0.6, 1.0));
        this.chassisBody = new CANNON.Body({ mass: 200 });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(pos.x, pos.y, pos.z);
        this.chassisBody.angularDamping = 0.95; // High damping for stability
        this.world.addBody(this.chassisBody);

        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexForwardAxis: 2, indexRightAxis: 0, indexUpAxis: 1
        });

        const wheelOptions = {
            radius: 0.5,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 40,
            suspensionRestLength: 0.6,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
        };

        wheelOptions.chassisConnectionPointLocal.set(0, -0.4, 0.8);
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(0, -0.4, -0.8);
        this.vehicle.addWheel(wheelOptions);

        this.vehicle.addToWorld(this.world);

        // Smart Assist: Auto-Upright
        this.world.addEventListener('preStep', () => {
            const up = new CANNON.Vec3(0, 1, 0);
            const chassisUp = new CANNON.Vec3(0, 1, 0);
            this.chassisBody.quaternion.vmult(chassisUp, chassisUp);
            const angle = Math.acos(chassisUp.dot(up));
            if (angle > 0.01) {
                const axis = new CANNON.Vec3();
                chassisUp.cross(up, axis);
                axis.normalize();
                this.chassisBody.torque.x += axis.x * angle * 2000;
                this.chassisBody.torque.y += axis.y * angle * 2000;
                this.chassisBody.torque.z += axis.z * angle * 2000;
            }
        });
    }

    initVisuals() {
        this.mesh = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.5, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, metalness: 0.7, roughness: 0.2 });
        this.fairing = new THREE.Mesh(bodyGeo, bodyMat);
        this.fairing.position.y = 0.3;
        this.mesh.add(this.fairing);

        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        this.wheelMeshes = [new THREE.Mesh(wheelGeo, wheelMat), new THREE.Mesh(wheelGeo, wheelMat)];
        this.mesh.add(...this.wheelMeshes);

        this.scene.add(this.mesh);
    }

    update(input, dt) {
        const engineForce = 1500;
        const maxSteer = 0.4;

        // Nitro Depletion
        this.nitroActive = input.nitro && this.nitroAmount > 0;
        if (this.nitroActive) {
            this.nitroAmount -= 30 * dt;
        } else if (this.nitroAmount < 100) {
            this.nitroAmount += 5 * dt;
        }

        const currentPower = this.nitroActive ? engineForce * 2.5 : engineForce;
        this.vehicle.applyEngineForce(input.forward ? currentPower : (input.backward ? -engineForce/2 : 0), 1);

        let steer = 0;
        if (input.left) steer = maxSteer;
        if (input.right) steer = -maxSteer;
        this.vehicle.setSteeringValue(steer, 0);

        this.mesh.position.copy(this.chassisBody.position);
        this.mesh.quaternion.copy(this.chassisBody.quaternion);

        for (let i = 0; i < 2; i++) {
            this.vehicle.updateWheelTransform(i);
            const t = this.vehicle.wheelInfos[i].worldTransform;
            this.wheelMeshes[i].position.copy(t.position);
            this.wheelMeshes[i].quaternion.copy(t.quaternion);
        }

        this.speed = this.chassisBody.velocity.length() * 3.6;
    }
}
