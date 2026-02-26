'use client';

import React, { useState } from 'react';
import { useGameStore, InventoryItem } from '@/store/useGameStore';

// ─── Shop catalogue ───────────────────────────────────────────
interface ShopItem {
    id: string;
    name: string;
    emoji: string;
    description: string;
    price: number;
    type: InventoryItem['type'];
    stock: number | null; // null = unlimited
}

const SHOP_CATALOGUE: ShopItem[] = [
    {
        id: 'health_potion',
        name: 'Зелье здоровья',
        emoji: '🧪',
        description: 'Восстанавливает 30 HP. Употреблять в инвентаре.',
        price: 15,
        type: 'potion',
        stock: null,
    },
    {
        id: 'big_potion',
        name: 'Большое зелье',
        emoji: '🫧',
        description: 'Восстанавливает 60 HP — мощнее обычного!',
        price: 30,
        type: 'potion',
        stock: null,
    },
    {
        id: 'math_scroll',
        name: 'Свиток Счёта',
        emoji: '📜',
        description: 'Помогает в математических задачах.',
        price: 25,
        type: 'scroll',
        stock: null,
    },
    {
        id: 'rus_scroll',
        name: 'Свиток Слова',
        emoji: '📖',
        description: 'Помогает в задачах по русскому языку.',
        price: 25,
        type: 'scroll',
        stock: null,
    },
    {
        id: 'amulet',
        name: 'Амулет удачи',
        emoji: '🔮',
        description: 'Увеличивает шанс дропа редких предметов.',
        price: 80,
        type: 'artifact',
        stock: 1,
    },
    {
        id: 'shield_rune',
        name: 'Руна защиты',
        emoji: '🛡️',
        description: 'Не теряешь HP при поражении в бою (один раз).',
        price: 60,
        type: 'artifact',
        stock: 2,
    },
];

// ─── Price Tag ─────────────────────────────────────────────────
const typeGradient: Record<string, string> = {
    potion: 'linear-gradient(135deg, #052e16, #14532d)',
    scroll: 'linear-gradient(135deg, #1e1b4b, #312e81)',
    artifact: 'linear-gradient(135deg, #2e1065, #4c1d95)',
};

const typeBorder: Record<string, string> = {
    potion: 'rgba(34,197,94,0.25)',
    scroll: 'rgba(99,102,241,0.25)',
    artifact: 'rgba(168,85,247,0.35)',
};

// ─── Shop Panel ───────────────────────────────────────────────
const ShopPanel: React.FC = () => {
    const { gameState, setGameState, player, addItem, setGold } = useGameStore();
    const [purchased, setPurchased] = useState<Record<string, number>>({});
    const [notification, setNotification] = useState<string | null>(null);

    if (gameState !== 'SHOP' as any) return null;

    const showNotif = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2000);
    };

    const handleBuy = (item: ShopItem) => {
        const gold = useGameStore.getState().player.gold;
        if (gold < item.price) { showNotif('❌ Недостаточно золота!'); return; }

        const boughtCount = purchased[item.id] ?? 0;
        if (item.stock !== null && boughtCount >= item.stock) {
            showNotif('❌ Товар распродан!');
            return;
        }

        setGold(gold - item.price);

        addItem({ id: item.id, name: item.name, emoji: item.emoji, description: item.description, type: item.type });
        setPurchased(prev => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }));
        showNotif(`✅ Куплено: ${item.emoji} ${item.name}`);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
            <div style={{
                width: '100%', maxWidth: 760, maxHeight: '92vh',
                background: 'linear-gradient(160deg, #0a0f1e, #0f172a)',
                border: '1px solid rgba(251,191,36,0.25)', borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 0 80px rgba(251,191,36,0.1)',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(90deg, #78350f, #b45309)',
                    padding: '18px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(251,191,36,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>🏪</span>
                        <div>
                            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, fontFamily: 'sans-serif', margin: 0, letterSpacing: 1 }}>
                                МАГ-BAZAAR
                            </h2>
                            <p style={{ color: '#fcd34d', fontSize: 11, fontFamily: 'sans-serif', margin: 0, letterSpacing: 1 }}>
                                Лавка волшебника Аркануса
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: 10
                        }}>
                            <span style={{ fontSize: 18 }}>🪙</span>
                            <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 18, fontFamily: 'sans-serif' }}>
                                {player.gold}
                            </span>
                        </div>
                        <button
                            onClick={() => setGameState('PLAYING')}
                            style={{
                                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)',
                                color: '#94a3b8', padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                                fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700
                            }}
                        >✕ Уйти</button>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div style={{
                        background: notification.startsWith('✅') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        borderBottom: `1px solid ${notification.startsWith('✅') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        color: notification.startsWith('✅') ? '#4ade80' : '#f87171',
                        padding: '10px 24px', fontFamily: 'sans-serif', fontWeight: 700,
                        fontSize: 14, textAlign: 'center'
                    }}>
                        {notification}
                    </div>
                )}

                {/* Intro */}
                <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#78716c', fontFamily: 'sans-serif', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                        "Добро пожаловать, юный маг! Мои зелья помогут тебе в самых трудных битвах..."
                    </p>
                </div>

                {/* Items Grid */}
                <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                        {SHOP_CATALOGUE.map(item => {
                            const boughtCount = purchased[item.id] ?? 0;
                            const isSoldOut = item.stock !== null && boughtCount >= item.stock;
                            const canAfford = player.gold >= item.price;

                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        background: typeGradient[item.type],
                                        border: `1px solid ${typeBorder[item.type]}`,
                                        borderRadius: 18, padding: '18px',
                                        display: 'flex', flexDirection: 'column', gap: 10,
                                        opacity: isSoldOut ? 0.5 : 1,
                                        transition: 'transform 0.15s',
                                    }}
                                    onMouseEnter={e => !isSoldOut && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: 38 }}>{item.emoji}</span>
                                        {item.stock !== null && (
                                            <span style={{
                                                background: 'rgba(0,0,0,0.4)', color: '#fcd34d', fontSize: 10,
                                                fontFamily: 'sans-serif', fontWeight: 700, padding: '2px 8px', borderRadius: 6
                                            }}>
                                                {isSoldOut ? 'ПРОДАН' : `Осталось: ${item.stock - boughtCount}`}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, fontFamily: 'sans-serif' }}>
                                            {item.name}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'sans-serif', marginTop: 4 }}>
                                            {item.description}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ fontSize: 16 }}>🪙</span>
                                            <span style={{
                                                color: canAfford ? '#fbbf24' : '#ef4444',
                                                fontWeight: 900, fontSize: 18, fontFamily: 'sans-serif'
                                            }}>
                                                {item.price}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleBuy(item)}
                                            disabled={isSoldOut || !canAfford}
                                            style={{
                                                background: isSoldOut ? '#374151' : canAfford ? 'linear-gradient(90deg, #d97706, #b45309)' : 'rgba(255,255,255,0.05)',
                                                color: canAfford && !isSoldOut ? '#fff' : '#6b7280',
                                                border: 'none', padding: '8px 16px', borderRadius: 10,
                                                fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif',
                                                cursor: isSoldOut || !canAfford ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {isSoldOut ? 'Продан' : 'Купить'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: '#44403c', fontSize: 11, fontFamily: 'sans-serif', textAlign: 'center'
                }}>
                    💡 Зарабатывай золото, побеждая врагов в боях • S — открыть магазин
                </div>
            </div>
        </div>
    );
};

export default ShopPanel;
