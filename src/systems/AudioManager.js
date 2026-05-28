import * as THREE from 'three';

/**
 * MotoRush Kids - Procedural Audio System
 * Uses Web Audio API via Three.js to generate engine & UI sounds without external assets.
 */
export class AudioManager {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        this.sounds = new Map();
        this.initEngineSound();
    }

    initEngineSound() {
        this.engineSound = new THREE.Audio(this.listener);
        const ctx = this.listener.context;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);

        oscillator.connect(gain);
        // Connect to Three.js audio node
        const audioNode = this.engineSound.getOutput();
        gain.connect(audioNode);

        oscillator.start();
        this.engineOsc = oscillator;
        this.engineGain = gain;
    }

    updateEngine(speed, isNitro) {
        const ctx = this.listener.context;
        const freq = 100 + (speed * 2) + (isNitro ? 50 : 0);
        const volume = Math.min(0.1, speed / 200);

        this.engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    }

    playCoinSound() {
        this.playTone(800, 0.1, 'sine');
        setTimeout(() => this.playTone(1200, 0.1, 'sine'), 50);
    }

    playBoostSound() {
        this.playTone(200, 0.3, 'square');
    }

    playTone(freq, duration, type = 'sine') {
        const ctx = this.listener.context;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }
}
