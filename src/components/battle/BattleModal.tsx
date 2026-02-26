'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

const ENEMY_VISUALS: Record<string, { emoji: string; color: string; name: string }> = {
    goblin: { emoji: '👺', color: '#22c55e', name: 'Гоблин' },
    slime: { emoji: '🟢', color: '#ec4899', name: 'Слизняк' },
    troll: { emoji: '👹', color: '#8b5cf6', name: 'Тролль' },
    witch: { emoji: '🧙‍♀️', color: '#f59e0b', name: 'Ведьма' },
    dragon: { emoji: '🐉', color: '#ef4444', name: 'Дракон' },
    phoenix: { emoji: '🦅', color: '#f97316', name: 'Феникс' },
};

const SUBJECT_LABELS: Record<string, string> = {
    math: '🔢 Магия математики',
    russian: '📖 Магия русского языка',
    geometry: '📐 Магия геометрии',
};

const LevelUpBanner: React.FC<{ newLevel: number; onClose: () => void }> = ({ newLevel, onClose }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)'
    }} onClick={onClose}>
        <div style={{
            background: 'linear-gradient(135deg, #312e81, #6d28d9)',
            border: '2px solid rgba(167,139,250,0.5)', borderRadius: 24, padding: '40px 60px',
            textAlign: 'center', boxShadow: '0 0 80px rgba(99,102,241,0.6)',
            animation: 'fadeInScale 0.4s ease'
        }}>
            <div style={{ fontSize: 72, marginBottom: 12 }}>⬆️</div>
            <h2 style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 32, margin: '0 0 8px' }}>
                УРОВЕНЬ ПОВЫШЕН!
            </h2>
            <p style={{ color: '#a5b4fc', fontFamily: 'sans-serif', fontSize: 20, margin: '0 0 24px' }}>
                Уровень {newLevel} разблокирован
            </p>
            <p style={{ color: '#818cf8', fontFamily: 'sans-serif', fontSize: 14, margin: '0 0 24px' }}>
                +20 HP • Более сложные вопросы открыты!
            </p>
            <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                padding: '10px 24px', borderRadius: 12, fontSize: 14, fontFamily: 'sans-serif',
                fontWeight: 700, cursor: 'pointer'
            }}>Продолжить →</button>
        </div>
        <style>{`@keyframes fadeInScale { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
);

const BattleModal: React.FC = () => {
    const { gameState, battleContext, finishBattle, player, skills, setSkillsPanelOpen } = useGameStore();
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
    const [levelUp, setLevelUp] = useState<number | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [hintVisible, setHintVisible] = useState(false);

    const activeEffect = battleContext.activeSkillEffect;
    const maxAttempts = activeEffect === 'extraAttempts' ? 6 : 3;
    const shieldActive = activeEffect === 'damageShield';
    const readySkills = skills.filter(s => s.unlocked);

    useEffect(() => {
        if (gameState === 'BATTLE') { setAnswer(''); setFeedback(null); setAttempts(0); setHintVisible(false); }
    }, [gameState]);

    // Auto-win on skipQuestion skill
    useEffect(() => {
        if (gameState === 'BATTLE' && activeEffect === 'skipQuestion') {
            const xpRew = Math.max(5, 20 * battleContext.difficulty);
            const goldRew = Math.max(2, 10 * battleContext.difficulty);
            setTimeout(() => {
                const prevLevel = player.level;
                finishBattle(true, { xp: xpRew, gold: goldRew });
                const newState = useGameStore.getState();
                if (newState.player.level > prevLevel) setLevelUp(newState.player.level);
            }, 500);
        }
    }, [activeEffect]);

    if (gameState !== 'BATTLE' || !battleContext.currentQuestion) return null;

    const vis = ENEMY_VISUALS[battleContext.enemyType ?? 'slime'];
    const xpReward = Math.max(5, 20 * battleContext.difficulty - attempts * 5);
    const goldReward = Math.max(2, 10 * battleContext.difficulty - attempts * 2);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback) return;
        if (activeEffect === 'showHint') setHintVisible(true);

        const isCorrect = answer.trim().toLowerCase() === battleContext.currentQuestion!.correctAnswer.toLowerCase();

        if (isCorrect) {
            setFeedback({ text: `✨ Правильно! +${xpReward} XP +${goldReward}🪙${activeEffect === 'xpBoost' ? ' 🔥×1.5' : ''}${activeEffect === 'goldBoost' ? ' ✨×2🪙' : ''}`, ok: true });

            const prevLevel = player.level;
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('enemyDefeated', { detail: battleContext.enemyId }));
                finishBattle(true, { xp: xpReward, gold: goldReward });
                setAnswer('');
                setFeedback(null);
                const newState = useGameStore.getState();
                if (newState.player.level > prevLevel) {
                    setLevelUp(newState.player.level);
                }
            }, 1500);
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= maxAttempts) {
                setFeedback({ text: '💀 Заклинание провалилось! Враг отступил.', ok: false });
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('enemyDefeated', { detail: battleContext.enemyId }));
                    if (shieldActive) {
                        finishBattle(false, { xp: 0, gold: 0 }); // no HP damage — shield handled by store
                    } else {
                        finishBattle(false, { xp: 0, gold: 0 });
                    }
                    setAnswer(''); setFeedback(null);
                }, 2000);
            } else {
                setFeedback({ text: `💥 Неверно! Осталось попыток: ${maxAttempts - newAttempts}`, ok: false });
                // Show hint after first error if showHint is active
                if (activeEffect === 'showHint') setHintVisible(true);
                setTimeout(() => { setFeedback(null); setAnswer(''); }, 1500);
            }
        }
    };

    return (
        <>
            {levelUp && <LevelUpBanner newLevel={levelUp} onClose={() => setLevelUp(null)} />}

            <div style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: 16
            }}>
                <div style={{
                    width: '100%', maxWidth: 500,
                    background: 'linear-gradient(160deg, #0f172a, #1e1b4b)',
                    border: '2px solid rgba(99,102,241,0.4)', borderRadius: 24, overflow: 'hidden',
                    boxShadow: '0 0 60px rgba(99,102,241,0.3)'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(90deg, #312e81, #4c1d95)', padding: '18px 24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid rgba(99,102,241,0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 26 }}>⚔️</span>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, fontFamily: 'sans-serif', letterSpacing: 2 }}>БИТВА!</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ background: 'rgba(255,255,255,0.1)', color: '#c7d2fe', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontFamily: 'sans-serif' }}>
                                ⚡ Сложность: {battleContext.difficulty}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fbbf24', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontFamily: 'sans-serif' }}>
                                +{xpReward}⭐ +{goldReward}🪙
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                        {/* Enemy */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 100, height: 100, borderRadius: '50%', margin: '0 auto 8px',
                                background: `rgba(${vis.color === '#22c55e' ? '34,197,94' : vis.color === '#ec4899' ? '236,72,153' : vis.color === '#8b5cf6' ? '139,92,246' : '245,158,11'},0.1)`,
                                border: `2px solid ${vis.color}33`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54,
                                boxShadow: `0 0 30px ${vis.color}44`
                            }}>{vis.emoji}</div>
                            <span style={{
                                background: '#dc2626', color: '#fff', padding: '3px 12px',
                                borderRadius: 8, fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, letterSpacing: 1
                            }}>{vis.name}</span>
                        </div>

                        {/* Question */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            <p style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'sans-serif', letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 6px' }}>
                                🔮 {SUBJECT_LABELS[battleContext.subject ?? 'math'] ?? 'Магия'}
                            </p>
                            {(battleContext.currentQuestion.hint || hintVisible || activeEffect === 'showHint') && (
                                <span style={{
                                    display: 'inline-block', marginBottom: 8,
                                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                                    color: '#a5b4fc', fontSize: 10, fontFamily: 'sans-serif',
                                    fontWeight: 700, letterSpacing: 1, padding: '2px 10px', borderRadius: 999
                                }}>
                                    📚 {hintVisible && battleContext.currentQuestion.correctAnswer
                                        ? `Правильный ответ: ${battleContext.currentQuestion.correctAnswer}`
                                        : battleContext.currentQuestion.hint}
                                </span>
                            )}
                            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 28, fontFamily: 'sans-serif', margin: '0 0 20px', whiteSpace: 'pre-line' }}>
                                {battleContext.currentQuestion.text}
                            </h3>

                            {/* Attempts dots */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                                {Array.from({ length: maxAttempts }).map((_, i) => (
                                    <div key={i} style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: i < attempts ? '#ef4444' : 'rgba(255,255,255,0.2)'
                                    }} />
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={answer}
                                    onChange={e => setAnswer(e.target.value)}
                                    placeholder="Введи ответ..."
                                    disabled={!!feedback}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(99,102,241,0.3)',
                                        borderRadius: 14, padding: '14px 20px', color: '#fff', fontSize: 22,
                                        textAlign: 'center', fontFamily: 'sans-serif', outline: 'none', width: '100%',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                                    onBlur={e => (e.target.style.borderColor = 'rgba(99,102,241,0.3)')}
                                />
                                <button
                                    type="submit"
                                    disabled={!!feedback || !answer.trim()}
                                    style={{
                                        background: 'linear-gradient(90deg, #6366f1, #9333ea)', color: '#fff', border: 'none',
                                        padding: '14px', borderRadius: 14, fontWeight: 900, fontSize: 16,
                                        fontFamily: 'sans-serif', cursor: 'pointer', letterSpacing: 1,
                                        opacity: (feedback || !answer.trim()) ? 0.5 : 1,
                                        boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
                                    }}
                                >
                                    🪄 ПРИМЕНИТЬ МАГИЮ
                                </button>
                            </form>

                            {feedback && (
                                <div style={{
                                    marginTop: 12, padding: '12px', borderRadius: 12,
                                    background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    color: feedback.ok ? '#4ade80' : '#f87171',
                                    fontFamily: 'sans-serif', fontWeight: 700, fontSize: 15
                                }}>
                                    {feedback.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active skill effect notification */}
                    {activeEffect && (
                        <div style={{
                            marginTop: -10, marginBottom: 4, padding: '8px 12px', borderRadius: 10,
                            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                            color: '#fbbf24', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 12, textAlign: 'center',
                        }}>
                            {activeEffect === 'xpBoost' && '🔥 Огненный шар: +50% XP за победу'}
                            {activeEffect === 'showHint' && '📜 Свиток мудрости: подсказка открыта'}
                            {activeEffect === 'extraAttempts' && '⚡ Громовое слово: +3 попытки'}
                            {activeEffect === 'damageShield' && '🛡️ Щит знаний: урон заблокирован'}
                            {activeEffect === 'goldBoost' && '✨ Великое заклинание: ×2 золото'}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ color: '#475569', fontFamily: 'sans-serif', fontSize: 11 }}>
                            {maxAttempts} попытки • Награда уменьшается с каждой ошибкой
                        </span>
                        {readySkills.length > 0 && !battleContext.skillUsedThisBattle && (
                            <button onClick={() => setSkillsPanelOpen(true)} style={{
                                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                                color: '#fbbf24', borderRadius: 8, padding: '5px 12px',
                                fontFamily: 'sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                            }}>⚡ Навык</button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default BattleModal;
