/**
 * MotoRush Kids - Save Manager
 * Handles local persistence of coins, XP, and unlocked bikes.
 */
class SaveManager {
    constructor() {
        this.data = {
            coins: 100,
            xp: 0,
            unlockedBikes: ['default'],
            selectedBike: 'default'
        };
        this.load();
    }

    load() {
        const saved = localStorage.getItem('motorush_save');
        if (saved) {
            this.data = JSON.parse(saved);
        }
    }

    save() {
        localStorage.setItem('motorush_save', JSON.stringify(this.data));
    }

    addCoins(amount) {
        this.data.coins += amount;
        this.save();
    }

    unlockBike(id, cost) {
        if (this.data.coins >= cost && !this.data.unlockedBikes.includes(id)) {
            this.data.coins -= cost;
            this.data.unlockedBikes.push(id);
            this.save();
            return true;
        }
        return false;
    }

    selectBike(id) {
        if (this.data.unlockedBikes.includes(id)) {
            this.data.selectedBike = id;
            this.save();
            return true;
        }
        return false;
    }
}

export const saveManager = new SaveManager();
