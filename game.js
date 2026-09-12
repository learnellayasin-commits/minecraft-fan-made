import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Game state
const game = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    world: new Map(),
    player: {
        velocity: new THREE.Vector3(),
        onGround: false,
        selectedBlock: 'grass'
    },
    keys: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    ws: null,
    playerId: null,
    otherPlayers: new Map(),
    lastPositionUpdate: 0
};

// Block types with colors
const blockTypes = {
    grass: 0x7cb342,
    dirt: 0x8d6e63,
    stone: 0x757575,
    wood: 0x6d4c41,
    sand: 0xfdd835
};

// World settings
const BLOCK_SIZE = 1;
const WORLD_WIDTH = 32;
const WORLD_DEPTH = 32;
const WORLD_HEIGHT = 16;
const RENDER_DISTANCE = 32;

// Initialize the game
function init() {
    // Create scene
    game.scene = new THREE.Scene();
    game.scene.background = new THREE.Color(0x87ceeb);
    game.scene.fog = new THREE.Fog(0x87ceeb, 0, RENDER_DISTANCE * BLOCK_SIZE);

    // Create camera
    game.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    game.camera.position.set(WORLD_WIDTH / 2, WORLD_HEIGHT + 5, WORLD_DEPTH / 2);

    // Create renderer
    game.renderer = new THREE.WebGLRenderer({ antialias: true });
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.renderer.shadowMap.enabled = true;
    game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(game.renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    game.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    game.scene.add(directionalLight);

    // Setup controls
    game.controls = new PointerLockControls(game.camera, document.body);
    
    const instructions = document.getElementById('instructions');
    instructions.addEventListener('click', () => {
        game.controls.lock();
    });

    game.controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
    });

    game.controls.addEventListener('unlock', () => {
        instructions.style.display = 'block';
    });

    // Connect to server
    connectToServer();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    // Start animation loop
    animate();
}

// Generate simple terrain
function generateTerrain() {
    const blocks = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let z = 0; z < WORLD_DEPTH; z++) {
            // Simple height map using sine waves for hills
            const height = Math.floor(
                WORLD_HEIGHT / 2 + 
                Math.sin(x / 5) * 3 + 
                Math.cos(z / 5) * 3 +
                Math.sin(x / 10) * Math.cos(z / 10) * 2
            );

            // Add blocks from bottom to height
            for (let y = 0; y <= height; y++) {
                let blockType;
                if (y === height) {
                    blockType = 'grass';
                } else if (y >= height - 3) {
                    blockType = 'dirt';
                } else {
                    blockType = 'stone';
                }
                addBlock(x, y, z, blockType);
                blocks.push({ x, y, z, type: blockType });
            }

            // Add some random trees
            if (Math.random() > 0.98 && height > WORLD_HEIGHT / 2) {
                const treeHeight = 4;
                for (let y = 0; y < treeHeight; y++) {
                    addBlock(x, height + 1 + y, z, 'wood');
                    blocks.push({ x, y: height + 1 + y, z, type: 'wood' });
                }
                // Tree leaves
                for (let lx = -1; lx <= 1; lx++) {
                    for (let lz = -1; lz <= 1; lz++) {
                        for (let ly = 0; ly < 2; ly++) {
                            if (x + lx >= 0 && x + lx < WORLD_WIDTH && 
                                z + lz >= 0 && z + lz < WORLD_DEPTH) {
                                addBlock(x + lx, height + treeHeight + ly, z + lz, 'grass');
                                blocks.push({ x: x + lx, y: height + treeHeight + ly, z: z + lz, type: 'grass' });
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Send world to server
    if (game.ws && game.ws.readyState === WebSocket.OPEN) {
        game.ws.send(JSON.stringify({
            type: 'worldGenerated',
            blocks: blocks
        }));
    }
}

// Add a block to the world
function addBlock(x, y, z, type) {
    const key = `${x},${y},${z}`;
    
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const material = new THREE.MeshLambertMaterial({ color: blockTypes[type] });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { blockType: type };
    
    game.scene.add(mesh);
    game.world.set(key, mesh);
}

// Remove a block from the world
function removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const block = game.world.get(key);
    
    if (block) {
        game.scene.remove(block);
        game.world.delete(key);
        return true;
    }
    return false;
}

// Check if a block exists at position
function getBlock(x, y, z) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    return game.world.get(key);
}

// Handle keyboard input
function onKeyDown(event) {
    game.keys[event.code] = true;
    
    // Block selection (1-5 keys)
    if (event.code === 'Digit1') game.player.selectedBlock = 'grass';
    if (event.code === 'Digit2') game.player.selectedBlock = 'dirt';
    if (event.code === 'Digit3') game.player.selectedBlock = 'stone';
    if (event.code === 'Digit4') game.player.selectedBlock = 'wood';
    if (event.code === 'Digit5') game.player.selectedBlock = 'sand';
}

function onKeyUp(event) {
    game.keys[event.code] = false;
}

// Handle mouse clicks
function onMouseDown(event) {
    if (!game.controls.isLocked) return;

    game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
    const intersects = game.raycaster.intersectObjects(Array.from(game.world.values()));

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const blockPos = intersect.object.position.clone().divideScalar(BLOCK_SIZE);

        // Left click - remove block
        if (event.button === 0) {
            if (removeBlock(blockPos.x, blockPos.y, blockPos.z)) {
                // Send to server
                if (game.ws && game.ws.readyState === WebSocket.OPEN) {
                    game.ws.send(JSON.stringify({
                        type: 'blockRemoved',
                        x: blockPos.x,
                        y: blockPos.y,
                        z: blockPos.z
                    }));
                }
            }
        }
        // Right click - place block
        else if (event.button === 2) {
            const normal = intersect.face.normal;
            const newPos = blockPos.clone().add(normal);
            
            // Don't place block where player is standing
            const playerPos = game.camera.position.clone().divideScalar(BLOCK_SIZE).floor();
            if (!(newPos.x === playerPos.x && 
                  (newPos.y === playerPos.y || newPos.y === playerPos.y - 1) && 
                  newPos.z === playerPos.z)) {
                addBlock(newPos.x, newPos.y, newPos.z, game.player.selectedBlock);
                
                // Send to server
                if (game.ws && game.ws.readyState === WebSocket.OPEN) {
                    game.ws.send(JSON.stringify({
                        type: 'blockPlaced',
                        x: newPos.x,
                        y: newPos.y,
                        z: newPos.z,
                        blockType: game.player.selectedBlock
                    }));
                }
            }
        }
    }
}

// Update player movement
function updatePlayer(delta) {
    if (!game.controls.isLocked) return;

    const speed = 10;
    const jumpSpeed = 8;
    const gravity = 20;

    // Apply gravity
    game.player.velocity.y -= gravity * delta;

    // Movement
    const moveDirection = new THREE.Vector3();
    
    if (game.keys['KeyW']) moveDirection.z -= 1;
    if (game.keys['KeyS']) moveDirection.z += 1;
    if (game.keys['KeyA']) moveDirection.x -= 1;
    if (game.keys['KeyD']) moveDirection.x += 1;

    moveDirection.normalize();
    moveDirection.multiplyScalar(speed * delta);
    
    // Apply camera rotation to movement
    const forward = new THREE.Vector3();
    game.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    const movement = new THREE.Vector3();
    movement.addScaledVector(forward, -moveDirection.z);
    movement.addScaledVector(right, moveDirection.x);

    // Check collision before moving
    const newPos = game.camera.position.clone().add(movement);
    if (!checkCollision(newPos)) {
        game.camera.position.add(movement);
    }

    // Jump
    if (game.keys['Space'] && game.player.onGround) {
        game.player.velocity.y = jumpSpeed;
        game.player.onGround = false;
    }

    // Apply vertical velocity
    const verticalMovement = game.player.velocity.y * delta;
    const newVerticalPos = game.camera.position.clone();
    newVerticalPos.y += verticalMovement;

    // Check ground collision
    if (checkCollision(newVerticalPos)) {
        game.player.velocity.y = 0;
        game.player.onGround = true;
    } else {
        game.camera.position.y += verticalMovement;
    }

    // Keep player in bounds
    game.camera.position.x = Math.max(0, Math.min(WORLD_WIDTH * BLOCK_SIZE, game.camera.position.x));
    game.camera.position.z = Math.max(0, Math.min(WORLD_DEPTH * BLOCK_SIZE, game.camera.position.z));
    
    // Send position to server periodically
    const now = Date.now();
    if (now - game.lastPositionUpdate > 50) { // Update 20 times per second
        game.lastPositionUpdate = now;
        if (game.ws && game.ws.readyState === WebSocket.OPEN) {
            game.ws.send(JSON.stringify({
                type: 'position',
                position: {
                    x: game.camera.position.x,
                    y: game.camera.position.y,
                    z: game.camera.position.z
                },
                rotation: {
                    x: game.camera.rotation.x,
                    y: game.camera.rotation.y
                }
            }));
        }
    }
}

// Simple collision detection
function checkCollision(position) {
    const playerRadius = 0.3;
    const playerHeight = 1.8;
    
    // Check blocks around player
    for (let y = -playerHeight; y <= 0.2; y += 0.5) {
        for (let x = -playerRadius; x <= playerRadius; x += playerRadius) {
            for (let z = -playerRadius; z <= playerRadius; z += playerRadius) {
                const checkPos = position.clone().add(new THREE.Vector3(x, y, z));
                const block = getBlock(
                    checkPos.x / BLOCK_SIZE,
                    checkPos.y / BLOCK_SIZE,
                    checkPos.z / BLOCK_SIZE
                );
                if (block) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Handle window resize
function onWindowResize() {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    updatePlayer(delta);
    updateOtherPlayers();
    
    game.renderer.render(game.scene, game.camera);
}

// Connect to WebSocket server
function connectToServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    game.ws = new WebSocket(wsUrl);
    
    game.ws.onopen = () => {
        console.log('Connected to server');
    };
    
    game.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };
    
    game.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    game.ws.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(connectToServer, 3000); // Reconnect after 3 seconds
    };
}

// Handle messages from server
function handleServerMessage(message) {
    switch (message.type) {
        case 'init':
            game.playerId = message.playerId;
            
            // Load world from server
            if (message.world && message.world.length > 0) {
                message.world.forEach(block => {
                    addBlock(block.x, block.y, block.z, block.type);
                });
            } else {
                // Generate terrain if first player
                generateTerrain();
            }
            
            // Add other players
            message.players.forEach(player => {
                addOtherPlayer(player);
            });
            break;
            
        case 'playerJoined':
            addOtherPlayer(message.player);
            break;
            
        case 'playerLeft':
            removeOtherPlayer(message.playerId);
            break;
            
        case 'playerMoved':
            updateOtherPlayerPosition(message.playerId, message.position, message.rotation);
            break;
            
        case 'blockPlaced':
            if (message.playerId !== game.playerId) {
                addBlock(message.x, message.y, message.z, message.blockType);
            }
            break;
            
        case 'blockRemoved':
            if (message.playerId !== game.playerId) {
                removeBlock(message.x, message.y, message.z);
            }
            break;
    }
}

// Create a player model (simple cube representation)
function createPlayerModel() {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);
    
    // Name tag
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 32px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText('Player', canvas.width / 2, 42);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 2;
    group.add(sprite);
    
    return group;
}

// Add other player to scene
function addOtherPlayer(playerData) {
    if (game.otherPlayers.has(playerData.id)) return;
    
    const playerModel = createPlayerModel();
    playerModel.position.set(
        playerData.position.x,
        playerData.position.y - 1.6, // Adjust for player height
        playerData.position.z
    );
    
    game.scene.add(playerModel);
    game.otherPlayers.set(playerData.id, {
        model: playerModel,
        targetPosition: playerData.position,
        targetRotation: playerData.rotation,
        username: playerData.username
    });
}

// Remove other player from scene
function removeOtherPlayer(playerId) {
    const player = game.otherPlayers.get(playerId);
    if (player) {
        game.scene.remove(player.model);
        game.otherPlayers.delete(playerId);
    }
}

// Update other player position
function updateOtherPlayerPosition(playerId, position, rotation) {
    const player = game.otherPlayers.get(playerId);
    if (player) {
        player.targetPosition = position;
        player.targetRotation = rotation;
    }
}

// Smoothly update other players' positions
function updateOtherPlayers() {
    game.otherPlayers.forEach((player) => {
        // Smoothly interpolate position
        player.model.position.x += (player.targetPosition.x - player.model.position.x) * 0.3;
        player.model.position.y += (player.targetPosition.y - 1.6 - player.model.position.y) * 0.3;
        player.model.position.z += (player.targetPosition.z - player.model.position.z) * 0.3;
        
        // Update rotation
        if (player.targetRotation) {
            player.model.rotation.y = player.targetRotation.y;
        }
    });
}

// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Start the game
init();
