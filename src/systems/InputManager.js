/**
 * MotoRush Kids - Input Manager
 * Supports Keyboard and Touch (Mobile)
 */
class InputManager {
    constructor() {
        this.actions = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            nitro: false,
            drift: false
        };

        this.initKeyboard();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => this.handleKey(e.code, true));
        window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
    }

    handleKey(code, isPressed) {
        switch (code) {
            case 'ArrowUp':
            case 'KeyW': this.actions.forward = isPressed; break;
            case 'ArrowDown':
            case 'KeyS': this.actions.backward = isPressed; break;
            case 'ArrowLeft':
            case 'KeyA': this.actions.left = isPressed; break;
            case 'ArrowRight':
            case 'KeyD': this.actions.right = isPressed; break;
            case 'Space': this.actions.nitro = isPressed; break;
            case 'ShiftLeft': this.actions.drift = isPressed; break;
        }
    }

    // Called by UIManager for mobile touch inputs
    setMobileAction(action, value) {
        if (this.actions.hasOwnProperty(action)) {
            this.actions[action] = value;
        }
    }

    update() {
        // Reserved for future smoothing/gamepad polling
    }
}

export const inputManager = new InputManager();
