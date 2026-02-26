'use client';

import React, { useEffect } from 'react';
import { useGameStore, XP_TABLE } from '@/store/useGameStore';

const HUD: React.FC = () => {
    const {
        player, gameState, setGameState, quests,
        setQuestLogOpen, skills, setSkillsPanelOpen,
        setLeaderboardOpen, setDailyPanelOpen, initDailyQuests, dailyQuests,
    } = useGameStore();
    const readyQuests = quests.filter(q => q.status === 'ready').length;
    const newSkills = skills.filter(s => s.unlocked && s.unlockLevel === player.level).length;
    const dailyDone = dailyQuests?.quests.filter(q => q.completed).length ?? 0;
    const dailyTotal = dailyQuests?.quests.length ?? 3;
    const dailyAllDone = dailyQuests?.quests.every(q => q.completed) && !dailyQuests?.bonusClaimed;

    // Init daily quests on first PLAYING state
    useEffect(() => {
        if (gameState === 'PLAYING') initDailyQuests();
    }, [gameState, initDailyQuests]);

    // ── Keyboard shortcuts ────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            const store = useGameStore.getState();
            if (store.gameState !== 'PLAYING') return;
            if (store.questLogOpen || store.npcDialog.isOpen || store.skillsPanelOpen) return;
            if (e.key === 'i' || e.key === 'ш') setGameState('INVENTORY');
            if (e.key === 'b' || e.key === 'и') setGameState('SHOP' as any);
            if (e.key === 'q' || e.key === 'й') setQuestLogOpen(true);
            if (e.key === 'k' || e.key === 'л') setSkillsPanelOpen(true);
            if (e.key === 'l' || e.key === 'д') setLeaderboardOpen(true);
            if (e.key === 'd' || e.key === 'в') setDailyPanelOpen(true);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [setGameState, setQuestLogOpen, setSkillsPanelOpen, setLeaderboardOpen, setDailyPanelOpen]);

    if (gameState !== 'PLAYING') return null;

    const xpFloor = XP_TABLE[Math.max(0, player.level - 1)] ?? 0;
    const xpCeil = player.xpToNextLevel ?? 100;
    const xpProgress = Math.min(((player.xp - xpFloor) / Math.max(1, xpCeil - xpFloor)) * 100, 100);
    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);

    return (
        <>
            {/* ── Player Panel ─────────────────────────────────────────── */}
            <div style={{
                position: 'fixed', top: 14, left: 14, zIndex: 100,
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                border: '1px solid rgba(99,102,241,0.3)',
                padding: '10px 16px', borderRadius: 18,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
            }}>
                {/* Avatar */}
                <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #9333ea)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    boxShadow: '0 0 12px rgba(99,102,241,0.5)'
                }}>🧙</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
                    {/* Name + level */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#e0e7ff', fontWeight: 700, fontSize: 13, fontFamily: 'sans-serif' }}>
                            {player.name}
                        </span>
                        <span style={{
                            background: 'rgba(99,102,241,0.3)', color: '#a5b4fc',
                            fontSize: 10, fontWeight: 700, fontFamily: 'sans-serif',
                            padding: '1px 7px', borderRadius: 5
                        }}>Ур.{player.level}</span>
                    </div>

                    {/* HP Bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ color: '#64748b', fontSize: 9, fontFamily: 'sans-serif' }}>HP</span>
                            <span style={{ color: '#f87171', fontSize: 9, fontFamily: 'sans-serif' }}>{player.hp}/{player.maxHp}</span>
                        </div>
                        <div style={{ width: 130, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3, width: `${hpPercent}%`, transition: 'width 0.5s',
                                background: hpPercent > 50 ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                                    : hpPercent > 25 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                        : 'linear-gradient(90deg,#ef4444,#f87171)'
                            }} />
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ color: '#64748b', fontSize: 9, fontFamily: 'sans-serif' }}>XP</span>
                            <span style={{ color: '#818cf8', fontSize: 9, fontFamily: 'sans-serif' }}>{player.xp}/{xpCeil}</span>
                        </div>
                        <div style={{ width: 130, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3, width: `${xpProgress}%`, transition: 'width 0.5s',
                                background: 'linear-gradient(90deg,#6366f1,#a855f7)',
                                boxShadow: '0 0 6px rgba(99,102,241,0.8)'
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Top Right Cluster ────────────────────────────────────── */}
            <div style={{
                position: 'fixed', top: 14, right: 14, zIndex: 100,
                display: 'flex', gap: 8, alignItems: 'center'
            }}>
                {/* Gold */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(251,191,36,0.3)', padding: '8px 14px', borderRadius: 12
                }}>
                    <span style={{ fontSize: 16 }}>🪙</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 15 }}>{player.gold}</span>
                </div>

                {/* Skill levels */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(99,102,241,0.25)', padding: '8px 14px', borderRadius: 12
                }}>
                    <span style={{ fontSize: 13 }}>🔢</span>
                    <span style={{ color: '#60a5fa', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 14 }}>{player.mathLevel}</span>
                    <span style={{ color: '#334155', fontSize: 12 }}>|</span>
                    <span style={{ fontSize: 13 }}>📖</span>
                    <span style={{ color: '#c084fc', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 14 }}>{player.rusLevel}</span>
                </div>

                {/* Shop btn */}
                <button
                    id="open-shop-btn"
                    onClick={() => setGameState('SHOP' as any)}
                    title="Магазин (S)"
                    style={{
                        background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(217,119,6,0.35)', padding: '8px 13px', borderRadius: 12,
                        color: '#fbbf24', cursor: 'pointer', fontSize: 18, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(217,119,6,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(217,119,6,0.35)')}
                >🏪</button>

                {/* Inventory btn */}
                <button
                    id="open-inventory-btn"
                    onClick={() => setGameState('INVENTORY')}
                    title="Инвентарь (I)"
                    style={{
                        background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,255,255,0.12)', padding: '8px 13px', borderRadius: 12,
                        color: '#94a3b8', cursor: 'pointer', fontSize: 18, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                >🎒</button>

                {/* Quest log btn */}
                <button
                    id="open-quest-btn"
                    onClick={() => setQuestLogOpen(true)}
                    title="Журнал квестов (Q)"
                    style={{
                        background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                        border: `1px solid ${readyQuests > 0 ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        padding: '8px 13px', borderRadius: 12,
                        color: readyQuests > 0 ? '#22c55e' : '#94a3b8',
                        cursor: 'pointer', fontSize: 18, transition: 'all 0.2s',
                        position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = readyQuests > 0 ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.12)')}
                >
                    📜
                    {readyQuests > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#22c55e', color: '#fff',
                            width: 16, height: 16, borderRadius: '50%',
                            fontSize: 10, fontWeight: 900, fontFamily: 'sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{readyQuests}</span>
                    )}
                </button>

                {/* Skills btn */}
                <button
                    id="open-skills-btn"
                    onClick={() => setSkillsPanelOpen(true)}
                    title="Заклинания (K)"
                    style={{
                        background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                        border: `1px solid ${newSkills > 0 ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        padding: '8px 13px', borderRadius: 12,
                        color: newSkills > 0 ? '#fbbf24' : '#94a3b8',
                        cursor: 'pointer', fontSize: 18, transition: 'all 0.2s',
                        position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = newSkills > 0 ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.12)')}
                >
                    ⚡
                    {newSkills > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#fbbf24', color: '#000',
                            width: 16, height: 16, borderRadius: '50%',
                            fontSize: 10, fontWeight: 900, fontFamily: 'sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>!</span>
                    )}
                </button>

                {/* Leaderboard btn */}
                <button
                    id="open-leaderboard-btn"
                    onClick={() => setLeaderboardOpen(true)}
                    title="Таблица рекордов (L)"
                    style={{
                        background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '8px 13px', borderRadius: 12,
                        color: '#94a3b8',
                        cursor: 'pointer', fontSize: 18, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                >
                    🏆
                </button>

                {/* Daily quests btn */}
                <button
                    id="open-daily-btn"
                    onClick={() => setDailyPanelOpen(true)}
                    title="Задания дня (D)"
                    style={{
                        background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(14px)',
                        border: `1px solid ${dailyAllDone ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.12)'}`,
                        padding: '8px 13px', borderRadius: 12,
                        color: dailyAllDone ? '#818cf8' : '#94a3b8',
                        cursor: 'pointer', fontSize: 18, transition: 'all 0.2s',
                        position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = dailyAllDone ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.12)')}
                >
                    📅
                    {dailyAllDone && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#6366f1', color: '#fff',
                            width: 16, height: 16, borderRadius: '50%',
                            fontSize: 10, fontWeight: 900, fontFamily: 'sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>!</span>
                    )}
                    {!dailyAllDone && dailyQuests && (
                        <span style={{
                            position: 'absolute', bottom: -4, right: -4,
                            background: '#1e293b', color: '#818cf8',
                            borderRadius: 99, fontSize: 9, fontWeight: 700,
                            fontFamily: 'sans-serif', padding: '1px 4px', border: '1px solid rgba(99,102,241,0.3)',
                        }}>{dailyDone}/{dailyTotal}</span>
                    )}
                </button>
            </div>

            {/* ── Bottom hint ───────────────────────────────────────────── */}
            <div style={{
                position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                zIndex: 100, color: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'sans-serif',
                background: 'rgba(0,0,0,0.3)', padding: '4px 14px', borderRadius: 999,
                whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
                WASD — движение &nbsp;•&nbsp; I — инвентарь &nbsp;•&nbsp; B — магазин &nbsp;•&nbsp; Q — квесты &nbsp;•&nbsp; K — заклинания &nbsp;•&nbsp; L — рекорды &nbsp;•&nbsp; D — задания дня
            </div>
        </>
    );
};

export default HUD;
