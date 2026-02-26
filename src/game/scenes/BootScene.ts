import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // No external assets needed - all textures are generated procedurally in MainMap
    }

    create() {
        this.scene.start('MainMap');
    }
}
