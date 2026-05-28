import { GameState } from '../core/GameManager';
import { inputManager } from '../systems/InputManager';
import { saveManager } from '../systems/SaveManager';

export class UIManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.init();

        gameManager.onStateChange((state) => this.handleStateChange(state));
    }

    init() {
        // Main Container
        this.container = document.createElement('div');
        this.container.id = 'ui-root';
        document.body.appendChild(this.container);

        // HUD (Coins, Speed, Nitro)
        this.hud = document.createElement('div');
        this.hud.id = 'hud';
        this.hud.style.display = 'none';
        this.hud.innerHTML = `
            <div id="coin-counter" class="hud-item">COINS: 0</div>
            <div id="announcer"></div>
            <div id="speedo-container">
                <div id="speedo-inner">
                    <span id="speed-val">0</span>
                    <span id="unit">KM/H</span>
                </div>
                <div id="nitro-bar-bg"><div id="nitro-bar-fill"></div></div>
            </div>
        `;
        this.container.appendChild(this.hud);

        // Menus
        this.menu = document.createElement('div');
        this.menu.id = 'menu-container';
        this.container.appendChild(this.menu);

        // Mobile Controls
        this.initMobileControls();
    }

    initMobileControls() {
        this.mobileUI = document.createElement('div');
        this.mobileUI.id = 'mobile-ui';
        this.mobileUI.style.display = 'none';
        this.mobileUI.innerHTML = `
            <div id="joystick-zone"></div>
            <div id="action-buttons">
                <button id="btn-nitro" class="mobile-btn">NITRO</button>
                <button id="btn-drift" class="mobile-btn">DRIFT</button>
            </div>
        `;
        this.container.appendChild(this.mobileUI);

        // Touch Listeners
        const nitroBtn = this.mobileUI.querySelector('#btn-nitro');
        nitroBtn.addEventListener('touchstart', (e) => { e.preventDefault(); inputManager.setMobileAction('nitro', true); });
        nitroBtn.addEventListener('touchend', () => inputManager.setMobileAction('nitro', false));

        const driftBtn = this.mobileUI.querySelector('#btn-drift');
        driftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); inputManager.setMobileAction('drift', true); });
        driftBtn.addEventListener('touchend', () => inputManager.setMobileAction('drift', false));

        // Joystick (Simplified: Left/Right zones)
        this.mobileUI.addEventListener('touchstart', (e) => {
            const x = e.touches[0].clientX;
            if (x < window.innerWidth / 3) inputManager.setMobileAction('left', true);
            else if (x > window.innerWidth / 3 && x < (window.innerWidth / 3) * 2) inputManager.setMobileAction('forward', true);
            else if (x > (window.innerWidth / 3) * 2) inputManager.setMobileAction('right', true);
        });

        this.mobileUI.addEventListener('touchend', () => {
            inputManager.setMobileAction('left', false);
            inputManager.setMobileAction('right', false);
            inputManager.setMobileAction('forward', false);
        });
    }

    handleStateChange(state) {
        this.menu.innerHTML = '';
        this.hud.style.display = 'none';
        this.mobileUI.style.display = 'none';

        switch (state) {
            case GameState.START_MENU:
                this.showStartMenu();
                break;
            case GameState.RACING:
                this.hud.style.display = 'block';
                if ('ontouchstart' in window) this.mobileUI.style.display = 'flex';
                break;
            case GameState.GARAGE:
                this.showGarage();
                break;
        }
    }

    showStartMenu() {
        this.menu.innerHTML = '';
        const title = document.createElement('h1');
        title.innerText = 'MOTORUSH KIDS';
        title.className = 'game-title';

        const startBtn = document.createElement('button');
        startBtn.innerText = 'GO RACING!';
        startBtn.className = 'main-btn';
        startBtn.onclick = () => this.gameManager.setState(GameState.RACING);

        const garageBtn = document.createElement('button');
        garageBtn.innerText = 'GARAGE';
        garageBtn.className = 'main-btn secondary';
        garageBtn.onclick = () => this.gameManager.setState(GameState.GARAGE);

        this.menu.appendChild(title);
        this.menu.appendChild(startBtn);
        this.menu.appendChild(garageBtn);
    }

    showGarage() {
        this.menu.innerHTML = '';
        const title = document.createElement('h1');
        title.innerText = 'GARAGE';
        title.className = 'game-title';

        const colors = [
            { id: 'pink', name: 'Neon Pink', hex: 0xf72585, cost: 0 },
            { id: 'blue', name: 'Cyber Blue', hex: 0x4cc9f0, cost: 50 },
            { id: 'green', name: 'Slime Green', hex: 0x72efdd, cost: 100 },
            { id: 'gold', name: 'Gold Rush', hex: 0xffbe0b, cost: 250 }
        ];

        const grid = document.createElement('div');
        grid.className = 'garage-grid';

        colors.forEach(c => {
            const isUnlocked = saveManager.data.unlockedBikes.includes(c.id);
            const isSelected = saveManager.data.selectedBike === c.id;

            const item = document.createElement('div');
            item.className = `garage-item ${isSelected ? 'selected' : ''}`;
            item.style.backgroundColor = `#${c.hex.toString(16).padStart(6, '0')}`;

            let label = isUnlocked ? 'OWNED' : `${c.cost} Coins`;
            if (isSelected) label = 'EQUIPPED';

            item.innerHTML = `<span>${c.name}</span><br><small>${label}</small>`;

            item.onclick = () => {
                if (isUnlocked) {
                    saveManager.selectBike(c.id);
                    this.showGarage(); // Refresh
                } else if (saveManager.unlockBike(c.id, c.cost)) {
                    this.showGarage(); // Refresh
                } else {
                    this.announce("NEED MORE COINS!");
                }
            };
            grid.appendChild(item);
        });

        const backBtn = document.createElement('button');
        backBtn.innerText = 'BACK';
        backBtn.className = 'main-btn';
        backBtn.onclick = () => this.gameManager.setState(GameState.START_MENU);

        this.menu.appendChild(title);
        this.menu.appendChild(grid);
        this.menu.appendChild(backBtn);
    }

    updateHUD(speed, nitro, coins) {
        document.getElementById('speed-val').innerText = Math.floor(speed);
        document.getElementById('coin-counter').innerText = `COINS: ${coins}`;
        document.getElementById('nitro-bar-fill').style.width = `${nitro}%`;
    }

    announce(text) {
        const el = document.getElementById('announcer');
        el.innerText = text;
        el.className = 'announcer-active';
        setTimeout(() => el.className = '', 1000);
    }
}
