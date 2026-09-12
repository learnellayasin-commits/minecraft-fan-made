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
    ,health: 20, hunger: 20, meat: 0, animals: new Map(), animalHost: null
};

// Block types with colors
const blockTypes = {
    grass: 0x7cb342,
    dirt: 0x8d6e63,
    stone: 0x757575,
    wood: 0x6d4c41,
    sand: 0xfdd835
};
const meatDrops = new Map();
const meatGeometry = new THREE.BoxGeometry(.35,.35,.35);
const meatMaterial = new THREE.MeshLambertMaterial({color: 0xb33a2c});
function updateHud() {
    const icon=(pattern,color,full)=>`<svg viewBox="0 0 8 8" width="22" height="22" shape-rendering="crispEdges">${pattern.flatMap((row,y)=>[...row].map((v,x)=>v==='1'?`<rect x="${x}" y="${y}" width="1" height="1" fill="${full?color:'#443c39'}"/>`:'')).join('')}</svg>`;
    const heart=['0110110','1111111','1111111','0111110','0011100','0001000'];
    const leg=['00111000','01111100','01111100','00111000','00001100','00000110','00000111','00000010'];
    const html=`<div aria-label="Health ${Math.ceil(game.health)}">${Array.from({length:10},(_,i)=>icon(heart,'#f03545',game.health>i*2)).join('')}</div><div aria-label="Hunger ${Math.ceil(game.hunger)}">${Array.from({length:10},(_,i)=>icon(leg,'#db984e',game.hunger>i*2)).join('')}</div><div class="inventory">${Object.keys(blockTypes).map((t,i)=>`<span class="slot ${game.player.selectedBlock===t?'selected':''}">${i+1} ${t}</span>`).join('')}<span class="slot">Meat: ${game.meat}<br>E: eat</span></div>`;
    const el=document.getElementById('survival');if(el.innerHTML!==html)el.innerHTML=html;
}
const sharedGeometry=new THREE.BoxGeometry(1,1,1);
const sharedMaterials=Object.fromEntries(Object.entries(blockTypes).map(([t,color])=>[t,new THREE.MeshLambertMaterial({color})]));
const animalMaterial=new THREE.MeshLambertMaterial({color:0xbe9872});
let ready=false, animalClock=0, pickupClock=0, peak=0, lastHit=0;
function send(m){if(ready&&game.ws.readyState===WebSocket.OPEN)game.ws.send(JSON.stringify(m));}
function surface(x,z){for(let y=48;y>=0;y--)if(game.world.has(`${Math.round(x)},${y},${Math.round(z)}`))return y+.5;return -.5;}
function respawn(){game.camera.position.set(16,surface(16,16)+1.82,16);game.player.velocity.set(0,0,0);game.player.onGround=false;peak=game.camera.position.y;game.health=20;game.hunger=20;game.meat=0;}
function damage(amount){game.health=Math.max(0,game.health-amount);if(game.health<=0){respawn();document.getElementById('notice').textContent='You died. Respawned; meat lost.';}}
function syncAnimals(list){
    const ids=new Set(list.map(a=>a.id));for(const [id,a]of game.animals)if(!ids.has(id)){game.scene.remove(a.model);game.animals.delete(id);}
    for(const data of list){let a=game.animals.get(data.id);if(!a){const model=new THREE.Group();
        for(const [x,y,z,sx,sy,sz]of [[0,.55,0,.8,.6,1.1],[0,.85,.65,.5,.5,.5],[-.27,.15,-.4,.18,.4,.18],[.27,.15,-.4,.18,.4,.18],[-.27,.15,.4,.18,.4,.18],[.27,.15,.4,.18,.4,.18]]){const m=new THREE.Mesh(sharedGeometry,animalMaterial);m.position.set(x,y,z);m.scale.set(sx,sy,sz);model.add(m);}
        model.userData.animal=data.id;game.scene.add(model);a={model,angle:Math.random()*6,turn:0};game.animals.set(data.id,a);model.position.set(data.x,data.y,data.z);
    }Object.assign(a,data);}
}
function survival(delta){
    if(!ready)return;
    game.hunger=Math.max(0,game.hunger-delta/15);if(game.hunger===0)damage(delta/2);
    animalClock+=delta;pickupClock+=delta;
    for(const a of game.animals.values()){
        if(game.animalHost===game.playerId){a.turn-=delta;if(a.turn<=0){a.angle+=(Math.random()-.5)*2;a.turn=3;}
            const x=a.x+Math.sin(a.angle)*delta*.6,z=a.z+Math.cos(a.angle)*delta*.6;
            if(x<1||x>30||z<1||z>30||Math.abs(surface(x,z)-a.y)>1.1)a.angle+=Math.PI;else{a.x=x;a.z=z;}
            a.y=THREE.MathUtils.lerp(a.y,surface(a.x,a.z),Math.min(1,delta*10));
        }
        const target=new THREE.Vector3(a.x,a.y,a.z),d=target.clone().sub(a.model.position);if(d.lengthSq()>.00001)a.model.rotation.y=Math.atan2(d.x,d.z);a.model.position.lerp(target,Math.min(1,delta*12));
    }
    if(animalClock>=.2){animalClock=0;if(game.animalHost===game.playerId)send({type:'animalState',animals:Array.from(game.animals.values(),a=>({id:a.id,x:a.x,y:a.y,z:a.z}))});}
    for(const [id,m]of meatDrops){m.position.y=m.userData.base+Math.sin(performance.now()/400)*.12;m.rotation.y+=delta;if(pickupClock>=.5&&m.position.distanceTo(game.camera.position)<2.5){document.getElementById('notice').textContent='Meat';send({type:'meatPickup',id});break;}}
    if(pickupClock>=.5)pickupClock=0;
    document.getElementById('status').textContent=`Connected: ${game.otherPlayers.size+1}/8 | ${game.animalHost===game.playerId?'Animal host':'Animal guest'}`;
}
function cull(x,y,z){for(const [dx,dy,dz]of [[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const a=x+dx,b=y+dy,c=z+dz,m=game.world.get(`${a},${b},${c}`);if(m)m.visible=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(([i,j,k])=>!game.world.has(`${a+i},${b+j},${c+k}`));}}

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
    game.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    game.renderer.shadowMap.enabled = false;
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
        if(ready)game.controls.lock();
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
    
    if(game.world.has(key))game.scene.remove(game.world.get(key));
    const geometry = sharedGeometry;
    const material = sharedMaterials[type];
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { blockType: type };
    
    game.scene.add(mesh);
    game.world.set(key, mesh);
    cull(x,y,z);
}

// Remove a block from the world
function removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const block = game.world.get(key);
    
    if (block) {
        game.scene.remove(block);
        game.world.delete(key);
        cull(x,y,z);
        return true;
    }
    return false;
}

// Check if a block exists at position
function getBlock(x, y, z) {
    const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
    return game.world.get(key);
}

// Handle keyboard input
function onKeyDown(event) {
    game.keys[event.code] = true;
    if (event.code === 'KeyE' && !event.repeat && ready && game.controls.isLocked && game.meat > 0 && game.hunger < 20) { game.meat--; game.hunger=Math.min(20,game.hunger+6); updateHud(); }
    
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
    if (!game.controls.isLocked || !ready || performance.now()-lastHit<450) return;
    lastHit=performance.now();

    game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
    game.raycaster.far=5;
    const intersects = game.raycaster.intersectObjects([...Array.from(game.world.values()).filter(m=>m.visible),...Array.from(game.animals.values(),a=>a.model),...Array.from(game.otherPlayers.values(),p=>p.model)],true);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        let root=intersect.object;while(root.parent!==game.scene)root=root.parent;
        if(root.userData.animal){if(event.button===0)send({type:'animalHit',id:root.userData.animal});return;}
        if(root.userData.player){if(event.button===0)send({type:'playerHit',id:root.userData.player});return;}
        const blockPos = intersect.object.position.clone().divideScalar(BLOCK_SIZE);

        // Left click - remove block
        if (event.button === 0) {
            if (game.world.has(`${blockPos.x},${blockPos.y},${blockPos.z}`)) {
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
                // Apply only the server acknowledgement, so rejected edits cannot diverge.
                
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
    if (!ready) return;

    const speed = 10;
    const jumpSpeed = 8;
    const gravity = 20;

    // Apply gravity
    game.player.velocity.y -= gravity * delta;

    // Movement
    const moveDirection = new THREE.Vector3();
    
    if (game.controls.isLocked && game.keys['KeyW']) moveDirection.z -= 1;
    if (game.controls.isLocked && game.keys['KeyS']) moveDirection.z += 1;
    if (game.controls.isLocked && game.keys['KeyA']) moveDirection.x -= 1;
    if (game.controls.isLocked && game.keys['KeyD']) moveDirection.x += 1;

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
    if (game.controls.isLocked && game.keys['Space'] && game.player.onGround) {
        game.player.velocity.y = jumpSpeed;
        game.player.onGround = false;
    }

    // Apply vertical velocity
    const verticalMovement = game.player.velocity.y * delta;
    peak=Math.max(peak,game.camera.position.y);
    const newVerticalPos = game.camera.position.clone();
    newVerticalPos.y += verticalMovement;

    // Check ground collision
    if (checkCollision(newVerticalPos)) {
        if(game.player.velocity.y<0){if(!game.player.onGround)damage(Math.max(0,Math.floor(peak-game.camera.position.y-3)));game.player.onGround=true;peak=game.camera.position.y;}
        game.player.velocity.y = 0;
    } else {
        game.player.onGround=false;
        game.camera.position.y += verticalMovement;
    }
    if(game.camera.position.y<-20)damage(20);

    // Keep player in bounds
    game.camera.position.x = Math.max(0, Math.min(WORLD_WIDTH * BLOCK_SIZE, game.camera.position.x));
    game.camera.position.z = Math.max(0, Math.min(WORLD_DEPTH * BLOCK_SIZE, game.camera.position.z));
    
    // Send position to server periodically
    const now = Date.now();
    if (now - game.lastPositionUpdate > 100) {
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
    
    const delta = Math.min(clock.getDelta(),.1);
    for(let remaining=delta;remaining>0;remaining-=1/120)updatePlayer(Math.min(remaining,1/120));
    updateOtherPlayers();
    survival(delta);updateHud();
    
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
        ready=false;game.animalHost=null;game.keys={};game.controls.unlock();document.getElementById('status').textContent='Disconnected. Reconnecting...';
        console.log('Disconnected from server');
        setTimeout(connectToServer, 3000); // Reconnect after 3 seconds
    };
}

// Handle messages from server
function handleServerMessage(message) {
    switch (message.type) {
        case 'init':
            for(const m of game.world.values())game.scene.remove(m);game.world.clear();
            for(const id of Array.from(game.otherPlayers.keys()))removeOtherPlayer(id);
            for(const m of meatDrops.values())game.scene.remove(m);meatDrops.clear();
            syncAnimals([]);
            game.playerId = message.playerId;
            game.animalHost = message.animalHost;
            (message.meat || []).forEach(addMeat);
            
            // Load world from server
            if (message.world) {
                message.world.forEach(block => {
                    addBlock(block.x, block.y, block.z, block.type);
                });
            }
            syncAnimals(message.animals);ready=true;respawn();
            
            // Add other players
            message.players.forEach(player => {
                addOtherPlayer(player);
            });
            break;
        case 'animalHost':game.animalHost=message.playerId;syncAnimals(message.animals);break;
        case 'animalState':syncAnimals(message.animals);break;
        case 'damage':damage(message.amount);break;
        case 'meatDropped': addMeat(message.meat); break;
        case 'meatPicked': { const m=meatDrops.get(message.id); if(m){game.scene.remove(m);meatDrops.delete(message.id);} if(message.playerId===game.playerId){game.meat++;updateHud();} break; }
            
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
            {
                addBlock(message.x, message.y, message.z, message.blockType);
            }
            break;
            
        case 'blockRemoved':
            {
                removeBlock(message.x, message.y, message.z);
            }
            break;
    }
}
function addMeat(data) { if(meatDrops.has(data.id)) return; const m=new THREE.Mesh(meatGeometry,meatMaterial);m.userData.base=data.y; m.position.set(data.x,data.y,data.z); game.scene.add(m); meatDrops.set(data.id,m); }

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
    playerModel.userData.player=playerData.id;
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
        player.model.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material){if(m.material.map)m.material.map.dispose();m.material.dispose();}});
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
window.addEventListener('blur',()=>game.keys={});

// Start the game
init();
