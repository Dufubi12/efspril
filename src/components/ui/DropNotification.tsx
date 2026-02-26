'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

const DropNotification: React.FC = () => {
    const { lastDrop, clearLastDrop } = useGameStore();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (lastDrop) {
            setVisible(true);
            const t = setTimeout(() => {
                setVisible(false);
                setTimeout(clearLastDrop, 400);
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [lastDrop, clearLastDrop]);

    if (!lastDrop) return null;

    return (
        <div style={{
            position: 'fixed', bottom: 80, right: 24, zIndex: 150,
            background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 16, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 0 30px rgba(99,102,241,0.3)',
            transform: visible ? 'translateX(0)' : 'translateX(120%)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            maxWidth: 280
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
            }}>
                {lastDrop.emoji}
            </div>
            <div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 11, fontFamily: 'sans-serif', letterSpacing: 1, marginBottom: 2 }}>
                    🎁 ПРЕДМЕТ ПОЛУЧЕН
                </div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, fontFamily: 'sans-serif' }}>
                    {lastDrop.name}
                </div>
                <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }}>
                    {lastDrop.description}
                </div>
            </div>
        </div>
    );
};

export default DropNotification;
