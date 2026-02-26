'use client';

import React from 'react';
import { useGameStore, InventoryItem } from '@/store/useGameStore';

const typeColors: Record<string, { bg: string; border: string; badge: string }> = {
    potion: { bg: '#0f2d1f', border: 'rgba(34,197,94,0.3)', badge: '#166534' },
    scroll: { bg: '#1e1b4b', border: 'rgba(99,102,241,0.3)', badge: '#3730a3' },
    artifact: { bg: '#2d1444', border: 'rgba(168,85,247,0.3)', badge: '#6b21a8' },
};

const typeLabel: Record<string, string> = {
    potion: 'Зелье', scroll: 'Свиток', artifact: 'Артефакт'
};

const ItemCard: React.FC<{ item: InventoryItem; onUse: () => void }> = ({ item, onUse }) => {
    const colors = typeColors[item.type] ?? typeColors.artifact;
    return (
        <div style={{
            background: colors.bg, border: `1px solid ${colors.border}`,
            borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
            transition: 'transform 0.2s', cursor: 'default'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 36 }}>{item.emoji}</span>
                <span style={{
                    background: colors.badge, color: '#fff', fontSize: 10, fontWeight: 700,
                    fontFamily: 'sans-serif', padding: '2px 8px', borderRadius: 6, letterSpacing: 1
                }}>
                    {typeLabel[item.type] ?? item.type}
                </span>
            </div>
            <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, fontFamily: 'sans-serif' }}>{item.name}</div>
                <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'sans-serif', marginTop: 4 }}>{item.description}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'sans-serif' }}>× {item.quantity}</span>
                <button
                    onClick={onUse}
                    style={{
                        background: '#6366f1', color: '#fff', border: 'none',
                        padding: '6px 14px', borderRadius: 8, fontSize: 12,
                        fontWeight: 700, fontFamily: 'sans-serif', cursor: 'pointer',
                        opacity: item.quantity > 0 ? 1 : 0.4,
                        transition: 'all 0.15s'
                    }}
                    disabled={item.quantity <= 0}
                    onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
                >
                    Применить
                </button>
            </div>
        </div>
    );
};

const InventoryPanel: React.FC = () => {
    const { gameState, setGameState, player, inventory, useItem } = useGameStore();

    if (gameState !== 'INVENTORY') return null;

    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
            <div style={{
                width: '100%', maxWidth: 700, maxHeight: '90vh',
                background: 'linear-gradient(160deg, #0a0f1e, #0f172a)',
                border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 0 80px rgba(99,102,241,0.2)', display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
                    padding: '20px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(99,102,241,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>🎒</span>
                        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 22, fontFamily: 'sans-serif', margin: 0, letterSpacing: 1 }}>
                            ИНВЕНТАРЬ
                        </h2>
                    </div>
                    <button
                        id="close-inventory-btn"
                        onClick={() => setGameState('PLAYING')}
                        style={{
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                            color: '#94a3b8', padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                            fontFamily: 'sans-serif', fontSize: 14, fontWeight: 700,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    >
                        ✕ Закрыть
                    </button>
                </div>

                {/* Player Stats */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', gap: 24, flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
                        }}>🧙</div>
                        <div>
                            <div style={{ color: '#e0e7ff', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 16 }}>{player.name}</div>
                            <div style={{ color: '#818cf8', fontFamily: 'sans-serif', fontSize: 12 }}>Уровень {player.level} Маг</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                        {[
                            { label: '❤️ HP', value: `${player.hp}/${player.maxHp}`, color: '#f87171' },
                            { label: '⭐ XP', value: `${player.xp}/${player.xpToNextLevel}`, color: '#a5b4fc' },
                            { label: '🪙 Золото', value: player.gold, color: '#fbbf24' },
                            { label: '🔢 Математика', value: `Ур.${player.mathLevel}`, color: '#60a5fa' },
                            { label: '📖 Русский', value: `Ур.${player.rusLevel}`, color: '#c084fc' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'sans-serif', letterSpacing: 1 }}>{label}</div>
                                <div style={{ color, fontWeight: 700, fontFamily: 'sans-serif', fontSize: 16, marginTop: 2 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Items */}
                <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                    {inventory.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#475569', fontFamily: 'sans-serif', padding: 40 }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                            <p>Инвентарь пуст. Победи врагов, чтобы получить предметы!</p>
                        </div>
                    ) : (
                        <>
                            <h3 style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 12, letterSpacing: 2, margin: '0 0 16px', textTransform: 'uppercase' }}>
                                Предметы ({inventory.length})
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                {inventory.map(item => (
                                    <ItemCard key={item.id} item={item} onUse={() => useItem(item.id)} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer tip */}
                <div style={{
                    padding: '12px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: '#334155', fontSize: 11, fontFamily: 'sans-serif', textAlign: 'center'
                }}>
                    💡 Подсказка: Зелья восстанавливают HP. Свитки помогают в бою. Продолжай побеждать врагов!
                </div>
            </div>
        </div>
    );
};

export default InventoryPanel;
