/**
 * MotoRush Kids - Input Manager
 * Supports Keyboard, Touch, and Mouse-Look
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

        this.mouse = {
            x: 0,
            y: 0,
            locked: false
        };

        this.initKeyboard();
        this.initMouse();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => this.handleKey(e.code, true));
        window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
    }

    handleKey(code, isPressed) {
        switch (code) {
            case 'ArrowUp': case 'KeyW': this.actions.forward = isPressed; break;
            case 'ArrowDown': case 'KeyS': this.actions.backward = isPressed; break;
            case 'ArrowLeft': case 'KeyA': this.actions.left = isPressed; break;
            case 'ArrowRight': case 'KeyD': this.actions.right = isPressed; break;
            case 'Space': this.actions.nitro = isPressed; break;
            case 'ShiftLeft': this.actions.drift = isPressed; break;
        }
    }

    initMouse() {
        document.addEventListener('click', () => {
            if (!this.mouse.locked) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === document.body;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.mouse.x += e.movementX;
                this.mouse.y += e.movementY;
            }
        });
    }

    update() {
        // Reserved for gamepad polling
    }
}

export const inputManager = new InputManager();
