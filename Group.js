module.exports = class Group {
    constructor(name, players, limit=5, type='lobby') {
        this.name = name;
        this.players = players;
        this.limit = limit;
        this.type = type;
    }

    setLimit(limit) {
        this.limit = limit;
    }

    isPlayerInGroup(player) {
        let inGroup = false;
        this.players.map((p) => {
            if (p.userID === player.userID) {
                inGroup = true;
            }
        });
        return inGroup;
    }

    isFull() {
        return this.limit < this.players.length;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    removePlayer(player) {
        this.players = this.players.filter((p) => p.userID !== player.userID);
    }

    toString() {
        if (this.type === 'lobby') {
            return `${this.name} (${this.players.length}/${this.limit})`;
        } else if (this.type === 'game') {
            return `${this.name} (${this.players.length} player${this.players.length === 1 ? '' : 's'})`;
        }
    }

    getType() {
        return this.type;
    }
}
