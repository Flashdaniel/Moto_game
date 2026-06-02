import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Motorcycle {
    constructor(world, scene, options = {}) {
        this.world = world;
        this.scene = scene;
        this.color = options.color || 0x39FF14;
        this.isPlayer = options.isPlayer || false;

        this.initPhysics(options.position || new THREE.Vector3(0, 2, 0));
        this.initVisuals();

        this.speed = 0;
        this.nitroAmount = 100;
        this.nitroActive = false;
        this.isDrifting = false;
        this.leanAmount = 0;

        this.isInAir = false;
        this.airTime = 0;
        this.stuntRotation = 0;
        this.onStuntComplete = options.onStuntComplete || (() => {});
    }

    initPhysics(pos) {
        const chassisShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.7, 1.1));
        this.chassisBody = new CANNON.Body({ mass: 180 });
        this.chassisBody.addShape(chassisShape);
        this.chassisBody.position.set(pos.x, pos.y, pos.z);
        this.chassisBody.angularDamping = 0.8;
        this.world.addBody(this.chassisBody);

        this.vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassisBody,
            indexForwardAxis: 2, indexRightAxis: 0, indexUpAxis: 1
        });

        const wheelOptions = {
            radius: 0.6,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 25,
            suspensionRestLength: 0.8,
            frictionSlip: 8,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 200000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
        };

        wheelOptions.chassisConnectionPointLocal.set(0, -0.4, 1.0);
        this.vehicle.addWheel(wheelOptions);
        wheelOptions.chassisConnectionPointLocal.set(0, -0.4, -1.0);
        this.vehicle.addWheel(wheelOptions);

        this.vehicle.addToWorld(this.world);

        this.world.addEventListener('preStep', () => {
            if (!this.isInAir) {
                const up = new CANNON.Vec3(0, 1, 0);
                const chassisUp = new CANNON.Vec3(0, 1, 0);
                this.chassisBody.quaternion.vmult(chassisUp, chassisUp);
                const angle = Math.acos(chassisUp.dot(up));
                if (angle > 0.01) {
                    const axis = new CANNON.Vec3();
                    chassisUp.cross(up, axis);
                    axis.normalize();
                    const strength = 1500;
                    this.chassisBody.torque.x += axis.x * angle * strength;
                    this.chassisBody.torque.y += axis.y * angle * strength;
                    this.chassisBody.torque.z += axis.z * angle * strength;
                }
            }
        });
    }

    initVisuals() {
        this.mesh = new THREE.Group();
        const frameGeo = new THREE.BoxGeometry(0.3, 0.8, 1.5);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.y = 0.5;
        this.mesh.add(frame);

        const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.3 });
        this.fairing = new THREE.Mesh(bodyGeo, bodyMat);
        this.fairing.position.y = 0.7;
        this.fairing.position.z = 0.2;
        this.mesh.add(this.fairing);

        const guardGeo = new THREE.BoxGeometry(0.4, 0.05, 0.6);
        const frontGuard = new THREE.Mesh(guardGeo, bodyMat);
        frontGuard.position.set(0, 0.7, 1.1);
        frontGuard.rotation.x = -0.3;
        this.mesh.add(frontGuard);

        const rearGuard = new THREE.Mesh(guardGeo, bodyMat);
        rearGuard.position.set(0, 0.9, -0.8);
        rearGuard.rotation.x = 0.3;
        this.mesh.add(rearGuard);

        const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2);
        barGeo.rotateZ(Math.PI / 2);
        const barMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const bars = new THREE.Mesh(barGeo, barMat);
        bars.position.set(0, 1.1, 0.7);
        this.mesh.add(bars);

        const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
        this.wheelMeshes = [new THREE.Mesh(wheelGeo, wheelMat), new THREE.Mesh(wheelGeo, wheelMat)];
        this.wheelMeshes.forEach(w => {
            const detailGeo = new THREE.BoxGeometry(0.65, 0.1, 0.32);
            const detailMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
            for(let i=0; i<8; i++) {
                const d = new THREE.Mesh(detailGeo, detailMat);
                d.rotation.x = (i / 8) * Math.PI * 2;
                w.add(d);
            }
        });

        this.mesh.add(...this.wheelMeshes);
        this.scene.add(this.mesh);
    }

    update(input, dt) {
        const engineForce = 2500;
        const maxSteer = 0.5;

        let grounded = false;
        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
            if (this.vehicle.wheelInfos[i].raycastResult.isInContact) grounded = true;
        }

        // Stunt Detection
        if (!grounded) {
            if (!this.isInAir) {
                this.isInAir = true;
                this.stuntRotation = 0;
                this.airTime = 0;
            }
            this.airTime += dt;
            // Accumulate rotation for flips
            this.stuntRotation += Math.abs(this.chassisBody.angularVelocity.x) * dt;
        } else {
            if (this.isInAir) {
                this.isInAir = false;
                if (this.stuntRotation > 5.0) { // Approx one full flip
                    this.onStuntComplete('flip');
                    this.nitroAmount = Math.min(100, this.nitroAmount + 30);
                }
            }
        }

        this.nitroActive = input.nitro && this.nitroAmount > 0;
        if (this.nitroActive) {
            this.nitroAmount -= 30 * dt;
        } else if (this.nitroAmount < 100) {
            this.nitroAmount += 5 * dt;
        }

        if (!this.isInAir) {
            const currentPower = this.nitroActive ? engineForce * 2.5 : engineForce;
            this.vehicle.applyEngineForce(input.forward ? currentPower : (input.backward ? -engineForce/2 : 0), 1);

            let steer = 0;
            if (input.left) steer = maxSteer;
            if (input.right) steer = -maxSteer;
            this.vehicle.setSteeringValue(steer, 0);
            this.chassisBody.angularDamping = 0.8;
        } else {
            this.chassisBody.angularDamping = 0.1;
            const airTorque = 5000;
            if (input.forward) this.chassisBody.torque.x += airTorque;
            if (input.backward) this.chassisBody.torque.x -= airTorque;
            if (input.left) this.chassisBody.torque.z += airTorque;
            if (input.right) this.chassisBody.torque.z -= airTorque;
        }

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

    spawn(pos, quat) {
        this.chassisBody.position.copy(pos);
        if (quat) this.chassisBody.quaternion.copy(quat);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        this.mesh.position.copy(this.chassisBody.position);
        this.mesh.quaternion.copy(this.chassisBody.quaternion);
    }

    destroy() {
        this.world.removeBody(this.chassisBody);
        this.scene.remove(this.mesh);
        this.wheelMeshes.forEach(m => this.mesh.remove(m));
    }
}
