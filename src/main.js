import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameState, gameManager } from './core/GameManager';
import { inputManager } from './systems/InputManager';
import { saveManager } from './systems/SaveManager';
import { setupEnvironment, setupRenderer } from './world/environment';
import { Motorcycle } from './entities/Motorcycle';
import { AIRacer } from './entities/AIRacer';
import { TrackManager } from './world/TrackManager';
import { UIManager } from './ui/UIManager';
import { FXManager } from './systems/ParticleSystem';
import { JuiceManager } from './systems/JuiceManager';
import { AudioManager } from './systems/AudioManager';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.world.gravity.set(0, -20, 0); // Higher gravity for arcade feel

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        setupRenderer(this.renderer);
        setupEnvironment(this.scene, this.world);

        this.trackManager = new TrackManager(this.scene, this.world);
        this.fx = new FXManager(this.scene);
        this.juice = new JuiceManager(this.camera, this.scene);
        this.audio = new AudioManager(this.camera);
        this.ui = new UIManager(gameManager);

        this.initRace();
        this.animate();

        window.addEventListener('resize', () => this.onResize());
        gameManager.setState(GameState.START_MENU);
    }

    initRace() {
        const points = [];
        const radius = 100;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const r = radius + (Math.random() - 0.5) * 40;
            const y = Math.sin(i * 0.8) * 8; // More verticality
            points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
        }
        this.trackManager.createTrack(points);

        const startPos = this.trackManager.curve.getPointAt(0).add(new THREE.Vector3(0, 2, 0));
        const startTangent = this.trackManager.curve.getTangentAt(0);
        const startQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);

        this.player = new Motorcycle(this.world, this.scene, {
            color: 0xf72585,
            position: startPos,
            isPlayer: true
        });
        this.player.spawn(startPos, startQuat);

        this.aiRacers = [
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0x4cc9f0, skill: 0.3 }),
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0x72efdd, skill: 0.5 }),
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0xffbe0b, skill: 0.7 })
        ];

        this.aiRacers.forEach((ai, idx) => {
            const p = this.trackManager.curve.getPointAt(0.01 * (idx + 1));
            ai.spawn(p, startQuat);
        });
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(1 / 30, 1 / 60); // Cap dt
        this.world.step(dt);
        inputManager.update();

        if (gameManager.state === GameState.RACING || gameManager.state === GameState.COUNTDOWN) {
            const moveInput = gameManager.state === GameState.RACING ? inputManager.actions : { forward: false };
            this.player.update(moveInput, dt);

            // 1. DYNAMIC CAMERA
            const playerPos = this.player.chassisBody.position;
            const playerQuat = this.player.chassisBody.quaternion;

            const camOffset = new THREE.Vector3(0, 2.5, -6).applyQuaternion(playerQuat);
            const targetCamPos = new THREE.Vector3().copy(playerPos).add(camOffset);
            this.camera.position.lerp(targetCamPos, 0.2);

            // Look ahead
            const lookTarget = new THREE.Vector3().copy(playerPos).add(new THREE.Vector3(0, 0.5, 4).applyQuaternion(playerQuat));
            this.camera.lookAt(lookTarget);

            // Dynamic FOV
            const targetFOV = 70 + (this.player.speed * 0.3) + (this.player.nitroActive ? 20 : 0);
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.1);
            this.camera.updateProjectionMatrix();

            // 2. FX, JUICE & AUDIO
            this.audio.updateEngine(this.player.speed, this.player.nitroActive);

            if (this.player.nitroActive) {
                this.fx.emitNitro(playerPos, null);
                this.juice.shake(0.1);
            }
            if (this.player.isDrifting) {
                this.fx.emitDriftSparks(playerPos, null);
                if (Math.random() > 0.95) this.ui.announce("SWEET DRIFT!");
            }

            // 3. COLLECTIBLES
            this.trackManager.collectibles.forEach(c => {
                if (c.mesh.visible && playerPos.distanceTo(c.mesh.position) < c.radius) {
                    c.mesh.visible = false;
                    if (c.type === 'coin') {
                        saveManager.addCoins(10);
                        this.juice.shake(0.05);
                        this.audio.playCoinSound();
                    } else if (c.type === 'boost') {
                        this.player.nitroAmount = Math.min(100, this.player.nitroAmount + 30);
                        this.ui.announce("BOOST!");
                        this.audio.playBoostSound();
                    }
                }
            });

            // 4. AI
            const playerProgress = 0.5; // Approximation
            this.aiRacers.forEach(ai => ai.updateAI(playerProgress, dt));

            this.ui.updateHUD(this.player.speed, this.player.nitroAmount, saveManager.data.coins);
        }

        this.fx.update(dt);
        this.juice.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
