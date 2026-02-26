'use client';

import React from 'react';
import { useGameStore, Quest } from '@/store/useGameStore';

function QuestCard({ quest, onAccept, onComplete }: {
    quest: Quest;
    onAccept: () => void;
    onComplete: () => void;
}) {
    const pct = Math.min(100, (quest.goal.current / quest.goal.target) * 100);

    const statusConfig = {
        locked: { color: '#475569', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', badge: '🔒 Заблокировано' },
        available: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', badge: '✨ Доступно' },
        active: { color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', badge: '⚔️ Активно' },
        ready: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', badge: '✅ Выполнено' },
        completed: { color: '#64748b', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', badge: '☑️ Сдано' },
    };

    const cfg = statusConfig[quest.status];
    const zoneLabel = quest.goal.zone === 'math' ? '🔢 Матем.' : '📖 Русский';
    const zoneColor = quest.goal.zone === 'math' ? '#3b82f6' : '#a855f7';

    return (
        <div style={{
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 16, padding: '16px',
            opacity: quest.status === 'completed' ? 0.5 : 1,
            transition: 'all 0.2s',
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 14, marginBottom: 3 }}>
                        {quest.title}
                    </div>
                    <span style={{
                        background: `${zoneColor}22`, border: `1px solid ${zoneColor}44`,
                        color: zoneColor, fontSize: 10, fontFamily: 'sans-serif',
                        padding: '2px 8px', borderRadius: 6, fontWeight: 700
                    }}>
                        {zoneLabel}
                    </span>
                </div>
                <span style={{
                    fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700,
                    color: cfg.color, background: `${cfg.color}18`,
                    padding: '3px 9px', borderRadius: 8, whiteSpace: 'nowrap'
                }}>
                    {cfg.badge}
                </span>
            </div>

            {quest.status !== 'locked' && (
                <>
                    <p style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12, margin: '0 0 10px', lineHeight: 1.5 }}>
                        {quest.description}
                    </p>

                    {/* Progress bar */}
                    {(quest.status === 'active' || quest.status === 'ready') && (
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'sans-serif' }}>
                                    Прогресс: {quest.goal.current} / {quest.goal.target}
                                </span>
                                <span style={{ color: cfg.color, fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700 }}>
                                    {Math.round(pct)}%
                                </span>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${pct}%`,
                                    background: cfg.color, borderRadius: 3, transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Reward */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: quest.status === 'available' || quest.status === 'ready' ? 12 : 0 }}>
                        <span style={{ color: '#818cf8', fontSize: 11, fontFamily: 'sans-serif', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                            +{quest.reward.xp} XP
                        </span>
                        <span style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'sans-serif', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                            +{quest.reward.gold} 🪙
                        </span>
                        {quest.reward.item && (
                            <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'sans-serif', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6 }}>
                                {quest.reward.item.emoji} {quest.reward.item.name}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    {quest.status === 'available' && (
                        <button onClick={onAccept} style={{
                            width: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                            color: '#fff', border: 'none', borderRadius: 10,
                            padding: '10px', fontFamily: 'sans-serif', fontWeight: 700,
                            fontSize: 13, cursor: 'pointer',
                        }}>
                            ⚔️ Принять квест
                        </button>
                    )}
                    {quest.status === 'ready' && (
                        <button onClick={onComplete} style={{
                            width: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                            color: '#fff', border: 'none', borderRadius: 10,
                            padding: '10px', fontFamily: 'sans-serif', fontWeight: 700,
                            fontSize: 13, cursor: 'pointer',
                        }}>
                            ✅ Забрать награду!
                        </button>
                    )}
                </>
            )}

            {quest.status === 'locked' && (
                <p style={{ color: '#334155', fontFamily: 'sans-serif', fontSize: 12, margin: '6px 0 0' }}>
                    Выполни предыдущий квест, чтобы открыть
                </p>
            )}
        </div>
    );
}

export default function QuestLog() {
    const { quests, questLogOpen, setQuestLogOpen, acceptQuest, completeQuest } = useGameStore();

    if (!questLogOpen) return null;

    const mathQuests = quests.filter(q => q.goal.zone === 'math');
    const rusQuests = quests.filter(q => q.goal.zone === 'russian');
    const activeCount = quests.filter(q => q.status === 'active' || q.status === 'ready').length;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 250,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            padding: 20,
        }}>
            <div style={{
                width: '100%', maxWidth: 680,
                background: 'linear-gradient(160deg, #0a0f1e, #111827)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 0 60px rgba(99,102,241,0.2)',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div>
                        <h2 style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 20, margin: 0 }}>
                            📜 Журнал квестов
                        </h2>
                        <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12, marginTop: 3 }}>
                            {activeCount > 0 ? `${activeCount} активных квеста` : 'Нет активных квестов'}
                        </div>
                    </div>
                    <button onClick={() => setQuestLogOpen(false)} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', width: 36, height: 36, borderRadius: 10,
                        fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>

                {/* Content */}
                <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Math quests */}
                    <div>
                        <div style={{ color: '#3b82f6', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
                            🔢 Зона Арифмантии
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {mathQuests.map(q => (
                                <QuestCard
                                    key={q.id} quest={q}
                                    onAccept={() => acceptQuest(q.id)}
                                    onComplete={() => completeQuest(q.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Russian quests */}
                    <div>
                        <div style={{ color: '#a855f7', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
                            📖 Зона Словесной Магии
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {rusQuests.map(q => (
                                <QuestCard
                                    key={q.id} quest={q}
                                    onAccept={() => acceptQuest(q.id)}
                                    onComplete={() => completeQuest(q.id)}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
