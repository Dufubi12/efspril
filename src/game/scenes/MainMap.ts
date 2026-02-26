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
        g.fillStyle(0x6366f1); g.fillRoundedRect(8, 18, 28, 20, 6);
        g.fillStyle(0xfde68a); g.fillCircle(22, 16, 10);
        g.fillStyle(0x4338ca);
        g.fillTriangle(12, 16, 32, 16, 22, 0);
        g.fillRect(10, 14, 24, 5);
        g.fillStyle(0xa5b4fc); g.fillRect(10, 14, 24, 3);
        g.fillStyle(0x1e1e2e); g.fillCircle(17, 15, 2); g.fillCircle(27, 15, 2);
        g.fillStyle(0xc4b5fd); g.fillRect(36, 20, 4, 14);
        g.fillStyle(0xfbbf24); g.fillCircle(38, 20, 4);
        g.generateTexture('wizard', 46, 44);
        g.destroy();
    }

    private _makeEnemyGoblin() {
        if (this.textures.exists('enemy_goblin')) return;
        const g = this.make.graphics({});
        g.fillStyle(0x22c55e);
        g.fillCircle(20, 12, 11);
        g.fillRoundedRect(6, 18, 28, 18, 5);
        g.fillStyle(0xff4444); g.fillCircle(14, 11, 3); g.fillCircle(26, 11, 3);
        g.fillStyle(0x000000); g.fillCircle(14, 11, 1.5); g.fillCircle(26, 11, 1.5);
        g.fillStyle(0x16a34a);
        g.fillTriangle(7, 6, 2, 16, 12, 16);
        g.fillTriangle(33, 6, 38, 16, 28, 16);
        g.generateTexture('enemy_goblin', 40, 38);
        g.destroy();
    }

    private _makeEnemySlime() {
        if (this.textures.exists('enemy_slime')) return;
        const g = this.make.graphics({});
        g.fillStyle(0xec4899);
        g.fillEllipse(20, 24, 34, 24);
        g.fillStyle(0xf472b6, 0.7);
        g.fillEllipse(20, 16, 24, 20);
        g.fillStyle(0xffffff); g.fillCircle(13, 16, 5); g.fillCircle(27, 16, 5);
        g.fillStyle(0x881337); g.fillCircle(13, 16, 2.5); g.fillCircle(27, 16, 2.5);
        g.generateTexture('enemy_slime', 40, 40);
        g.destroy();
    }

    private _makeEnemyTroll() {
        if (this.textures.exists('enemy_troll')) return;
        const g = this.make.graphics({});
        g.fillStyle(0x8b5cf6);
        g.fillRoundedRect(4, 12, 34, 24, 5);
        g.fillCircle(21, 14, 13);
        g.fillStyle(0xfbbf24); g.fillCircle(14, 13, 4); g.fillCircle(28, 13, 4);
        g.fillStyle(0x000000); g.fillCircle(14, 13, 2); g.fillCircle(28, 13, 2);
        g.fillStyle(0xd97706);
        g.fillTriangle(12, 4, 8, -4, 17, 2);
        g.fillTriangle(30, 4, 34, -4, 25, 2);
        g.generateTexture('enemy_troll', 42, 40);
        g.destroy();
    }

    private _makeEnemyWitch() {
        if (this.textures.exists('enemy_witch')) return;
        const g = this.make.graphics({});
        g.fillStyle(0xf59e0b);
        g.fillRoundedRect(8, 16, 26, 20, 5);
        g.fillStyle(0xfde68a); g.fillCircle(21, 14, 10);
        g.fillStyle(0x1e1e2e);
        g.fillTriangle(11, 14, 31, 14, 21, 0);
        g.fillRect(8, 12, 26, 4);
        g.fillStyle(0xfbbf24); g.fillRect(8, 12, 26, 3);
        g.fillStyle(0x78350f); g.fillCircle(16, 13, 3); g.fillCircle(26, 13, 3);
        g.fillStyle(0xfbbf24);
        g.fillTriangle(21, 22, 24, 26, 18, 26);
        g.fillTriangle(21, 30, 24, 26, 18, 26);
        g.generateTexture('enemy_witch', 40, 40);
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
        // Body
        g.fillStyle(0xdc2626); g.fillRoundedRect(6, 14, 32, 20, 6);
        // Head
        g.fillStyle(0xef4444); g.fillCircle(36, 16, 12);
        // Snout
        g.fillStyle(0xb91c1c); g.fillEllipse(44, 18, 10, 6);
        // Eyes
        g.fillStyle(0xfbbf24); g.fillCircle(32, 12, 4);
        g.fillStyle(0x000000); g.fillCircle(32, 12, 2);
        // Wings
        g.fillStyle(0x991b1b);
        g.fillTriangle(0, 16, 10, 4, 14, 20);
        g.fillTriangle(2, 22, 10, 34, 14, 20);
        // Tail
        g.fillStyle(0xdc2626);
        g.fillTriangle(2, 24, 2, 30, 8, 26);
        // Fire
        g.fillStyle(0xf97316, 0.9); g.fillEllipse(50, 18, 10, 6);
        g.fillStyle(0xfbbf24, 0.7); g.fillEllipse(54, 18, 6, 4);
        g.generateTexture('enemy_dragon', 60, 42);
        g.destroy();
    }

    // Phoenix texture
    private _makeEnemyPhoenix() {
        if (this.textures.exists('enemy_phoenix')) return;
        const g = this.make.graphics({});
        // Body
        g.fillStyle(0xf97316); g.fillEllipse(22, 24, 28, 22);
        // Flame tail
        g.fillStyle(0xef4444, 0.8);
        g.fillTriangle(0, 20, 14, 28, 0, 36);
        g.fillStyle(0xfbbf24, 0.7);
        g.fillTriangle(4, 22, 14, 28, 2, 32);
        // Wings
        g.fillStyle(0xf59e0b);
        g.fillTriangle(8, 10, 22, 18, 16, 4);
        g.fillTriangle(36, 10, 22, 18, 28, 4);
        // Head
        g.fillStyle(0xfde68a); g.fillCircle(30, 12, 9);
        // Beak
        g.fillStyle(0xfbbf24); g.fillTriangle(36, 11, 44, 13, 36, 15);
        // Eye
        g.fillStyle(0xef4444); g.fillCircle(27, 11, 3);
        g.fillStyle(0x000000); g.fillCircle(27, 11, 1.5);
        // Glow
        g.fillStyle(0xfbbf24, 0.3); g.fillCircle(22, 20, 18);
        g.generateTexture('enemy_phoenix', 46, 42);
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
