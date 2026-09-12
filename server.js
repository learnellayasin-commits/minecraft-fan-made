import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 32768, perMessageDeflate: false });

const PORT = process.env.PORT || 3000;

// Serve static files
for (const file of ['index.html', 'game.js']) app.get(file === 'index.html' ? '/' : `/${file}`, (req, res) => res.sendFile(join(__dirname, file)));

// Game state
const gameState = {
    players: new Map(),
    world: new Map(),
    worldGenerated: false
    ,animals: new Map(), animalHost: null, meat: new Map(), worldVersion: 0
};

function initializeWorld() {
    if (gameState.worldGenerated) return;
    for (let x = 0; x < 32; x++) for (let z = 0; z < 32; z++) {
        const height = Math.floor(8 + Math.sin(x / 5) * 3 + Math.cos(z / 5) * 3);
        for (let y = 0; y <= height; y++) gameState.world.set(`${x},${y},${z}`, { x, y, z, type: y === height ? 'grass' : y >= height - 3 ? 'dirt' : 'stone' });
    }
    gameState.worldGenerated = true;
    for (let i=0;i<12;i++) { const x=3+i*2, z=8+i%4; const y=Math.floor(8+Math.sin(x/5)*3+Math.cos(z/5)*3)+1; gameState.animals.set(`animal${i}`, {id:`animal${i}`,x,y,z,health:6}); }
}

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
    const encoded = JSON.stringify(message);
    gameState.players.forEach((player) => {
        if (player.id !== senderId && player.ws.readyState === 1) {
            if (player.ws.bufferedAmount > 262144) player.ws.terminate(); else player.ws.send(encoded);
        }
    });
}

// Broadcast to all players including sender
function broadcastAll(message) {
    const encoded = JSON.stringify(message);
    gameState.players.forEach((player) => {
        if (player.ws.readyState === 1) {
            if (player.ws.bufferedAmount > 262144) player.ws.terminate(); else player.ws.send(encoded);
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    if (gameState.players.size >= 8) { ws.close(1013, 'Room full'); return; }
    initializeWorld();
    const playerId = generateId();
    const player = new Player(playerId, ws);
    gameState.players.set(playerId, player);
    if (!gameState.animalHost) gameState.animalHost = playerId;
    let budget = 0, windowStart = Date.now();
    ws._socket.setTimeout(45000, () => ws.terminate());

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
            .map(p => p.toJSON()), animals: Array.from(gameState.animals.values()),
        animalHost: gameState.animalHost,
        meat: Array.from(gameState.meat.values())
    }));

    // Notify other players about new player
    broadcast(playerId, {
        type: 'playerJoined',
        player: player.toJSON()
    });

    // Handle messages from client
    ws.on('message', (data) => {
        if (Date.now() - windowStart > 1000) { budget = 0; windowStart = Date.now(); }
        if (++budget > 40) { ws.close(1008, 'Rate limit'); return; }
        try {
            const message = JSON.parse(data.toString());
            handleMessage(playerId, message);
        } catch (error) {
            ws.close(1008, 'Invalid message');
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected. Total players: ${gameState.players.size - 1}`);
        gameState.players.delete(playerId);
        if (gameState.animalHost === playerId) { gameState.animalHost = gameState.players.keys().next().value || null; broadcastAll({ type: 'animalHost', playerId: gameState.animalHost, animals: Array.from(gameState.animals.values()) }); }
        
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
    if (!message || typeof message !== 'object') return;
    if (message.type === 'blockPlaced' || message.type === 'blockRemoved') {
        if (![message.x,message.y,message.z].every(Number.isInteger) || message.x<0 || message.x>=32 || message.z<0 || message.z>=32 || message.y<0 || message.y>48) return;
        if (Math.hypot(message.x-player.position.x,message.y-player.position.y,message.z-player.position.z)>7) return;
        if (message.type==='blockPlaced' && !['grass','dirt','stone','wood','sand'].includes(message.blockType)) return;
    }

    switch (message.type) {
        case 'position':
            if (!message.position || [message.position.x, message.position.y, message.position.z].some(v => !Number.isFinite(v) || Math.abs(v) > 1000)) return;
            if (!message.rotation || ![message.rotation.x,message.rotation.y].every(Number.isFinite)) return;
            player.position = {x:message.position.x,y:message.position.y,z:message.position.z}; player.rotation = {x:message.rotation.x,y:message.rotation.y};
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
            break;

        case 'animalHost':
            if (!gameState.animalHost) { gameState.animalHost = playerId; broadcastAll({ type: 'animalHost', playerId }); }
            break;
        case 'animalState':
            if (playerId !== gameState.animalHost || !Array.isArray(message.animals) || message.animals.length > 64) return;
            message.animals.forEach(a => { const old=gameState.animals.get(a.id); if (old && [a.x,a.y,a.z].every(Number.isFinite) && a.x>=0 && a.x<32 && a.z>=0 && a.z<32 && a.y>=0 && a.y<64) Object.assign(old,{x:a.x,y:a.y,z:a.z}); });
            broadcast(playerId, { type: 'animalState', animals: Array.from(gameState.animals.values()) });
            break;
        case 'animalHit':
            const animal = gameState.animals.get(message.id);
            if (!animal || Math.hypot(animal.x-player.position.x,animal.y-player.position.y,animal.z-player.position.z)>5 || Date.now()-(player.lastHit||0)<400) return;
            player.lastHit=Date.now(); animal.health = Math.max(0, animal.health - 2);
            if (!animal.health) { gameState.animals.delete(message.id); const drop = { id: generateId(), x: animal.x, y: animal.y + .5, z: animal.z }; gameState.meat.set(drop.id, drop); broadcastAll({ type: 'meatDropped', meat: drop }); }
            broadcastAll({ type: 'animalState', animals: Array.from(gameState.animals.values()) });
            break;
        case 'meatPickup':
            if (!gameState.meat.has(message.id)) return;
            const meat=gameState.meat.get(message.id);
            if(Math.hypot(meat.x-player.position.x,meat.y-player.position.y,meat.z-player.position.z)>3) return;
            gameState.meat.delete(message.id); broadcastAll({ type: 'meatPicked', id: message.id, playerId });
            break;
        case 'playerHit': {
            const target=gameState.players.get(message.id);
            if(!target || target===player || Date.now()-(player.lastHit||0)<400 || Math.hypot(target.position.x-player.position.x,target.position.y-player.position.y,target.position.z-player.position.z)>5) return;
            player.lastHit=Date.now(); target.ws.send(JSON.stringify({type:'damage',amount:2})); break;
        }

        case 'chat':
            broadcastAll({
                type: 'chat',
                playerId: playerId,
                username: player.username,
                message: String(message.text || '').slice(0,200)
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
