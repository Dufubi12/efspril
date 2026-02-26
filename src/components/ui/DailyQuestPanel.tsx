'use client';
import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface Props { onClose: () => void; }

export default function DailyQuestPanel({ onClose }: Props) {
    const { dailyQuests, claimDailyBonus } = useGameStore();
    const dq = dailyQuests;

    if (!dq) return null;

    const allDone = dq.quests.every(q => q.completed);
    const doneCnt = dq.quests.filter(q => q.completed).length;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 280,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        }}>
            <div style={{
                width: 460, maxHeight: '80vh',
                background: 'linear-gradient(160deg, #0a0f1e, #111827)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 0 80px rgba(99,102,241,0.15)',
                display: 'flex', flexDirection: 'column',
                animation: 'fadeInScale 0.25s ease',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px 16px',
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.15), transparent)',
                    borderBottom: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    <span style={{ fontSize: 28 }}>📅</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#818cf8', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 18 }}>
                            Задания дня
                        </div>
                        <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12, marginTop: 2 }}>
                            {doneCnt}/{dq.quests.length} выполнено · Сбрасываются каждый день
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', width: 32, height: 32, borderRadius: 8,
                        fontSize: 16, cursor: 'pointer',
                    }}>✕</button>
                </div>

                {/* Progress bar */}
                <div style={{ padding: '12px 24px 0' }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${(doneCnt / dq.quests.length) * 100}%`,
                            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </div>

                {/* Quest list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                    {dq.quests.map(q => {
                        const pct = Math.min(100, (q.current / q.target) * 100);
                        return (
                            <div key={q.id} style={{
                                marginBottom: 12, borderRadius: 16, padding: '14px',
                                background: q.completed ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${q.completed ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontSize: 22 }}>{q.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            color: q.completed ? '#818cf8' : '#e2e8f0',
                                            fontFamily: 'sans-serif', fontWeight: 700, fontSize: 14,
                                            textDecoration: q.completed ? 'line-through' : 'none',
                                        }}>
                                            {q.title}
                                        </div>
                                        <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 11, marginTop: 2, display: 'flex', gap: 8 }}>
                                            <span style={{ color: '#818cf8' }}>+{q.xpReward} XP</span>
                                            <span style={{ color: '#fbbf24' }}>+{q.goldReward} 🪙</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        color: q.completed ? '#4ade80' : '#94a3b8',
                                        fontFamily: 'sans-serif', fontWeight: 700, fontSize: 13,
                                    }}>
                                        {q.completed ? '✓' : `${q.current}/${q.target}`}
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 99, width: `${pct}%`,
                                        background: q.completed ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : 'linear-gradient(90deg, #6366f1, #818cf8)',
                                        transition: 'width 0.4s ease',
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bonus claim */}
                <div style={{ padding: '0 24px 24px' }}>
                    {allDone && !dq.bonusClaimed ? (
                        <button onClick={claimDailyBonus} style={{
                            width: '100%', padding: '14px',
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            color: '#fff', border: 'none', borderRadius: 14,
                            fontFamily: 'sans-serif', fontWeight: 900, fontSize: 15,
                            cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                        }}>
                            🎁 Получить ежедневный бонус (+150 XP, +80 🪙, +Зелье)
                        </button>
                    ) : allDone && dq.bonusClaimed ? (
                        <div style={{
                            textAlign: 'center', padding: '12px',
                            color: '#4ade80', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 14,
                        }}>
                            ✅ Бонус получен! Возвращайся завтра за новыми заданиями.
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: '12px',
                            color: '#475569', fontFamily: 'sans-serif', fontSize: 13,
                        }}>
                            🎁 Выполни все задания, чтобы получить бонус
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }`}</style>
        </div>
    );
}
