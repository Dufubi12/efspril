'use client';
import React, { useState, useEffect } from 'react';
import { loadLeaderboard, LeaderboardEntry } from '@/utils/saveGame';
import { CLASS_INFO } from '@/store/useGameStore';

interface Props { onClose: () => void; }

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ onClose }: Props) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [tab, setTab] = useState<'level' | 'gold'>('level');

    useEffect(() => {
        setEntries(loadLeaderboard());
    }, []);

    const sorted = [...entries].sort(tab === 'level'
        ? (a, b) => b.level - a.level || b.gold - a.gold
        : (a, b) => b.gold - a.gold || b.level - a.level
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 280,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        }}>
            <div style={{
                width: 480, maxHeight: '80vh',
                background: 'linear-gradient(160deg, #0a0f1e, #111827)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 0 80px rgba(251,191,36,0.15)',
                display: 'flex', flexDirection: 'column',
                animation: 'fadeInScale 0.25s ease',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    background: 'linear-gradient(90deg, rgba(251,191,36,0.15), transparent)',
                    borderBottom: '1px solid rgba(251,191,36,0.2)',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <span style={{ fontSize: 28 }}>🏆</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#fbbf24', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 18 }}>
                            Таблица рекордов
                        </div>
                        <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12, marginTop: 2 }}>
                            Топ-10 лучших магов
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', width: 32, height: 32, borderRadius: 8,
                        fontSize: 16, cursor: 'pointer',
                    }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, padding: '12px 24px 0' }}>
                    {(['level', 'gold'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            flex: 1, padding: '8px', borderRadius: 10, fontFamily: 'sans-serif',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            background: tab === t ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${tab === t ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.08)'}`,
                            color: tab === t ? '#fbbf24' : '#64748b',
                        }}>
                            {t === 'level' ? '⭐ По уровню' : '🪙 По золоту'}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}>
                    {sorted.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569', fontFamily: 'sans-serif', fontSize: 14 }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
                            Пока никто не попал в таблицу.<br />Победи врагов и займи первое место!
                        </div>
                    ) : sorted.map((e, i) => {
                        const classInfo = CLASS_INFO[e.class as keyof typeof CLASS_INFO] ?? CLASS_INFO.mage;
                        const isTop3 = i < 3;
                        return (
                            <div key={e.name + i} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '12px 14px', marginBottom: 8, borderRadius: 14,
                                background: isTop3 ? `rgba(251,191,36,${0.1 - i * 0.025})` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isTop3 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: isTop3 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: isTop3 ? 20 : 14, fontWeight: 700,
                                    color: isTop3 ? '#fbbf24' : '#475569', fontFamily: 'sans-serif',
                                }}>
                                    {MEDAL[i] ?? `#${i + 1}`}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: '#e2e8f0', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span>{classInfo.emoji}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                                    </div>
                                    <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 11, marginTop: 2 }}>
                                        {classInfo.name} · {e.wins} побед
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ color: '#818cf8', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 14 }}>Ур. {e.level}</div>
                                    <div style={{ color: '#fbbf24', fontFamily: 'sans-serif', fontSize: 12, marginTop: 2 }}>{e.gold} 🪙</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }`}</style>
        </div>
    );
}
