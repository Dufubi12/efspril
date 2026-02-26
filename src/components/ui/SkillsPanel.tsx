'use client';

import React from 'react';
import { useGameStore, SKILLS_CATALOG, type Skill } from '@/store/useGameStore';

function SkillCard({ skill, playerLevel, isInBattle, skillUsed, onUse }: {
    skill: Skill;
    playerLevel: number;
    isInBattle: boolean;
    skillUsed: boolean;
    onUse: () => void;
}) {
    const locked = !skill.unlocked;
    const levelsUntil = skill.unlockLevel - playerLevel;

    const EFFECT_COLORS: Record<string, string> = {
        xpBoost: '#818cf8',
        showHint: '#38bdf8',
        skipQuestion: '#4ade80',
        extraAttempts: '#fbbf24',
        damageShield: '#f87171',
        goldBoost: '#fbbf24',
    };
    const color = EFFECT_COLORS[skill.effect] ?? '#94a3b8';

    return (
        <div style={{
            background: locked ? 'rgba(255,255,255,0.02)' : `${color}0f`,
            border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : color + '33'}`,
            borderRadius: 16, padding: '16px',
            opacity: locked ? 0.5 : 1,
            transition: 'all 0.2s',
            position: 'relative',
        }}>
            {/* Emoji + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: locked ? 'rgba(255,255,255,0.05)' : `${color}22`,
                    border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : color + '44'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                    {locked ? '🔒' : skill.emoji}
                </div>
                <div>
                    <div style={{ color: locked ? '#475569' : '#e2e8f0', fontFamily: 'sans-serif', fontWeight: 700, fontSize: 14 }}>
                        {skill.name}
                    </div>
                    <div style={{
                        color: locked ? '#334155' : color,
                        fontFamily: 'sans-serif', fontSize: 11, marginTop: 2,
                    }}>
                        {locked ? `🔒 Разблокируется на уровне ${skill.unlockLevel} (ещё ${levelsUntil})` : skill.description}
                    </div>
                </div>
            </div>

            {/* Unlock badge */}
            {!locked && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{
                        background: `${color}22`, color, border: `1px solid ${color}44`,
                        fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 6,
                    }}>
                        Ур. {skill.unlockLevel}
                    </span>

                    {isInBattle && !skillUsed && (
                        <button onClick={onUse} style={{
                            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                            color: '#fff', border: 'none', borderRadius: 8,
                            padding: '6px 14px', fontFamily: 'sans-serif',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        }}>
                            ⚡ Применить
                        </button>
                    )}
                    {isInBattle && skillUsed && (
                        <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }}>
                            ✓ Использован
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SkillsPanel() {
    const { skills, skillsPanelOpen, setSkillsPanelOpen, useSkill, battleContext, gameState, player } = useGameStore();
    const isInBattle = gameState === 'BATTLE';

    if (!skillsPanelOpen) return null;

    const unlockedCount = skills.filter(s => s.unlocked).length;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 250,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            padding: 20,
        }}>
            <div style={{
                width: '100%', maxWidth: 540,
                background: 'linear-gradient(160deg, #0a0f1e, #111827)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 0 60px rgba(251,191,36,0.15)',
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
                            ⚡ Книга заклинаний
                        </h2>
                        <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12, marginTop: 3 }}>
                            {unlockedCount} / {skills.length} навыков открыто
                        </div>
                    </div>
                    {isInBattle && (
                        <span style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                            color: '#f87171', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700,
                            padding: '4px 12px', borderRadius: 8,
                        }}>
                            ⚔️ В бою — выбери 1 навык!
                        </span>
                    )}
                    <button onClick={() => setSkillsPanelOpen(false)} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', width: 36, height: 36, borderRadius: 10,
                        fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>

                {/* Skills list */}
                <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {skills.map(skill => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            playerLevel={player.level}
                            isInBattle={isInBattle}
                            skillUsed={battleContext.skillUsedThisBattle}
                            onUse={() => {
                                useSkill(skill.id);
                                setSkillsPanelOpen(false);
                            }}
                        />
                    ))}
                </div>

                {/* Footer hint */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#334155', fontFamily: 'sans-serif', fontSize: 11, margin: 0, textAlign: 'center' }}>
                        Нажми K или кнопку ⚡ в бою, чтобы применить навык · 1 навык за бой
                    </p>
                </div>
            </div>
        </div>
    );
}
