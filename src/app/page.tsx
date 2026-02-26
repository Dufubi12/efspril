'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import HUD from '@/components/ui/HUD';
import BattleModal from '@/components/battle/BattleModal';
import InventoryPanel from '@/components/ui/InventoryPanel';
import DropNotification from '@/components/ui/DropNotification';
import ShopPanel from '@/components/ui/ShopPanel';
import Leaderboard from '@/components/ui/Leaderboard';
import DiagnosticTest from '@/components/ui/DiagnosticTest';
import QuestLog from '@/components/ui/QuestLog';
import NPCDialog from '@/components/ui/NPCDialog';
import SkillsPanel from '@/components/ui/SkillsPanel';
import { useGameStore, CLASS_INFO, SKIN_TONES, HAIR_COLORS } from '@/store/useGameStore';
import type { CharacterClass, SkinTone, HairColor } from '@/store/useGameStore';
import { hasSave } from '@/utils/saveGame';

const GameClient = dynamic(() => import('@/components/game/GameClient'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100vw', height: '100vh', background: '#020617',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24
        }}>
            <div style={{ fontSize: 48, animation: 'spin 1s linear infinite' }}>⚙️</div>
            <p style={{ color: '#818cf8', fontFamily: 'sans-serif', fontSize: 16 }}>Загрузка мира...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
});

// ─── Stat Bar (mini) ──────────────────────────────────────────
function Stat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    return (
        <div style={{ textAlign: 'center', minWidth: 40 }}>
            <div style={{ color: '#64748b', fontSize: 9, fontFamily: 'sans-serif', marginBottom: 3 }}>{label}</div>
            <div style={{ width: 40, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
            </div>
            <div style={{ color, fontSize: 9, fontFamily: 'sans-serif', marginTop: 2 }}>{value}</div>
        </div>
    );
}

// ─── ClassSprite (canvas pixel-art hero) ─────────────────────
function ClassSprite({ cls, skinTone, hairColor, size = 64, style: extStyle }:
    { cls: CharacterClass; skinTone: SkinTone; hairColor: HairColor; size?: number; style?: React.CSSProperties }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;

        const skin = SKIN_TONES[skinTone];
        const hair = HAIR_COLORS[hairColor];

        // Outfit colours per class
        const outfit: Record<CharacterClass, { body: string; acc: string }> = {
            mage: { body: '#7c3aed', acc: '#a78bfa' },
            knight: { body: '#3b82f6', acc: '#93c5fd' },
            archer: { body: '#16a34a', acc: '#86efac' },
        };
        const { body, acc } = outfit[cls];

        const S = 16; // pixel grid 16×16
        c.width = S; c.height = S;
        ctx.clearRect(0, 0, S, S);

        const px = (x: number, y: number, col: string) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, 1, 1);
        };

        // Hair (top 2 rows)
        for (let x = 4; x <= 11; x++) { px(x, 1, hair); px(x, 2, hair); }
        px(3, 2, hair); px(12, 2, hair);

        // Head (skin)
        for (let y = 2; y <= 6; y++)
            for (let x = 4; x <= 11; x++) px(x, y, skin);

        // Eyes
        px(6, 4, '#1e293b'); px(9, 4, '#1e293b');

        // Body (outfit)
        for (let y = 7; y <= 11; y++)
            for (let x = 4; x <= 11; x++) px(x, y, y === 7 ? acc : body);

        // Arms
        for (let y = 7; y <= 10; y++) { px(3, y, body); px(12, y, body); }

        // Legs
        for (let y = 12; y <= 15; y++) {
            px(4, y, body); px(5, y, body);
            px(10, y, body); px(11, y, body);
        }

        // Class accessories
        if (cls === 'mage') {
            // Hat
            for (let x = 5; x <= 10; x++) px(x, 0, '#4c1d95');
            px(6, 1, '#4c1d95'); px(7, 1, '#4c1d95'); px(8, 1, '#4c1d95');
            // Staff right hand
            for (let y = 7; y <= 14; y++) px(13, y, '#92400e');
            px(13, 6, '#fbbf24'); // orb
        } else if (cls === 'knight') {
            // Helmet
            for (let x = 4; x <= 11; x++) px(x, 1, '#475569');
            px(3, 2, '#475569'); px(12, 2, '#475569');
            // Shield left hand
            for (let y = 7; y <= 10; y++) { px(2, y, '#1e40af'); px(1, y, acc); }
        } else {
            // Hood
            for (let x = 3; x <= 12; x++) px(x, 1, '#166534');
            // Bow right hand
            for (let y = 6; y <= 12; y++) px(13, y, '#92400e');
            px(13, 7, acc); px(13, 10, acc);
        }
    }, [cls, skinTone, hairColor]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                imageRendering: 'pixelated',
                width: size, height: size,
                display: 'block',
                ...extStyle,
            }}
        />
    );
}

// ─── Name Entry Screen ────────────────────────────────────────

function NameEntryScreen() {
    const { initPlayer } = useGameStore();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [charClass, setCharClass] = useState<CharacterClass>('mage');
    const [skinTone, setSkinTone] = useState<SkinTone>('light');
    const [hairColor, setHairColor] = useState<HairColor>('brown');
    const [name, setName] = useState('');

    const handleStart = () => {
        initPlayer(name.trim() || CLASS_INFO[charClass].name + '-Ученик', {
            class: charClass, skinTone, hairColor,
        });
    };

    // Class colour themes
    const classTheme: Record<CharacterClass, { grad: string; border: string; glow: string }> = {
        mage: { grad: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: 'rgba(139,92,246,0.6)', glow: 'rgba(139,92,246,0.3)' },
        knight: { grad: 'linear-gradient(135deg, #0c1a2e, #1e3a5f)', border: 'rgba(96,165,250,0.6)', glow: 'rgba(96,165,250,0.3)' },
        archer: { grad: 'linear-gradient(135deg, #052e16, #14532d)', border: 'rgba(74,222,128,0.6)', glow: 'rgba(74,222,128,0.3)' },
    };

    const steps = ['Класс', 'Внешность', 'Имя'];

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #020617 70%)',
            padding: 20,
        }}>
            <div style={{
                width: '100%', maxWidth: 580, padding: '32px 36px',
                background: 'linear-gradient(160deg, #0a0f1e, #111827)',
                border: '1px solid rgba(99,102,241,0.3)', borderRadius: 28,
                boxShadow: '0 0 80px rgba(99,102,241,0.2)',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ color: '#6366f1', fontSize: 10, letterSpacing: 4, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
                        ✨ Создание персонажа
                    </div>
                    <h2 style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 22, margin: '8px 0 16px' }}>
                        {step === 1 ? 'Выбери класс' : step === 2 ? 'Внешность' : 'Твоё имя'}
                    </h2>
                    {/* Step dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        {steps.map((s, i) => (
                            <div key={s} style={{
                                display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <div style={{
                                    width: i + 1 <= step ? 28 : 8, height: 8, borderRadius: 4,
                                    background: i + 1 <= step ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s'
                                }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Step 1: Class ─────────────────────────── */}
                {step === 1 && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        {(Object.entries(CLASS_INFO) as [CharacterClass, typeof CLASS_INFO[CharacterClass]][]).map(([cls, info]) => {
                            const selected = charClass === cls;
                            const th = classTheme[cls];
                            return (
                                <button key={cls} onClick={() => setCharClass(cls)} style={{
                                    flex: 1, background: selected ? th.grad : 'rgba(255,255,255,0.03)',
                                    border: `2px solid ${selected ? th.border : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: 20, padding: '20px 12px', cursor: 'pointer', textAlign: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: selected ? `0 0 30px ${th.glow}` : 'none',
                                    transform: selected ? 'translateY(-4px)' : 'none',
                                }}>
                                    {/* Sprite preview canvas */}
                                    <ClassSprite cls={cls} skinTone={skinTone} hairColor={hairColor} size={80} />
                                    <div style={{ color: selected ? '#fff' : '#94a3b8', fontWeight: 900, fontSize: 16, fontFamily: 'sans-serif', marginTop: 10 }}>
                                        {info.name}
                                    </div>
                                    <div style={{ color: selected ? '#a5b4fc' : '#475569', fontSize: 11, fontFamily: 'sans-serif', margin: '4px 0 10px' }}>
                                        {info.description}
                                    </div>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '5px 8px',
                                        color: '#fbbf24', fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700
                                    }}>
                                        ⚡ {info.bonusText}
                                    </div>
                                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        <Stat label="HP" value={info.baseHp} max={140} color="#f87171" />
                                        <Stat label="XP×" value={info.xpMult === 1.2 ? 120 : 100} max={120} color="#818cf8" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Step 2: Appearance ──────────────────────── */}
                {step === 2 && (
                    <div style={{ display: 'flex', gap: 32 }}>
                        {/* Live Preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <div style={{
                                width: 120, height: 120, borderRadius: 24,
                                background: classTheme[charClass].grad,
                                border: `2px solid ${classTheme[charClass].border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 0 30px ${classTheme[charClass].glow}`
                            }}>
                                <ClassSprite cls={charClass} skinTone={skinTone} hairColor={hairColor} size={100} />
                            </div>
                            <div style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 11 }}>Предпросмотр</div>
                        </div>

                        <div style={{ flex: 1 }}>
                            {/* Skin Tone */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'sans-serif', letterSpacing: 2, marginBottom: 10 }}>ЦВЕТ КОЖИ</div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {(Object.entries(SKIN_TONES) as [SkinTone, string][]).map(([tone, hex]) => (
                                        <button key={tone} onClick={() => setSkinTone(tone)} style={{
                                            width: 36, height: 36, borderRadius: '50%', background: hex, cursor: 'pointer',
                                            border: `3px solid ${skinTone === tone ? '#fff' : 'transparent'}`,
                                            boxShadow: skinTone === tone ? '0 0 12px rgba(255,255,255,0.4)' : 'none',
                                            outline: 'none', transition: 'all 0.15s',
                                            transform: skinTone === tone ? 'scale(1.2)' : 'scale(1)'
                                        }} title={tone} />
                                    ))}
                                </div>
                            </div>
                            {/* Hair Color */}
                            <div>
                                <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'sans-serif', letterSpacing: 2, marginBottom: 10 }}>ЦВЕТ ВОЛОС</div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {(Object.entries(HAIR_COLORS) as [HairColor, string][]).map(([color, hex]) => (
                                        <button key={color} onClick={() => setHairColor(color)} style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: hex, cursor: 'pointer',
                                            border: `3px solid ${hairColor === color ? '#fff' : 'transparent'}`,
                                            boxShadow: hairColor === color ? '0 0 12px rgba(255,255,255,0.4)' : 'none',
                                            outline: 'none', transition: 'all 0.15s',
                                            transform: hairColor === color ? 'scale(1.2)' : 'scale(1)'
                                        }} title={color} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Name ─────────────────────────────── */}
                {step === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <ClassSprite cls={charClass} skinTone={skinTone} hairColor={hairColor} size={100} style={{ margin: '0 auto 20px' }} />
                        <input
                            autoFocus
                            type="text"
                            maxLength={16}
                            placeholder={`${CLASS_INFO[charClass].name}-Ученик`}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleStart()}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)',
                                border: '2px solid rgba(99,102,241,0.3)', borderRadius: 14,
                                padding: '14px 20px', color: '#fff', fontSize: 20,
                                fontFamily: 'sans-serif', outline: 'none', textAlign: 'center',
                            }}
                            onFocus={e => (e.target.style.borderColor = '#6366f1')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(99,102,241,0.3)')}
                        />
                        <div style={{ color: '#475569', fontSize: 12, fontFamily: 'sans-serif', marginTop: 10 }}>
                            Оставь пустым — будешь «{CLASS_INFO[charClass].name}-Ученик»
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                    {step > 1 && (
                        <button onClick={() => setStep((step - 1) as 1 | 2 | 3)} style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                            color: '#94a3b8', padding: '14px 24px', borderRadius: 14,
                            fontFamily: 'sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer'
                        }}>← Назад</button>
                    )}
                    <button
                        onClick={() => step < 3 ? setStep((step + 1) as 2 | 3) : handleStart()}
                        style={{
                            flex: 1, background: 'linear-gradient(90deg, #6366f1, #9333ea)',
                            color: '#fff', border: 'none', padding: '14px', borderRadius: 14,
                            fontSize: 17, fontWeight: 900, fontFamily: 'sans-serif', cursor: 'pointer',
                            boxShadow: '0 4px 24px rgba(99,102,241,0.4)', letterSpacing: 1
                        }}
                    >
                        {step < 3 ? 'Далее →' : '▶ НАЧАТЬ ПРИКЛЮЧЕНИЕ'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Death Screen ─────────────────────────────────────────────
function DeathScreen() {
    const { player, respawn, setGameState } = useGameStore();
    const [anim, setAnim] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnim(true), 100);
    }, []);

    return (
        <div style={{
            position: 'absolute', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                textAlign: 'center', maxWidth: 440, padding: '0 24px',
                opacity: anim ? 1 : 0, transform: anim ? 'none' : 'scale(0.9)',
                transition: 'all 0.5s ease'
            }}>
                <div style={{ fontSize: 80, marginBottom: 16 }}>💀</div>
                <h2 style={{ color: '#ef4444', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 36, margin: '0 0 8px', letterSpacing: 2 }}>
                    ВЫ ПАЛИ В БОЮ
                </h2>
                <p style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 16, margin: '0 0 32px' }}>
                    {player.name}, твои силы иссякли. Но маги не сдаются!
                </p>

                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '20px', marginBottom: 24
                }}>
                    <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'sans-serif', letterSpacing: 2, marginBottom: 12 }}>СТАТИСТИКА</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
                        {[
                            { label: 'Уровень', value: player.level },
                            { label: 'Опыт', value: player.xp },
                            { label: 'Золото', value: player.gold },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 22, fontFamily: 'sans-serif' }}>{value}</div>
                                <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'sans-serif' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={respawn}
                        style={{
                            flex: 1, background: 'linear-gradient(90deg, #6366f1, #9333ea)',
                            color: '#fff', border: 'none', padding: '16px', borderRadius: 14,
                            fontSize: 16, fontWeight: 900, fontFamily: 'sans-serif', cursor: 'pointer'
                        }}
                    >
                        ✨ Возродиться (50% HP)
                    </button>
                    <button
                        onClick={() => setGameState('MENU')}
                        style={{
                            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94a3b8', padding: '16px', borderRadius: 14,
                            fontSize: 16, fontWeight: 700, fontFamily: 'sans-serif', cursor: 'pointer'
                        }}
                    >
                        🏠 В главное меню
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Menu ────────────────────────────────────────────────
function MainMenu() {
    const { setGameState, loadSave } = useGameStore();
    const [showLB, setShowLB] = useState(false);
    const [hasSaveData, setHasSaveData] = useState(false);

    useEffect(() => {
        setHasSaveData(hasSave());
    }, []);

    return (
        <>
            <div style={{
                position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 50%, rgba(168,85,247,0.12) 0%, transparent 60%),
        linear-gradient(180deg, #020617 0%, #0a0f1e 100%)
      `
            }}>
                {/* Floating orbs */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3,
                        borderRadius: '50%', background: i % 2 ? '#6366f1' : '#a855f7',
                        opacity: 0.3, left: `${8 + i * 15}%`, top: `${15 + (i % 4) * 18}%`,
                        animation: `floatOrb ${3 + i * 0.6}s ease-in-out infinite alternate`,
                    }} />
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 640, textAlign: 'center', padding: '0 24px', zIndex: 2 }}>
                    {/* Logo */}
                    <div>
                        <div style={{ color: '#818cf8', fontFamily: 'sans-serif', fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 16 }}>
                            ✨ Образовательная RPG для школьников
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(3rem, 11vw, 5.5rem)', fontWeight: 900, color: '#fff',
                            margin: 0, letterSpacing: '-3px', lineHeight: 1,
                            textShadow: '0 0 80px rgba(99,102,241,0.6)', fontFamily: 'sans-serif'
                        }}>
                            МИР<br />
                            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                МАГИИ
                            </span>
                        </h1>
                        <p style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 16, margin: '16px 0 0' }}>
                            Победи монстров, решая задачи. Стань великим магом!
                        </p>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
                        {hasSaveData ? (
                            <>
                                <button id="continue-btn" onClick={() => loadSave()} style={btnStyle('primary')}>
                                    ▶ Продолжить
                                </button>
                                <button id="newgame-btn" onClick={() => setGameState('NAME_ENTRY')} style={btnStyle('secondary')}>
                                    ✚ Новая игра
                                </button>
                            </>
                        ) : (
                            <button id="start-game-btn" onClick={() => setGameState('NAME_ENTRY')} style={btnStyle('primary')}>
                                ▶ НАЧАТЬ ИГРУ
                            </button>
                        )}
                        <button id="leaderboard-btn" onClick={() => setShowLB(true)} style={btnStyle('secondary')}>
                            🏆 Таблица рекордов
                        </button>
                    </div>

                    {/* Feature cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%' }}>
                        {[
                            { emoji: '🔢', title: 'Математика', desc: 'Зона синих\nмонстров' },
                            { emoji: '📖', title: 'Русский язык', desc: 'Зона фиолетовых\nмонстров' },
                            { emoji: '🏆', title: '9 уровней', desc: 'XP, предметы,\nпрогрессия' },
                        ].map(f => (
                            <div key={f.title} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 16, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center'
                            }}>
                                <span style={{ fontSize: 28 }}>{f.emoji}</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12, fontFamily: 'sans-serif' }}>{f.title}</span>
                                <span style={{ color: '#475569', fontSize: 10, fontFamily: 'sans-serif', whiteSpace: 'pre' }}>{f.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <style>{`
        @keyframes floatOrb { to { transform: translateY(-20px); } }
      `}</style>
            </div>
            {showLB && <Leaderboard onClose={() => setShowLB(false)} />}
        </>
    );
}

const btnStyle = (variant: 'primary' | 'secondary'): React.CSSProperties => ({
    width: '100%',
    background: variant === 'primary' ? 'linear-gradient(90deg, #6366f1, #9333ea)' : 'rgba(255,255,255,0.06)',
    color: '#fff',
    border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.15)',
    padding: '16px',
    borderRadius: 16,
    fontSize: 18,
    fontWeight: 900,
    fontFamily: 'sans-serif',
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: variant === 'primary' ? '0 0 40px rgba(99,102,241,0.4)' : 'none',
    transition: 'all 0.2s ease',
});

// ─── Page ─────────────────────────────────────────────────────
export default function Home() {
    const { gameState } = useGameStore();
    const isInGame = ['PLAYING', 'BATTLE', 'INVENTORY', 'SHOP'].includes(gameState);

    return (
        <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#020617' }}>
            {/* Phaser */}
            {isInGame && <GameClient />}

            <div style={{ position: 'relative', zIndex: 100, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <HUD />
                    <BattleModal />
                    <InventoryPanel />
                    <ShopPanel />
                    <DropNotification />
                </div>
            </div>

            {/* Screens */}
            {gameState === 'MENU' && <MainMenu />}
            {gameState === 'NAME_ENTRY' && <NameEntryScreen />}
            {gameState === 'DIAGNOSTIC' && <DiagnosticTest />}
            {gameState === 'DEATH' && <DeathScreen />}

            {/* Quest & NPC & Skills overlays (always mounted when in game) */}
            <QuestLog />
            <NPCDialog />
            <SkillsPanel />
        </main>
    );
}
