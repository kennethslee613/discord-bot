let Discord = require('discord.io');
let auth = require('./auth.json');
let fs = require('fs');
let Group = require('./Group');
let Player = require('./Player');

function readFile() {
    let groups;
    return new Promise((resolve, reject) => {
        fs.readFile('groups.json', 'utf8', (err, jsonContent) => {
            if (err) {
                console.log('File read failed:', err);
                groups = { 'lobbies': {}, 'games': {} };
            } else {
                try {
                    groups = JSON.parse(jsonContent);
                    Object.entries(groups).map(([type, typeValues]) => {
                        Object.entries(typeValues).map(([key, value]) => {
                            let players = value.players.map((player) => {
                                return new Player(player.user, player.userID);
                            });
                            typeValues[key] = new Group(value.name, players, value.limit, value.type);
                        });
                    });
                    console.log('Parse successful. Group object:');
                    console.log(groups);
                } catch (err) {
                    console.log('JSON parse failed:', err);
                    groups = { 'lobbies': {}, 'games': {} };
                }
            }
            resolve(groups);
        });
    });
}

async function main() {
    let groups = await readFile();
    let lobbies = groups.lobbies;
    let games = groups.games;

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

    bot.on('ready', (event) => {
        console.log('Connected');
        console.log(`Logged in as: ${bot.username} (${bot.id})`);
    });

    bot.on('message', (user, userID, channelID, message, event) => {
        if (message.substring(0, 2) == '==') {
            let args = message.substring(2).split(' ');
            let cmd = args[0];
            let arg = args.slice(1).join(' ');
            let player = new Player(user, userID);

            switch(cmd) {
                case 'help':
                    sendMessage(channelID, '__Commands__:\n'
                        + '**==create <name>**: Creates a new lobby.\n'
                        + '**==delete <name>**: Deletes an existing lobby.\n'
                        + '**==join <name>**: Join the lobby.\n'
                        + '**==leave <name>**: Leave the lobby.\n'
                        + '**==limit <name> <limit>**: Sets the limit for lobby.\n'
                        + '**==list**: Lists all available lobbies.\n'
                        + '**==players <name>**: Lists the players that are in the lobby.'
                    );
                    break;
                case 'create':
                    if (arg.length >= 1) {
                        if (!lobbies[arg]) {
                            let newGroup = new Group(arg, [player]);
                            lobbies[arg] = newGroup;
                            sendMessage(channelID, `**${arg}** has been created.\nSet the lobby limit with **==limit <name> <limit>**`);
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
                            if (lobbies[arg].isPlayerInGroup(player)) {
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
                            if (lobbies[arg].isPlayerInGroup(player)) {
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
            groups = { 'lobbies': lobbies, 'games': games };
            fs.writeFile('groups.json', JSON.stringify(groups), (error) => {
                if (error) {
                    console.log(error);
                }
            });
        }
    });

    bot.on('disconnect', (err) => {
        console.log('Disconnected:', err);
        console.log('Reconnecting...');
        bot.connect();
    });
}

main();