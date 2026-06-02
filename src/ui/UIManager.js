import { GameState, gameManager } from '../core/GameManager';

export class UIManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.init();
        gameManager.onStateChange((state) => this.handleStateChange(state));
    }

    init() {
        this.root = document.createElement('div');
        this.root.id = 'ui-root';
        document.body.appendChild(this.root);

        // Vignette
        const v = document.createElement('div');
        v.id = 'vignette';
        this.root.appendChild(v);

        // HUD
        this.hud = document.createElement('div');
        this.hud.id = 'hud';
        this.hud.style.display = 'none';
        this.hud.innerHTML = `
            <div id="hud-content">
                <p class="speed-text"><span id="speed-val">0</span> KM/H</p>
                <div class="nitro-bar-container"><div id="nitro-fill"></div></div>
            </div>
        `;
        this.root.appendChild(this.hud);

        // Menu
        this.menu = document.createElement('div');
        this.menu.id = 'menu';
        this.root.appendChild(this.menu);
    }

    handleStateChange(state) {
        this.menu.innerHTML = '';
        this.hud.style.display = 'none';
        this.menu.style.display = 'none';

        if (state === GameState.START_MENU) {
            this.menu.style.display = 'flex';
            this.showStartMenu();
        } else if (state === GameState.RACING) {
            this.hud.style.display = 'block';
            this.showIntroText();
        }
    }

    showStartMenu() {
        const title = document.createElement('h1');
        title.className = 'game-title';
        title.innerText = 'MOTORUSH: SAN ANDREAS';

        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = 'RACE START';
        btn.onclick = () => {
            this.gameManager.setState(GameState.RACING);
        };

        this.menu.appendChild(title);
        this.menu.appendChild(btn);
    }

    showIntroText() {
        const intro = document.createElement('div');
        intro.id = 'intro-overlay';
        intro.innerText = 'LOS SANTOS DISTRICT';
        this.root.appendChild(intro);
        setTimeout(() => { if(intro) intro.remove(); }, 4000);
    }

    updateHUD(speed, nitro) {
        const s = document.getElementById('speed-val');
        if (s) s.innerText = Math.floor(speed);
        const n = document.getElementById('nitro-fill');
        if (n) n.style.width = `${Math.max(0, nitro)}%`;
    }
}
