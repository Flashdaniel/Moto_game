import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameState, gameManager } from './core/GameManager';
import { inputManager } from './systems/InputManager';
import { setupEnvironment, setupRenderer, DayNightCycle } from './world/environment';
import { WorldGenerator } from './world/WorldGenerator';
import { TrackManager } from './world/TrackManager';
import { Motorcycle } from './entities/Motorcycle';
import { AIRacer } from './entities/AIRacer';
import { CameraSystem } from './systems/CameraSystem';
import { UIManager } from './ui/UIManager';
import { TrafficSystem } from './systems/TrafficSystem';
import { FXManager } from './systems/ParticleSystem';
import { AudioManager } from './systems/AudioManager';
import { JuiceManager } from './systems/JuiceManager';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.world.gravity.set(0, -20, 0);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        setupRenderer(this.renderer);
        const { sun } = setupEnvironment(this.scene, this.world);
        this.sun = sun;

        this.worldGen = new WorldGenerator(this.scene, this.world);
        this.trackManager = new TrackManager(this.scene, this.world);
        this.camSystem = new CameraSystem(this.camera);
        this.traffic = new TrafficSystem(this.scene);
        this.fx = new FXManager(this.scene);
        this.juice = new JuiceManager(this.camera, this.scene);
        this.audio = new AudioManager(this.camera);
        this.ui = new UIManager(gameManager);

        this.initWorld();
        this.animate();

        window.addEventListener('resize', () => this.onResize());
        gameManager.setState(GameState.START_MENU);
    }

    initWorld() {
        const points = [];
        const radius = 120;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const y = Math.sin(i * 1.5) * 2; // Reduced verticality for city roads
            points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        }
        this.trackManager.createTrack(points);

        // Generate city AFTER track so buildings can avoid it
        for (let x = -3; x <= 3; x++) {
            for (let z = -3; z <= 3; z++) {
                this.worldGen.generateCityBlock(x, z, this.trackManager.curve);
            }
        }

        const startPos = this.trackManager.curve.getPointAt(0).add(new THREE.Vector3(0, 5, 0));
        const startTangent = this.trackManager.curve.getTangentAt(0);
        const startQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);

        this.player = new Motorcycle(this.world, this.scene, {
            position: startPos,
            isPlayer: true,
            color: 0x39FF14, // Neon Green
            onStuntComplete: (type) => {
                if (type === 'flip') {
                    this.audio.playStuntSound();
                    this.juice.shake(0.3);
                }
            }
        });
        this.player.spawn(startPos, startQuat);
        this.camSystem.setTarget(this.player.mesh);

        this.aiRacers = [
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0xFFFF00, skill: 0.5 }),
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0x4cc9f0, skill: 0.8 })
        ];
        this.aiRacers.forEach((ai, idx) => {
            const p = this.trackManager.curve.getPointAt(0.02 * (idx + 1)).add(new THREE.Vector3(idx*2, 5, 0));
            ai.spawn(p, startQuat);
        });

        // Fewer traffic cars for dirt track, maybe none? Let's keep a few as "spectators"
        for (let i = 0; i < 5; i++) {
            this.traffic.spawn((Math.random() - 0.5) * 400, (Math.random() - 0.5) * 400, Math.random() > 0.5 ? 'h' : 'v');
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(1/30, 1/60);

        this.world.step(dt);
        inputManager.update();
        DayNightCycle.update(dt, this.scene, this.sun);

        if (gameManager.state === GameState.RACING) {
            this.player.update(inputManager.actions, dt);

            if (this.player.nitroActive) {
                this.fx.emitNitro(this.player.mesh.position, null);
                this.juice.shake(0.1);
            }

            // Smoke particles for city roads instead of dirt
            if (!this.player.isInAir && this.player.speed > 5) {
                this.fx.emitNitro(this.player.mesh.position, null); // Re-using nitro for simple smoke
            }

            this.trackManager.checkCollisions(this.player.mesh.position, (type) => {
                if (type === 'coin') {
                    this.audio.playCoinSound();
                } else if (type === 'boost') {
                    this.audio.playBoostSound();
                    this.player.nitroAmount = Math.min(100, this.player.nitroAmount + 30);
                }
            });

            this.camSystem.update(dt, this.player.speed, this.player.nitroActive);
            this.traffic.update(dt);
            this.audio.updateEngine(this.player.speed, this.player.nitroActive);

            const playerProgress = this.trackManager.getNearestT(this.player.mesh.position);
            this.aiRacers.forEach(ai => ai.updateAI(playerProgress, dt));
            this.ui.updateHUD(this.player.speed, this.player.nitroAmount);
        } else {
            this.player.syncVisuals();
            this.camSystem.updateIntro(dt);
        }

        this.fx.update(dt);
        this.juice.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

window.game = new Game();
