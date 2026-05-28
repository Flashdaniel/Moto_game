export const GameState = {
    LOADING: 'loading',
    START_MENU: 'start_menu',
    GARAGE: 'garage',
    COUNTDOWN: 'countdown',
    RACING: 'racing',
    PAUSED: 'paused',
    RACE_RESULTS: 'race_results'
};

class GameManager {
    constructor() {
        this.state = GameState.LOADING;
        this.listeners = [];
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.notify(newState);
        console.log(`Game State changed to: ${newState}`);
    }

    onStateChange(callback) {
        this.listeners.push(callback);
    }

    notify(state) {
        this.listeners.forEach(cb => cb(state));
    }
}

export const gameManager = new GameManager();
