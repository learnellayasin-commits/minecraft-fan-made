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

// Textures
const textures = {
    dirt: createNoiseCanvas(16, 16, () => {
        const v = rand(0.8, 1.2);
        const dark = Math.random() < 0.15 ? 0.7 : 1.0;
        return [Math.floor(134 * v * dark), Math.floor(96 * v * dark), Math.floor(67 * v * dark)];
    }).texture,

    grassTop: createNoiseCanvas(16, 16, () => {
        const v = rand(0.85, 1.15);
        return [Math.floor(88 * v), Math.floor(166 * v), Math.floor(54 * v)];
    }).texture,

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

    stone: createNoiseCanvas(16, 16, () => {
        const v = rand(0.8, 1.2);
        const dark = Math.random() < 0.1 ? 0.75 : 1.0;
        const g = Math.floor(125 * v * dark);
        return [g, g, g];
    }).texture,

    woodSide: createNoiseCanvas(16, 16, (x, y) => {
        const bark = (x % 4 === 0) ? 0.7 : rand(0.85, 1.15);
        return [Math.floor(103 * bark), Math.floor(82 * bark), Math.floor(49 * bark)];
    }).texture,

    woodTop: createNoiseCanvas(16, 16, (x, y) => {
        const dist = Math.hypot(x - 7.5, y - 7.5);
        const ring = Math.floor(dist) % 2 === 0 ? 0.9 : 1.1;
        if (dist > 6.5) return [70, 50, 30];
        return [Math.floor(168 * ring), Math.floor(130 * ring), Math.floor(88 * ring)];
    }).texture,

    sand: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        const speck = Math.random() < 0.08 ? 0.85 : 1.0;
        return [Math.floor(220 * v * speck), Math.floor(214 * v * speck), Math.floor(149 * v * speck)];
    }).texture,

    // Wood Planks
    planks: createNoiseCanvas(16, 16, (x, y) => {
        const plankLine = (y % 4 === 0) ? 0.7 : 1.0;
        const v = rand(0.9, 1.1) * plankLine;
        return [Math.floor(180 * v), Math.floor(140 * v), Math.floor(90 * v)];
    }).texture,

    // Stick Texture
    stick: createNoiseCanvas(16, 16, (x, y) => {
        if (Math.abs(x - (15 - y)) <= 1 && y >= 2 && y <= 13) {
            return [120, 85, 45, 255];
        }
        return [0, 0, 0, 0];
    }).texture,

    // Crafting Table
    craftingTableSide: createNoiseCanvas(16, 16, (x, y) => {
        const v = rand(0.9, 1.1);
        if (y >= 4 && y <= 12 && x >= 4 && x <= 12) {
            return [140, 100, 60]; // Tool carvings
        }
        return [Math.floor(160 * v), Math.floor(120 * v), Math.floor(70 * v)];
    }).texture,

    craftingTableTop: createNoiseCanvas(16, 16, (x, y) => {
        const grid = (x % 5 === 0 || y % 5 === 0) ? 0.75 : 1.0;
        const v = rand(0.9, 1.1) * grid;
        return [Math.floor(190 * v), Math.floor(150 * v), Math.floor(95 * v)];
    }).texture,

    // Steve Skin
    steveFace: createNoiseCanvas(16, 16, (x, y) => {
        if (y === 8 && (x === 4 || x === 11)) return [255, 255, 255];
        if (y === 8 && (x === 5 || x === 10)) return [40, 50, 160];
        if (y < 4 || (y === 4 && (x < 2 || x > 13))) return [70, 45, 25];
        if (y >= 10 && y <= 11 && x >= 5 && x <= 10) return [100, 60, 40];
        const v = rand(0.95, 1.05);
        return [Math.floor(190 * v), Math.floor(138 * v), Math.floor(110 * v)];
    }).texture,

    // Plain skin (sides/bottom of the head - NO face on them)
    steveSkin: createNoiseCanvas(16, 16, () => {
        const v = rand(0.95, 1.05);
        return [Math.floor(190 * v), Math.floor(138 * v), Math.floor(110 * v)];
    }).texture,

    // Hair (top/back of the head)
    steveHair: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [Math.floor(70 * v), Math.floor(45 * v), Math.floor(25 * v)];
    }).texture,

    steveShirt: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [0, Math.floor(160 * v), Math.floor(175 * v)];
    }).texture,

    stevePants: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [Math.floor(40 * v), Math.floor(45 * v), Math.floor(125 * v)];
    }).texture,

    // Pig Texture
    pigSkin: createNoiseCanvas(16, 16, () => {
        const v = rand(0.92, 1.08);
        return [Math.floor(240 * v), Math.floor(165 * v), Math.floor(170 * v)];
    }).texture,

    pigSnout: createNoiseCanvas(16, 16, (x, y) => {
        if (y >= 6 && y <= 9 && (x === 4 || x === 11)) return [80, 20, 20];
        const v = rand(0.9, 1.1);
        return [Math.floor(220 * v), Math.floor(130 * v), Math.floor(145 * v)];
    }).texture,

    // Zombie Texture (Rotten Green)
    zombieFace: createNoiseCanvas(16, 16, (x, y) => {
        if (y === 8 && (x === 4 || x === 11)) return [0, 0, 0];
        if (y === 8 && (x === 5 || x === 10)) return [180, 40, 40];
        if (y < 4 || (y === 4 && (x < 2 || x > 13))) return [30, 60, 30];
        const v = rand(0.9, 1.1);
        return [Math.floor(60 * v), Math.floor(130 * v), Math.floor(60 * v)];
    }).texture,

    zombieSkin: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [Math.floor(50 * v), Math.floor(115 * v), Math.floor(50 * v)];
    }).texture,

    // Skeleton Texture (Bones & Sockets)
    skeletonFace: createNoiseCanvas(16, 16, (x, y) => {
        if ((y >= 6 && y <= 8) && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12))) return [20, 20, 20]; // Big black sockets
        if (y === 10 && x >= 7 && x <= 8) return [30, 30, 30]; // Nose hole
        if (y >= 12 && y <= 13 && x >= 4 && x <= 11) return (x % 2 === 0) ? [40, 40, 40] : [200, 200, 200]; // Teeth
        const v = rand(0.9, 1.1);
        return [Math.floor(190 * v), Math.floor(190 * v), Math.floor(190 * v)];
    }).texture,

    skeletonBone: createNoiseCanvas(16, 16, () => {
        const v = rand(0.9, 1.1);
        return [Math.floor(180 * v), Math.floor(180 * v), Math.floor(180 * v)];
    }).texture,

    // Creeper Texture (Camo Green & Grimace)
    creeperFace: createNoiseCanvas(16, 16, (x, y) => {
        // Eyes
        if ((y >= 5 && y <= 7) && ((x >= 3 && x <= 5) || (x >= 10 && x <= 12))) return [0, 0, 0];
        // Mouth
        if ((y >= 7 && y <= 10 && x >= 6 && x <= 9) || (y >= 9 && y <= 13 && (x === 4 || x === 5 || x === 10 || x === 11))) return [0, 0, 0];
        const v = rand(0.8, 1.2);
        return [Math.floor(30 * v), Math.floor(160 * v), Math.floor(30 * v)];
    }).texture,

    creeperBody: createNoiseCanvas(16, 16, () => {
        const v = rand(0.75, 1.25);
        return [Math.floor(25 * v), Math.floor(150 * v), Math.floor(25 * v)];
    }).texture,

    // Tree Leaves (Green)
    leaves: createNoiseCanvas(16, 16, (x, y) => {
        const v = rand(0.75, 1.2);
        const dark = Math.random() < 0.2 ? 0.75 : 1.0;
        return [Math.floor(40 * v * dark), Math.floor(130 * v * dark), Math.floor(30 * v * dark)];
    }).texture,

    // Raw Meat Texture
    meatItem: createNoiseCanvas(16, 16, (x, y) => {
        const dist = Math.hypot(x - 7.5, y - 7.5);
        if (dist > 6) return [0, 0, 0, 0];
        if (x < 6 && y > 9) return [230, 230, 230, 255];
        const v = rand(0.85, 1.15);
        return [Math.floor(180 * v), Math.floor(50 * v), Math.floor(50 * v), 255];
    }).texture
};

// Multi-materials for Minecraft blocks
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);

// Build a 6-material head so the FACE only appears on the front (+Z) side.
// BoxGeometry material order is [+X, -X, +Y, -Y, +Z, -Z].
const headMaterialCache = new Map();
function headMaterials(faceTexture, sideTexture, topTexture = sideTexture) {
    const key = `${faceTexture.uuid}|${sideTexture.uuid}|${topTexture.uuid}`;
    if (headMaterialCache.has(key)) return headMaterialCache.get(key);

    const side = new THREE.MeshLambertMaterial({ map: sideTexture });
    const top = new THREE.MeshLambertMaterial({ map: topTexture });
    const mats = [
        side,                                                  // +X right
        side,                                                  // -X left
        top,                                                   // +Y top
        side,                                                  // -Y bottom
        new THREE.MeshLambertMaterial({ map: faceTexture }),   // +Z FRONT (the only face)
        side                                                   // -Z back
    ];
    headMaterialCache.set(key, mats);
    return mats;
}

const blockMaterials = {
    grass: [
        new THREE.MeshLambertMaterial({ map: textures.grassSide }),
        new THREE.MeshLambertMaterial({ map: textures.grassSide }),
        new THREE.MeshLambertMaterial({ map: textures.grassTop }),
        new THREE.MeshLambertMaterial({ map: textures.dirt }),
        new THREE.MeshLambertMaterial({ map: textures.grassSide }),
        new THREE.MeshLambertMaterial({ map: textures.grassSide })
    ],
    dirt: new THREE.MeshLambertMaterial({ map: textures.dirt }),
    stone: new THREE.MeshLambertMaterial({ map: textures.stone }),
    wood: [
        new THREE.MeshLambertMaterial({ map: textures.woodSide }),
        new THREE.MeshLambertMaterial({ map: textures.woodSide }),
        new THREE.MeshLambertMaterial({ map: textures.woodTop }),
        new THREE.MeshLambertMaterial({ map: textures.woodTop }),
        new THREE.MeshLambertMaterial({ map: textures.woodSide }),
        new THREE.MeshLambertMaterial({ map: textures.woodSide })
    ],
    sand: new THREE.MeshLambertMaterial({ map: textures.sand }),
    leaves: new THREE.MeshLambertMaterial({ map: textures.leaves }),
    planks: new THREE.MeshLambertMaterial({ map: textures.planks }),
    craftingTable: [
        new THREE.MeshLambertMaterial({ map: textures.craftingTableSide }),
        new THREE.MeshLambertMaterial({ map: textures.craftingTableSide }),
        new THREE.MeshLambertMaterial({ map: textures.craftingTableTop }),
        new THREE.MeshLambertMaterial({ map: textures.planks }),
        new THREE.MeshLambertMaterial({ map: textures.craftingTableSide }),
        new THREE.MeshLambertMaterial({ map: textures.craftingTableSide })
    ]
};

// ==========================================
// 2. WEB AUDIO API SOUND ENGINE
// ==========================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type, material = 'stone') {
    if (!audioCtx) return;

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (type === 'hit') {
        // Block Punch / Mining sound (dull thud)
        const baseFreq = material === 'stone' ? 90 : material === 'wood' ? 140 : 110;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 30, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.09);

    } else if (type === 'break') {
        // Block Break sound (crisp crunch)
        osc.type = 'square';
        osc.frequency.setValueAtTime(220 + Math.random() * 80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.16);

    } else if (type === 'place') {
        // Block Place sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.1);

    } else if (type === 'explosion') {
        // Creeper Explosion
        const bufferSize = audioCtx.sampleRate * 0.6;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.15));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.linearRampToValueAtTime(80, t + 0.6);

        gain.gain.setValueAtTime(0.8, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(t);

    } else if (type === 'fuse') {
        // Creeper Hiss
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3200, t);
        osc.frequency.linearRampToValueAtTime(4500, t + 1.2);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 1.2);

    } else if (type === 'bow') {
        // Arrow Shoot
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.13);

    } else if (type === 'eat') {
        // Eating crunch
        osc.type = 'square';
        osc.frequency.setValueAtTime(300 + Math.random() * 100, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.08);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.09);

    } else if (type === 'step') {
        // Footstep sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(70 + Math.random() * 30, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.05);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.06);

    } else if (type === 'hurt') {
        // Classic Minecraft OOF/Hurt sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.12);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.13);
    }
}

// ==========================================
// 3. GAME STATE & CONSTANTS
// ==========================================
const BLOCK_SIZE = 1;
const WORLD_SIZE = 128; // Must match server.js exactly for deterministic terrain
const WORLD_WIDTH = 128; // HUGE EXPANDED WORLD!
const WORLD_DEPTH = 128;
const WORLD_HEIGHT = 24;
const RENDER_DISTANCE = 96;

// Deterministic terrain generation - MUST match server.js byte-for-byte
function terrainHeight(x, z) {
    return Math.floor(10 + Math.sin(x / 10) * 5 + Math.cos(z / 10) * 5 + Math.sin((x + z) / 16) * 3);
}

const blockNames = ['grass', 'dirt', 'stone', 'wood', 'sand', 'leaves', 'planks', 'craftingTable', 'stick', 'meat'];

// Inventory Slots (0 to 8: Hotbar, 9 to 35: Main Inventory, Crafting: 4 inputs + 1 output)
const playerInventory = Array.from({ length: 36 }, () => null);
const craftingGrid = [null, null, null, null];
let craftOutput = null;
let draggedItem = null;
let cursorOrigin = null;
let inventoryGesture = null;
let lastInventoryClick = null;
let cursorClientX = 0;
let cursorClientY = 0;
let lastInventoryInput = 'mouse';
const MAX_STACK_SIZE = 64;
let selectedHotbarIndex = 0;
let isInventoryOpen = false;

// 3D Player Preview in Inventory GUI
let previewScene, previewCamera, previewRenderer, previewPlayerMesh;

function initPlayerPreview() {
    const canvas = document.getElementById('player-preview-canvas');
    if (!canvas) return;
    previewRenderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    previewRenderer.setSize(120, 140);

    previewScene = new THREE.Scene();
    previewCamera = new THREE.PerspectiveCamera(50, 120 / 140, 0.1, 100);
    previewCamera.position.set(0, 1.0, 3.2);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 4, 3);
    previewScene.add(light);
    previewScene.add(new THREE.AmbientLight(0xffffff, 0.8));

    previewPlayerMesh = createSteveModel(true);
    previewPlayerMesh.position.set(0, -0.3, 0);
    previewScene.add(previewPlayerMesh);
}

function renderPlayerPreview() {
    if (!previewRenderer || !isInventoryOpen) return;
    if (previewPlayerMesh) {
        previewPlayerMesh.rotation.y = performance.now() * 0.0015;
    }
    previewRenderer.render(previewScene, previewCamera);
}

function addToInventory(itemType, count = 1) {
    if (!itemType) return false;
    if (!canAddToInventory(itemType, count)) return false;
    // 1. Try stacking into existing non-full slots (max 64)
    for (let i = 0; i < 36; i++) {
        if (playerInventory[i] && playerInventory[i].type === itemType && playerInventory[i].count < MAX_STACK_SIZE) {
            const add = Math.min(count, MAX_STACK_SIZE - playerInventory[i].count);
            playerInventory[i].count += add;
            count -= add;
            if (count <= 0) {
                updateHud();
                updateInventoryUI();
                updateHeldItemMesh();
                return true;
            }
        }
    }
    // 2. Try placing in empty slots
    for (let i = 0; i < 36; i++) {
        if (!playerInventory[i]) {
            const add = Math.min(count, MAX_STACK_SIZE);
            playerInventory[i] = { type: itemType, count: add };
            count -= add;
            if (count <= 0) {
                updateHud();
                updateInventoryUI();
                updateHeldItemMesh();
                return true;
            }
        }
    }
    updateHud();
    updateInventoryUI();
    updateHeldItemMesh();
    return count <= 0;
}

function canAddToInventory(itemType, count = 1) {
    if (!itemType || !Number.isInteger(count) || count < 0) return false;
    const simulated = playerInventory.map(stack => stack ? { ...stack } : null);
    let remaining = count;
    for (const stack of simulated) {
        if (!stack || stack.type !== itemType || stack.count >= MAX_STACK_SIZE) continue;
        const moved = Math.min(remaining, MAX_STACK_SIZE - stack.count);
        stack.count += moved;
        remaining -= moved;
        if (!remaining) return true;
    }
    for (let index = 0; index < simulated.length && remaining > 0; index++) {
        if (simulated[index]) continue;
        const moved = Math.min(remaining, MAX_STACK_SIZE);
        simulated[index] = { type: itemType, count: moved };
        remaining -= moved;
    }
    return remaining === 0;
}

function getInventorySlot(element) {
    if (!element) return null;
    const slot = element.closest('[data-slot], [data-craft], #craft-output-slot');
    if (!slot) return null;
    if (slot.hasAttribute('data-slot')) return { element: slot, kind: 'inventory', index: Number(slot.dataset.slot) };
    if (slot.hasAttribute('data-craft')) return { element: slot, kind: 'crafting', index: Number(slot.dataset.craft) };
    return { element: slot, kind: 'output', index: 0 };
}

function getSlotStack(slot) {
    if (slot.kind === 'inventory') return playerInventory[slot.index];
    if (slot.kind === 'crafting') return craftingGrid[slot.index];
    return craftOutput;
}

function setSlotStack(slot, stack) {
    if (slot.kind === 'inventory') playerInventory[slot.index] = stack;
    else if (slot.kind === 'crafting') craftingGrid[slot.index] = stack;
}

function canPlaceInSlot(slot, stack) {
    if (!stack || slot.kind === 'output') return false;
    if (slot.kind === 'inventory') return slot.index >= 0 && slot.index < playerInventory.length;
    if (slot.kind === 'crafting') return slot.index >= 0 && slot.index < craftingGrid.length;
    return true;
}

function slotCapacity(slot, stack) {
    if (!canPlaceInSlot(slot, stack)) return 0;
    const current = getSlotStack(slot);
    if (current && current.type !== stack.type) return 0;
    return MAX_STACK_SIZE - (current?.count || 0);
}

function refreshInventoryState() {
    if (inventoryGesture?.dragged) clearDragPreview();
    if (inventoryGesture) inventoryGesture = null;
    if (craftingGrid.some(Boolean)) updateCrafting();
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
    updateDragIcon();
}

// 2x2 Crafting Logic
function updateCrafting() {
    const [c0, c1, c2, c3] = craftingGrid;
    craftOutput = null;

    // 1 Wood Log -> 4 Planks
    const woodCount = [c0, c1, c2, c3].filter(c => c && c.type === 'wood').length;
    const totalFilled = [c0, c1, c2, c3].filter(c => c !== null).length;

    if (woodCount === 1 && totalFilled === 1) {
        craftOutput = { type: 'planks', count: 4 };
    }
    // 2 Planks vertically -> 4 Sticks
    else if (((c0 && c0.type === 'planks' && c2 && c2.type === 'planks') || (c1 && c1.type === 'planks' && c3 && c3.type === 'planks')) && totalFilled === 2) {
        craftOutput = { type: 'stick', count: 4 };
    }
    // 4 Planks in 2x2 -> 1 Crafting Table
    else if (c0 && c0.type === 'planks' && c1 && c1.type === 'planks' && c2 && c2.type === 'planks' && c3 && c3.type === 'planks' && totalFilled === 4) {
        craftOutput = { type: 'craftingTable', count: 1 };
    }

    renderCraftingUI();
}

function takeCraftOutput() {
    if (!craftOutput) return;
    if (draggedItem) {
        if (draggedItem.type === craftOutput.type && draggedItem.count + craftOutput.count <= 64) {
            draggedItem.count += craftOutput.count;
        } else {
            return;
        }
    } else {
        draggedItem = { ...craftOutput };
    }

    // Decrement recipe ingredients
    for (let i = 0; i < 4; i++) {
        if (craftingGrid[i]) {
            craftingGrid[i].count--;
            if (craftingGrid[i].count <= 0) craftingGrid[i] = null;
        }
    }
    updateCrafting();
    updateInventoryUI();
    updateDragIcon();
}

const game = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    chunks: new Map(),
    blockTypes: new Map(),
    player: {
        velocity: new THREE.Vector3(),
        onGround: false,
        selectedBlock: null,
        handGroup: null,
        armMesh: null,
        heldItemMesh: null,
        swingProgress: 0,
        isSwinging: false,
        isFlying: false,
        isCreative: false,
        pvp: true,
        lastSpaceTime: 0
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
    moon: null,
    stars: null,
    sunLight: null,
    ambientLight: null,
    arrows: []
};

// Mining & Cracking Progress
let miningTarget = null;
let miningProgress = 0;
let isMining = false;
let lastMineHitSound = 0;

let lastStepTime = 0;
let isChatOpen = false;

function addChatMessage(user, text) {
    const msgContainer = document.getElementById('chat-messages');
    if (!msgContainer) return;
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = `<strong>&lt;${user}&gt;</strong> ${text}`;
    msgContainer.appendChild(msg);
    if (msgContainer.children.length > 5) {
        msgContainer.removeChild(msgContainer.firstChild);
    }
    setTimeout(() => {
        if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 8000);
}

function flashDamage() {
    const el = document.getElementById('damage-flash');
    if (el) {
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.opacity = '0';
        }, 120);
    }
}

const meatDrops = new Map();
const meatGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const meatMaterial = new THREE.MeshLambertMaterial({ map: textures.meatItem, transparent: true });

let ready = false;
let animalClock = 0;
let pickupClock = 0;
let peak = 0;
let lastHit = 0;

// 20-minute Day/Night Cycle (1200 seconds total, 10 min day, 10 min night)
const DAY_CYCLE_DURATION = 1200; // 20 minutes in seconds
let worldTime = 0;

// ==========================================
// 4. MINECRAFT HUD & UI (SVG PIXEL ICONS)
// ==========================================
function getHeartSvg(filled, half) {
    if (!filled && !half) {
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

function getBlockColorPreview(type) {
    switch (type) {
        case 'grass': return '#58a636';
        case 'dirt': return '#866043';
        case 'stone': return '#7d7d7d';
        case 'wood': return '#675231';
        case 'sand': return '#dcd695';
        case 'leaves': return '#308020';
        case 'planks': return '#b48a56';
        case 'stick': return '#78552d';
        case 'craftingTable': return '#a67b45';
        case 'meat': return '#a82e2e';
        default: return 'transparent';
    }
}

// 3D In-Hand Held Item Mesh attached to Steve's Arm
function updateHeldItemMesh() {
    if (!game.player.handGroup) return;

    if (game.player.heldItemMesh) {
        game.player.handGroup.remove(game.player.heldItemMesh);
        game.player.heldItemMesh = null;
    }

    const currentItem = playerInventory[selectedHotbarIndex];
    game.player.selectedBlock = currentItem ? currentItem.type : null;

    if (!currentItem) return;

    if (currentItem.type === 'meat') {
        const meat = new THREE.Mesh(meatGeometry, meatMaterial);
        meat.position.set(0.2, -0.2, -0.7);
        meat.rotation.set(0.4, 0.4, 0);
        game.player.handGroup.add(meat);
        game.player.heldItemMesh = meat;
    } else if (currentItem.type === 'stick') {
        const stickGeom = new THREE.BoxGeometry(0.06, 0.5, 0.06);
        const stickMesh = new THREE.Mesh(stickGeom, new THREE.MeshLambertMaterial({ color: 0x78552d }));
        stickMesh.position.set(0.25, -0.15, -0.65);
        stickMesh.rotation.set(-0.3, 0.2, 0.4);
        game.player.handGroup.add(stickMesh);
        game.player.heldItemMesh = stickMesh;
    } else {
        const mat = blockMaterials[currentItem.type] || blockMaterials.dirt;
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat);
        block.position.set(0.22, -0.2, -0.65);
        block.rotation.set(0.3, 0.4, 0.1);
        game.player.handGroup.add(block);
        game.player.heldItemMesh = block;
    }
}

function updateHud() {
    const vitalsEl = document.getElementById('vitals');
    if (game.player.isCreative) {
        vitalsEl.style.display = 'none';
    } else {
        vitalsEl.style.display = 'flex';
        // 1. Health Bar
        let heartsHtml = '';
        for (let i = 0; i < 10; i++) {
            const hp = game.health - (i * 2);
            heartsHtml += getHeartSvg(hp >= 2, hp === 1);
        }
        document.getElementById('hearts-bar').innerHTML = heartsHtml;

        // 2. Hunger Bar
        let hungerHtml = '';
        for (let i = 0; i < 10; i++) {
            const hg = game.hunger - (i * 2);
            hungerHtml += getHungerSvg(hg >= 1);
        }
        document.getElementById('hunger-bar').innerHTML = hungerHtml;
    }

    // 3. 9-Slot Minecraft Hotbar
    const hotbarEl = document.getElementById('hotbar');
    let hotbarHtml = '';
    for (let i = 0; i < 9; i++) {
        const item = playerInventory[i];
        const isSelected = selectedHotbarIndex === i;
        hotbarHtml += `
            <div class="hotbar-slot ${isSelected ? 'selected' : ''}" data-hotbar="${i}">
                <span class="slot-key">${i + 1}</span>
                ${item ? `<div class="slot-icon" style="background: ${getBlockColorPreview(item.type)}; border: 1px solid #111;"></div><span class="slot-count">${item.count > 1 ? item.count : ''}</span>` : ''}
            </div>
        `;
    }
    hotbarEl.innerHTML = hotbarHtml;

    // 4. Mode Panel & Buttons
    const modePanel = document.getElementById('mode-panel');
    if (modePanel) {
        modePanel.textContent = `Mode: ${game.player.isCreative ? 'Creative (Flying: ' + (game.player.isFlying ? 'ON' : 'OFF') + ')' : 'Survival'}`;
    }
    const pvpBtn = document.getElementById('pvp-btn');
    if (pvpBtn) {
        pvpBtn.textContent = `PvP: ${game.player.pvp ? 'ON' : 'OFF'}`;
        pvpBtn.style.background = game.player.pvp ? '#a83232' : '#328832';
    }
    const modeBtn = document.getElementById('gamemode-btn');
    if (modeBtn) {
        modeBtn.textContent = game.player.isCreative ? 'Switch to Survival' : 'Switch to Creative';
    }
}

// Render Full Inventory Grid & Dragging UI
function updateInventoryUI() {
    const mainGrid = document.getElementById('main-inv-grid');
    const hotbarGrid = document.getElementById('hotbar-inv-grid');
    if (!mainGrid || !hotbarGrid) return;
    const activeSlot = document.activeElement?.closest?.('[data-slot], [data-craft]');
    const focusTarget = activeSlot ? { kind: activeSlot.hasAttribute('data-slot') ? 'inventory' : 'crafting', index: Number(activeSlot.dataset.slot ?? activeSlot.dataset.craft) } : null;

    // 27 Main inventory slots (index 9 to 35)
    let mainHtml = '';
    for (let i = 9; i < 36; i++) {
        const item = playerInventory[i];
        mainHtml += `
            <div class="grid-slot" data-slot="${i}" tabindex="0" role="gridcell" aria-label="${item ? `${item.count} ${item.type}` : 'Empty inventory slot'}">
                ${item ? `<div class="slot-icon" style="background: ${getBlockColorPreview(item.type)};"></div><span class="slot-count">${item.count > 1 ? item.count : ''}</span>` : ''}
            </div>
        `;
    }
    mainGrid.innerHTML = mainHtml;

    // 9 Hotbar slots (index 0 to 8)
    let hotbarHtml = '';
    for (let i = 0; i < 9; i++) {
        const item = playerInventory[i];
        hotbarHtml += `
            <div class="grid-slot ${selectedHotbarIndex === i ? 'selected' : ''}" data-slot="${i}" tabindex="0" role="gridcell" aria-label="Hotbar ${i + 1}${item ? `, ${item.count} ${item.type}` : ', empty'}">
                ${item ? `<div class="slot-icon" style="background: ${getBlockColorPreview(item.type)};"></div><span class="slot-count">${item.count > 1 ? item.count : ''}</span>` : ''}
            </div>
        `;
    }
    hotbarGrid.innerHTML = hotbarHtml;

    renderCraftingUI();
    attachSlotListeners();
    if (isInventoryOpen && focusTarget) {
        const selector = focusTarget.kind === 'inventory' ? `[data-slot="${focusTarget.index}"]` : `[data-craft="${focusTarget.index}"]`;
        document.querySelector(selector)?.focus({ preventScroll: true });
    }
}

function renderCraftingUI() {
    const craftGrid = document.getElementById('craft-input-grid');
    const outputSlot = document.getElementById('craft-output-slot');
    if (!craftGrid || !outputSlot) return;

    let craftHtml = '';
    for (let i = 0; i < 4; i++) {
        const item = craftingGrid[i];
        craftHtml += `
            <div class="grid-slot" data-craft="${i}" tabindex="0" role="gridcell" aria-label="Crafting slot ${i + 1}${item ? `, ${item.count} ${item.type}` : ', empty'}">
                ${item ? `<div class="slot-icon" style="background: ${getBlockColorPreview(item.type)};"></div><span class="slot-count">${item.count > 1 ? item.count : ''}</span>` : ''}
            </div>
        `;
    }
    craftGrid.innerHTML = craftHtml;

    outputSlot.setAttribute('tabindex', craftOutput ? '0' : '-1');
    outputSlot.setAttribute('role', 'button');
    outputSlot.setAttribute('aria-label', craftOutput ? `Craft ${craftOutput.count} ${craftOutput.type}` : 'Crafting output unavailable');
    outputSlot.classList.toggle('disabled', !craftOutput);
    outputSlot.innerHTML = craftOutput ? `
        <div class="slot-icon" style="width:32px; height:32px; background: ${getBlockColorPreview(craftOutput.type)};"></div>
        <span class="slot-count" style="font-size:18px;">${craftOutput.count > 1 ? craftOutput.count : ''}</span>
    ` : '';

    attachSlotListeners();
}

function attachSlotListeners() {
    document.querySelectorAll('[data-slot], [data-craft], #craft-output-slot').forEach(el => {
        el.draggable = false;
    });
}

function handleSlotClick(slot, button = 0, shiftKey = false) {
    if (slot.kind === 'output') {
        if (button === 0) takeCraftOutput();
        return;
    }
    if (shiftKey && !draggedItem) {
        quickTransfer(slot);
        return;
    }

    const current = getSlotStack(slot);
    if (!draggedItem) {
        if (!current) return;
        const pickedCount = button === 2 ? Math.ceil(current.count / 2) : current.count;
        draggedItem = { type: current.type, count: pickedCount };
        current.count -= pickedCount;
        if (current.count <= 0) setSlotStack(slot, null);
        cursorOrigin = { ...slot };
    } else if (button === 2) {
        const capacity = slotCapacity(slot, draggedItem);
        if (capacity > 0) {
            if (current) current.count++;
            else setSlotStack(slot, { type: draggedItem.type, count: 1 });
            draggedItem.count--;
            if (draggedItem.count <= 0) { draggedItem = null; cursorOrigin = null; }
        }
    } else if (!current) {
        const placed = Math.min(draggedItem.count, MAX_STACK_SIZE);
        setSlotStack(slot, { type: draggedItem.type, count: placed });
        draggedItem.count -= placed;
        if (draggedItem.count <= 0) { draggedItem = null; cursorOrigin = null; }
    } else if (current.type === draggedItem.type) {
        const moved = Math.min(draggedItem.count, slotCapacity(slot, draggedItem));
        current.count += moved;
        draggedItem.count -= moved;
        if (draggedItem.count <= 0) { draggedItem = null; cursorOrigin = null; }
    } else if (draggedItem.count <= MAX_STACK_SIZE) {
        setSlotStack(slot, draggedItem);
        draggedItem = current;
        cursorOrigin = { ...slot };
    }

    if (slot.kind === 'crafting') updateCrafting();
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
    updateDragIcon();
}

function quickTransfer(slot) {
    const source = getSlotStack(slot);
    if (!source || slot.kind === 'output') return;
    let destinations = [];
    if (slot.kind === 'crafting') {
        destinations = playerInventory.map((_, index) => ({ kind: 'inventory', index }));
    } else {
        const start = slot.index < 9 ? 9 : 0;
        const end = slot.index < 9 ? 36 : 9;
        destinations = Array.from({ length: end - start }, (_, offset) => ({ kind: 'inventory', index: start + offset }));
    }
    let remaining = source.count;
    for (const destination of destinations) {
        const target = getSlotStack(destination);
        if (!target || target.type !== source.type) continue;
        const moved = Math.min(remaining, slotCapacity(destination, source));
        target.count += moved;
        remaining -= moved;
        if (!remaining) break;
    }
    for (const destination of destinations) {
        if (remaining <= 0) break;
        if (getSlotStack(destination)) continue;
        const moved = Math.min(remaining, MAX_STACK_SIZE);
        setSlotStack(destination, { type: source.type, count: moved });
        remaining -= moved;
    }
    if (remaining === source.count) return;
    if (remaining <= 0) setSlotStack(slot, null);
    else source.count = remaining;
    if (slot.kind === 'crafting') updateCrafting();
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
}

function getDragDistribution(slots, button, stack) {
    const eligible = Array.from(slots.values()).map(slot => ({ slot, capacity: slotCapacity(slot, stack) })).filter(entry => entry.capacity > 0);
    const distribution = new Map();
    if (button === 2) {
        for (const { slot } of eligible) distribution.set(slot.element, 1);
        return distribution;
    }
    let remaining = stack.count;
    let active = eligible.slice();
    while (remaining > 0 && active.length) {
        const evenShare = Math.floor(remaining / active.length);
        const amount = evenShare > 0 ? evenShare : 1;
        let placed = 0;
        for (const entry of active) {
            const already = distribution.get(entry.slot.element) || 0;
            const add = Math.min(amount, entry.capacity - already, remaining);
            if (add > 0) {
                distribution.set(entry.slot.element, already + add);
                remaining -= add;
                placed += add;
            }
        }
        active = active.filter(entry => (distribution.get(entry.slot.element) || 0) < entry.capacity);
        if (!placed) break;
    }
    return distribution;
}

function clearDragPreview() {
    document.querySelectorAll('.grid-slot.drag-preview').forEach(slot => {
        slot.classList.remove('drag-preview');
        slot.removeAttribute('data-preview-count');
    });
}

function showDragPreview() {
    if (!inventoryGesture?.dragged || !draggedItem) return;
    clearDragPreview();
    const distribution = getDragDistribution(inventoryGesture.slots, inventoryGesture.button, draggedItem);
    for (const [element, count] of distribution) {
        element.classList.add('drag-preview');
        element.setAttribute('data-preview-count', String(count));
    }
}

function applyDragDistribution() {
    if (!inventoryGesture?.dragged || !draggedItem) return;
    const distribution = getDragDistribution(inventoryGesture.slots, inventoryGesture.button, draggedItem);
    for (const [element, count] of distribution) {
        const slot = getInventorySlot(element);
        const existing = getSlotStack(slot);
        if (existing) existing.count += count;
        else setSlotStack(slot, { type: draggedItem.type, count });
        draggedItem.count -= count;
    }
    if (draggedItem.count <= 0) { draggedItem = null; cursorOrigin = null; }
    if (Array.from(inventoryGesture.slots.values()).some(slot => slot.kind === 'crafting')) updateCrafting();
    clearDragPreview();
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
    updateDragIcon();
}

function restoreCursorStack() {
    if (!draggedItem) return;
    let remaining = draggedItem.count;
    const origin = cursorOrigin && { ...cursorOrigin };
    if (origin && canPlaceInSlot(origin, draggedItem)) {
        const current = getSlotStack(origin);
        if (!current || current.type === draggedItem.type) {
            const capacity = slotCapacity(origin, draggedItem);
            const returned = Math.min(remaining, capacity);
            if (returned) {
                if (current) current.count += returned;
                else setSlotStack(origin, { type: draggedItem.type, count: returned });
                remaining -= returned;
            }
        }
    }
    for (let index = 0; index < playerInventory.length && remaining > 0; index++) {
        const slot = { kind: 'inventory', index };
        const current = playerInventory[index];
        if (!current || current.type !== draggedItem.type) continue;
        const returned = Math.min(remaining, slotCapacity(slot, draggedItem));
        current.count += returned;
        remaining -= returned;
    }
    for (let index = 0; index < playerInventory.length && remaining > 0; index++) {
        if (playerInventory[index]) continue;
        const returned = Math.min(remaining, MAX_STACK_SIZE);
        playerInventory[index] = { type: draggedItem.type, count: returned };
        remaining -= returned;
    }
    if (remaining <= 0) {
        draggedItem = null;
        cursorOrigin = null;
    } else {
        draggedItem.count = remaining;
        showNotice('No room to return the held stack. Reopen inventory to continue.');
    }
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
    updateDragIcon();
}

function canReturnOnClose(stacks) {
    const simulated = playerInventory.map(stack => stack ? { ...stack } : null);
    for (const stack of stacks.filter(Boolean)) {
        let remaining = stack.count;
        for (const slot of simulated) {
            if (!slot || slot.type !== stack.type || slot.count >= MAX_STACK_SIZE) continue;
            const moved = Math.min(remaining, MAX_STACK_SIZE - slot.count);
            slot.count += moved;
            remaining -= moved;
            if (!remaining) break;
        }
        for (let index = 0; index < simulated.length && remaining > 0; index++) {
            if (simulated[index]) continue;
            const moved = Math.min(remaining, MAX_STACK_SIZE);
            simulated[index] = { type: stack.type, count: moved };
            remaining -= moved;
        }
        if (remaining) return false;
    }
    return true;
}

function storeStackInInventory(stack) {
    let remaining = stack.count;
    for (let index = 0; index < playerInventory.length && remaining > 0; index++) {
        const current = playerInventory[index];
        if (!current || current.type !== stack.type || current.count >= MAX_STACK_SIZE) continue;
        const moved = Math.min(remaining, MAX_STACK_SIZE - current.count);
        current.count += moved;
        remaining -= moved;
    }
    for (let index = 0; index < playerInventory.length && remaining > 0; index++) {
        if (playerInventory[index]) continue;
        const moved = Math.min(remaining, MAX_STACK_SIZE);
        playerInventory[index] = { type: stack.type, count: moved };
        remaining -= moved;
    }
    return remaining === 0;
}

function gatherMatchingItems() {
    if (!draggedItem) return;
    let remaining = MAX_STACK_SIZE - draggedItem.count;
    if (remaining <= 0) return;
    const slots = [
        ...playerInventory.map((_, index) => ({ kind: 'inventory', index })),
        ...craftingGrid.map((_, index) => ({ kind: 'crafting', index }))
    ];
    for (const slot of slots) {
        const stack = getSlotStack(slot);
        if (!stack || stack.type !== draggedItem.type) continue;
        const moved = Math.min(remaining, stack.count);
        stack.count -= moved;
        draggedItem.count += moved;
        remaining -= moved;
        if (!stack.count) setSlotStack(slot, null);
        if (!remaining) break;
    }
    if (craftingGrid.some(Boolean) || craftOutput) updateCrafting();
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
    updateDragIcon();
}

function swapFocusedWithHotbar(slot, hotbarIndex) {
    if (slot.kind !== 'inventory' || draggedItem) return;
    const current = playerInventory[slot.index];
    const hotbar = playerInventory[hotbarIndex];
    if (slot.index === hotbarIndex) return;
    playerInventory[slot.index] = hotbar;
    playerInventory[hotbarIndex] = current;
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
}

function onInventoryPointerDown(event) {
    if (!isInventoryOpen || (event.button !== 0 && event.button !== 2)) return;
    cursorClientX = event.clientX;
    cursorClientY = event.clientY;
    lastInventoryInput = 'mouse';
    const slot = getInventorySlot(event.target);
    if (!slot) return;
    event.preventDefault();
    event.stopPropagation();
    slot.element.focus({ preventScroll: true });

    if (slot.kind === 'output') {
        inventoryGesture = { button: event.button, start: slot, startX: event.clientX, startY: event.clientY, dragged: false, slots: new Map() };
        return;
    }

    const now = performance.now();
    const clickType = getSlotStack(slot)?.type || draggedItem?.type;
    if (event.button === 0 && draggedItem && lastInventoryClick && now - lastInventoryClick.time < 360 && lastInventoryClick.type === draggedItem.type) {
        gatherMatchingItems();
        lastInventoryClick = null;
        inventoryGesture = { button: event.button, start: slot, startX: event.clientX, startY: event.clientY, dragged: false, slots: new Map(), suppressClick: true };
        return;
    }

    inventoryGesture = { button: event.button, start: slot, startX: event.clientX, startY: event.clientY, dragged: false, slots: new Map() };
    if (draggedItem) {
        inventoryGesture.slots.set(slot.element, slot);
        showDragPreview();
    }
    inventoryGesture.clickType = clickType;
}

function onInventoryPointerMove(event) {
    cursorClientX = event.clientX;
    cursorClientY = event.clientY;
    lastInventoryInput = 'mouse';
    const gesture = inventoryGesture;
    if (!isInventoryOpen || !gesture) return;
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 4) gesture.dragged = true;
    if (!gesture.dragged || !draggedItem) return;
    const slot = getInventorySlot(document.elementFromPoint(event.clientX, event.clientY));
    if (!slot || slot.kind === 'output') return;
    if (!gesture.slots.has(slot.element)) {
        gesture.slots.set(slot.element, slot);
        showDragPreview();
    }
}

function onInventoryPointerUp(event) {
    const gesture = inventoryGesture;
    if (!gesture) {
        const gui = document.getElementById('inventory-gui');
        if (isInventoryOpen && draggedItem && gui && !gui.contains(document.elementFromPoint(event.clientX, event.clientY))) restoreCursorStack();
        return;
    }
    inventoryGesture = null;
    clearDragPreview();
    if (!isInventoryOpen) return;
    if (gesture.suppressClick) return;
    if (gesture.dragged && draggedItem) {
        inventoryGesture = gesture;
        applyDragDistribution();
        inventoryGesture = null;
        return;
    }
    const releasedSlot = getInventorySlot(document.elementFromPoint(event.clientX, event.clientY));
    const slot = releasedSlot || gesture.start;
    const gui = document.getElementById('inventory-gui');
    if (!slot || (gui && !gui.contains(document.elementFromPoint(event.clientX, event.clientY)) && !releasedSlot)) {
        restoreCursorStack();
        return;
    }
    if (!gesture.start || !slot) return;
    const previousTime = lastInventoryClick?.time || 0;
    handleSlotClick(slot, gesture.button, event.shiftKey);
    if (gesture.button === 0 && draggedItem && gesture.clickType === draggedItem.type && performance.now() - previousTime < 360) {
        gatherMatchingItems();
        lastInventoryClick = null;
    } else {
        lastInventoryClick = { time: performance.now(), type: gesture.clickType || draggedItem?.type || null };
    }
}

function cancelInventoryGesture() {
    if (!inventoryGesture) return;
    clearDragPreview();
    inventoryGesture = null;
}

function onInventoryKeyDown(event) {
    if (!isInventoryOpen) return false;
    if (event.code === 'KeyQ' || event.code === 'Escape') {
        event.preventDefault();
        toggleInventory();
        return true;
    }
    const focusedSlot = getInventorySlot(document.activeElement);
    if (focusedSlot && /^Digit[1-9]$/.test(event.code)) {
        event.preventDefault();
        swapFocusedWithHotbar(focusedSlot, Number(event.code.slice(-1)) - 1);
        return true;
    }
    if (focusedSlot && (event.code === 'Enter' || event.code === 'Space')) {
        event.preventDefault();
        lastInventoryInput = 'keyboard';
        if (event.shiftKey) quickTransfer(focusedSlot);
        else handleSlotClick(focusedSlot, 0, false);
        return true;
    }
    if (focusedSlot && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        event.preventDefault();
        lastInventoryInput = 'keyboard';
        const elements = Array.from(document.querySelectorAll('[data-slot], [data-craft]')).filter(el => el.tabIndex >= 0);
        const index = elements.indexOf(focusedSlot.element);
        const offset = event.code === 'ArrowLeft' ? -1 : event.code === 'ArrowRight' ? 1 : event.code === 'ArrowUp' ? -9 : 9;
        elements[(index + offset + elements.length) % elements.length]?.focus();
        return true;
    }
    return true;
}

function updateDragIcon() {
    const dragEl = document.getElementById('drag-icon');
    const dragPreview = document.getElementById('drag-preview');
    const dragCount = document.getElementById('drag-count');

    if (!draggedItem || !isInventoryOpen) {
        if (dragEl) dragEl.style.display = 'none';
        return;
    }

    if (dragEl && dragPreview && dragCount) {
        dragEl.style.display = 'block';
        if (lastInventoryInput === 'keyboard') {
            const focused = getInventorySlot(document.activeElement)?.element;
            const rect = focused?.getBoundingClientRect();
            if (rect) {
                dragEl.style.left = `${rect.left + rect.width / 2 - 18}px`;
                dragEl.style.top = `${rect.top + rect.height / 2 - 18}px`;
            }
        } else {
            dragEl.style.left = `${cursorClientX - 18}px`;
            dragEl.style.top = `${cursorClientY - 18}px`;
        }
        dragPreview.style.background = getBlockColorPreview(draggedItem.type);
        dragCount.textContent = draggedItem.count > 1 ? draggedItem.count : '';
    }
}

document.addEventListener('mousemove', (e) => {
    cursorClientX = e.clientX;
    cursorClientY = e.clientY;
    lastInventoryInput = 'mouse';
    const dragEl = document.getElementById('drag-icon');
    if (dragEl && isInventoryOpen && draggedItem) {
        dragEl.style.left = `${e.clientX - 18}px`;
        dragEl.style.top = `${e.clientY - 18}px`;
    }
});

function toggleInventory() {
    const invScreen = document.getElementById('inventory-screen');
    if (!isInventoryOpen) {
        isInventoryOpen = true;
        invScreen.style.display = 'flex';
        game.controls.unlock();
        updateInventoryUI();
        renderPlayerPreview();
        document.querySelector(`[data-slot="${selectedHotbarIndex}"]`)?.focus({ preventScroll: true });
    } else {
        cancelInventoryGesture();
        const returning = [...(draggedItem ? [{ ...draggedItem }] : []), ...craftingGrid.filter(Boolean).map(stack => ({ ...stack }))];
        if (!canReturnOnClose(returning)) {
            showNotice('Make room in your inventory before closing.');
            return;
        }
        if (draggedItem) {
            storeStackInInventory(draggedItem);
            draggedItem = null;
            cursorOrigin = null;
        }
        for (let i = 0; i < craftingGrid.length; i++) {
            if (craftingGrid[i]) storeStackInInventory(craftingGrid[i]);
            craftingGrid[i] = null;
        }
        updateCrafting();
        isInventoryOpen = false;
        invScreen.style.display = 'none';
        updateHud();
        updateHeldItemMesh();
        updateDragIcon();
        if (ready) game.controls.lock();
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
// 5. VOXEL CLOUDS, STARS, SUN & MOON
// ==========================================
function createMinecraftClouds() {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    
    for (let x = -200; x <= 200; x += 16) {
        for (let z = -200; z <= 200; z += 16) {
            if (Math.random() > 0.45) {
                const cloud = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), cloudMat);
                cloud.position.set(x, 48, z);
                cloudGroup.add(cloud);
            }
        }
    }
    return cloudGroup;
}

function createSkyDiorama() {
    const group = new THREE.Group();

    // Pixel Sun
    const sunGeom = new THREE.PlaneGeometry(12, 12);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffbb, side: THREE.DoubleSide });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    group.add(sun);
    game.sun = sun;

    // Pixel Moon
    const moonGeom = new THREE.PlaneGeometry(10, 10);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xddddff, side: THREE.DoubleSide });
    const moon = new THREE.Mesh(moonGeom, moonMat);
    group.add(moon);
    game.moon = moon;

    // Stars
    const starGeom = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 300; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 180;
        starCoords.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }
    starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    const stars = new THREE.Points(starGeom, starMat);
    group.add(stars);
    game.stars = stars;

    return group;
}

// ==========================================
// 6. FIRST PERSON STEVE ARM & SWINGING
// ==========================================
function createFirstPersonArm() {
    const armGroup = new THREE.Group();

    const armGeom = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterials = [
        new THREE.MeshLambertMaterial({ map: textures.steveShirt }),
        new THREE.MeshLambertMaterial({ map: textures.steveShirt }),
        new THREE.MeshLambertMaterial({ map: textures.steveFace }),
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
// 7. BLOCK SELECTION OUTLINE BOX
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
    const intersects = game.raycaster.intersectObjects(getWorldMeshes());

    if (intersects.length > 0) {
        const b = blockFromHit(intersects[0]);
        game.selectionBox.position.set(b.x, b.y, b.z);
        game.selectionBox.visible = true;
    } else {
        game.selectionBox.visible = false;
    }
}

// ==========================================
// 8. INITIALIZE ENGINE & GRAPHICS
// ==========================================
function init() {
    // Create Scene
    game.scene = new THREE.Scene();
    game.scene.background = new THREE.Color(0x78a7ff);
    game.scene.fog = new THREE.Fog(0x78a7ff, 20, RENDER_DISTANCE * BLOCK_SIZE);

    // Camera
    game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    game.camera.position.set(WORLD_WIDTH / 2, WORLD_HEIGHT + 5, WORLD_DEPTH / 2);

    // Renderer
    game.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    document.body.appendChild(game.renderer.domElement);

    // Lighting
    game.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    game.scene.add(game.ambientLight);

    game.sunLight = new THREE.DirectionalLight(0xfffbe8, 0.85);
    game.sunLight.position.set(45, 90, 30);
    game.scene.add(game.sunLight);

    // Clouds & Celestial Bodies
    game.clouds = createMinecraftClouds();
    game.scene.add(game.clouds);
    game.scene.add(createSkyDiorama());

    // Selection Box & First-person Arm
    createSelectionOutline();
    game.scene.add(game.camera);
    createFirstPersonArm();
    initPlayerPreview();

    // Controls
    game.controls = new PointerLockControls(game.camera, document.body);

    const startScreen = document.getElementById('start-screen');
    const playBtn = document.getElementById('play-btn');

    function lockGame() {
        initAudio();
        if (ready) {
            game.controls.lock();
        }
    }

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        lockGame();
    });

    startScreen.addEventListener('click', (e) => {
        if (e.target === startScreen || e.target.classList.contains('title-logo') || e.target.classList.contains('instructions-list')) {
            lockGame();
        }
    });

    const closeInvBtn = document.getElementById('close-inv-btn');
    if (closeInvBtn) {
        closeInvBtn.addEventListener('click', () => {
            toggleInventory();
        });
    }

    game.controls.addEventListener('lock', () => {
        startScreen.style.display = 'none';
    });

    game.controls.addEventListener('unlock', () => {
        isMining = false;
        miningProgress = 0;
        miningTarget = null;
        const progressEl = document.getElementById('mining-progress');
        if (progressEl) progressEl.style.display = 'none';
        startScreen.style.display = 'flex';
    });

    // Buttons
    document.getElementById('pvp-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        togglePvP();
    });

    document.getElementById('gamemode-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleGamemode();
    });

    // Network Connect
    connectToServer();

    // Events
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerdown', onInventoryPointerDown);
    document.addEventListener('pointermove', onInventoryPointerMove);
    document.addEventListener('pointerup', onInventoryPointerUp);
    document.addEventListener('pointercancel', cancelInventoryGesture);

    // Animation loop
    animate();
}

function togglePvP() {
    game.player.pvp = !game.player.pvp;
    send({ type: 'pvpToggle', pvp: game.player.pvp });
    updateHud();
    showNotice(`PvP is now ${game.player.pvp ? 'ON' : 'OFF'}`);
}

function toggleGamemode() {
    game.player.isCreative = !game.player.isCreative;
    if (game.player.isCreative) {
        game.health = 20;
        game.hunger = 20;
        showNotice('Switched to Creative Mode (Double-tap Space to fly)');
    } else {
        game.player.isFlying = false;
        showNotice('Switched to Survival Mode');
    }
    updateHud();
}

// ==========================================
// 9. WORLD & BLOCK MANAGEMENT (CHUNKED MESHER)
// ==========================================
// Blocks live in game.blockTypes (key "x,y,z" -> type). Each 16x16 column
// chunk is merged into ONE mesh per material containing only exposed faces.
// This collapses ~50k block meshes into ~100 chunk meshes (only exposed
// faces, no overdraw, tiny raycast list) and keeps the game at 60 FPS.
const NEIGHBORS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const CHUNK = 16;
const CHUNKS_X = WORLD_SIZE / CHUNK;
const CHUNKS_Z = WORLD_SIZE / CHUNK;

// Face templates (CCW winding from outside). matIndex maps into the
// blockMaterials array order [+X, -X, +Y, -Y, +Z, -Z].
const FACES = [
    { dir: [-1, 0, 0], matIndex: 1, corners: [
        { pos: [0, 1, 0], uv: [0, 1] }, { pos: [0, 0, 0], uv: [0, 0] },
        { pos: [0, 1, 1], uv: [1, 1] }, { pos: [0, 0, 1], uv: [1, 0] } ] },
    { dir: [1, 0, 0], matIndex: 0, corners: [
        { pos: [1, 1, 1], uv: [0, 1] }, { pos: [1, 0, 1], uv: [0, 0] },
        { pos: [1, 1, 0], uv: [1, 1] }, { pos: [1, 0, 0], uv: [1, 0] } ] },
    { dir: [0, -1, 0], matIndex: 3, corners: [
        { pos: [1, 0, 1], uv: [1, 0] }, { pos: [0, 0, 1], uv: [0, 0] },
        { pos: [1, 0, 0], uv: [1, 1] }, { pos: [0, 0, 0], uv: [0, 1] } ] },
    { dir: [0, 1, 0], matIndex: 2, corners: [
        { pos: [0, 1, 1], uv: [1, 1] }, { pos: [1, 1, 1], uv: [0, 1] },
        { pos: [0, 1, 0], uv: [1, 0] }, { pos: [1, 1, 0], uv: [0, 0] } ] },
    { dir: [0, 0, -1], matIndex: 5, corners: [
        { pos: [1, 0, 0], uv: [0, 0] }, { pos: [0, 0, 0], uv: [1, 0] },
        { pos: [1, 1, 0], uv: [0, 1] }, { pos: [0, 1, 0], uv: [1, 1] } ] },
    { dir: [0, 0, 1], matIndex: 4, corners: [
        { pos: [0, 0, 1], uv: [0, 0] }, { pos: [1, 0, 1], uv: [1, 0] },
        { pos: [0, 1, 1], uv: [0, 1] }, { pos: [1, 1, 1], uv: [1, 1] } ] }
];

const dirtyChunks = new Set();
let chunkMeshList = [];

function chunkKey(cx, cz) {
    return `${cx},${cz}`;
}

function markBlockDirty(x, y, z) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const cx = Math.floor((x + dx) / CHUNK), cz = Math.floor((z + dz) / CHUNK);
            if (cx < 0 || cz < 0 || cx >= CHUNKS_X || cz >= CHUNKS_Z) continue;
            dirtyChunks.add(chunkKey(cx, cz));
        }
    }
}

function buildChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    const old = game.chunks.get(key);
    if (old) for (const m of old.meshes) { game.scene.remove(m); m.geometry.dispose(); }

    const buckets = new Map(); // material -> vertex arrays
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    for (let x = x0; x < x0 + CHUNK; x++) {
        for (let z = z0; z < z0 + CHUNK; z++) {
            for (let y = 0; y <= 48; y++) {
                const type = game.blockTypes.get(`${x},${y},${z}`);
                if (!type) continue;
                const mats = blockMaterials[type] || blockMaterials.dirt;
                for (const face of FACES) {
                    if (game.blockTypes.has(`${x + face.dir[0]},${y + face.dir[1]},${z + face.dir[2]}`)) continue;
                    const mat = Array.isArray(mats) ? mats[face.matIndex] : mats;
                    let b = buckets.get(mat);
                    if (!b) { b = { positions: [], normals: [], uvs: [], indices: [] }; buckets.set(mat, b); }
                    const ndx = b.positions.length / 3;
                    for (const c of face.corners) {
                        b.positions.push(x - 0.5 + c.pos[0], y - 0.5 + c.pos[1], z - 0.5 + c.pos[2]);
                        b.normals.push(face.dir[0], face.dir[1], face.dir[2]);
                        b.uvs.push(c.uv[0], c.uv[1]);
                    }
                    b.indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
                }
            }
        }
    }

    const meshes = [];
    for (const [mat, b] of buckets) {
        if (b.indices.length === 0) continue;
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(b.uvs, 2));
        geom.setIndex(b.indices);
        geom.computeBoundingSphere();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        game.scene.add(mesh);
        meshes.push(mesh);
    }
    game.chunks.set(key, { meshes });
}

function rebuildChunkList() {
    chunkMeshList = [];
    for (const rec of game.chunks.values()) chunkMeshList.push(...rec.meshes);
}

function processDirtyChunks() {
    if (dirtyChunks.size === 0) return;
    for (const key of dirtyChunks) {
        const [cx, cz] = key.split(',').map(Number);
        buildChunk(cx, cz);
    }
    dirtyChunks.clear();
    rebuildChunkList();
}

function buildAllChunks() {
    for (let cx = 0; cx < CHUNKS_X; cx++) {
        for (let cz = 0; cz < CHUNKS_Z; cz++) buildChunk(cx, cz);
    }
    rebuildChunkList();
}

function clearWorldMeshes() {
    for (const rec of game.chunks.values()) {
        for (const m of rec.meshes) { game.scene.remove(m); m.geometry.dispose(); }
    }
    game.chunks.clear();
    dirtyChunks.clear();
    chunkMeshList = [];
}

function getWorldMeshes() {
    return chunkMeshList;
}

// Resolve the aimed-at block from a raycast hit on a chunk mesh.
// Chunk meshes are untransformed, so face normals are world-space.
function blockFromHit(intersect) {
    const p = intersect.point, n = intersect.face.normal;
    return {
        x: Math.floor(p.x - n.x * 0.5),
        y: Math.floor(p.y - n.y * 0.5),
        z: Math.floor(p.z - n.z * 0.5)
    };
}

function addBlock(x, y, z, type) {
    game.blockTypes.set(`${x},${y},${z}`, type);
    markBlockDirty(x, y, z);
}

function removeBlock(x, y, z, collect) {
    const key = `${x},${y},${z}`;
    const type = game.blockTypes.get(key);
    if (!type) return false;
    game.blockTypes.delete(key);
    markBlockDirty(x, y, z);
    if (collect) {
        playSound('break', type);
        addToInventory(type, 1);
    }
    return true;
}

// Replays a server edit without side effects (no sound, no inventory pickup)
function applyEdit(x, y, z, type) {
    const key = `${x},${y},${z}`;
    if (type === null || type === undefined) game.blockTypes.delete(key);
    else game.blockTypes.set(key, type);
    markBlockDirty(x, y, z);
}

function getBlock(x, y, z) {
    return game.blockTypes.get(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`);
}

function surface(x, z) {
    for (let y = 48; y >= 0; y--) {
        if (game.blockTypes.has(`${Math.round(x)},${y},${Math.round(z)}`)) return y + 0.5;
    }
    return -0.5;
}

// Deterministic terrain + oak trees. MUST mirror the original server-side
// generation exactly so every client builds the identical base world.
function generateTerrain(size) {
    // Ground columns
    for (let x = 0; x < size; x++) for (let z = 0; z < size; z++) {
        const height = terrainHeight(x, z);
        for (let y = 0; y <= height; y++) {
            game.blockTypes.set(`${x},${y},${z}`, y === height ? 'grass' : y >= height - 3 ? 'dirt' : 'stone');
        }
    }

    // Procedural oak trees on an 8x8 jittered grid
    for (let x = 4; x < size - 4; x += 8) {
        for (let z = 4; z < size - 4; z += 8) {
            const rx = x + Math.floor(Math.sin(x * 12 + z) * 3);
            const rz = z + Math.floor(Math.cos(z * 12 + x) * 3);
            if (rx < 3 || rx >= size - 3 || rz < 3 || rz >= size - 3) continue;

            const groundHeight = terrainHeight(rx, rz);
            const trunkH = 4;

            for (let ty = 1; ty <= trunkH; ty++) {
                game.blockTypes.set(`${rx},${groundHeight + ty},${rz}`, 'wood');
            }
            for (let lx = -2; lx <= 2; lx++) {
                for (let lz = -2; lz <= 2; lz++) {
                    for (let ly = trunkH - 1; ly <= trunkH + 1; ly++) {
                        if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === trunkH + 1) continue;
                        if (lx === 0 && lz === 0 && ly <= trunkH) continue; // trunk occupies center
                        const key = `${rx + lx},${groundHeight + ly},${rz + lz}`;
                        if (!game.blockTypes.has(key)) game.blockTypes.set(key, 'leaves');
                    }
                }
            }
        }
    }

    buildAllChunks();
}

// Calculate mining hardness based on block type and depth (y)
function getBlockHardness(y, blockType) {
    if (game.player.isCreative) return 0.01; // Instant break in Creative
    let base = 0.4;
    if (blockType === 'stone') base = 1.0;
    if (blockType === 'wood') base = 0.8;
    if (blockType === 'dirt') base = 0.3;
    if (blockType === 'sand') base = 0.25;

    // Deeper under ground (y from 12 down to 0) = significantly harder!
    const depthFactor = Math.max(1, (16 - y) * 0.25);
    return base * depthFactor;
}

// ==========================================
// 10. AUTHENTIC MOBS (ZOMBIE, SKELETON, CREEPER, PIG)
// ==========================================
function createMobModel(type) {
    const mob = new THREE.Group();

    if (type === 'pig') {
        const pigMat = new THREE.MeshLambertMaterial({ map: textures.pigSkin });
        const snoutMat = new THREE.MeshLambertMaterial({ map: textures.pigSnout });

        const body = new THREE.Mesh(sharedGeometry, pigMat);
        body.position.set(0, 0.55, 0);
        body.scale.set(0.9, 0.65, 1.2);
        mob.add(body);

        // Face only on the front (+Z); other sides are plain pig skin
        const head = new THREE.Mesh(sharedGeometry, headMaterials(textures.pigSnout, textures.pigSkin));
        head.position.set(0, 0.95, 0.7);
        head.scale.set(0.65, 0.65, 0.65);
        mob.add(head);

        const snout = new THREE.Mesh(sharedGeometry, snoutMat);
        snout.position.set(0, 0.85, 1.05);
        snout.scale.set(0.35, 0.25, 0.15);
        mob.add(snout);

        [[-0.3, 0.2, -0.4], [0.3, 0.2, -0.4], [-0.3, 0.2, 0.4], [0.3, 0.2, 0.4]].forEach(([lx, ly, lz]) => {
            const leg = new THREE.Mesh(sharedGeometry, pigMat);
            leg.position.set(lx, ly, lz);
            leg.scale.set(0.22, 0.4, 0.22);
            mob.add(leg);
        });

    } else if (type === 'zombie') {
        const skinMat = new THREE.MeshLambertMaterial({ map: textures.zombieSkin });
        const shirtMat = new THREE.MeshLambertMaterial({ map: textures.steveShirt });
        const pantsMat = new THREE.MeshLambertMaterial({ map: textures.stevePants });

        // Face only on the front (+Z); other sides are plain zombie skin
        const head = new THREE.Mesh(sharedGeometry, headMaterials(textures.zombieFace, textures.zombieSkin));
        head.position.set(0, 1.45, 0);
        head.scale.set(0.5, 0.5, 0.5);
        mob.add(head);

        const torso = new THREE.Mesh(sharedGeometry, shirtMat);
        torso.position.set(0, 0.85, 0);
        torso.scale.set(0.5, 0.7, 0.25);
        mob.add(torso);

        // Arms stretched forward like a classic zombie!
        const leftArm = new THREE.Mesh(sharedGeometry, skinMat);
        leftArm.position.set(-0.35, 1.0, 0.35);
        leftArm.scale.set(0.2, 0.2, 0.7);
        mob.add(leftArm);

        const rightArm = new THREE.Mesh(sharedGeometry, skinMat);
        rightArm.position.set(0.35, 1.0, 0.35);
        rightArm.scale.set(0.2, 0.2, 0.7);
        mob.add(rightArm);

        const leftLeg = new THREE.Mesh(sharedGeometry, pantsMat);
        leftLeg.position.set(-0.13, 0.25, 0);
        leftLeg.scale.set(0.22, 0.65, 0.24);
        mob.add(leftLeg);

        const rightLeg = new THREE.Mesh(sharedGeometry, pantsMat);
        rightLeg.position.set(0.13, 0.25, 0);
        rightLeg.scale.set(0.22, 0.65, 0.24);
        mob.add(rightLeg);

    } else if (type === 'skeleton') {
        const boneMat = new THREE.MeshLambertMaterial({ map: textures.skeletonBone });

        // Skull face only on the front (+Z)
        const head = new THREE.Mesh(sharedGeometry, headMaterials(textures.skeletonFace, textures.skeletonBone));
        head.position.set(0, 1.45, 0);
        head.scale.set(0.5, 0.5, 0.5);
        mob.add(head);

        const ribs = new THREE.Mesh(sharedGeometry, boneMat);
        ribs.position.set(0, 0.85, 0);
        ribs.scale.set(0.4, 0.7, 0.2);
        mob.add(ribs);

        // Bow holding pose
        const bowArm = new THREE.Mesh(sharedGeometry, boneMat);
        bowArm.position.set(0.3, 0.95, 0.3);
        bowArm.scale.set(0.15, 0.15, 0.6);
        mob.add(bowArm);

        // Bow mesh
        const bow = new THREE.Mesh(sharedGeometry, new THREE.MeshBasicMaterial({ color: 0x5a3d28 }));
        bow.position.set(0.3, 0.95, 0.6);
        bow.scale.set(0.08, 0.6, 0.08);
        mob.add(bow);

        const leftLeg = new THREE.Mesh(sharedGeometry, boneMat);
        leftLeg.position.set(-0.12, 0.25, 0);
        leftLeg.scale.set(0.15, 0.65, 0.15);
        mob.add(leftLeg);

        const rightLeg = new THREE.Mesh(sharedGeometry, boneMat);
        rightLeg.position.set(0.12, 0.25, 0);
        rightLeg.scale.set(0.15, 0.65, 0.15);
        mob.add(rightLeg);

    } else if (type === 'creeper') {
        const bodyMat = new THREE.MeshLambertMaterial({ map: textures.creeperBody });

        // Creeper grimace only on the front (+Z)
        const head = new THREE.Mesh(sharedGeometry, headMaterials(textures.creeperFace, textures.creeperBody));
        head.position.set(0, 1.25, 0);
        head.scale.set(0.5, 0.5, 0.5);
        mob.add(head);

        const body = new THREE.Mesh(sharedGeometry, bodyMat);
        body.position.set(0, 0.65, 0);
        body.scale.set(0.45, 0.7, 0.25);
        mob.add(body);

        [[-0.2, 0.15, -0.2], [0.2, 0.15, -0.2], [-0.2, 0.15, 0.2], [0.2, 0.15, 0.2]].forEach(([lx, ly, lz]) => {
            const leg = new THREE.Mesh(sharedGeometry, bodyMat);
            leg.position.set(lx, ly, lz);
            leg.scale.set(0.2, 0.35, 0.2);
            mob.add(leg);
        });
    }

    return mob;
}

function syncAnimals(list) {
    const ids = new Set(list.map(a => a.id));
    for (const [id, a] of game.animals) {
        if (!ids.has(id)) {
            game.scene.remove(a.model);
            clearHitFeedback(a.model);
            game.animals.delete(id);
        }
    }
    for (const data of list) {
        let a = game.animals.get(data.id);
        if (!a) {
            const mobType = data.type || (data.id.includes('zombie') ? 'zombie' : data.id.includes('skeleton') ? 'skeleton' : data.id.includes('creeper') ? 'creeper' : 'pig');
            const model = createMobModel(mobType);
            model.userData.animal = data.id;
            model.userData.mobType = mobType;
            game.scene.add(model);
            a = { model, angle: Math.random() * 6, turn: 0, type: mobType, shootClock: 0, fuseClock: 0 };
            game.animals.set(data.id, a);
            model.position.set(data.x, data.y, data.z);
        }
        Object.assign(a, data);
    }
}

// ==========================================
// 11. AUTHENTIC STEVE PLAYER MODEL (PvP TAG)
// ==========================================
function createSteveModel(pvpEnabled) {
    const group = new THREE.Group();

    const shirtMat = new THREE.MeshLambertMaterial({ map: textures.steveShirt });
    const pantsMat = new THREE.MeshLambertMaterial({ map: textures.stevePants });

    // Face only on the front (+Z); sides are plain skin, top is hair
    const head = new THREE.Mesh(sharedGeometry, headMaterials(textures.steveFace, textures.steveSkin, textures.steveHair));
    head.position.set(0, 1.35, 0);
    head.scale.set(0.5, 0.5, 0.5);
    group.add(head);

    const torso = new THREE.Mesh(sharedGeometry, shirtMat);
    torso.position.set(0, 0.75, 0);
    torso.scale.set(0.5, 0.7, 0.25);
    group.add(torso);

    const leftArm = new THREE.Mesh(sharedGeometry, shirtMat);
    leftArm.position.set(-0.35, 0.75, 0);
    leftArm.scale.set(0.2, 0.7, 0.22);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(sharedGeometry, shirtMat);
    rightArm.position.set(0.35, 0.75, 0);
    rightArm.scale.set(0.2, 0.7, 0.22);
    group.add(rightArm);

    const leftLeg = new THREE.Mesh(sharedGeometry, pantsMat);
    leftLeg.position.set(-0.13, 0.15, 0);
    leftLeg.scale.set(0.22, 0.65, 0.24);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(sharedGeometry, pantsMat);
    rightLeg.position.set(0.13, 0.15, 0);
    rightLeg.scale.set(0.22, 0.65, 0.24);
    group.add(rightLeg);

    // Name Tag with PvP indicator
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'Bold 28px monospace';
    ctx.fillStyle = pvpEnabled ? '#ff6666' : '#66ff66';
    ctx.textAlign = 'center';
    ctx.fillText(`Player [${pvpEnabled ? 'PvP' : 'Peace'}]`, canvas.width / 2, 44);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(2.4, 0.6, 1);
    sprite.position.y = 2.05;
    group.add(sprite);

    return group;
}

function addOtherPlayer(playerData) {
    if (game.otherPlayers.has(playerData.id)) return;
    const playerModel = createSteveModel(playerData.pvp !== false);
    playerModel.userData.player = playerData.id;
    playerModel.position.set(playerData.position.x, playerData.position.y - 1.6, playerData.position.z);

    game.scene.add(playerModel);
    game.otherPlayers.set(playerData.id, {
        model: playerModel,
        targetPosition: playerData.position,
        targetRotation: playerData.rotation,
        username: playerData.username,
        pvp: playerData.pvp !== false
    });
}

function removeOtherPlayer(playerId) {
    const player = game.otherPlayers.get(playerId);
    if (player) {
        game.scene.remove(player.model);
        clearHitFeedback(player.model);
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
// 12. MEAT DROPS & ARROWS
// ==========================================
function addMeat(data) {
    if (meatDrops.has(data.id)) return;
    const m = new THREE.Mesh(meatGeometry, meatMaterial);
    m.userData.base = data.y;
    m.position.set(data.x, data.y, data.z);
    game.scene.add(m);
    meatDrops.set(data.id, m);
}

function spawnSkeletonArrow(fromPos, targetPos) {
    const arrowGeom = new THREE.BoxGeometry(0.08, 0.08, 0.8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.position.copy(fromPos);
    arrow.lookAt(targetPos);

    const dir = targetPos.clone().sub(fromPos).normalize();
    game.scene.add(arrow);
    game.arrows.push({ mesh: arrow, dir, life: 3.0 });
    playSound('bow');
}

function updateArrows(delta) {
    for (let i = game.arrows.length - 1; i >= 0; i--) {
        const arrow = game.arrows[i];
        arrow.mesh.position.addScaledVector(arrow.dir, delta * 18);
        arrow.life -= delta;

        // Hit player check
        if (arrow.mesh.position.distanceTo(game.camera.position) < 1.2) {
            damage(3);
            showNotice('Shot by Skeleton!');
            game.scene.remove(arrow.mesh);
            game.arrows.splice(i, 1);
            continue;
        }

        if (arrow.life <= 0) {
            game.scene.remove(arrow.mesh);
            game.arrows.splice(i, 1);
        }
    }
}

// ==========================================
// 13. SURVIVAL, MOB BEHAVIOR & CONTINUOUS MINING
// ==========================================
function send(m) {
    if (ready && game.ws.readyState === WebSocket.OPEN) {
        game.ws.send(JSON.stringify(m));
    }
}

function respawn() {
    game.camera.position.set(64, surface(64, 64) + 1.82, 64);
    game.player.velocity.set(0, 0, 0);
    game.player.onGround = false;
    peak = game.camera.position.y;
    game.health = 20;
    game.hunger = 20;
    game.meat = 0;
    // Clear inventory on death/fresh spawn
    for (let i = 0; i < 36; i++) playerInventory[i] = null;
    for (let i = 0; i < 4; i++) craftingGrid[i] = null;
    craftOutput = null;
    draggedItem = null;
    cursorOrigin = null;
    inventoryGesture = null;
    updateCrafting();
    updateInventoryUI();
    updateHud();
    updateHeldItemMesh();
}

function damage(amount) {
    if (game.player.isCreative) return; // Invulnerable in Creative
    game.health = Math.max(0, game.health - amount);
    playSound('hurt');
    flashDamage();
    updateHud();
    if (game.health <= 0) {
        respawn();
        showNotice('You died! Respawned.');
    }
}

function survival(delta) {
    if (!ready) return;

    // Day/Night Cycle Progression (20 min cycle)
    worldTime = (worldTime + delta) % DAY_CYCLE_DURATION;
    const dayRatio = worldTime / DAY_CYCLE_DURATION; // 0 to 1
    const sunAngle = dayRatio * Math.PI * 2;

    const isNight = Math.sin(sunAngle) < 0;

    // Sun & Moon Positions
    if (game.sun) {
        game.sun.position.x = 64 + Math.cos(sunAngle) * 180;
        game.sun.position.y = Math.sin(sunAngle) * 180;
        game.sun.position.z = 64;
        game.sun.lookAt(64, 0, 64);
    }
    if (game.moon) {
        game.moon.position.x = 64 + Math.cos(sunAngle + Math.PI) * 180;
        game.moon.position.y = Math.sin(sunAngle + Math.PI) * 180;
        game.moon.position.z = 64;
        game.moon.lookAt(64, 0, 64);
    }

    // Sky & Lighting Transition (Day = Blue / Night = Deep Dark Midnight)
    const skyLightIntensity = Math.max(0.08, Math.sin(sunAngle));
    if (game.ambientLight) {
        game.ambientLight.intensity = 0.2 + skyLightIntensity * 0.55;
    }
    if (game.sunLight) {
        game.sunLight.intensity = Math.max(0, skyLightIntensity * 0.85);
        game.sunLight.position.set(Math.cos(sunAngle) * 60, Math.max(5, Math.sin(sunAngle) * 90), 32);
    }
    if (game.scene) {
        const skyR = 0.05 + skyLightIntensity * 0.42;
        const skyG = 0.05 + skyLightIntensity * 0.60;
        const skyB = 0.15 + skyLightIntensity * 0.85;
        game.scene.background.setRGB(skyR, skyG, skyB);
        if (game.scene.fog) {
            game.scene.fog.color.setRGB(skyR, skyG, skyB);
        }
    }
    if (game.stars) {
        game.stars.material.opacity = isNight ? 0.9 : 0.0;
    }

    // Hunger drain in Survival
    if (!game.player.isCreative) {
        game.hunger = Math.max(0, game.hunger - delta / 25);
        if (game.hunger === 0) damage(delta / 2);
    }

    animalClock += delta;
    pickupClock += delta;

    // AI & Hostile Mobs Movement (allocation-free for 60 FPS)
    const camPos = game.camera.position;
    for (const a of game.animals.values()) {
        const pdx = camPos.x - a.x, pdy = camPos.y - a.y, pdz = camPos.z - a.z;
        const distToPlayer = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);

        if (game.animalHost === game.playerId) {
            if (a.type === 'zombie' && distToPlayer < 16) {
                // Zombie pursues player
                const len = Math.max(1e-6, distToPlayer);
                const ux = pdx / len, uz = pdz / len;
                a.x += ux * delta * 1.8;
                a.z += uz * delta * 1.8;
                a.angle = Math.atan2(ux, uz);
            } else if (a.type === 'skeleton' && distToPlayer < 18) {
                // Skeleton shoots bow periodically
                a.shootClock = (a.shootClock || 0) + delta;
                if (a.shootClock > 3.0) {
                    a.shootClock = 0;
                    spawnSkeletonArrow(new THREE.Vector3(a.x, a.y + 1.2, a.z), camPos);
                }
            } else if (a.type === 'creeper' && distToPlayer < 12) {
                // Creeper chases and explodes!
                const len = Math.max(1e-6, distToPlayer);
                const ux = pdx / len, uz = pdz / len;
                a.x += ux * delta * 2.2;
                a.z += uz * delta * 2.2;
                a.angle = Math.atan2(ux, uz);

                if (distToPlayer < 3.0) {
                    a.fuseClock = (a.fuseClock || 0) + delta;
                    if (a.fuseClock === delta) playSound('fuse');
                    if (a.fuseClock > 1.5) {
                        // EXPLODE!
                        playSound('explosion');
                        damage(12);
                        showNotice('Creeper Exploded!');
                        send({ type: 'animalHit', id: a.id });
                    }
                } else {
                    a.fuseClock = 0;
                }
            } else {
                // Passive wander
                a.turn -= delta;
                if (a.turn <= 0) {
                    a.angle += (Math.random() - 0.5) * 2;
                    a.turn = 2.5;
                }
                const x = a.x + Math.sin(a.angle) * delta * 0.7;
                const z = a.z + Math.cos(a.angle) * delta * 0.7;
                if (x < 1 || x > 126 || z < 1 || z > 126 || Math.abs(surface(x, z) - a.y) > 1.1) {
                    a.angle += Math.PI;
                } else {
                    a.x = x;
                    a.z = z;
                }
            }
            a.y = THREE.MathUtils.lerp(a.y, surface(a.x, a.z), Math.min(1, delta * 10));
        }

        const m = a.model.position;
        const ddx = a.x - m.x, ddy = a.y - m.y, ddz = a.z - m.z;
        if (ddx * ddx + ddy * ddy + ddz * ddz > 0.0001) a.model.rotation.y = Math.atan2(ddx, ddz);
        const k = Math.min(1, delta * 12);
        m.x += ddx * k;
        m.y += ddy * k;
        m.z += ddz * k;

        // Zombie melee hit
        if (a.type === 'zombie' && distToPlayer < 1.6) {
            damage(delta * 4);
        }
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

    // Continuous Mining Progress Update
    updateMining(delta);
    updateArrows(delta);

    // Floating Meat Drops
    for (const [id, m] of meatDrops) {
        m.position.y = m.userData.base + Math.sin(performance.now() / 400) * 0.12;
        m.rotation.y += delta * 2;
        if (pickupClock >= 0.3 && m.position.distanceTo(game.camera.position) < 2.5) {
            if (!canAddToInventory('meat', 1)) {
                showNotice('Inventory is full!');
                continue;
            }
            addToInventory('meat', 1);
            showNotice('Picked up Raw Porkchop!');
            send({ type: 'meatPickup', id });
            break;
        }
    }
    if (pickupClock >= 0.3) pickupClock = 0;

    // Status Panel
    const timeDisplay = isNight ? '🌙 Night' : '☀️ Day';
    document.getElementById('status-panel').textContent =
        `World: 128x128 | ${timeDisplay} | Players: ${game.otherPlayers.size + 1}/8`;
}

function updateMining(delta) {
    const progressEl = document.getElementById('mining-progress');
    const progressBar = document.getElementById('mining-bar');

    if (!isMining || !game.controls.isLocked) {
        miningProgress = 0;
        miningTarget = null;
        if (progressEl) progressEl.style.display = 'none';
        return;
    }

    game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
    game.raycaster.far = 5;

    const visibleBlocks = getWorldMeshes();
    const intersects = game.raycaster.intersectObjects(visibleBlocks, false);

    if (intersects.length > 0) {
        const blockPos = blockFromHit(intersects[0]);
        const targetKey = `${blockPos.x},${blockPos.y},${blockPos.z}`;
        const blockType = game.blockTypes.get(targetKey);

        if (miningTarget !== targetKey) {
            miningTarget = targetKey;
            miningProgress = 0;
        }

        triggerSwing();

        // Hit sound rhythm
        if (performance.now() - lastMineHitSound > 220) {
            lastMineHitSound = performance.now();
            playSound('hit', blockType);
        }

        const hardness = getBlockHardness(blockPos.y, blockType);
        miningProgress += delta / hardness;

        if (progressEl) progressEl.style.display = 'block';
        if (progressBar) progressBar.style.width = `${Math.min(100, miningProgress * 100)}%`;

        if (miningProgress >= 1.0) {
            // Block successfully mined!
            if (!canAddToInventory(blockType, 1)) {
                showNotice('Inventory is full!');
                isMining = false;
            } else {
                send({ type: 'blockRemoved', x: blockPos.x, y: blockPos.y, z: blockPos.z });
            }
            miningProgress = 0;
            miningTarget = null;
            if (progressEl) progressEl.style.display = 'none';
        }
    } else {
        miningProgress = 0;
        miningTarget = null;
        if (progressEl) progressEl.style.display = 'none';
    }
}

function onKeyDown(event) {
    if (onInventoryKeyDown(event)) return;
    // Multiplayer Chat Handling
    if (event.code === 'Enter') {
        const chatInput = document.getElementById('chat-input');
        if (isChatOpen) {
            const text = chatInput.value.trim();
            if (text.length > 0) {
                send({ type: 'chat', text });
            }
            chatInput.value = '';
            chatInput.style.display = 'none';
            isChatOpen = false;
            if (ready) game.controls.lock();
        } else {
            isChatOpen = true;
            chatInput.style.display = 'block';
            chatInput.focus();
            game.controls.unlock();
        }
        return;
    }

    if (isChatOpen) return; // Prevent game keys while typing in chat

    game.keys[event.code] = true;

    // Double-tap Space for Creative Flight
    if (event.code === 'Space' && !event.repeat && game.player.isCreative) {
        const now = performance.now();
        if (now - game.player.lastSpaceTime < 320) {
            game.player.isFlying = !game.player.isFlying;
            game.player.velocity.set(0, 0, 0);
            showNotice(`Flying: ${game.player.isFlying ? 'ON' : 'OFF'}`);
            updateHud();
        }
        game.player.lastSpaceTime = now;
    }

    // Toggle Mode (C key)
    if (event.code === 'KeyC' && !event.repeat) {
        toggleGamemode();
    }

    // Toggle PvP (P key)
    if (event.code === 'KeyP' && !event.repeat) {
        togglePvP();
    }

    // Open Inventory & Crafting GUI (Q key)
    if (event.code === 'KeyQ' && !event.repeat) {
        toggleInventory();
        return;
    }

    // Eating Food / Meat (E key)
    if (event.code === 'KeyE' && !event.repeat && ready && game.controls.isLocked) {
        const held = playerInventory[selectedHotbarIndex];
        if (held && held.type === 'meat' && game.hunger < 20) {
            held.count--;
            if (held.count <= 0) playerInventory[selectedHotbarIndex] = null;
            game.hunger = Math.min(20, game.hunger + 6);
            playSound('eat');
            showNotice('Ate porkchop (+6 Hunger)');
            triggerSwing();
            updateHud();
            updateHeldItemMesh();
        }
    }

    // Hotbar Selection 1-9
    for (let d = 1; d <= 9; d++) {
        if (event.code === `Digit${d}`) {
            selectedHotbarIndex = d - 1;
            updateHud();
            updateHeldItemMesh();
        }
    }
}

function selectBlock(type) {
    game.player.selectedBlock = type;
    updateHud();
}

function onKeyUp(event) {
    game.keys[event.code] = false;
}

function onMouseDown(event) {
    if (!game.controls.isLocked || !ready) return;

    if (event.button === 0) {
        isMining = true;
        game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
        game.raycaster.far = 5;

        // Check Animal or Player Melee Attack
        const targets = [
            ...Array.from(game.animals.values(), a => a.model),
            ...Array.from(game.otherPlayers.values(), p => p.model)
        ];
        const mobIntersects = game.raycaster.intersectObjects(targets, true);
        if (mobIntersects.length > 0) {
            let root = mobIntersects[0].object;
            while (root.parent && root.parent !== game.scene) root = root.parent;
            if (root.userData.animal) {
                send({ type: 'animalHit', id: root.userData.animal });
                playSound('hit', 'meat');
                showHitFeedback(root);
                triggerSwing();
                isMining = false;
                return;
            }
            if (root.userData.player) {
                if (game.player.pvp) {
                    send({ type: 'playerHit', id: root.userData.player });
                    playSound('hit', 'meat');
                    showHitFeedback(root);
                } else {
                    showNotice('Your PvP is OFF! Press P to enable.');
                }
                triggerSwing();
                isMining = false;
                return;
            }
        }
    } else if (event.button === 2) {
        // Right Click: USE the held item
        const held = playerInventory[selectedHotbarIndex];
        if (!held) return;

        // Usable item: eat meat
        if (held.type === 'meat') {
            if (game.hunger < 20) {
                held.count--;
                if (held.count <= 0) playerInventory[selectedHotbarIndex] = null;
                game.hunger = Math.min(20, game.hunger + 6);
                playSound('eat');
                showNotice('Ate porkchop (+6 Hunger)');
                triggerSwing();
                updateHud();
                updateHeldItemMesh();
            } else {
                showNotice('Hunger is already full!');
            }
            return;
        }
        if (held.type === 'stick') return; // Not usable or placeable

        game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
        game.raycaster.far = 5;
        const blockIntersects = game.raycaster.intersectObjects(getWorldMeshes(), false);

        if (blockIntersects.length > 0) {
            const intersect = blockIntersects[0];
            const blockPos = blockFromHit(intersect);
            const normal = intersect.face.normal;
            const newPos = {
                x: blockPos.x + Math.round(normal.x),
                y: blockPos.y + Math.round(normal.y),
                z: blockPos.z + Math.round(normal.z)
            };
            const playerPos = game.camera.position.clone().divideScalar(BLOCK_SIZE).floor();

            if (!(newPos.x === playerPos.x && (newPos.y === playerPos.y || newPos.y === playerPos.y - 1) && newPos.z === playerPos.z)) {
                playSound('place', held.type);
                triggerSwing();
                if (!game.player.isCreative) {
                    held.count--;
                    if (held.count <= 0) playerInventory[selectedHotbarIndex] = null;
                    updateHud();
                    updateHeldItemMesh();
                }
                send({
                    type: 'blockPlaced',
                    x: newPos.x,
                    y: newPos.y,
                    z: newPos.z,
                    blockType: held.type
                });
            }
        }
    }
}

function onMouseUp(event) {
    if (event.button === 0) {
        isMining = false;
        miningProgress = 0;
        miningTarget = null;
        const progressEl = document.getElementById('mining-progress');
        if (progressEl) progressEl.style.display = 'none';
    }
}

// ==========================================
// 13.5 HIT FEEDBACK (targets jump + flash red for 1 second)
// ==========================================
const HIT_FLASH_DURATION = 1.0;   // seconds red
const HIT_HOP_DURATION = 0.45;    // seconds of the jump arc
const HIT_HOP_HEIGHT = 0.55;
const hitFeedback = new Map();    // model.uuid -> { model, timer, origMats }

function makeRedMaterial(m) {
    const c = m.clone();
    c.color.setRGB(0.45, 0.1, 0.1);
    if (c.emissive) c.emissive.setHex(0x7a1010);
    return c;
}

function showHitFeedback(model) {
    if (!model) return;
    let fb = hitFeedback.get(model.uuid);
    if (!fb) {
        const origMats = [];
        model.traverse(o => {
            if (o.isMesh) origMats.push([o, o.material]);
        });
        fb = { model, timer: 0, origMats };
        hitFeedback.set(model.uuid, fb);
        // Swap every mesh to a red-tinted version of its material
        for (const [o, orig] of origMats) {
            o.material = Array.isArray(orig) ? orig.map(makeRedMaterial) : makeRedMaterial(orig);
        }
    }
    fb.timer = HIT_FLASH_DURATION; // repeated hits refresh the flash
}

function endHitFeedback(fb) {
    for (const [o, orig] of fb.origMats) o.material = orig;
}

function clearHitFeedback(model) {
    const fb = hitFeedback.get(model.uuid);
    if (fb) {
        endHitFeedback(fb);
        hitFeedback.delete(model.uuid);
    }
}

function updateHitFeedback(delta) {
    if (hitFeedback.size === 0) return;
    for (const fb of Array.from(hitFeedback.values())) {
        if (fb.timer <= 0) continue;
        fb.timer -= delta;
        // Parabolic hop during the first part of the flash
        const elapsed = HIT_FLASH_DURATION - fb.timer;
        if (elapsed < HIT_HOP_DURATION) {
            const t = elapsed / HIT_HOP_DURATION;
            fb.model.position.y += 4 * HIT_HOP_HEIGHT * t * (1 - t);
        }
        if (fb.timer <= 0) {
            endHitFeedback(fb);
            hitFeedback.delete(fb.model.uuid);
        }
    }
}

// ==========================================
// 14. PHYSICS & FLYING MOVEMENT
// ==========================================
function updatePlayer(delta) {
    if (!ready) return;

    if (game.player.isFlying) {
        // Creative Flying Flight Mode
        const flySpeed = 16;
        const moveDir = new THREE.Vector3();

        if (game.controls.isLocked) {
            if (game.keys['KeyW']) moveDir.z -= 1;
            if (game.keys['KeyS']) moveDir.z += 1;
            if (game.keys['KeyA']) moveDir.x -= 1;
            if (game.keys['KeyD']) moveDir.x += 1;
            if (game.keys['Space']) moveDir.y += 1; // Ascend
            if (game.keys['ShiftLeft'] || game.keys['ShiftRight']) moveDir.y -= 1; // Descend
        }

        const forward = new THREE.Vector3();
        game.camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const move = new THREE.Vector3();
        move.addScaledVector(forward, -moveDir.z * flySpeed * delta);
        move.addScaledVector(right, moveDir.x * flySpeed * delta);
        move.y += moveDir.y * flySpeed * delta;

        game.camera.position.add(move);
        game.player.velocity.set(0, 0, 0);

    } else {
        // Survival Walking & Falling Physics
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

        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

        const movement = new THREE.Vector3();
        movement.addScaledVector(forward, -moveDirection.z);
        movement.addScaledVector(right, moveDirection.x);

        const newPos = game.camera.position.clone().add(movement);
        if (!checkCollision(newPos)) {
            game.camera.position.add(movement);
            // Footstep sound when moving on ground
            if (game.player.onGround && movement.lengthSq() > 0.0001) {
                if (performance.now() - lastStepTime > 340) {
                    lastStepTime = performance.now();
                    playSound('step');
                }
            }
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
    }

    // Keep player in bounds
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
// 15. NETWORKING & SYNC
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
            clearWorldMeshes();
            game.blockTypes.clear();
            for (const id of Array.from(game.otherPlayers.keys())) removeOtherPlayer(id);
            for (const m of meatDrops.values()) game.scene.remove(m);
            meatDrops.clear();
            syncAnimals([]);

            game.playerId = message.playerId;
            game.animalHost = message.animalHost;
            (message.meat || []).forEach(addMeat);

            // Terrain is generated locally (deterministic), then player edits are replayed on top
            generateTerrain(message.worldSize || WORLD_SIZE);
            (message.world || []).forEach(b => applyEdit(b.x, b.y, b.z, b.type));
            processDirtyChunks();

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

        case 'playerPvp': {
            const p = game.otherPlayers.get(message.playerId);
            if (p) p.pvp = message.pvp;
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

        case 'chat':
            addChatMessage(message.username || 'Player', message.message || '');
            break;

        case 'blockPlaced':
            addBlock(message.x, message.y, message.z, message.blockType);
            break;

        case 'blockRemoved':
            // Only the player who mined collects the block (no inventory dupes)
            removeBlock(message.x, message.y, message.z, message.playerId === game.playerId);
            break;
    }
}

// ==========================================
// 16. MAIN ANIMATION LOOP
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
    updateHitFeedback(delta);
    processDirtyChunks();
    renderPlayerPreview();

    // Rotate Sky & Clouds slowly
    if (game.clouds) game.clouds.position.x = (performance.now() * 0.001) % 16;

    game.renderer.render(game.scene, game.camera);
}

function onWindowResize() {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

document.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('blur', () => { game.keys = {}; isMining = false; cancelInventoryGesture(); });

// Start the game!
init();
