import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMap } from './scenes/MainMap';

export const getGameConfig = (containerId: string): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    parent: containerId,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: process.env.NODE_ENV === 'development',
        },
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainMap],
});
