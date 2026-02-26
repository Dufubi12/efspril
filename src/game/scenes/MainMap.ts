import Phaser from 'phaser';
import { useGameStore } from '@/store/useGameStore';

const TILE = 48;
const MAP_W = 57;  // was 38, +19 for geometry zone
const MAP_H = 28;
const ZONE_SPLIT = Math.floor(MAP_W / 3); // ~19 — split math/russian
const GEO_SPLIT = Math.floor(MAP_W * 2 / 3); // ~38 — start of geometry zone

export class MainMap extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
    private enemies!: Phaser.Physics.Arcade.Group;
    private npcs!: Phaser.Physics.Arcade.Group;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private battleActive = false;
    private npcCooldown = false;
    private rusBarrier!: Phaser.GameObjects.Group;
    private rusBarrierUnlocked = false;
    private geoBarrier!: Phaser.GameObjects.Group;
    private geoBarrierUnlocked = false;

    constructor() {
        super('MainMap');
    }

    create() {
        const W = MAP_W * TILE;
        const H = MAP_H * TILE;
        this.physics.world.setBounds(0, 0, W, H);

        this._buildMap(W, H);
        this._createTextures();
        this._createPlayer();
        this._spawnEnemies();
        this._spawnNPCs();
        this._setupCamera();
        this._setupInput();
        this._setupCollisions();
        this._setupEventBridge();
        this._drawZoneLabels();
        this._drawRusBarrier();
        this._drawGeoBarrier();
        this._checkRusZoneUnlock();
        this._checkGeoZoneUnlock();
    }

    // ─── Map ─────────────────────────────────────────────────────
    private _buildMap(W: number, H: number) {
        const gfx = this.add.graphics();

        // Floor tiles
        for (let tx = 0; tx < MAP_W; tx++) {
            for (let ty = 0; ty < MAP_H; ty++) {
                const isMath = tx < ZONE_SPLIT;
                const isGeo = tx >= GEO_SPLIT;
                const alt = (tx + ty) % 2 === 0;
                let color: number;
                if (isMath) color = alt ? 0x1a2744 : 0x16213a;
                else if (isGeo) color = alt ? 0x2a1f0a : 0x1e1608;
                else color = alt ? 0x2d1444 : 0x251038;
                gfx.fillStyle(color, 1);
                gfx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
            }
        }

        // Zone divider lines
        gfx.lineStyle(2, 0xffffff, 0.1);
        gfx.lineBetween(ZONE_SPLIT * TILE, 0, ZONE_SPLIT * TILE, H);
        gfx.lineBetween(GEO_SPLIT * TILE, 0, GEO_SPLIT * TILE, H);

        // Top/bottom walls
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillRect(0, 0, W, TILE);
        gfx.fillRect(0, H - TILE, W, TILE);
        gfx.fillRect(0, 0, TILE, H);
        gfx.fillRect(W - TILE, 0, TILE, H);

        // Wall brick detail
        gfx.fillStyle(0x1e293b, 1);
        for (let tx = 0; tx < MAP_W; tx++) {
            gfx.fillRect(tx * TILE + 4, 4, TILE - 8, TILE - 8);
            gfx.fillRect(tx * TILE + 4, H - TILE + 4, TILE - 8, TILE - 8);
        }
        for (let ty = 0; ty < MAP_H; ty++) {
            gfx.fillRect(4, ty * TILE + 4, TILE - 8, TILE - 8);
            gfx.fillRect(W - TILE + 4, ty * TILE + 4, TILE - 8, TILE - 8);
        }

        // Physics walls
        this.walls = this.physics.add.staticGroup();
        const addWall = (x: number, y: number, w: number, h: number) => {
            const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
            this.physics.add.existing(r, true);
            this.walls.add(r);
        };
        addWall(0, 0, W, TILE);
        addWall(0, H - TILE, W, TILE);
        addWall(0, 0, TILE, H);
        addWall(W - TILE, 0, TILE, H);
    }

    // ─── Textures ─────────────────────────────────────────────────
    private _createTextures() {
        this._makeWizard();
        this._makeEnemyGoblin();
        this._makeEnemySlime();
        this._makeEnemyTroll();
        this._makeEnemyWitch();
        this._makeEnemyDragon();
        this._makeEnemyPhoenix();
        this._makeNPCMathius();
        this._makeNPCWordkeeper();
        this._makeNPCGeomancer();
    }

    private _makeWizard() {
        if (this.textures.exists('wizard')) return;
        const g = this.make.graphics({});
        const S = 64;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(S/2, S-4, S*0.5, 8);

        // Robe bottom (flowing)
        g.fillStyle(0x4338ca);
        g.fillTriangle(S*0.5, S*0.55, S*0.25, S*0.88, S*0.75, S*0.88);

        // Robe body
        g.fillStyle(0x6366f1);
        g.fillRoundedRect(S*0.3, S*0.45, S*0.4, S*0.35, 6);

        // Belt (gold)
        g.fillStyle(0xfbbf24);
        g.fillRect(S*0.32, S*0.6, S*0.36, 5);
        g.fillCircle(S*0.5, S*0.625, 4);

        // Arms/sleeves
        g.fillStyle(0x4f46e5);
        g.fillRoundedRect(S*0.22, S*0.5, S*0.12, S*0.25, 4);
        g.fillRoundedRect(S*0.66, S*0.5, S*0.12, S*0.25, 4);

        // Hands
        g.fillStyle(0xfde68a);
        g.fillCircle(S*0.28, S*0.73, 6);
        g.fillCircle(S*0.72, S*0.73, 6);

        // Magic staff (right hand)
        g.lineStyle(5, 0x78350f);
        g.lineBetween(S*0.75, S*0.7, S*0.82, S*0.35);

        // Staff orb (glowing purple)
        g.fillStyle(0xa855f7);
        g.fillCircle(S*0.84, S*0.32, 10);
        g.fillStyle(0xc084fc, 0.7);
        g.fillCircle(S*0.84, S*0.32, 7);
        g.fillStyle(0xe9d5ff, 0.5);
        g.fillCircle(S*0.84, S*0.32, 4);

        // Magic sparkles around orb
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI/4;
            g.fillStyle(0xc084fc, 0.6);
            g.fillCircle(S*0.84 + Math.cos(angle)*14, S*0.32 + Math.sin(angle)*14, 2);
        }

        // Neck
        g.fillStyle(0xfde68a);
        g.fillRect(S*0.44, S*0.38, S*0.12, S*0.08);

        // Head
        g.fillStyle(0xfde68a);
        g.fillCircle(S*0.5, S*0.32, S*0.16);

        // Wizard hat (tall and pointy)
        g.fillStyle(0x4338ca);
        g.fillTriangle(S*0.32, S*0.3, S*0.68, S*0.3, S*0.5, S*0.05);

        // Hat brim
        g.fillEllipse(S*0.5, S*0.3, S*0.25, S*0.06);

        // Hat band (stars pattern)
        g.fillStyle(0xa5b4fc);
        g.fillRect(S*0.38, S*0.28, S*0.24, 4);

        // Stars on hat
        for (let i = 0; i < 3; i++) {
            g.fillStyle(0xfbbf24, 0.8);
            const x = S*0.42 + i*0.08*S;
            const y = S*0.3 - i*0.05*S;
            g.fillCircle(x, y, 2);
        }

        // Eyes (wise)
        g.fillStyle(0xffffff);
        g.fillCircle(S*0.42, S*0.3, 5);
        g.fillCircle(S*0.58, S*0.3, 5);
        g.fillStyle(0x4338ca);
        g.fillCircle(S*0.42, S*0.3, 3);
        g.fillCircle(S*0.58, S*0.3, 3);

        // Eye shine
        g.fillStyle(0xffffff);
        g.fillCircle(S*0.43, S*0.29, 1.5);
        g.fillCircle(S*0.59, S*0.29, 1.5);

        // Beard (small, wise)
        g.fillStyle(0xe2e8f0);
        g.fillEllipse(S*0.5, S*0.4, S*0.16, S*0.08);

        // Smile
        g.lineStyle(2, 0x64748b);
        g.beginPath();
        g.arc(S*0.5, S*0.35, 6, 0, Math.PI);
        g.strokePath();

        // Robe details (arcane symbols)
        g.lineStyle(1.5, 0x818cf8, 0.6);
        g.strokeCircle(S*0.5, S*0.7, 6);
        g.lineBetween(S*0.5, S*0.64, S*0.5, S*0.76);
        g.lineBetween(S*0.44, S*0.7, S*0.56, S*0.7);

        g.generateTexture('wizard', S, S);
        g.destroy();
    }

    private _makeEnemyGoblin() {
        if (this.textures.exists('enemy_goblin')) return;
        const g = this.make.graphics({});
        const S = 64;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(S/2, S-6, S*0.6, 8);

        // Body (green armor)
        g.fillStyle(0x16a34a);
        g.fillRoundedRect(S*0.3, S*0.5, S*0.4, S*0.35, 4);

        // Arms
        g.fillStyle(0x22c55e);
        g.fillRoundedRect(S*0.2, S*0.5, S*0.15, S*0.3, 3); // left arm
        g.fillRoundedRect(S*0.65, S*0.5, S*0.15, S*0.3, 3); // right arm

        // Head
        g.fillStyle(0x22c55e);
        g.fillCircle(S*0.5, S*0.35, S*0.18);

        // Ears (pointy)
        g.fillStyle(0x16a34a);
        g.fillTriangle(S*0.25, S*0.3, S*0.15, S*0.35, S*0.3, S*0.4);
        g.fillTriangle(S*0.75, S*0.3, S*0.85, S*0.35, S*0.7, S*0.4);

        // Eyes (angry red)
        g.fillStyle(0xffffff);
        g.fillCircle(S*0.4, S*0.33, 5);
        g.fillCircle(S*0.6, S*0.33, 5);
        g.fillStyle(0xff0000);
        g.fillCircle(S*0.4, S*0.33, 3);
        g.fillCircle(S*0.6, S*0.33, 3);

        // Angry eyebrows
        g.lineStyle(2, 0x000000);
        g.lineBetween(S*0.35, S*0.28, S*0.45, S*0.3);
        g.lineBetween(S*0.65, S*0.28, S*0.55, S*0.3);

        // Nose
        g.fillStyle(0x16a34a);
        g.fillCircle(S*0.5, S*0.4, 3);

        // Mouth (fangs)
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.arc(S*0.5, S*0.42, 6, 0, Math.PI);
        g.strokePath();
        g.fillStyle(0xffffff);
        g.fillTriangle(S*0.45, S*0.45, S*0.47, S*0.5, S*0.43, S*0.5);
        g.fillTriangle(S*0.55, S*0.45, S*0.53, S*0.5, S*0.57, S*0.5);

        // Weapon (club in right hand)
        g.fillStyle(0x78350f);
        g.fillRoundedRect(S*0.75, S*0.55, 6, S*0.3, 3);
        g.fillCircle(S*0.78, S*0.52, 7);

        // Armor details (belt)
        g.fillStyle(0x92400e);
        g.fillRect(S*0.3, S*0.62, S*0.4, 4);
        g.fillStyle(0xfbbf24);
        g.fillCircle(S*0.5, S*0.64, 3);

        // Feet
        g.fillStyle(0x16a34a);
        g.fillEllipse(S*0.38, S*0.88, S*0.12, S*0.08);
        g.fillEllipse(S*0.62, S*0.88, S*0.12, S*0.08);

        g.generateTexture('enemy_goblin', S, S);
        g.destroy();
    }

    private _makeEnemySlime() {
        if (this.textures.exists('enemy_slime')) return;
        const g = this.make.graphics({});
        const S = 64;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(S/2, S-4, S*0.7, 10);

        // Body base (darker pink)
        g.fillStyle(0xdb2777);
        g.fillEllipse(S*0.5, S*0.65, S*0.7, S*0.5);

        // Body top layer (lighter, translucent)
        g.fillStyle(0xec4899, 0.9);
        g.fillEllipse(S*0.5, S*0.5, S*0.6, S*0.45);

        // Shine/highlight layer
        g.fillStyle(0xf9a8d4, 0.6);
        g.fillEllipse(S*0.5, S*0.42, S*0.5, S*0.35);

        // Glossy spots (multiple bubbles inside)
        g.fillStyle(0xfce7f3, 0.5);
        g.fillCircle(S*0.38, S*0.45, S*0.08);
        g.fillCircle(S*0.58, S*0.52, S*0.06);
        g.fillCircle(S*0.48, S*0.58, S*0.05);

        // Eyes (big cute eyes)
        g.fillStyle(0xffffff);
        g.fillEllipse(S*0.38, S*0.45, 12, 14);
        g.fillEllipse(S*0.62, S*0.45, 12, 14);

        // Pupils
        g.fillStyle(0x000000);
        g.fillCircle(S*0.38, S*0.47, 6);
        g.fillCircle(S*0.62, S*0.47, 6);

        // Eye shine
        g.fillStyle(0xffffff);
        g.fillCircle(S*0.4, S*0.44, 3);
        g.fillCircle(S*0.64, S*0.44, 3);

        // Mouth (simple happy smile)
        g.lineStyle(2, 0x9f1239);
        g.beginPath();
        g.arc(S*0.5, S*0.55, 8, 0, Math.PI);
        g.strokePath();

        // Surface shimmer
        g.lineStyle(2, 0xfce7f3, 0.7);
        g.beginPath();
        g.arc(S*0.45, S*0.38, S*0.25, Math.PI * 1.2, Math.PI * 1.8);
        g.strokePath();

        g.generateTexture('enemy_slime', S, S);
        g.destroy();
    }

    private _makeEnemyTroll() {
        if (this.textures.exists('enemy_troll')) return;
        const g = this.make.graphics({});
        const S = 64;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(S/2, S-5, S*0.7, 10);

        // Muscular body
        g.fillStyle(0x7c3aed);
        g.fillRoundedRect(S*0.25, S*0.5, S*0.5, S*0.4, 6);

        // Arms (big muscles)
        g.fillStyle(0x8b5cf6);
        g.fillEllipse(S*0.15, S*0.6, S*0.18, S*0.25);
        g.fillEllipse(S*0.85, S*0.6, S*0.18, S*0.25);

        // Legs
        g.fillStyle(0x6d28d9);
        g.fillRoundedRect(S*0.32, S*0.8, S*0.14, S*0.15, 3);
        g.fillRoundedRect(S*0.54, S*0.8, S*0.14, S*0.15, 3);

        // Big head
        g.fillStyle(0x8b5cf6);
        g.fillCircle(S*0.5, S*0.32, S*0.22);

        // Horns (golden)
        g.fillStyle(0xd97706);
        g.fillTriangle(S*0.3, S*0.22, S*0.22, S*0.08, S*0.35, S*0.15);
        g.fillTriangle(S*0.7, S*0.22, S*0.78, S*0.08, S*0.65, S*0.15);

        // Horn shine
        g.fillStyle(0xfbbf24, 0.6);
        g.fillCircle(S*0.26, S*0.14, 3);
        g.fillCircle(S*0.74, S*0.14, 3);

        // Eyes (glowing yellow)
        g.fillStyle(0xfbbf24);
        g.fillCircle(S*0.42, S*0.3, 7);
        g.fillCircle(S*0.58, S*0.3, 7);
        g.fillStyle(0x000000);
        g.fillCircle(S*0.42, S*0.3, 4);
        g.fillCircle(S*0.58, S*0.3, 4);

        // Angry eyebrows
        g.lineStyle(3, 0x4c1d95);
        g.lineBetween(S*0.35, S*0.22, S*0.47, S*0.26);
        g.lineBetween(S*0.65, S*0.22, S*0.53, S*0.26);

        // Large nose
        g.fillStyle(0x6d28d9);
        g.fillTriangle(S*0.5, S*0.35, S*0.45, S*0.42, S*0.55, S*0.42);

        // Tusks
        g.fillStyle(0xffffff);
        g.fillTriangle(S*0.42, S*0.45, S*0.38, S*0.52, S*0.4, S*0.45);
        g.fillTriangle(S*0.58, S*0.45, S*0.62, S*0.52, S*0.6, S*0.45);

        // Muscle definition (lines)
        g.lineStyle(2, 0x6d28d9, 0.5);
        g.lineBetween(S*0.3, S*0.6, S*0.32, S*0.75);
        g.lineBetween(S*0.7, S*0.6, S*0.68, S*0.75);

        // Belt/loincloth
        g.fillStyle(0x92400e);
        g.fillRect(S*0.28, S*0.7, S*0.44, 6);
        g.fillStyle(0x78350f);
        g.fillRect(S*0.35, S*0.76, S*0.12, S*0.12);
        g.fillRect(S*0.53, S*0.76, S*0.12, S*0.12);

        g.generateTexture('enemy_troll', S, S);
        g.destroy();
    }

    private _makeEnemyWitch() {
        if (this.textures.exists('enemy_witch')) return;
        const g = this.make.graphics({});
        const S = 64;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(S/2, S-5, S*0.6, 10);

        // Dress/robe (dark purple)
        g.fillStyle(0x6b21a8);
        g.fillTriangle(S*0.5, S*0.55, S*0.2, S*0.9, S*0.8, S*0.9);

        // Body
        g.fillStyle(0x7c3aed);
        g.fillRoundedRect(S*0.35, S*0.48, S*0.3, S*0.25, 5);

        // Arms with sleeves
        g.fillStyle(0x6b21a8);
        g.fillTriangle(S*0.35, S*0.5, S*0.18, S*0.55, S*0.3, S*0.7);
        g.fillTriangle(S*0.65, S*0.5, S*0.82, S*0.55, S*0.7, S*0.7);

        // Hands (green skin)
        g.fillStyle(0x84cc16);
        g.fillCircle(S*0.25, S*0.65, 7);
        g.fillCircle(S*0.75, S*0.65, 7);

        // Magic staff (in left hand)
        g.lineStyle(4, 0x78350f);
        g.lineBetween(S*0.2, S*0.6, S*0.12, S*0.9);
        // Staff orb (purple glow)
        g.fillStyle(0xa855f7);
        g.fillCircle(S*0.15, S*0.52, 8);
        g.fillStyle(0xc084fc, 0.6);
        g.fillCircle(S*0.15, S*0.52, 5);

        // Head (green witch skin)
        g.fillStyle(0x84cc16);
        g.fillCircle(S*0.5, S*0.38, S*0.16);

        // Witch hat (pointy, black)
        g.fillStyle(0x1e1b4b);
        g.fillTriangle(S*0.32, S*0.35, S*0.68, S*0.35, S*0.5, S*0.08);
        g.fillEllipse(S*0.5, S*0.35, S*0.25, S*0.06);

        // Hat band (gold)
        g.fillStyle(0xfbbf24);
        g.fillRect(S*0.38, S*0.33, S*0.24, 4);

        // Crooked nose
        g.fillStyle(0x65a30d);
        g.fillTriangle(S*0.5, S*0.38, S*0.54, S*0.45, S*0.48, S*0.42);

        // Eyes (glowing yellow)
        g.fillStyle(0xfbbf24);
        g.fillCircle(S*0.43, S*0.36, 5);
        g.fillCircle(S*0.57, S*0.36, 5);
        g.fillStyle(0x000000);
        g.fillCircle(S*0.43, S*0.36, 2);
        g.fillCircle(S*0.57, S*0.36, 2);

        // Evil smile
        g.lineStyle(2, 0x000000);
        g.beginPath();
        g.arc(S*0.5, S*0.42, 6, 0, Math.PI);
        g.strokePath();

        // Magic particles around staff
        for (let i = 0; i < 3; i++) {
            g.fillStyle(0xa855f7, 0.4 + i*0.2);
            g.fillCircle(S*0.1 + i*4, S*0.48 - i*6, 3 - i);
        }

        // Book in right hand (spell book)
        g.fillStyle(0x92400e);
        g.fillRoundedRect(S*0.7, S*0.6, S*0.12, S*0.15, 2);
        g.fillStyle(0xfbbf24);
        g.fillRect(S*0.71, S*0.65, S*0.1, 2);

        g.generateTexture('enemy_witch', S, S);
        g.destroy();
    }

    // ─── NPC Textures ─────────────────────────────────────────────
    private _makeNPCMathius() {
        if (this.textures.exists('npc_mathius')) return;
        const g = this.make.graphics({});
        // Robe (blue)
        g.fillStyle(0x1d4ed8); g.fillRoundedRect(8, 20, 30, 22, 6);
        // Head
        g.fillStyle(0xfde68a); g.fillCircle(23, 17, 11);
        // Beard
        g.fillStyle(0xe2e8f0); g.fillEllipse(23, 26, 16, 10);
        // Hat (blue wizard hat)
        g.fillStyle(0x1e40af);
        g.fillTriangle(12, 18, 34, 18, 23, 2);
        g.fillRect(10, 16, 26, 5);
        // Hat star
        g.fillStyle(0xfbbf24); g.fillCircle(23, 7, 4);
        // Eyes
        g.fillStyle(0x1e293b); g.fillCircle(19, 16, 2); g.fillCircle(27, 16, 2);
        // Scroll in hand
        g.fillStyle(0xfef3c7); g.fillRoundedRect(38, 22, 8, 14, 3);
        g.fillStyle(0xd97706); g.fillRect(38, 22, 8, 2); g.fillRect(38, 34, 8, 2);
        // Exclamation mark
        g.fillStyle(0xfbbf24); g.fillRect(20, -8, 6, 8); g.fillCircle(23, 2, 3);
        g.generateTexture('npc_mathius', 50, 50);
        g.destroy();
    }

    // Geometry NPC texture
    private _makeNPCGeomancer() {
        if (this.textures.exists('npc_geomancer')) return;
        const g = this.make.graphics({});
        // Robe (gold)
        g.fillStyle(0xb45309); g.fillRoundedRect(8, 20, 30, 22, 6);
        // Head
        g.fillStyle(0xfde68a); g.fillCircle(23, 17, 11);
        // Hood
        g.fillStyle(0x78350f); g.fillRoundedRect(10, 12, 26, 10, 8);
        // Eyes (wise, with glasses!)
        g.fillStyle(0x1e293b); g.fillCircle(18, 17, 2); g.fillCircle(28, 17, 2);
        g.lineStyle(1.5, 0xfbbf24, 1);
        g.strokeCircle(18, 17, 4); g.strokeCircle(28, 17, 4);
        g.strokeRect(22, 15, 0, 4);
        // Compass/ruler in hand
        g.fillStyle(0xfbbf24); g.fillRect(38, 18, 3, 18);
        g.fillStyle(0xfef3c7); g.fillRect(34, 18, 8, 2);
        g.fillStyle(0xfbbf24); g.fillRect(34, 34, 8, 2);
        // Geo shapes floating above
        g.lineStyle(1.5, 0xfbbf24, 0.8);
        g.strokeRect(13, -14, 10, 10);
        g.strokeTriangle(30, -14, 38, -4, 22, -4);
        // Exclamation
        g.fillStyle(0xfbbf24); g.fillRect(20, -22, 6, 8); g.fillCircle(23, -10, 3);
        g.generateTexture('npc_geomancer', 50, 50);
        g.destroy();
    }

    // Dragon texture
    private _makeEnemyDragon() {
        if (this.textures.exists('enemy_dragon')) return;
        const g = this.make.graphics({});
        const S = 80;

        // Shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(S*0.5, S*0.92, S*0.7, 12);

        // Tail
        g.fillStyle(0xb91c1c);
        g.fillTriangle(S*0.08, S*0.55, S*0.02, S*0.7, S*0.15, S*0.6);
        g.fillTriangle(S*0.05, S*0.68, S*0.02, S*0.78, S*0.12, S*0.72);

        // Back leg
        g.fillStyle(0xdc2626);
        g.fillRoundedRect(S*0.25, S*0.7, S*0.12, S*0.2, 4);

        // Body (scales)
        g.fillStyle(0xdc2626);
        g.fillEllipse(S*0.4, S*0.55, S*0.35, S*0.25);

        // Scales pattern
        g.lineStyle(2, 0x991b1b, 0.5);
        for (let i = 0; i < 4; i++) {
            g.beginPath();
            g.arc(S*0.3 + i*0.08*S, S*0.52, 8, 0, Math.PI);
            g.strokePath();
        }

        // Wings (large, detailed)
        g.fillStyle(0x7f1d1d);
        // Left wing
        g.fillTriangle(S*0.2, S*0.45, S*0.05, S*0.2, S*0.25, S*0.35);
        g.fillTriangle(S*0.22, S*0.5, S*0.08, S*0.65, S*0.28, S*0.55);
        // Wing membrane (lighter)
        g.fillStyle(0xb91c1c, 0.6);
        g.fillTriangle(S*0.18, S*0.42, S*0.1, S*0.3, S*0.22, S*0.38);

        // Right wing
        g.fillStyle(0x7f1d1d);
        g.fillTriangle(S*0.55, S*0.4, S*0.7, S*0.15, S*0.5, S*0.35);
        g.fillTriangle(S*0.53, S*0.5, S*0.68, S*0.6, S*0.48, S*0.55);

        // Front leg
        g.fillStyle(0xdc2626);
        g.fillRoundedRect(S*0.5, S*0.7, S*0.12, S*0.2, 4);

        // Claws (gold)
        g.fillStyle(0xfbbf24);
        for (let i = 0; i < 3; i++) {
            g.fillTriangle(S*0.27 + i*0.03*S, S*0.88, S*0.28 + i*0.03*S, S*0.92, S*0.26 + i*0.03*S, S*0.92);
            g.fillTriangle(S*0.52 + i*0.03*S, S*0.88, S*0.53 + i*0.03*S, S*0.92, S*0.51 + i*0.03*S, S*0.92);
        }

        // Head
        g.fillStyle(0xef4444);
        g.fillCircle(S*0.65, S*0.38, S*0.15);

        // Snout/jaw
        g.fillStyle(0xb91c1c);
        g.fillEllipse(S*0.75, S*0.42, S*0.15, S*0.1);

        // Horns
        g.fillStyle(0xfbbf24);
        g.fillTriangle(S*0.58, S*0.28, S*0.54, S*0.15, S*0.62, S*0.25);
        g.fillTriangle(S*0.68, S*0.26, S*0.7, S*0.13, S*0.64, S*0.28);

        // Eye (glowing)
        g.fillStyle(0xfbbf24);
        g.fillCircle(S*0.62, S*0.35, 6);
        g.fillStyle(0x000000);
        g.fillCircle(S*0.62, S*0.35, 3);
        g.fillStyle(0xfbbf24, 0.4);
        g.fillCircle(S*0.62, S*0.35, 9);

        // Teeth
        g.fillStyle(0xffffff);
        for (let i = 0; i < 4; i++) {
            g.fillTriangle(S*0.68 + i*0.03*S, S*0.4, S*0.69 + i*0.03*S, S*0.45, S*0.67 + i*0.03*S, S*0.45);
        }

        // Fire breath
        g.fillStyle(0xf97316, 0.8);
        g.fillEllipse(S*0.88, S*0.42, S*0.18, S*0.12);
        g.fillStyle(0xfbbf24, 0.7);
        g.fillEllipse(S*0.92, S*0.42, S*0.12, S*0.08);
        g.fillStyle(0xfef3c7, 0.5);
        g.fillEllipse(S*0.95, S*0.42, S*0.08, S*0.05);

        g.generateTexture('enemy_dragon', S, S);
        g.destroy();
    }

    // Phoenix texture
    private _makeEnemyPhoenix() {
        if (this.textures.exists('enemy_phoenix')) return;
        const g = this.make.graphics({});
        const S = 80;

        // Glow aura (outer)
        g.fillStyle(0xfbbf24, 0.2);
        g.fillCircle(S*0.5, S*0.5, S*0.45);
        g.fillStyle(0xf97316, 0.3);
        g.fillCircle(S*0.5, S*0.5, S*0.35);

        // Flame tail (layered)
        g.fillStyle(0xef4444, 0.7);
        g.fillTriangle(S*0.05, S*0.4, S*0.25, S*0.55, S*0.08, S*0.7);
        g.fillTriangle(S*0.02, S*0.5, S*0.2, S*0.6, S*0.05, S*0.8);

        g.fillStyle(0xf97316, 0.8);
        g.fillTriangle(S*0.1, S*0.45, S*0.25, S*0.55, S*0.12, S*0.68);

        g.fillStyle(0xfbbf24, 0.6);
        g.fillTriangle(S*0.15, S*0.5, S*0.25, S*0.58, S*0.18, S*0.65);

        // Body (orange-red)
        g.fillStyle(0xf97316);
        g.fillEllipse(S*0.45, S*0.55, S*0.28, S*0.22);

        // Body flame pattern
        g.fillStyle(0xfbbf24, 0.4);
        g.fillEllipse(S*0.42, S*0.5, S*0.2, S*0.15);

        // Wings (flame wings - left)
        g.fillStyle(0xef4444, 0.7);
        g.fillTriangle(S*0.2, S*0.35, S*0.35, S*0.5, S*0.25, S*0.25);
        g.fillTriangle(S*0.22, S*0.45, S*0.35, S*0.55, S*0.28, S*0.35);

        g.fillStyle(0xf97316, 0.8);
        g.fillTriangle(S*0.25, S*0.38, S*0.35, S*0.5, S*0.28, S*0.28);

        g.fillStyle(0xfbbf24, 0.6);
        g.fillTriangle(S*0.28, S*0.4, S*0.35, S*0.5, S*0.3, S*0.32);

        // Wings (flame wings - right)
        g.fillStyle(0xef4444, 0.7);
        g.fillTriangle(S*0.72, S*0.35, S*0.57, S*0.5, S*0.67, S*0.25);
        g.fillTriangle(S*0.7, S*0.45, S*0.57, S*0.55, S*0.64, S*0.35);

        g.fillStyle(0xf97316, 0.8);
        g.fillTriangle(S*0.67, S*0.38, S*0.57, S*0.5, S*0.64, S*0.28);

        g.fillStyle(0xfbbf24, 0.6);
        g.fillTriangle(S*0.64, S*0.4, S*0.57, S*0.5, S*0.62, S*0.32);

        // Neck
        g.fillStyle(0xf97316);
        g.fillEllipse(S*0.58, S*0.4, S*0.12, S*0.15);

        // Head
        g.fillStyle(0xfbbf24);
        g.fillCircle(S*0.65, S*0.3, S*0.14);

        // Crown feathers (flame-like)
        g.fillStyle(0xef4444, 0.8);
        g.fillTriangle(S*0.58, S*0.2, S*0.6, S*0.1, S*0.62, S*0.2);
        g.fillTriangle(S*0.64, S*0.18, S*0.65, S*0.08, S*0.66, S*0.18);
        g.fillTriangle(S*0.7, S*0.2, S*0.7, S*0.1, S*0.68, S*0.2);

        g.fillStyle(0xfbbf24);
        g.fillTriangle(S*0.62, S*0.2, S*0.63, S*0.12, S*0.64, S*0.2);

        // Beak
        g.fillStyle(0xf97316);
        g.fillTriangle(S*0.74, S*0.28, S*0.82, S*0.3, S*0.74, S*0.32);

        // Eye (glowing red)
        g.fillStyle(0xef4444);
        g.fillCircle(S*0.68, S*0.28, 5);
        g.fillStyle(0xfbbf24);
        g.fillCircle(S*0.68, S*0.28, 3);
        g.fillStyle(0xffffff);
        g.fillCircle(S*0.69, S*0.27, 2);

        // Legs/talons
        g.lineStyle(3, 0x92400e);
        g.lineBetween(S*0.42, S*0.65, S*0.38, S*0.75);
        g.lineBetween(S*0.48, S*0.65, S*0.48, S*0.75);

        // Talons (claws)
        g.lineStyle(2, 0x78350f);
        g.lineBetween(S*0.38, S*0.75, S*0.35, S*0.78);
        g.lineBetween(S*0.38, S*0.75, S*0.38, S*0.78);
        g.lineBetween(S*0.38, S*0.75, S*0.41, S*0.78);

        // Flame particles around
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const dist = S*0.4;
            const x = S*0.5 + Math.cos(angle) * dist;
            const y = S*0.5 + Math.sin(angle) * dist;
            g.fillStyle(0xfbbf24, 0.3 + Math.random()*0.3);
            g.fillCircle(x, y, 3 + Math.random()*3);
        }

        g.generateTexture('enemy_phoenix', S, S);
        g.destroy();
    }

    private _makeNPCWordkeeper() {
        if (this.textures.exists('npc_wordkeeper')) return;
        const g = this.make.graphics({});
        // Robe (purple)
        g.fillStyle(0x7e22ce); g.fillRoundedRect(8, 20, 30, 22, 6);
        // Head
        g.fillStyle(0xfde68a); g.fillCircle(23, 17, 11);
        // Long hair
        g.fillStyle(0x92400e);
        g.fillRoundedRect(11, 14, 5, 22, 4);
        g.fillRoundedRect(30, 14, 5, 22, 4);
        // Hood
        g.fillStyle(0x581c87); g.fillRoundedRect(10, 12, 26, 10, 8);
        // Eyes
        g.fillStyle(0x1e293b); g.fillCircle(19, 17, 2); g.fillCircle(27, 17, 2);
        // Book in hand
        g.fillStyle(0x16a34a); g.fillRoundedRect(36, 20, 12, 16, 3);
        g.fillStyle(0xfef3c7); g.fillRect(38, 23, 8, 10);
        g.fillStyle(0x64748b); g.fillRect(38, 25, 8, 1); g.fillRect(38, 27, 8, 1); g.fillRect(38, 29, 8, 1);
        // Exclamation mark
        g.fillStyle(0xa855f7); g.fillRect(20, -8, 6, 8); g.fillCircle(23, 2, 3);
        g.generateTexture('npc_wordkeeper', 52, 50);
        g.destroy();
    }

    // ─── Player ───────────────────────────────────────────────────
    private _createPlayer() {
        const startX = ZONE_SPLIT * TILE / 2;
        const startY = MAP_H * TILE / 2;
        this.player = this.physics.add.image(startX, startY, 'wizard');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.setScale(1.1);
    }

    // ─── NPCs ─────────────────────────────────────────────────────
    private _spawnNPCs() {
        this.npcs = this.physics.add.group();

        const npcDefs = [
            { id: 'npc_mathius', key: 'npc_mathius', x: TILE * 5, y: MAP_H * TILE / 2, label: 'Проф. Матиус', labelColor: '#93c5fd' },
            { id: 'npc_wordkeeper', key: 'npc_wordkeeper', x: (ZONE_SPLIT + 4) * TILE, y: MAP_H * TILE / 2, label: 'Хранитель Слова', labelColor: '#d8b4fe' },
            { id: 'npc_geomancer', key: 'npc_geomancer', x: (GEO_SPLIT + 4) * TILE, y: MAP_H * TILE / 2, label: 'Архимаг Геометр', labelColor: '#fbbf24' },
        ];

        npcDefs.forEach(def => {
            const npc = this.physics.add.image(def.x, def.y, def.key);
            npc.setData('npcId', def.id);
            npc.setDepth(11);
            npc.setImmovable(true);
            this.npcs.add(npc);

            // Name label
            this.add.text(def.x, def.y - 36, def.label, {
                fontSize: '11px', fontFamily: 'sans-serif', color: def.labelColor,
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(20);

            // "!" bubble
            this.add.text(def.x + 16, def.y - 48, '!', {
                fontSize: '18px', fontFamily: 'sans-serif', fontStyle: 'bold',
                color: '#fbbf24', stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(21);

            // Idle bob
            this.tweens.add({
                targets: npc,
                y: def.y - 5,
                duration: 1200 + Math.random() * 400,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        });
    }

    // ─── Geometry zone barrier ────────────────────────────────────
    private _drawGeoBarrier() {
        const H = MAP_H * TILE;
        const bx = GEO_SPLIT * TILE;
        const zoneW = (MAP_W - GEO_SPLIT - 1) * TILE;

        this.geoBarrier = this.add.group();

        // Gold barrier overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0xd97706, 0.18);
        overlay.fillRect(bx, TILE, zoneW, H - TILE * 2);
        overlay.lineStyle(4, 0xd97706, 0.6);
        overlay.strokeRect(bx, TILE, zoneW, H - TILE * 2);
        overlay.setDepth(15);
        this.geoBarrier.add(overlay);

        const lockText = this.add.text(bx + zoneW / 2, H / 2, '🔒', {
            fontSize: '48px', fontFamily: 'sans-serif',
        }).setOrigin(0.5).setDepth(16);
        this.geoBarrier.add(lockText);

        const reqText = this.add.text(bx + zoneW / 2, H / 2 + 60, 'Академия Геометрии\n(Ур. 5+)', {
            fontSize: '14px', fontFamily: 'sans-serif', color: '#fcd34d',
            stroke: '#000', strokeThickness: 3, align: 'center',
        }).setOrigin(0.5).setDepth(16);
        this.geoBarrier.add(reqText);

        // Physics wall
        const barrierWall = this.add.rectangle(bx + 2, H / 2, 4, H, 0x000000, 0);
        this.physics.add.existing(barrierWall, true);
        this.walls.add(barrierWall);
        barrierWall.setData('isGeoBarrier', true);
        this.geoBarrier.add(barrierWall);
    }

    private _checkGeoZoneUnlock() {
        const { geoZoneUnlocked } = useGameStore.getState();
        if (geoZoneUnlocked && !this.geoBarrierUnlocked) {
            this._unlockGeoZone();
        }
    }

    private _unlockGeoZone() {
        this.geoBarrierUnlocked = true;
        this.geoBarrier.getChildren().forEach(child => {
            this.tweens.add({
                targets: child, alpha: 0, duration: 800, ease: 'Power2',
                onComplete: () => {
                    if ((child as any).getData?.('isGeoBarrier')) {
                        this.walls.remove(child as any, true, false);
                    }
                    child.destroy();
                }
            });
        });
        const H = MAP_H * TILE;
        const bx = GEO_SPLIT * TILE;
        const zoneW = (MAP_W - GEO_SPLIT) * TILE;
        const msg = this.add.text(bx + zoneW / 2, H / 2, '✨ Академия Геометрии открыта!', {
            fontSize: '22px', fontFamily: 'sans-serif', color: '#fbbf24',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20).setAlpha(0);
        this.tweens.add({ targets: msg, alpha: 1, duration: 400 });
        this.time.delayedCall(2500, () => {
            this.tweens.add({ targets: msg, alpha: 0, duration: 500, onComplete: () => msg.destroy() });
        });
    }
    private _drawRusBarrier() {
        const H = MAP_H * TILE;
        const bx = ZONE_SPLIT * TILE;

        this.rusBarrier = this.add.group();

        // Red semi-transparent wall overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0xef4444, 0.18);
        overlay.fillRect(bx, TILE, (MAP_W - ZONE_SPLIT - 1) * TILE, H - TILE * 2);
        overlay.lineStyle(4, 0xef4444, 0.6);
        overlay.strokeRect(bx, TILE, (MAP_W - ZONE_SPLIT - 1) * TILE, H - TILE * 2);
        overlay.setDepth(15);
        this.rusBarrier.add(overlay);

        // Lock text
        const lockText = this.add.text(bx + ((MAP_W - ZONE_SPLIT) * TILE) / 2, H / 2, '🔒', {
            fontSize: '48px', fontFamily: 'sans-serif',
        }).setOrigin(0.5).setDepth(16);
        this.rusBarrier.add(lockText);

        const reqText = this.add.text(bx + ((MAP_W - ZONE_SPLIT) * TILE) / 2, H / 2 + 60, 'Нужен\nуровень 3', {
            fontSize: '16px', fontFamily: 'sans-serif', color: '#fca5a5',
            stroke: '#000', strokeThickness: 3, align: 'center',
        }).setOrigin(0.5).setDepth(16);
        this.rusBarrier.add(reqText);

        // Physics wall for barrier
        const barrierWall = this.add.rectangle(bx + 2, H / 2, 4, H, 0x000000, 0);
        this.physics.add.existing(barrierWall, true);
        this.walls.add(barrierWall);
        barrierWall.setData('isRusBarrier', true);
        this.rusBarrier.add(barrierWall);
    }

    private _checkRusZoneUnlock() {
        const { rusZoneUnlocked } = useGameStore.getState();
        if (rusZoneUnlocked && !this.rusBarrierUnlocked) {
            this._unlockRusZone();
        }
    }

    private _unlockRusZone() {
        this.rusBarrierUnlocked = true;
        this.rusBarrier.getChildren().forEach(child => {
            this.tweens.add({
                targets: child,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => {
                    if (child instanceof Phaser.GameObjects.GameObject) {
                        // Remove physics barrier from walls group if it is one
                        if ((child as any).getData?.('isRusBarrier')) {
                            this.walls.remove(child as any, true, false);
                        }
                        child.destroy();
                    }
                }
            });
        });

        // Unlock text
        const H = MAP_H * TILE;
        const bx = ZONE_SPLIT * TILE;
        const unlockMsg = this.add.text(bx + ((MAP_W - ZONE_SPLIT) * TILE) / 2, H / 2, '✨ Зона открыта!', {
            fontSize: '24px', fontFamily: 'sans-serif', color: '#a855f7',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20).setAlpha(0);
        this.tweens.add({ targets: unlockMsg, alpha: 1, duration: 400, ease: 'Power2' });
        this.time.delayedCall(2500, () => {
            this.tweens.add({ targets: unlockMsg, alpha: 0, duration: 500, onComplete: () => unlockMsg.destroy() });
        });
    }

    // ─── Enemies ─────────────────────────────────────────────────
    private _spawnEnemies() {
        this.enemies = this.physics.add.group();

        const enemyDefs = [
            { zone: 'math', type: 'goblin', key: 'enemy_goblin', difficulty: 1 },
            { zone: 'math', type: 'troll', key: 'enemy_troll', difficulty: 2 },
            { zone: 'russian', type: 'slime', key: 'enemy_slime', difficulty: 1 },
            { zone: 'russian', type: 'witch', key: 'enemy_witch', difficulty: 2 },
            { zone: 'geometry', type: 'dragon', key: 'enemy_dragon', difficulty: 3 },
            { zone: 'geometry', type: 'phoenix', key: 'enemy_phoenix', difficulty: 3 },
        ] as const;

        enemyDefs.forEach((def, defIdx) => {
            const count = 3;
            const isGeo = def.zone === 'geometry';
            const isMath = def.zone === 'math';
            const minX = isGeo ? (GEO_SPLIT + 1) * TILE
                : isMath ? TILE * 2
                    : (ZONE_SPLIT + 1) * TILE;
            const maxX = isGeo ? (MAP_W - 2) * TILE
                : isMath ? (ZONE_SPLIT - 1) * TILE
                    : (GEO_SPLIT - 1) * TILE;
            const minY = TILE * 2;
            const maxY = (MAP_H - 2) * TILE;

            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(minX + 48, maxX - 48);
                const y = Phaser.Math.Between(minY + 48, maxY - 48);
                const enemy = this.physics.add.image(x, y, def.key);
                enemy.setData('id', `${def.zone}_${def.type}_${defIdx}_${i}`);
                enemy.setData('type', def.type);
                enemy.setData('difficulty', def.difficulty);
                enemy.setData('zone', def.zone);
                enemy.setDepth(9);
                this.enemies.add(enemy);

                this.tweens.add({
                    targets: enemy, y: y - 7,
                    duration: 800 + Math.random() * 500,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
                    delay: Math.random() * 800,
                });
            }
        });
    }

    // ─── Labels ───────────────────────────────────────────────────
    private _drawZoneLabels() {
        const H = MAP_H * TILE;
        const mathCX = ZONE_SPLIT * TILE / 2;
        const rusCX = ZONE_SPLIT * TILE + (GEO_SPLIT - ZONE_SPLIT) * TILE / 2;
        const geoCX = GEO_SPLIT * TILE + (MAP_W - GEO_SPLIT) * TILE / 2;

        const style = (color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
            fontSize: '16px', fontFamily: 'sans-serif', color,
            stroke: '#000000', strokeThickness: 4,
        });

        this.add.text(mathCX, 28, '⚔️ Зона Математики', style('#93c5fd')).setOrigin(0.5).setDepth(20);
        this.add.text(mathCX, 50, 'Реши примеры!', style('#60a5fa')).setOrigin(0.5).setDepth(20);
        this.add.text(rusCX, 28, '📖 Зона Русского', style('#d8b4fe')).setOrigin(0.5).setDepth(20);
        this.add.text(rusCX, 50, 'Исправь ошибки!', style('#c084fc')).setOrigin(0.5).setDepth(20);
        this.add.text(geoCX, 28, '📐 Академия Геометрии', style('#fcd34d')).setOrigin(0.5).setDepth(20);
        this.add.text(geoCX, 50, 'Фигуры и формулы!', style('#fbbf24')).setOrigin(0.5).setDepth(20);
    }

    // ─── Camera ──────────────────────────────────────────────────
    private _setupCamera() {
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.3);
        this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    }

    // ─── Input ───────────────────────────────────────────────────
    private _setupInput() {
        if (!this.input.keyboard) return;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
    }

    // ─── Collisions ──────────────────────────────────────────────
    private _setupCollisions() {
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.npcs);
        this.physics.add.overlap(this.player, this.enemies, (_p, e) => {
            this._handleEnemyCollision(e as Phaser.Physics.Arcade.Image);
        });
        this.physics.add.overlap(this.player, this.npcs, (_p, npc) => {
            this._handleNPCInteraction(npc as Phaser.Physics.Arcade.Image);
        });
    }

    // ─── Event Bridge ────────────────────────────────────────────
    private _setupEventBridge() {
        const handler = ((ev: CustomEvent) => {
            const id = ev.detail as string;
            this.enemies.getChildren().forEach((child) => {
                const img = child as Phaser.Physics.Arcade.Image;
                if (img.getData('id') === id) {
                    this.tweens.add({
                        targets: img,
                        alpha: 0, scaleX: 2, scaleY: 2,
                        duration: 400, ease: 'Power2',
                        onComplete: () => img.destroy(),
                    });
                }
            });
            this.battleActive = false;
            this._checkRusZoneUnlock();
            this._checkGeoZoneUnlock();
        }) as EventListener;

        window.addEventListener('enemyDefeated', handler);
        this.events.once('destroy', () => window.removeEventListener('enemyDefeated', handler));
    }

    private _handleEnemyCollision(enemy: Phaser.Physics.Arcade.Image) {
        if (this.battleActive) return;
        const store = useGameStore.getState();
        if (store.gameState !== 'PLAYING') return;

        const zone = enemy.getData('zone') as 'math' | 'russian' | 'geometry';
        if (zone === 'russian' && !store.rusZoneUnlocked) return;
        if (zone === 'geometry' && !store.geoZoneUnlocked) return;

        this.battleActive = true;
        store.triggerBattle(
            {
                id: enemy.getData('id'),
                type: enemy.getData('type'),
                difficulty: enemy.getData('difficulty'),
            },
            zone,
            zone
        );
    }

    private _handleNPCInteraction(npc: Phaser.Physics.Arcade.Image) {
        if (this.npcCooldown) return;
        const store = useGameStore.getState();
        if (store.gameState !== 'PLAYING') return;
        if (store.npcDialog.isOpen) return;
        if (store.questLogOpen) return;   // don't open NPC while journal is open
        if (store.skillsPanelOpen) return;

        this.npcCooldown = true;
        const npcId = npc.getData('npcId') as string;
        store.openNpcDialog(npcId);

        // Увеличенный кулдаун чтобы диалог не переоткрывался сразу после закрытия
        this.time.delayedCall(3000, () => { this.npcCooldown = false; });
    }

    // ─── Update ──────────────────────────────────────────────────
    update() {
        const store = useGameStore.getState();

        // Stop player whenever ANY overlay/state blocks gameplay
        const blocked =
            store.gameState !== 'PLAYING' ||
            store.questLogOpen ||
            store.npcDialog.isOpen ||
            store.skillsPanelOpen;

        if (blocked) {
            this.player.setVelocity(0);
            return;
        }

        // Check zone unlocks periodically
        this._checkRusZoneUnlock();
        this._checkGeoZoneUnlock();

        const speed = 220;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd?.left.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd?.right.isDown) vx = speed;
        if (this.cursors.up.isDown || this.wasd?.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd?.down.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.player.setVelocity(vx, vy);

        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);
    }
}
