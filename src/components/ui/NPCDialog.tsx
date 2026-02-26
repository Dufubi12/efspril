'use client';

import React from 'react';
import { useGameStore, INITIAL_QUESTS } from '@/store/useGameStore';

const NPC_INFO: Record<string, {
    name: string; emoji: string; color: string; zone: string;
    greeting: string; questIntro: string;
}> = {
    npc_mathius: {
        name: 'Профессор Матиус',
        emoji: '🧙‍♂️',
        color: '#3b82f6',
        zone: 'Академия Арифмантии',
        greeting: 'Приветствую тебя, молодой маг! Я — Профессор Матиус, страж Академии Арифмантии.',
        questIntro: 'Числа — это основа всякой магии. Возьми задание и докажи, что достоин звания Мага Чисел!',
    },
    npc_wordkeeper: {
        name: 'Хранитель Слова',
        emoji: '📚',
        color: '#a855f7',
        zone: 'Академия Словесной Магии',
        greeting: 'Слово — сильнейшее заклинание во всём мире. Я — Хранитель Слова, страж этой академии.',
        questIntro: 'Тот, кто владеет словом — владеет миром. Возьми задание и стань Мастером Правописания!',
    },
    npc_geomancer: {
        name: 'Архимаг Геометр',
        emoji: '📐',
        color: '#f59e0b',
        zone: 'Академия Геометрии',
        greeting: 'Геометрия — язык богов и архитекторов вселенной. Я — Архимаг Геометр, и я вижу в тебе потенциал!',
        questIntro: 'Форма, угол, площадь — три столпа пространства. Прими мои задания и постигни тайны фигур!',
    },
};


export default function NPCDialog() {
    const { npcDialog, closeNpcDialog, quests, acceptQuest, setQuestLogOpen } = useGameStore();

    if (!npcDialog.isOpen || !npcDialog.npcId) return null;
    const npc = NPC_INFO[npcDialog.npcId];
    if (!npc) return null;

    const npcQuests = quests.filter(q => q.npcId === npcDialog.npcId);
    const availableQuest = npcQuests.find(q => q.status === 'available');
    const activeQuest = npcQuests.find(q => q.status === 'active');
    const readyQuest = npcQuests.find(q => q.status === 'ready');
    const allDone = npcQuests.every(q => q.status === 'completed');

    const handleAccept = () => {
        if (availableQuest) {
            acceptQuest(availableQuest.id);
            closeNpcDialog();
        }
    };

    const handleViewLog = () => {
        closeNpcDialog();
        setQuestLogOpen(true);
    };

    // Choose dialog text based on quest state
    let dialogText = npc.questIntro;
    let actionHelp = '';
    if (readyQuest) {
        dialogText = `Замечательно! Ты выполнил задание «${readyQuest.title}»! Забери награду в журнале квестов.`;
        actionHelp = 'Открой журнал квестов (Q), чтобы забрать награду.';
    } else if (activeQuest) {
        dialogText = `Ты уже взял задание «${activeQuest.title}». Прогресс: ${activeQuest.goal.current}/${activeQuest.goal.target}. Продолжай сражаться!`;
        actionHelp = '';
    } else if (allDone) {
        dialogText = 'Ты выполнил все мои задания, ученик. Ты достоин звания настоящего мага! Путь в новые земли открыт.';
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 260,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 20px 24px', pointerEvents: 'none',
        }}>
            <div style={{
                width: '100%', maxWidth: 640,
                background: 'linear-gradient(160deg, #0a0f1e, #111827)',
                border: `1px solid ${npc.color}55`,
                borderRadius: 24, overflow: 'hidden',
                boxShadow: `0 0 60px ${npc.color}33`,
                pointerEvents: 'auto',
                animation: 'slideUp 0.3s ease',
            }}>
                {/* NPC header */}
                <div style={{
                    padding: '16px 20px',
                    background: `linear-gradient(90deg, ${npc.color}22, transparent)`,
                    borderBottom: `1px solid ${npc.color}33`,
                    display: 'flex', alignItems: 'center', gap: 14,
                }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: `${npc.color}22`, border: `2px solid ${npc.color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, flexShrink: 0,
                    }}>
                        {npc.emoji}
                    </div>
                    <div>
                        <div style={{ color: '#e2e8f0', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 16 }}>
                            {npc.name}
                        </div>
                        <div style={{ color: npc.color, fontFamily: 'sans-serif', fontSize: 11, marginTop: 2 }}>
                            📍 {npc.zone}
                        </div>
                    </div>
                    <button onClick={closeNpcDialog} style={{
                        marginLeft: 'auto', background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8',
                        width: 32, height: 32, borderRadius: 8, fontSize: 16,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>

                {/* Dialog text */}
                <div style={{ padding: '16px 20px 0' }}>
                    <p style={{ color: '#cbd5e1', fontFamily: 'sans-serif', fontSize: 14, lineHeight: 1.65, margin: '0 0 4px' }}>
                        <span style={{ color: npc.color }}>«</span>{dialogText}<span style={{ color: npc.color }}>»</span>
                    </p>
                    {actionHelp && (
                        <p style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12, margin: '6px 0 0' }}>
                            💡 {actionHelp}
                        </p>
                    )}

                    {/* Quest preview if available */}
                    {availableQuest && (
                        <div style={{
                            background: `${npc.color}0f`, border: `1px solid ${npc.color}33`,
                            borderRadius: 14, padding: '12px', marginTop: 14,
                        }}>
                            <div style={{ color: '#e2e8f0', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                                ⚔️ {availableQuest.title}
                            </div>
                            <div style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 12, marginBottom: 8 }}>
                                {availableQuest.description}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ color: '#818cf8', fontSize: 11, fontFamily: 'sans-serif', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                                    +{availableQuest.reward.xp} XP
                                </span>
                                <span style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'sans-serif', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                                    +{availableQuest.reward.gold} 🪙
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
                    {availableQuest && (
                        <button onClick={handleAccept} style={{
                            flex: 1, background: `linear-gradient(90deg, ${npc.color}, ${npc.color}cc)`,
                            color: '#fff', border: 'none', borderRadius: 12,
                            padding: '12px', fontFamily: 'sans-serif', fontWeight: 700,
                            fontSize: 14, cursor: 'pointer',
                        }}>
                            ⚔️ Принять задание
                        </button>
                    )}
                    <button onClick={handleViewLog} style={{
                        flex: availableQuest ? 0.5 : 1,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', borderRadius: 12,
                        padding: '12px', fontFamily: 'sans-serif', fontWeight: 700,
                        fontSize: 14, cursor: 'pointer',
                    }}>
                        📜 Журнал
                    </button>
                    <button onClick={closeNpcDialog} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        color: '#64748b', borderRadius: 12,
                        padding: '12px 16px', fontFamily: 'sans-serif', fontWeight: 700,
                        fontSize: 14, cursor: 'pointer',
                    }}>
                        Уйти
                    </button>
                </div>
            </div>

            <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }`}</style>
        </div>
    );
}
