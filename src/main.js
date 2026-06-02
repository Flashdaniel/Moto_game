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
        // 1. Scene & Physics
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

        // 2. Initial Modules
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
        // 1. Open World Geometry
        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                if (Math.abs(x) === 2 || Math.abs(z) === 2) {
                    this.worldGen.generateBeach(x, z);
                } else {
                    this.worldGen.generateCityBlock(x, z);
                }
            }
        }

        // 2. Race Track
        const points = [];
        const radius = 100;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const y = Math.sin(i * 0.8) * 5;
            points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        }
        this.trackManager.createTrack(points);

        // 3. Player
        const startPos = this.trackManager.curve.getPointAt(0).add(new THREE.Vector3(0, 5, 0));
        const startTangent = this.trackManager.curve.getTangentAt(0);
        const startQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);

        this.player = new Motorcycle(this.world, this.scene, {
            position: startPos,
            isPlayer: true,
            color: 0xf72585
        });
        this.player.spawn(startPos, startQuat);
        this.camSystem.setTarget(this.player.mesh);

        // 4. AI
        this.aiRacers = [
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0x4cc9f0, skill: 0.5 }),
            new AIRacer(this.world, this.scene, this.trackManager.curve, { color: 0xffbe0b, skill: 0.8 })
        ];
        this.aiRacers.forEach((ai, idx) => {
            const p = this.trackManager.curve.getPointAt(0.02 * (idx + 1)).add(new THREE.Vector3(idx*2, 5, 0));
            ai.spawn(p, startQuat);
        });

        // 5. Ambient Traffic
        for (let i = 0; i < 15; i++) {
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

            // Particles & Juice
            if (this.player.nitroActive) {
                this.fx.emitNitro(this.player.mesh.position, null);
                this.juice.shake(0.1);
            }
            if (this.player.isDrifting) {
                this.fx.emitDriftSparks(this.player.mesh.position, null);
            }

            this.trackManager.checkCollisions(this.player.mesh.position, (type) => {
                if (type === 'coin') {
                    this.audio.play('coin');
                } else if (type === 'boost') {
                    this.player.nitroAmount = Math.min(100, this.player.nitroAmount + 30);
                    this.audio.play('nitro');
                }
            });

            this.camSystem.update(dt, this.player.speed, this.player.nitroActive);
            this.traffic.update(dt);
            this.audio.updateEngine(this.player.speed, this.player.nitroActive);

            // Calculate player progress
            const playerProgress = this.trackManager.getNearestT(this.player.mesh.position);
            this.aiRacers.forEach(ai => ai.updateAI(playerProgress, dt));
            this.ui.updateHUD(this.player.speed, this.player.nitroAmount);
        } else {
            this.camSystem.updateIntro(dt);
        }

        this.fx.update(dt);
        this.juice.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

window.game = new Game();
