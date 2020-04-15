let Discord = require('discord.io');
let auth = require('./auth.json');

let lobbies = {};

let bot = new Discord.Client({
    autorun: true,
    token: auth.token
});
let sendMessage = (channelID, message) => {
    bot.sendMessage({
        to: channelID,
        message: message
    });
}

class Player {
    constructor(user, userID) {
        this.user = user;
        this.userID = userID;
    }
}

class Lobby {
    constructor(name, player) {
        this.name = name;
        this.players = [player];
        this.limit = 1;
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

bot.on('ready', (event) => {
    console.log('Connected');
    console.log(`Logged in as: ${bot.username} (${bot.id})`);
});

bot.on('message', (user, userID, channelID, message, event) => {
    if (message.substring(0, 2) == '--') {
        let args = message.substring(2).split(' ');
        let cmd = args[0];
        let arg = args.slice(1).join(' ');
        let player = new Player(user, userID);

        switch(cmd) {
            case 'help':
                sendMessage(channelID, '__Commands__:\n'
                    + '**--create <name>**: Creates a new lobby.\n'
                    + '**--delete <name>**: Deletes an existing lobby.\n'
                    + '**--join <name>**: Join the lobby.\n'
                    + '**--leave <name>**: Leave the lobby.\n'
                    + '**--limit <name> <limit>**: Sets the limit for lobby.\n'
                    + '**--list**: Lists all available lobbies.\n'
                    + '**--players <name>**: Lists the players that are in the lobby.'
                );
                break;
            case 'create':
                if (arg.length >= 1) {
                    if (!lobbies[arg]) {
                        let newLobby = new Lobby(arg, player);
                        lobbies[arg] = newLobby;
                        sendMessage(channelID, `**${arg}** has been created.\nSet the lobby limit with **--limit <name> <limit>**`);
                    } else {
                        sendMessage(channelID, 'A lobby with this name already exists.');
                    }
                } else {
                    sendMessage(channelID, 'Please enter a lobby name.');
                }
                break;
            case 'limit':
                let argSplit = arg.split(' ');
                let lobbyName;
                let limit;
                if (argSplit.length === 1) {
                    lobbyName = argSplit[argSplit.length - 1];
                    limit = NaN;
                } else {
                    lobbyName = argSplit.slice(0, argSplit.length - 1).join(' ');
                    limit = parseInt(argSplit[argSplit.length - 1]);
                }

                if (lobbies[lobbyName]) {
                    if (!isNaN(limit)) {
                        if (limit > 0) {
                            if (limit >= lobbies[lobbyName].players.length) {
                                lobbies[lobbyName].setLimit(limit, channelID);
                                sendMessage(channelID, `The limit for **${lobbyName}** is now ${limit}`);
                            } else {
                                sendMessage(channelID, `There are too many players in the lobby (${lobbies[lobbyName].players.length} players).`);
                            }
                        } else {
                            sendMessage(channelID, 'Please set the limit to a number greater than 0.');
                        }
                    } else {
                        sendMessage(channelID, 'Please set the limit as an integer.');
                    }
                } else {
                    sendMessage(channelID, 'The lobby does not exist.');
                }
                break;
            case 'list':
                let list = '__Lobbies__:';
                if (Object.values(lobbies).length > 0) {
                    Object.values(lobbies).map((lobby) => {
                        list += '\n' + lobby.toString();
                    });
                } else {
                    list += '\nNo lobbies'
                }
                sendMessage(channelID, list);
                break;
            case 'delete':
                if (arg.length >= 1) {
                    if (lobbies[arg]) {
                        delete lobbies[arg];
                        sendMessage(channelID, `**${arg}** has been deleted.`);
                    } else {
                        sendMessage(channelID, 'The lobby does not exist.');
                    }
                } else {
                    sendMessage(channelID, 'Please enter a lobby name.');
                }
                break;
            case 'players':
                if (arg.length >= 1) {
                    if (lobbies[arg]) {
                        let list = `__Players in **${arg}**__:`
                        if (lobbies[arg].players.length > 0) {
                            lobbies[arg].players.map((player) => {
                                list += '\n' + player.user;
                            });
                        } else {
                            list += '\nNo players';
                        }
                        sendMessage(channelID, list);
                    } else {
                        sendMessage(channelID, 'The lobby does not exist.');
                    }
                } else {
                    sendMessage(channelID, 'Please enter a lobby name.');
                }
                break;
            case 'join':
                if (arg.length >= 1) {
                    if (lobbies[arg]) {
                        if (lobbies[arg].playerInLobby(player)) {
                            sendMessage(channelID, `You are already in **${arg}**.`);
                        } else if (lobbies[arg].isFull()) {
                            sendMessage(channelID, `**${arg}** is full.`);
                        } else {
                            lobbies[arg].addPlayer(player);
                            sendMessage(channelID, `You have been added to **${arg}**.`);
                        }
                    } else {
                        sendMessage(channelID, 'The lobby does not exist.');
                    }
                } else {
                    sendMessage(channelID, 'Please enter a lobby name.');
                }
                break;
            case 'leave':
                if (arg.length >= 1) {
                    if (lobbies[arg]) {
                        if (lobbies[arg].playerInLobby(player)) {
                            lobbies[arg].removePlayer(player);
                            sendMessage(channelID, `You have left **${arg}**.`);
                        } else {
                            sendMessage(channelID, `You are not in **${arg}**.`);
                        }
                    } else {
                        sendMessage(channelID, 'The lobby does not exist.');
                    }
                } else {
                    sendMessage(channelID, 'Please enter a lobby name.');
                }
                break;
            case 'ping':
                if (arg.length >= 1) {
                    if (lobbies[arg]) {
                        let ping = 'Pinging...';
                        if (lobbies[arg].players.length > 0) {
                            lobbies[arg].players.map((player) => {
                                ping += `\n<@${player.userID}>`;
                            });
                        } else {
                            ping += '\nThere are no players to ping.';
                        }
                        sendMessage(channelID, ping);
                    } else {
                        sendMessage(channelID, 'The lobby does not exist.');
                    }
                } else {
                    sendMessage(channelID, 'Please enter a lobby name.');
                }
                break;
        }
    }
});