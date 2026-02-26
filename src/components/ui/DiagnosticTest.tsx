'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

// ─── Diagnostic Questions ─────────────────────────────────────
interface DiagQ {
    id: string;
    subject: 'math' | 'russian';
    text: string;
    options: string[];
    correct: string;
    level: number; // difficulty level this question targets
}

const DIAGNOSTIC_QUESTIONS: DiagQ[] = [
    // Math – escalating difficulty
    { id: 'm1', subject: 'math', text: '5 + 7 = ?', options: ['11', '12', '13', '14'], correct: '12', level: 1 },
    { id: 'm2', subject: 'math', text: '24 − 9 = ?', options: ['13', '14', '15', '16'], correct: '15', level: 2 },
    { id: 'm3', subject: 'math', text: '6 × 8 = ?', options: ['42', '44', '46', '48'], correct: '48', level: 3 },
    { id: 'm4', subject: 'math', text: '72 ÷ 9 = ?', options: ['6', '7', '8', '9'], correct: '8', level: 3 },
    { id: 'm5', subject: 'math', text: 'x + 15 = 34. Найди x', options: ['17', '18', '19', '20'], correct: '19', level: 4 },
    // Russian – escalating difficulty
    { id: 'r1', subject: 'russian', text: 'Как правильно?', options: ['собака', 'сабака', 'субака', 'собока'], correct: 'собака', level: 1 },
    { id: 'r2', subject: 'russian', text: 'Жираф или жыраф?', options: ['жираф', 'жыраф', 'жераф', 'жираф'], correct: 'жираф', level: 2 },
    { id: 'r3', subject: 'russian', text: 'Как правильно: мышь или мыш?', options: ['мышь', 'мыш', 'мышт', 'мыш'], correct: 'мышь', level: 3 },
    { id: 'r4', subject: 'russian', text: 'Расписание или разписание?', options: ['расписание', 'разписание', 'роcписание', 'расписанние'], correct: 'расписание', level: 4 },
    { id: 'r5', subject: 'russian', text: 'Синоним слова «большой»:', options: ['огромный', 'маленький', 'быстрый', 'грустный'], correct: 'огромный', level: 5 },
];

const SUBJECT_COLORS = {
    math: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', accent: '#3b82f6', label: '🔢 Математика' },
    russian: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', accent: '#a855f7', label: '📖 Русский язык' },
};

export default function DiagnosticTest() {
    const { finishDiagnostic } = useGameStore();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [selected, setSelected] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [mathScore, setMathScore] = useState(0);
    const [rusScore, setRusScore] = useState(0);

    const q = DIAGNOSTIC_QUESTIONS[current];
    const colors = q ? SUBJECT_COLORS[q.subject] : null;
    const progress = ((current) / DIAGNOSTIC_QUESTIONS.length) * 100;

    const handleSelect = (option: string) => {
        if (feedback) return;
        setSelected(option);
        const correct = option === q.correct;
        setFeedback(correct ? 'correct' : 'wrong');
        setAnswers(prev => ({ ...prev, [q.id]: option }));

        setTimeout(() => {
            if (current + 1 >= DIAGNOSTIC_QUESTIONS.length) {
                // Calculate results
                let mScore = 1, rScore = 1;
                DIAGNOSTIC_QUESTIONS.forEach(dq => {
                    const ans = dq.id === q.id ? option : answers[dq.id];
                    if (ans === dq.correct) {
                        if (dq.subject === 'math') mScore = Math.max(mScore, dq.level);
                        else rScore = Math.max(rScore, dq.level);
                    }
                });
                setMathScore(mScore);
                setRusScore(rScore);
                setShowResult(true);
            } else {
                setCurrent(c => c + 1);
                setSelected(null);
                setFeedback(null);
            }
        }, 900);
    };

    const handleFinish = () => {
        finishDiagnostic(mathScore, rusScore);
    };

    if (showIntro) {
        return (
            <div style={overlayStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>🔮</div>
                        <div style={{ color: '#818cf8', fontSize: 11, letterSpacing: 4, fontFamily: 'sans-serif', textTransform: 'uppercase', marginBottom: 12 }}>
                            Испытание Мага
                        </div>
                        <h2 style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 26, margin: '0 0 12px' }}>
                            Диагностика знаний
                        </h2>
                        <p style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                            Ответь на 10 вопросов по математике и русскому языку.<br />
                            Результат определит твой стартовый уровень магии!
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                        {[
                            { emoji: '🔢', label: '5 вопросов', sub: 'Математика' },
                            { emoji: '📖', label: '5 вопросов', sub: 'Русский язык' },
                        ].map(item => (
                            <div key={item.sub} style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16, padding: '16px', textAlign: 'center'
                            }}>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>{item.emoji}</div>
                                <div style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 13 }}>{item.sub}</div>
                                <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 11, marginTop: 2 }}>{item.label}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setShowIntro(false)} style={primaryBtn}>
                        ⚡ НАЧАТЬ ДИАГНОСТИКУ
                    </button>
                </div>
            </div>
        );
    }

    if (showResult) {
        const totalLevel = Math.max(1, Math.floor((mathScore + rusScore) / 2));
        return (
            <div style={overlayStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>✨</div>
                        <h2 style={{ color: '#fff', fontFamily: 'sans-serif', fontWeight: 900, fontSize: 24, margin: '0 0 8px' }}>
                            Диагностика завершена!
                        </h2>
                        <p style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: 14, margin: 0 }}>
                            Твои магические силы определены
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        {[
                            { label: '🔢 Уровень математики', level: mathScore, color: '#3b82f6', desc: mathScore >= 4 ? 'Продвин.' : mathScore >= 3 ? 'Средний' : 'Начальный' },
                            { label: '📖 Уровень русского', level: rusScore, color: '#a855f7', desc: rusScore >= 4 ? 'Продвин.' : rusScore >= 3 ? 'Средний' : 'Начальный' },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}44`,
                                borderRadius: 16, padding: '16px 12px', textAlign: 'center',
                            }}>
                                <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'sans-serif', marginBottom: 8 }}>{stat.label}</div>
                                <div style={{ color: stat.color, fontSize: 36, fontWeight: 900, fontFamily: 'sans-serif' }}>{stat.level}</div>
                                <div style={{ color: '#64748b', fontSize: 11, fontFamily: 'sans-serif', marginTop: 4 }}>{stat.desc}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                        border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: '16px',
                        textAlign: 'center', marginBottom: 24
                    }}>
                        <div style={{ color: '#818cf8', fontSize: 11, fontFamily: 'sans-serif', letterSpacing: 2, marginBottom: 6 }}>СТАРТОВЫЙ УРОВЕНЬ</div>
                        <div style={{ color: '#fff', fontSize: 44, fontWeight: 900, fontFamily: 'sans-serif' }}>{totalLevel}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'sans-serif', marginTop: 4 }}>
                            {totalLevel >= 4 ? 'Маг старшего класса 🧙' : totalLevel >= 3 ? 'Ученик боевой магии ⚔️' : 'Начинающий чародей 🌟'}
                        </div>
                    </div>

                    <button onClick={handleFinish} style={primaryBtn}>
                        ▶ ОТПРАВИТЬСЯ В МИР
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={overlayStyle}>
            <div style={cardStyle}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ color: colors!.accent, fontFamily: 'sans-serif', fontSize: 12, fontWeight: 700 }}>
                            {colors!.label}
                        </div>
                        <div style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: 12 }}>
                            {current + 1} / {DIAGNOSTIC_QUESTIONS.length}
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${progress}%`,
                            background: `linear-gradient(90deg, ${colors!.accent}, ${q.subject === 'math' ? '#60a5fa' : '#c084fc'})`,
                            borderRadius: 3, transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>

                {/* Question */}
                <div style={{
                    background: colors!.bg, border: `1px solid ${colors!.border}`,
                    borderRadius: 20, padding: '28px 24px', minHeight: 90,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24, textAlign: 'center'
                }}>
                    <p style={{ color: '#e2e8f0', fontFamily: 'sans-serif', fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                        {q.text}
                    </p>
                </div>

                {/* Options */}
                <div style={{ display: 'grid', gridTemplateColumns: q.options.length <= 2 ? '1fr 1fr' : '1fr 1fr', gap: 10 }}>
                    {q.options.map((opt) => {
                        const isSelected = selected === opt;
                        const isCorrectOpt = opt === q.correct;
                        let bg = 'rgba(255,255,255,0.04)';
                        let border = 'rgba(255,255,255,0.1)';
                        let textColor = '#e2e8f0';
                        if (feedback && isCorrectOpt) { bg = 'rgba(34,197,94,0.15)'; border = '#22c55e'; textColor = '#86efac'; }
                        else if (feedback && isSelected && !isCorrectOpt) { bg = 'rgba(239,68,68,0.15)'; border = '#ef4444'; textColor = '#fca5a5'; }
                        return (
                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                disabled={!!feedback}
                                style={{
                                    background: bg, border: `2px solid ${border}`,
                                    borderRadius: 14, padding: '14px 16px',
                                    color: textColor, fontFamily: 'sans-serif',
                                    fontSize: 15, fontWeight: 700, cursor: feedback ? 'default' : 'pointer',
                                    transition: 'all 0.2s', textAlign: 'center',
                                }}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback */}
                {feedback && (
                    <div style={{
                        marginTop: 16, textAlign: 'center',
                        color: feedback === 'correct' ? '#22c55e' : '#ef4444',
                        fontFamily: 'sans-serif', fontWeight: 700, fontSize: 16,
                        animation: 'fadeIn 0.2s ease'
                    }}>
                        {feedback === 'correct' ? '✓ Верно!' : `✗ Правильно: ${q.correct}`}
                    </div>
                )}

                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
            </div>
        </div>
    );
}

// ─── Shared styles ─────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #020617 70%)',
    padding: 20,
};
const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 520,
    background: 'linear-gradient(160deg, #0a0f1e, #111827)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 28, padding: '32px 36px',
    boxShadow: '0 0 80px rgba(99,102,241,0.2)',
};
const primaryBtn: React.CSSProperties = {
    width: '100%', background: 'linear-gradient(90deg, #6366f1, #9333ea)',
    color: '#fff', border: 'none', padding: '16px', borderRadius: 14,
    fontSize: 17, fontWeight: 900, fontFamily: 'sans-serif', cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(99,102,241,0.4)', letterSpacing: 1,
};
