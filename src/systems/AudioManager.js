import * as THREE from 'three';

/**
 * MotoRush Kids - Procedural Audio System (Dirt Bike Edition)
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

        // 2-Stroke dirt bike sound is higher pitched and raspier
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);

        oscillator.connect(gain);
        const audioNode = this.engineSound.getOutput();
        gain.connect(audioNode);

        oscillator.start();
        this.engineOsc = oscillator;
        this.engineGain = gain;
    }

    updateEngine(speed, isNitro) {
        const ctx = this.listener.context;
        // Higher base freq and more aggressive scaling for dirt bike
        const freq = 150 + (speed * 4) + (isNitro ? 100 : 0);
        const volume = Math.min(0.08, speed / 250);

        this.engineOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
        this.engineGain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }

    playCoinSound() {
        this.playTone(800, 0.1, 'sine');
        setTimeout(() => this.playTone(1200, 0.1, 'sine'), 50);
    }

    playBoostSound() {
        this.playTone(300, 0.4, 'sawtooth');
    }

    playStuntSound() {
        this.playTone(600, 0.2, 'sine');
        setTimeout(() => this.playTone(900, 0.3, 'sine'), 100);
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
