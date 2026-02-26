'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

const GameClient: React.FC = () => {
    const gameRef = useRef<any>(null);
    const containerId = 'phaser-game-container';
    const setGameState = useGameStore((state) => state.setGameState);

    useEffect(() => {
        if (typeof window === 'undefined' || gameRef.current) return;

        const initPhaser = async () => {
            try {
                const Phaser = (await import('phaser')).default;
                const { BootScene } = await import('@/game/scenes/BootScene');
                const { MainMap } = await import('@/game/scenes/MainMap');

                const config: Phaser.Types.Core.GameConfig = {
                    type: Phaser.AUTO,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    parent: containerId,
                    backgroundColor: '#1e293b',
                    physics: {
                        default: 'arcade',
                        arcade: {
                            gravity: { x: 0, y: 0 },
                            debug: false,
                        },
                    },
                    scale: {
                        mode: Phaser.Scale.FIT,
                        autoCenter: Phaser.Scale.CENTER_BOTH,
                        width: window.innerWidth,
                        height: window.innerHeight,
                        parent: containerId,
                        expandParent: true,
                    },
                    scene: [BootScene, MainMap],
                };

                gameRef.current = new Phaser.Game(config);
            } catch (err) {
                console.error('Failed to init Phaser:', err);
            }
        };

        initPhaser();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [setGameState]);

    return (
        <div
            id={containerId}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                background: '#0f172a',
                zIndex: 1
            }}
        />
    );
};

export default GameClient;
