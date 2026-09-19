import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ==========================================
// 1. PROCEDURAL 16x16 MINECRAFT PIXEL TEXTURES
// ==========================================
function createNoiseCanvas(w, h, genFn) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const [r, g, b, a = 255] = genFn(x, y);
            const idx = (y * w + x) * 4;
            imgData.data[idx] = r;
            imgData.data[idx + 1] = g;
            imgData.data[idx + 2] = b;
            imgData.data[idx + 3] = a;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return { texture, canvas };
}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

// Block Texture Generators
const textures = {
    // Dirt
    dirt: createNoiseCanvas(16, 16, () => {
        const v = rand(0.8, 1.2);
        const dark = Math.random() < 0.15 ? 0.7 : 1.0;
        return [Math.floor(134 * v * dark), Math.floor(96 * v * dark), Math.floor(67 * v * dark)];
    }).texture,

    // Grass Top
    grassTop: createNoiseCanvas(16, 16, () => {
        const v = rand(0.85, 1.15);
        return [Math.floor(88 * v), Math.floor(166 * v), Math.floor(54 * v)];
    }).texture,

    // Grass Side (dirt bottom with grass hanging)
    grassSide: createNoiseCanvas(16, 16, (x, y) => {
        const grassH = 3 + Math.floor(Math.sin(x * 1.5) * 1.5 + (x % 3 === 0 ? 1 : 0));
        if (y < grassH) {
            const v = rand(0.85, 1.15);
            return [Math.floor(88 * v), Math.floor(166 * v), Math.floor(54 * v)];
        }
        const v = rand(0.8, 1.2);
        const dark = Math.random() < 0.15 ? 0.7 : 1.0;
        return [Math.floor(134 * v * dark), Math.floor(96 * v * dark), Math.floor(67 * v * dark)];
    }).texture,

    // Stone
    stone: createNoiseCanvas(16, 16, () => {
        const v = rand(0.8, 1.2);
        const dark = Math.random() < 0.1 ? 0.75 : 1.0;
        const g = Math.floor(125 * v * dark);
        return [g, g, g];
    }).texture,

    // Wood Log Side
    woodSide: createNoiseCanvas(16, 16, (x, y) => {
        const bark = (x % 4 === 0) ? 0.7 : rand(0.85, 1.15);
        return [Math.floor(103 * bark), Math.floor(82 * bark), Math.floor(49 * bark)];
    }).texture,

    // Wood Log Top (Rings)
    woodTop: createNoiseCanvas(16, 16, (x, y) => {
        const dist = Math.hypot(x - 7.5, y - 7.5);
        const ring = Math.floor(dist) % 2 === 0 ? 0.9 : 1.1;
        if (dist > 6.5) return [70, 50, 30]; // Bark border
        return [Math.floor(168 * ring), Math.floor(130 * ring), Math.floor(88 * ring)];
    }).texture,

    // Sand
    sand: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        const speck = Math.random() < 0.08 ? 0.85 : 1.0;
        return [Math.floor(220 * v * speck), Math.floor(214 * v * speck), Math.floor(149 * v * speck)];
    }).texture,

    // Oak Leaves
    leaves: createNoiseCanvas(16, 16, () => {
        const transparent = Math.random() < 0.15;
        if (transparent) return [0, 0, 0, 0];
        const v = rand(0.7, 1.3);
        return [Math.floor(40 * v), Math.floor(115 * v), Math.floor(25 * v), 255];
    }).texture,

    // Steve Skin Parts
    steveFace: createNoiseCanvas(16, 16, (x, y) => {
        // Eyes
        if (y === 8 && (x === 4 || x === 11)) return [255, 255, 255]; // White of eye
        if (y === 8 && (x === 5 || x === 10)) return [40, 50, 160]; // Blue iris
        // Hair & Beard
        if (y < 4 || (y === 4 && (x < 2 || x > 13))) return [70, 45, 25];
        if (y >= 10 && y <= 11 && x >= 5 && x <= 10) return [100, 60, 40]; // Beard/mouth
        // Skin
        const v = rand(0.95, 1.05);
        return [Math.floor(190 * v), Math.floor(138 * v), Math.floor(110 * v)];
    }).texture,

    steveShirt: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [Math.floor(0 * v), Math.floor(160 * v), Math.floor(175 * v)]; // Cyan/Teal
    }).texture,

    stevePants: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [Math.floor(40 * v), Math.floor(45 * v), Math.floor(125 * v)]; // Blue Jeans
    }).texture,

    // Pig Pink Texture
    pigSkin: createNoiseCanvas(16, 16, () => {
        const v = rand(0.92, 1.08);
        return [Math.floor(240 * v), Math.floor(165 * v), Math.floor(170 * v)];
    }).texture,

    pigSnout: createNoiseCanvas(16, 16, (x, y) => {
        if (y >= 6 && y <= 9 && (x === 4 || x === 11)) return [80, 20, 20]; // Nostrils
        const v = rand(0.9, 1.1);
        return [Math.floor(220 * v), Math.floor(130 * v), Math.floor(145 * v)];
    }).texture,

    // Raw Meat Texture
    meatItem: createNoiseCanvas(16, 16, (x, y) => {
        const dist = Math.hypot(x - 7.5, y - 7.5);
        if (dist > 6) return [0, 0, 0, 0];
        if (x < 6 && y > 9) return [230, 230, 230, 255]; // Bone
        const v = rand(0.85, 1.15);
        return [Math.floor(180 * v), Math.floor(50 * v), Math.floor(50 * v), 255];
    }).texture
};

// Multi-materials for Minecraft blocks
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);

const blockMaterials = {
    grass: [
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
        new THREE.MeshLambertMaterial({ map: textures.grassTop }),  // top
        new THREE.MeshLambertMaterial({ map: textures.dirt }),      // bottom
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
        new THREE.MeshLambertMaterial({ map: textures.grassSide })  // back
    ],
    dirt: new THREE.MeshLambertMaterial({ map: textures.dirt }),
    stone: new THREE.MeshLambertMaterial({ map: textures.stone }),
    wood: [
        new THREE.MeshLambertMaterial({ map: textures.woodSide }), // right
        new THREE.MeshLambertMaterial({ map: textures.woodSide }), // left
        new THREE.MeshLambertMaterial({ map: textures.woodTop }),  // top
        new THREE.MeshLambertMaterial({ map: textures.woodTop }),  // bottom
        new THREE.MeshLambertMaterial({ map: textures.woodSide }), // front
        new THREE.MeshLambertMaterial({ map: textures.woodSide })  // back
    ],
    sand: new THREE.MeshLambertMaterial({ map: textures.sand })
};

// ==========================================
// 2. GAME STATE & CONSTANTS
// ==========================================
const BLOCK_SIZE = 1;
const WORLD_WIDTH = 32;
const WORLD_DEPTH = 32;
const WORLD_HEIGHT = 16;
const RENDER_DISTANCE = 48;

const blockNames = ['grass', 'dirt', 'stone', 'wood', 'sand'];

const game = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    world: new Map(),
    player: {
        velocity: new THREE.Vector3(),
        onGround: false,
        selectedBlock: 'grass',
        handGroup: null,
        armMesh: null,
        swingProgress: 0,
        isSwinging: false
    },
    keys: {},
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    ws: null,
    playerId: null,
    otherPlayers: new Map(),
    lastPositionUpdate: 0,
    health: 20,
    hunger: 20,
    meat: 0,
    animals: new Map(),
    animalHost: null,
    selectionBox: null,
    clouds: null,
    sun: null,
    moon: null
};

const meatDrops = new Map();
const meatGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const meatMaterial = new THREE.MeshLambertMaterial({ map: textures.meatItem, transparent: true });

let ready = false;
let animalClock = 0;
let pickupClock = 0;
let peak = 0;
let lastHit = 0;
let timeOfDay = 0; // Sun/Moon rotation

// ==========================================
// 3. MINECRAFT HUD & UI (SVG PIXEL ICONS)
// ==========================================
function getHeartSvg(filled, half) {
    if (!filled && !half) {
        // Empty Heart
        return `<svg viewBox="0 0 9 9" class="stat-icon"><path d="M2,1 h2 v1 h1 v-1 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-2 h1 z" fill="#111"/><path d="M2,2 h2 v1 h-2 z M5,2 h2 v1 h-2 z M1,3 h7 v1 h-7 z M2,4 h5 v1 h-5 z M3,5 h3 v1 h-3 z M4,6 h1 v1 h-1 z" fill="#444"/></svg>`;
    }
    return `<svg viewBox="0 0 9 9" class="stat-icon"><path d="M2,0 h2 v1 h1 v-1 h2 v1 h1 v3 h-1 v1 h-1 v1 h-1 v1 h-1 v1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-3 h1 z" fill="#000"/><path d="M2,1 h2 v1 h-2 z M5,1 h2 v1 h-2 z M1,2 h7 v2 h-7 z M2,4 h5 v1 h-5 z M3,5 h3 v1 h-3 z M4,6 h1 v1 h-1 z" fill="#e71822"/><path d="M2,1 h1 v1 h-1 z M2,2 h1 v1 h-1 z" fill="#ffffff"/></svg>`;
}

function getHungerSvg(filled) {
    if (!filled) {
        return `<svg viewBox="0 0 9 9" class="stat-icon"><path d="M3,1 h3 v1 h2 v3 h-1 v2 h-1 v1 h-2 v-1 h-1 v-1 h-1 v-3 h1 v-1 h-1 v-1 h1 z" fill="#111"/><path d="M4,2 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 z" fill="#443c39"/></svg>`;
    }
    return `<svg viewBox="0 0 9 9" class="stat-icon"><path d="M3,0 h3 v1 h2 v3 h-1 v2 h-1 v1 h-2 v-1 h-1 v-1 h-1 v-3 h1 v-1 h-1 v-1 h1 z" fill="#000"/><path d="M4,1 h2 v1 h1 v2 h-1 v1 h-1 v1 h-1 z" fill="#c4782b"/><path d="M5,1 h1 v2 h-1 z" fill="#e89e4f"/><circle cx="2" cy="7" r="1" fill="#dedede"/><circle cx="1" cy="6" r="1" fill="#dedede"/></svg>`;
}

function updateHud() {
    // 1. Health Bar (10 hearts)
    let heartsHtml = '';
    for (let i = 0; i < 10; i++) {
        const hp = game.health - (i * 2);
        heartsHtml += getHeartSvg(hp >= 2, hp === 1);
    }
    document.getElementById('hearts-bar').innerHTML = heartsHtml;

    // 2. Hunger Bar (10 drumsticks)
    let hungerHtml = '';
    for (let i = 0; i < 10; i++) {
        const hg = game.hunger - (i * 2);
        hungerHtml += getHungerSvg(hg >= 1);
    }
    document.getElementById('hunger-bar').innerHTML = hungerHtml;

    // 3. Hotbar Slots
    const hotbarEl = document.getElementById('hotbar');
    let hotbarHtml = '';
    blockNames.forEach((blockName, index) => {
        const isSelected = game.player.selectedBlock === blockName;
        hotbarHtml += `
            <div class="hotbar-slot ${isSelected ? 'selected' : ''}">
                <span class="slot-key">${index + 1}</span>
                <div class="slot-icon" style="background: ${getBlockColorPreview(blockName)}; border: 1px solid #111;"></div>
            </div>
        `;
    });
    // Meat Slot (6)
    hotbarHtml += `
        <div class="hotbar-slot">
            <span class="slot-key">6</span>
            <div class="slot-icon" style="background: #a82e2e; border: 1px solid #111; border-radius: 4px;"></div>
            <span class="slot-count">${game.meat}</span>
        </div>
    `;
    hotbarEl.innerHTML = hotbarHtml;
}

function getBlockColorPreview(type) {
    switch (type) {
        case 'grass': return '#58a636';
        case 'dirt': return '#866043';
        case 'stone': return '#7d7d7d';
        case 'wood': return '#675231';
        case 'sand': return '#dcd695';
        default: return '#fff';
    }
}

function showNotice(text) {
    const el = document.getElementById('notice');
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => {
        el.style.opacity = '0';
    }, 1800);
}

// ==========================================
// 4. VOXEL CLOUDS & SKY DYNAMICS
// ==========================================
function createMinecraftClouds() {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    
    for (let x = -80; x <= 80; x += 16) {
        for (let z = -80; z <= 80; z += 16) {
            if (Math.random() > 0.45) {
                const cloud = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), cloudMat);
                cloud.position.set(x, 42, z);
                cloudGroup.add(cloud);
            }
        }
    }
    return cloudGroup;
}

function createSunAndMoon() {
    const group = new THREE.Group();

    // Pixel Sun
    const sunGeom = new THREE.PlaneGeometry(8, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffbb, side: THREE.DoubleSide });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    sun.position.set(0, 100, 0);
    sun.lookAt(0, 0, 0);
    group.add(sun);
    game.sun = sun;

    // Pixel Moon
    const moonGeom = new THREE.PlaneGeometry(6, 6);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff, side: THREE.DoubleSide });
    const moon = new THREE.Mesh(moonGeom, moonMat);
    moon.position.set(0, -100, 0);
    moon.lookAt(0, 0, 0);
    group.add(moon);
    game.moon = moon;

    return group;
}

// ==========================================
// 5. FIRST PERSON STEVE ARM & SWINGING
// ==========================================
function createFirstPersonArm() {
    const armGroup = new THREE.Group();

    // Arm (Steve Sleeve + Skin)
    const armGeom = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterials = [
        new THREE.MeshLambertMaterial({ map: textures.steveShirt }),
        new THREE.MeshLambertMaterial({ map: textures.steveShirt }),
        new THREE.MeshLambertMaterial({ map: textures.steveFace }), // Hand skin
        new THREE.MeshLambertMaterial({ map: textures.steveFace }),
        new THREE.MeshLambertMaterial({ map: textures.steveShirt }),
        new THREE.MeshLambertMaterial({ map: textures.steveShirt })
    ];
    const armMesh = new THREE.Mesh(armGeom, armMaterials);
    armMesh.position.set(0.35, -0.35, -0.55);
    armMesh.rotation.set(-Math.PI / 4, Math.PI / 8, -Math.PI / 12);
    armGroup.add(armMesh);

    game.player.handGroup = armGroup;
    game.player.armMesh = armMesh;
    game.camera.add(armGroup);
}

function triggerSwing() {
    game.player.isSwinging = true;
    game.player.swingProgress = 0;
}

function updateArmSwing(delta) {
    if (!game.player.isSwinging || !game.player.armMesh) return;

    game.player.swingProgress += delta * 9;
    const p = Math.sin(game.player.swingProgress * Math.PI);

    game.player.armMesh.rotation.x = -Math.PI / 4 + p * 0.75;
    game.player.armMesh.rotation.y = Math.PI / 8 - p * 0.45;
    game.player.armMesh.position.z = -0.55 + p * 0.15;

    if (game.player.swingProgress >= 1) {
        game.player.isSwinging = false;
        game.player.armMesh.rotation.set(-Math.PI / 4, Math.PI / 8, -Math.PI / 12);
        game.player.armMesh.position.set(0.35, -0.35, -0.55);
    }
}

// ==========================================
// 6. BLOCK SELECTION OUTLINE BOX
// ==========================================
function createSelectionOutline() {
    const geom = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const wireframe = new THREE.WireframeGeometry(geom);
    const line = new THREE.LineSegments(wireframe);
    line.material.color.setHex(0x000000);
    line.material.linewidth = 2;
    line.visible = false;
    game.scene.add(line);
    game.selectionBox = line;
}

function updateSelectionOutline() {
    if (!game.controls.isLocked || !ready) {
        if (game.selectionBox) game.selectionBox.visible = false;
        return;
    }

    game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
    game.raycaster.far = 5;
    const intersects = game.raycaster.intersectObjects(
        Array.from(game.world.values()).filter(m => m.visible)
    );

    if (intersects.length > 0) {
        const block = intersects[0].object;
        game.selectionBox.position.copy(block.position);
        game.selectionBox.visible = true;
    } else {
        game.selectionBox.visible = false;
    }
}

// ==========================================
// 7. INITIALIZE ENGINE & GRAPHICS
// ==========================================
function init() {
    // Create Scene
    game.scene = new THREE.Scene();
    game.scene.background = new THREE.Color(0x78a7ff); // Minecraft sky blue
    game.scene.fog = new THREE.Fog(0x78a7ff, 20, RENDER_DISTANCE * BLOCK_SIZE);

    // Camera
    game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    game.camera.position.set(WORLD_WIDTH / 2, WORLD_HEIGHT + 5, WORLD_DEPTH / 2);

    // Renderer
    game.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    document.body.appendChild(game.renderer.domElement);

    // Lighting (Warm Minecraft Sunlight)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    game.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbe8, 0.85);
    sunLight.position.set(45, 90, 30);
    game.scene.add(sunLight);

    // Clouds & Celestial Bodies
    game.clouds = createMinecraftClouds();
    game.scene.add(game.clouds);
    game.scene.add(createSunAndMoon());

    // Selection Box & First-person Arm
    createSelectionOutline();
    game.scene.add(game.camera);
    createFirstPersonArm();

    // Controls
    game.controls = new PointerLockControls(game.camera, document.body);

    const startScreen = document.getElementById('start-screen');
    const playBtn = document.getElementById('play-btn');

    playBtn.addEventListener('click', () => {
        if (ready) game.controls.lock();
    });

    game.controls.addEventListener('lock', () => {
        startScreen.style.display = 'none';
    });

    game.controls.addEventListener('unlock', () => {
        startScreen.style.display = 'flex';
    });

    // Network Connect
    connectToServer();

    // Events
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    // Animation loop
    animate();
}

// ==========================================
// 8. WORLD & BLOCK MANAGEMENT
// ==========================================
function addBlock(x, y, z, type) {
    const key = `${x},${y},${z}`;
    if (game.world.has(key)) game.scene.remove(game.world.get(key));

    const mat = blockMaterials[type] || blockMaterials.dirt;
    const mesh = new THREE.Mesh(sharedGeometry, mat);
    mesh.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
    mesh.userData = { blockType: type };

    game.scene.add(mesh);
    game.world.set(key, mesh);
    cull(x, y, z);
}

function removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const block = game.world.get(key);
    if (block) {
        game.scene.remove(block);
        game.world.delete(key);
        cull(x, y, z);
        return true;
    }
    return false;
}

function cull(x, y, z) {
    for (const [dx, dy, dz] of [[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
        const a = x + dx, b = y + dy, c = z + dz;
        const m = game.world.get(`${a},${b},${c}`);
        if (m) {
            m.visible = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(([i,j,k]) => !game.world.has(`${a+i},${b+j},${c+k}`));
        }
    }
}

function getBlock(x, y, z) {
    return game.world.get(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`);
}

function surface(x, z) {
    for (let y = 48; y >= 0; y--) {
        if (game.world.has(`${Math.round(x)},${y},${Math.round(z)}`)) return y + 0.5;
    }
    return -0.5;
}

// ==========================================
// 9. ANIMALS: AUTHENTIC VOXEL PIGS
// ==========================================
function createMinecraftPig() {
    const pig = new THREE.Group();
    const pigMat = new THREE.MeshLambertMaterial({ map: textures.pigSkin });
    const snoutMat = new THREE.MeshLambertMaterial({ map: textures.pigSnout });

    // Body
    const body = new THREE.Mesh(sharedGeometry, pigMat);
    body.position.set(0, 0.55, 0);
    body.scale.set(0.9, 0.65, 1.2);
    pig.add(body);

    // Head
    const head = new THREE.Mesh(sharedGeometry, pigMat);
    head.position.set(0, 0.95, 0.7);
    head.scale.set(0.65, 0.65, 0.65);
    pig.add(head);

    // Snout
    const snout = new THREE.Mesh(sharedGeometry, snoutMat);
    snout.position.set(0, 0.85, 1.05);
    snout.scale.set(0.35, 0.25, 0.15);
    pig.add(snout);

    // 4 Legs
    const legPositions = [
        [-0.3, 0.2, -0.4],
        [0.3, 0.2, -0.4],
        [-0.3, 0.2, 0.4],
        [0.3, 0.2, 0.4]
    ];
    legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(sharedGeometry, pigMat);
        leg.position.set(lx, ly, lz);
        leg.scale.set(0.22, 0.4, 0.22);
        pig.add(leg);
    });

    return pig;
}

function syncAnimals(list) {
    const ids = new Set(list.map(a => a.id));
    for (const [id, a] of game.animals) {
        if (!ids.has(id)) {
            game.scene.remove(a.model);
            game.animals.delete(id);
        }
    }
    for (const data of list) {
        let a = game.animals.get(data.id);
        if (!a) {
            const model = createMinecraftPig();
            model.userData.animal = data.id;
            game.scene.add(model);
            a = { model, angle: Math.random() * 6, turn: 0 };
            game.animals.set(data.id, a);
            model.position.set(data.x, data.y, data.z);
        }
        Object.assign(a, data);
    }
}

// ==========================================
// 10. AUTHENTIC STEVE PLAYER MODEL
// ==========================================
function createSteveModel() {
    const group = new THREE.Group();

    const headMat = new THREE.MeshLambertMaterial({ map: textures.steveFace });
    const shirtMat = new THREE.MeshLambertMaterial({ map: textures.steveShirt });
    const pantsMat = new THREE.MeshLambertMaterial({ map: textures.stevePants });

    // Head
    const head = new THREE.Mesh(sharedGeometry, headMat);
    head.position.set(0, 1.35, 0);
    head.scale.set(0.5, 0.5, 0.5);
    group.add(head);

    // Torso / Shirt
    const torso = new THREE.Mesh(sharedGeometry, shirtMat);
    torso.position.set(0, 0.75, 0);
    torso.scale.set(0.5, 0.7, 0.25);
    group.add(torso);

    // Arms
    const leftArm = new THREE.Mesh(sharedGeometry, shirtMat);
    leftArm.position.set(-0.35, 0.75, 0);
    leftArm.scale.set(0.2, 0.7, 0.22);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(sharedGeometry, shirtMat);
    rightArm.position.set(0.35, 0.75, 0);
    rightArm.scale.set(0.2, 0.7, 0.22);
    group.add(rightArm);

    // Legs
    const leftLeg = new THREE.Mesh(sharedGeometry, pantsMat);
    leftLeg.position.set(-0.13, 0.15, 0);
    leftLeg.scale.set(0.22, 0.65, 0.24);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(sharedGeometry, pantsMat);
    rightLeg.position.set(0.13, 0.15, 0);
    rightLeg.scale.set(0.22, 0.65, 0.24);
    group.add(rightLeg);

    // Name Tag
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'Bold 32px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Player', canvas.width / 2, 44);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 2.0;
    group.add(sprite);

    return group;
}

function addOtherPlayer(playerData) {
    if (game.otherPlayers.has(playerData.id)) return;
    const playerModel = createSteveModel();
    playerModel.userData.player = playerData.id;
    playerModel.position.set(playerData.position.x, playerData.position.y - 1.6, playerData.position.z);

    game.scene.add(playerModel);
    game.otherPlayers.set(playerData.id, {
        model: playerModel,
        targetPosition: playerData.position,
        targetRotation: playerData.rotation,
        username: playerData.username
    });
}

function removeOtherPlayer(playerId) {
    const player = game.otherPlayers.get(playerId);
    if (player) {
        game.scene.remove(player.model);
        game.otherPlayers.delete(playerId);
    }
}

function updateOtherPlayers() {
    game.otherPlayers.forEach((player) => {
        player.model.position.x += (player.targetPosition.x - player.model.position.x) * 0.3;
        player.model.position.y += (player.targetPosition.y - 1.6 - player.model.position.y) * 0.3;
        player.model.position.z += (player.targetPosition.z - player.model.position.z) * 0.3;
        if (player.targetRotation) {
            player.model.rotation.y = player.targetRotation.y;
        }
    });
}

// ==========================================
// 11. MEAT DROPS
// ==========================================
function addMeat(data) {
    if (meatDrops.has(data.id)) return;
    const m = new THREE.Mesh(meatGeometry, meatMaterial);
    m.userData.base = data.y;
    m.position.set(data.x, data.y, data.z);
    game.scene.add(m);
    meatDrops.set(data.id, m);
}

// ==========================================
// 12. SURVIVAL, CONTROLS & COMBAT
// ==========================================
function send(m) {
    if (ready && game.ws.readyState === WebSocket.OPEN) {
        game.ws.send(JSON.stringify(m));
    }
}

function respawn() {
    game.camera.position.set(16, surface(16, 16) + 1.82, 16);
    game.player.velocity.set(0, 0, 0);
    game.player.onGround = false;
    peak = game.camera.position.y;
    game.health = 20;
    game.hunger = 20;
    game.meat = 0;
    updateHud();
}

function damage(amount) {
    game.health = Math.max(0, game.health - amount);
    updateHud();
    if (game.health <= 0) {
        respawn();
        showNotice('You died! Respawned.');
    }
}

function survival(delta) {
    if (!ready) return;

    // Hunger and starvation
    game.hunger = Math.max(0, game.hunger - delta / 20);
    if (game.hunger === 0) damage(delta / 2);

    animalClock += delta;
    pickupClock += delta;

    // Animal movement (Elected Client Host)
    for (const a of game.animals.values()) {
        if (game.animalHost === game.playerId) {
            a.turn -= delta;
            if (a.turn <= 0) {
                a.angle += (Math.random() - 0.5) * 2;
                a.turn = 2.5;
            }
            const x = a.x + Math.sin(a.angle) * delta * 0.7;
            const z = a.z + Math.cos(a.angle) * delta * 0.7;
            if (x < 1 || x > 30 || z < 1 || z > 30 || Math.abs(surface(x, z) - a.y) > 1.1) {
                a.angle += Math.PI;
            } else {
                a.x = x;
                a.z = z;
            }
            a.y = THREE.MathUtils.lerp(a.y, surface(a.x, a.z), Math.min(1, delta * 10));
        }
        const target = new THREE.Vector3(a.x, a.y, a.z);
        const d = target.clone().sub(a.model.position);
        if (d.lengthSq() > 0.0001) a.model.rotation.y = Math.atan2(d.x, d.z);
        a.model.position.lerp(target, Math.min(1, delta * 12));
    }

    if (animalClock >= 0.2) {
        animalClock = 0;
        if (game.animalHost === game.playerId) {
            send({
                type: 'animalState',
                animals: Array.from(game.animals.values(), a => ({ id: a.id, x: a.x, y: a.y, z: a.z }))
            });
        }
    }

    // Floating Meat Drops
    for (const [id, m] of meatDrops) {
        m.position.y = m.userData.base + Math.sin(performance.now() / 400) * 0.12;
        m.rotation.y += delta * 2;
        if (pickupClock >= 0.3 && m.position.distanceTo(game.camera.position) < 2.5) {
            showNotice('Picked up Raw Porkchop!');
            send({ type: 'meatPickup', id });
            break;
        }
    }
    if (pickupClock >= 0.3) pickupClock = 0;

    // Status Panel
    document.getElementById('status-panel').textContent =
        `Connected: ${game.otherPlayers.size + 1}/8 | Role: ${game.animalHost === game.playerId ? 'Simulation Host' : 'Guest'}`;
}

function onKeyDown(event) {
    game.keys[event.code] = true;

    // Eating Meat (E key)
    if (event.code === 'KeyE' && !event.repeat && ready && game.controls.isLocked) {
        if (game.meat > 0 && game.hunger < 20) {
            game.meat--;
            game.hunger = Math.min(20, game.hunger + 6);
            showNotice('Ate meat (+6 Hunger)');
            triggerSwing();
            updateHud();
        }
    }

    // Number Selection 1-5
    if (event.code === 'Digit1') selectBlock('grass');
    if (event.code === 'Digit2') selectBlock('dirt');
    if (event.code === 'Digit3') selectBlock('stone');
    if (event.code === 'Digit4') selectBlock('wood');
    if (event.code === 'Digit5') selectBlock('sand');
}

function selectBlock(type) {
    game.player.selectedBlock = type;
    updateHud();
}

function onKeyUp(event) {
    game.keys[event.code] = false;
}

function onMouseDown(event) {
    if (!game.controls.isLocked || !ready || performance.now() - lastHit < 300) return;
    lastHit = performance.now();

    triggerSwing();

    game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
    game.raycaster.far = 5;

    const targets = [
        ...Array.from(game.world.values()).filter(m => m.visible),
        ...Array.from(game.animals.values(), a => a.model),
        ...Array.from(game.otherPlayers.values(), p => p.model)
    ];

    const intersects = game.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        let root = intersect.object;
        while (root.parent && root.parent !== game.scene) root = root.parent;

        // Hit Animal
        if (root.userData.animal) {
            if (event.button === 0) send({ type: 'animalHit', id: root.userData.animal });
            return;
        }

        // Hit Player (PvP)
        if (root.userData.player) {
            if (event.button === 0) send({ type: 'playerHit', id: root.userData.player });
            return;
        }

        // Block Break & Place
        const blockPos = intersect.object.position.clone().divideScalar(BLOCK_SIZE);

        if (event.button === 0) {
            // Left click: Break
            if (game.world.has(`${blockPos.x},${blockPos.y},${blockPos.z}`)) {
                send({ type: 'blockRemoved', x: blockPos.x, y: blockPos.y, z: blockPos.z });
            }
        } else if (event.button === 2) {
            // Right click: Place
            const normal = intersect.face.normal;
            const newPos = blockPos.clone().add(normal);
            const playerPos = game.camera.position.clone().divideScalar(BLOCK_SIZE).floor();

            if (!(newPos.x === playerPos.x && (newPos.y === playerPos.y || newPos.y === playerPos.y - 1) && newPos.z === playerPos.z)) {
                send({
                    type: 'blockPlaced',
                    x: newPos.x,
                    y: newPos.y,
                    z: newPos.z,
                    blockType: game.player.selectedBlock
                });
            }
        }
    }
}

// ==========================================
// 13. PHYSICS & PLAYER MOVEMENT
// ==========================================
function updatePlayer(delta) {
    if (!ready) return;

    const speed = 9.5;
    const jumpSpeed = 8.5;
    const gravity = 22;

    game.player.velocity.y -= gravity * delta;

    const moveDirection = new THREE.Vector3();
    if (game.controls.isLocked && game.keys['KeyW']) moveDirection.z -= 1;
    if (game.controls.isLocked && game.keys['KeyS']) moveDirection.z += 1;
    if (game.controls.isLocked && game.keys['KeyA']) moveDirection.x -= 1;
    if (game.controls.isLocked && game.keys['KeyD']) moveDirection.x += 1;

    moveDirection.normalize();
    moveDirection.multiplyScalar(speed * delta);

    const forward = new THREE.Vector3();
    game.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const movement = new THREE.Vector3();
    movement.addScaledVector(forward, -moveDirection.z);
    movement.addScaledVector(right, moveDirection.x);

    const newPos = game.camera.position.clone().add(movement);
    if (!checkCollision(newPos)) {
        game.camera.position.add(movement);
    }

    // Jump
    if (game.controls.isLocked && game.keys['Space'] && game.player.onGround) {
        game.player.velocity.y = jumpSpeed;
        game.player.onGround = false;
    }

    // Vertical fall & fall damage
    const verticalMovement = game.player.velocity.y * delta;
    peak = Math.max(peak, game.camera.position.y);
    const newVerticalPos = game.camera.position.clone();
    newVerticalPos.y += verticalMovement;

    if (checkCollision(newVerticalPos)) {
        if (game.player.velocity.y < 0) {
            if (!game.player.onGround) {
                const fallDist = peak - game.camera.position.y;
                if (fallDist > 3.5) damage(Math.floor(fallDist - 3));
                game.player.onGround = true;
                peak = game.camera.position.y;
            }
        }
        game.player.velocity.y = 0;
    } else {
        game.player.onGround = false;
        game.camera.position.y += verticalMovement;
    }

    if (game.camera.position.y < -20) damage(20);

    // World Boundaries
    game.camera.position.x = Math.max(0, Math.min(WORLD_WIDTH * BLOCK_SIZE, game.camera.position.x));
    game.camera.position.z = Math.max(0, Math.min(WORLD_DEPTH * BLOCK_SIZE, game.camera.position.z));

    // Send position sync (10 Hz)
    const now = Date.now();
    if (now - game.lastPositionUpdate > 100) {
        game.lastPositionUpdate = now;
        send({
            type: 'position',
            position: { x: game.camera.position.x, y: game.camera.position.y, z: game.camera.position.z },
            rotation: { x: game.camera.rotation.x, y: game.camera.rotation.y }
        });
    }
}

function checkCollision(position) {
    const playerRadius = 0.3;
    const playerHeight = 1.8;

    for (let y = -playerHeight; y <= 0.2; y += 0.5) {
        for (let x = -playerRadius; x <= playerRadius; x += playerRadius) {
            for (let z = -playerRadius; z <= playerRadius; z += playerRadius) {
                const checkPos = position.clone().add(new THREE.Vector3(x, y, z));
                const block = getBlock(checkPos.x / BLOCK_SIZE, checkPos.y / BLOCK_SIZE, checkPos.z / BLOCK_SIZE);
                if (block) return true;
            }
        }
    }
    return false;
}

// ==========================================
// 14. NETWORKING & SYNC
// ==========================================
function connectToServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    game.ws = new WebSocket(wsUrl);

    game.ws.onopen = () => {
        console.log('Connected to Minecraft server');
    };

    game.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
    };

    game.ws.onclose = () => {
        ready = false;
        game.animalHost = null;
        game.keys = {};
        game.controls.unlock();
        document.getElementById('status-panel').textContent = 'Disconnected. Reconnecting...';
        setTimeout(connectToServer, 3000);
    };
}

function handleServerMessage(message) {
    switch (message.type) {
        case 'init':
            for (const m of game.world.values()) game.scene.remove(m);
            game.world.clear();
            for (const id of Array.from(game.otherPlayers.keys())) removeOtherPlayer(id);
            for (const m of meatDrops.values()) game.scene.remove(m);
            meatDrops.clear();
            syncAnimals([]);

            game.playerId = message.playerId;
            game.animalHost = message.animalHost;
            (message.meat || []).forEach(addMeat);

            if (message.world) {
                message.world.forEach(b => addBlock(b.x, b.y, b.z, b.type));
            }
            syncAnimals(message.animals);
            ready = true;
            respawn();
            message.players.forEach(addOtherPlayer);
            break;

        case 'animalHost':
            game.animalHost = message.playerId;
            syncAnimals(message.animals);
            break;

        case 'animalState':
            syncAnimals(message.animals);
            break;

        case 'damage':
            damage(message.amount);
            break;

        case 'meatDropped':
            addMeat(message.meat);
            break;

        case 'meatPicked': {
            const m = meatDrops.get(message.id);
            if (m) {
                game.scene.remove(m);
                meatDrops.delete(message.id);
            }
            if (message.playerId === game.playerId) {
                game.meat++;
                updateHud();
            }
            break;
        }

        case 'playerJoined':
            addOtherPlayer(message.player);
            break;

        case 'playerLeft':
            removeOtherPlayer(message.playerId);
            break;

        case 'playerMoved':
            const player = game.otherPlayers.get(message.playerId);
            if (player) {
                player.targetPosition = message.position;
                player.targetRotation = message.rotation;
            }
            break;

        case 'blockPlaced':
            addBlock(message.x, message.y, message.z, message.blockType);
            break;

        case 'blockRemoved':
            removeBlock(message.x, message.y, message.z);
            break;
    }
}

// ==========================================
// 15. MAIN ANIMATION LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);

    // Physics step
    for (let remaining = delta; remaining > 0; remaining -= 1 / 120) {
        updatePlayer(Math.min(remaining, 1 / 120));
    }

    updateOtherPlayers();
    updateArmSwing(delta);
    updateSelectionOutline();
    survival(delta);

    // Rotate Sky & Clouds slowly
    if (game.clouds) game.clouds.position.x = (performance.now() * 0.001) % 16;
    timeOfDay += delta * 0.02;
    if (game.sun) {
        game.sun.position.x = Math.cos(timeOfDay) * 100;
        game.sun.position.y = Math.sin(timeOfDay) * 100;
    }

    game.renderer.render(game.scene, game.camera);
}

function onWindowResize() {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('blur', () => { game.keys = {}; });

// Start the game!
init();
