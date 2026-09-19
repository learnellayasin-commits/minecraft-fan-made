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

    // Steve Skin
    steveFace: createNoiseCanvas(16, 16, (x, y) => {
        if (y === 8 && (x === 4 || x === 11)) return [255, 255, 255];
        if (y === 8 && (x === 5 || x === 10)) return [40, 50, 160];
        if (y < 4 || (y === 4 && (x < 2 || x > 13))) return [70, 45, 25];
        if (y >= 10 && y <= 11 && x >= 5 && x <= 10) return [100, 60, 40];
        const v = rand(0.95, 1.05);
        return [Math.floor(190 * v), Math.floor(138 * v), Math.floor(110 * v)];
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
    leaves: new THREE.MeshLambertMaterial({ map: textures.leaves, transparent: true })
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
const WORLD_WIDTH = 128; // HUGE EXPANDED WORLD!
const WORLD_DEPTH = 128;
const WORLD_HEIGHT = 24;
const RENDER_DISTANCE = 96;

const blockNames = ['grass', 'dirt', 'stone', 'wood', 'sand', 'leaves'];

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
    // Meat Slot (7)
    hotbarHtml += `
        <div class="hotbar-slot">
            <span class="slot-key">7</span>
            <div class="slot-icon" style="background: #a82e2e; border: 1px solid #111; border-radius: 4px;"></div>
            <span class="slot-count">${game.meat}</span>
        </div>
    `;
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

function getBlockColorPreview(type) {
    switch (type) {
        case 'grass': return '#58a636';
        case 'dirt': return '#866043';
        case 'stone': return '#7d7d7d';
        case 'wood': return '#675231';
        case 'sand': return '#dcd695';
        case 'leaves': return '#308020';
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
        // If user clicks anywhere on the pause/start overlay (except interactive sub-elements if any)
        if (e.target === startScreen || e.target.classList.contains('title-logo') || e.target.classList.contains('instructions-list')) {
            lockGame();
        }
    });

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
// 9. WORLD & BLOCK MANAGEMENT
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
        playSound('break', block.userData.blockType);
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

        const head = new THREE.Mesh(sharedGeometry, pigMat);
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
        const headMat = new THREE.MeshLambertMaterial({ map: textures.zombieFace });
        const skinMat = new THREE.MeshLambertMaterial({ map: textures.zombieSkin });
        const shirtMat = new THREE.MeshLambertMaterial({ map: textures.steveShirt });
        const pantsMat = new THREE.MeshLambertMaterial({ map: textures.stevePants });

        const head = new THREE.Mesh(sharedGeometry, headMat);
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
        const headMat = new THREE.MeshLambertMaterial({ map: textures.skeletonFace });
        const boneMat = new THREE.MeshLambertMaterial({ map: textures.skeletonBone });

        const head = new THREE.Mesh(sharedGeometry, headMat);
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
        const headMat = new THREE.MeshLambertMaterial({ map: textures.creeperFace });
        const bodyMat = new THREE.MeshLambertMaterial({ map: textures.creeperBody });

        const head = new THREE.Mesh(sharedGeometry, headMat);
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

    const headMat = new THREE.MeshLambertMaterial({ map: textures.steveFace });
    const shirtMat = new THREE.MeshLambertMaterial({ map: textures.steveShirt });
    const pantsMat = new THREE.MeshLambertMaterial({ map: textures.stevePants });

    const head = new THREE.Mesh(sharedGeometry, headMat);
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
    updateHud();
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

    // AI & Hostile Mobs Movement
    for (const a of game.animals.values()) {
        const distToPlayer = game.camera.position.distanceTo(new THREE.Vector3(a.x, a.y, a.z));

        if (game.animalHost === game.playerId) {
            if (a.type === 'zombie' && distToPlayer < 16) {
                // Zombie pursues player
                const dir = game.camera.position.clone().sub(new THREE.Vector3(a.x, a.y, a.z)).normalize();
                a.x += dir.x * delta * 1.8;
                a.z += dir.z * delta * 1.8;
                a.angle = Math.atan2(dir.x, dir.z);
            } else if (a.type === 'skeleton' && distToPlayer < 18) {
                // Skeleton shoots bow periodically
                a.shootClock = (a.shootClock || 0) + delta;
                if (a.shootClock > 3.0) {
                    a.shootClock = 0;
                    spawnSkeletonArrow(new THREE.Vector3(a.x, a.y + 1.2, a.z), game.camera.position);
                }
            } else if (a.type === 'creeper' && distToPlayer < 12) {
                // Creeper chases and explodes!
                const dir = game.camera.position.clone().sub(new THREE.Vector3(a.x, a.y, a.z)).normalize();
                a.x += dir.x * delta * 2.2;
                a.z += dir.z * delta * 2.2;
                a.angle = Math.atan2(dir.x, dir.z);

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

        const target = new THREE.Vector3(a.x, a.y, a.z);
        const d = target.clone().sub(a.model.position);
        if (d.lengthSq() > 0.0001) a.model.rotation.y = Math.atan2(d.x, d.z);
        a.model.position.lerp(target, Math.min(1, delta * 12));

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

    const visibleBlocks = Array.from(game.world.values()).filter(m => m.visible);
    const intersects = game.raycaster.intersectObjects(visibleBlocks, true);

    if (intersects.length > 0) {
        const block = intersects[0].object;
        const blockPos = block.position.clone().divideScalar(BLOCK_SIZE);
        const targetKey = `${blockPos.x},${blockPos.y},${blockPos.z}`;

        if (miningTarget !== targetKey) {
            miningTarget = targetKey;
            miningProgress = 0;
        }

        triggerSwing();

        // Hit sound rhythm
        if (performance.now() - lastMineHitSound > 220) {
            lastMineHitSound = performance.now();
            playSound('hit', block.userData.blockType);
        }

        const hardness = getBlockHardness(blockPos.y, block.userData.blockType);
        miningProgress += delta / hardness;

        if (progressEl) progressEl.style.display = 'block';
        if (progressBar) progressBar.style.width = `${Math.min(100, miningProgress * 100)}%`;

        if (miningProgress >= 1.0) {
            // Block successfully mined!
            send({ type: 'blockRemoved', x: blockPos.x, y: blockPos.y, z: blockPos.z });
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

    // Eating Meat (E key)
    if (event.code === 'KeyE' && !event.repeat && ready && game.controls.isLocked) {
        if (game.meat > 0 && game.hunger < 20) {
            game.meat--;
            game.hunger = Math.min(20, game.hunger + 6);
            playSound('eat');
            showNotice('Ate meat (+6 Hunger)');
            triggerSwing();
            updateHud();
        }
    }

    // Hotbar Selection 1-6
    if (event.code === 'Digit1') selectBlock('grass');
    if (event.code === 'Digit2') selectBlock('dirt');
    if (event.code === 'Digit3') selectBlock('stone');
    if (event.code === 'Digit4') selectBlock('wood');
    if (event.code === 'Digit5') selectBlock('sand');
    if (event.code === 'Digit6') selectBlock('leaves');
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
                triggerSwing();
                isMining = false;
                return;
            }
            if (root.userData.player) {
                if (game.player.pvp) {
                    send({ type: 'playerHit', id: root.userData.player });
                    playSound('hit', 'meat');
                } else {
                    showNotice('Your PvP is OFF! Press P to enable.');
                }
                triggerSwing();
                isMining = false;
                return;
            }
        }
    } else if (event.button === 2) {
        // Right Click: Place Block
        game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
        game.raycaster.far = 5;
        const blockIntersects = game.raycaster.intersectObjects(Array.from(game.world.values()).filter(m => m.visible), true);

        if (blockIntersects.length > 0) {
            const intersect = blockIntersects[0];
            const blockPos = intersect.object.position.clone().divideScalar(BLOCK_SIZE);
            const normal = intersect.face.normal;
            const newPos = blockPos.clone().add(normal);
            const playerPos = game.camera.position.clone().divideScalar(BLOCK_SIZE).floor();

            if (!(newPos.x === playerPos.x && (newPos.y === playerPos.y || newPos.y === playerPos.y - 1) && newPos.z === playerPos.z)) {
                playSound('place', game.player.selectedBlock);
                triggerSwing();
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
            removeBlock(message.x, message.y, message.z);
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
window.addEventListener('blur', () => { game.keys = {}; isMining = false; });

// Start the game!
init();
