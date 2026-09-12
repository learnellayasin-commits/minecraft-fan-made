import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Game state
const gameState = {
    players: new Map(),
    world: new Map(),
    worldGenerated: false
};

// Player class
class Player {
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        this.position = { x: 16, y: 20, z: 16 };
        this.rotation = { x: 0, y: 0 };
        this.username = `Player${id.slice(0, 4)}`;
    }

    toJSON() {
        return {
            id: this.id,
            position: this.position,
            rotation: this.rotation,
            username: this.username
        };
    }
}

// Broadcast to all players except sender
function broadcast(senderId, message) {
    gameState.players.forEach((player) => {
        if (player.id !== senderId && player.ws.readyState === 1) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

// Broadcast to all players including sender
function broadcastAll(message) {
    gameState.players.forEach((player) => {
        if (player.ws.readyState === 1) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    const playerId = generateId();
    const player = new Player(playerId, ws);
    gameState.players.set(playerId, player);

    console.log(`Player ${playerId} connected. Total players: ${gameState.players.size}`);

    // Send initial state to new player
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        world: Array.from(gameState.world.entries()).map(([key, block]) => ({
            key,
            ...block
        })),
        players: Array.from(gameState.players.values())
            .filter(p => p.id !== playerId)
            .map(p => p.toJSON())
    }));

    // Notify other players about new player
    broadcast(playerId, {
        type: 'playerJoined',
        player: player.toJSON()
    });

    // Handle messages from client
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleMessage(playerId, message);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected. Total players: ${gameState.players.size - 1}`);
        gameState.players.delete(playerId);
        
        // Notify other players
        broadcastAll({
            type: 'playerLeft',
            playerId: playerId
        });
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle different message types
function handleMessage(playerId, message) {
    const player = gameState.players.get(playerId);
    if (!player) return;

    switch (message.type) {
        case 'position':
            player.position = message.position;
            player.rotation = message.rotation;
            broadcast(playerId, {
                type: 'playerMoved',
                playerId: playerId,
                position: message.position,
                rotation: message.rotation
            });
            break;

        case 'blockPlaced':
            const blockKey = `${message.x},${message.y},${message.z}`;
            gameState.world.set(blockKey, {
                x: message.x,
                y: message.y,
                z: message.z,
                type: message.blockType
            });
            broadcastAll({
                type: 'blockPlaced',
                x: message.x,
                y: message.y,
                z: message.z,
                blockType: message.blockType,
                playerId: playerId
            });
            break;

        case 'blockRemoved':
            const removeKey = `${message.x},${message.y},${message.z}`;
            gameState.world.delete(removeKey);
            broadcastAll({
                type: 'blockRemoved',
                x: message.x,
                y: message.y,
                z: message.z,
                playerId: playerId
            });
            break;

        case 'worldGenerated':
            if (!gameState.worldGenerated) {
                message.blocks.forEach(block => {
                    const key = `${block.x},${block.y},${block.z}`;
                    gameState.world.set(key, block);
                });
                gameState.worldGenerated = true;
            }
            break;

        case 'chat':
            broadcastAll({
                type: 'chat',
                playerId: playerId,
                username: player.username,
                message: message.text
            });
            break;
    }
}

// Generate unique ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
