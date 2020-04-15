module.exports = class Lobby {
    constructor(name, players, limit=1) {
        this.name = name;
        this.players = players;
        this.limit = limit;
    }

    setLimit(limit) {
        this.limit = limit;
    }

    playerInLobby(player) {
        let inLobby = false;
        this.players.map((p) => {
            if (p.userID === player.userID) {
                inLobby = true;
            }
        });
        return inLobby;
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
        return `${this.name} (${this.players.length}/${this.limit})`;
    }
}
