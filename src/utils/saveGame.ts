// localStorage persistence utilities

import { Player, InventoryItem, Quest } from '@/store/useGameStore';

const SAVE_KEY = 'school_magic_save_v3';
const LEADERBOARD_KEY = 'school_magic_leaderboard';
const DAILY_KEY = 'school_magic_daily';
const CUSTOM_Q_KEY = 'school_magic_custom_questions';

export interface SaveData {
    player: Player;
    inventory: InventoryItem[];
    quests: Quest[];
    diagnosticDone: boolean;
    rusZoneUnlocked: boolean;
    geoZoneUnlocked: boolean;
    savedAt: number;
}

export function saveGame(
    player: Player,
    inventory: InventoryItem[],
    quests: Quest[],
    diagnosticDone: boolean,
    rusZoneUnlocked: boolean,
    geoZoneUnlocked: boolean = false,
) {
    try {
        const data: SaveData = { player, inventory, quests, diagnosticDone, rusZoneUnlocked, geoZoneUnlocked, savedAt: Date.now() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save game:', e);
    }
}

export function loadGame(): SaveData | null {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SaveData;
    } catch (e) {
        console.warn('Failed to load game:', e);
        return null;
    }
}

export function clearSave() { localStorage.removeItem(SAVE_KEY); }
export function hasSave(): boolean { return !!localStorage.getItem(SAVE_KEY); }

// ─── Leaderboard ──────────────────────────────────────────────
export interface LeaderboardEntry {
    name: string;
    level: number;
    gold: number;
    wins: number;
    class: string;
    savedAt: number;
}

export function loadLeaderboard(): LeaderboardEntry[] {
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function updateLeaderboard(player: Player, wins: number) {
    try {
        const entries = loadLeaderboard();
        const idx = entries.findIndex(e => e.name === player.name);
        const entry: LeaderboardEntry = {
            name: player.name,
            level: player.level,
            gold: player.gold,
            wins,
            class: player.appearance?.class ?? 'mage',
            savedAt: Date.now(),
        };
        if (idx >= 0) entries[idx] = entry;
        else entries.push(entry);
        entries.sort((a, b) => b.level - a.level || b.gold - a.gold);
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 10)));
    } catch (e) { console.warn('Leaderboard save failed:', e); }
}

// ─── Daily Quests ─────────────────────────────────────────────
export interface DailyQuestEntry {
    id: string;
    title: string;
    emoji: string;
    target: number;
    current: number;
    zone: 'math' | 'russian' | 'geometry';
    xpReward: number;
    goldReward: number;
    completed: boolean;
}

export interface DailyQuestData {
    date: string;
    quests: DailyQuestEntry[];
    bonusClaimed: boolean;
}

export function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

export function loadDailyQuests(): DailyQuestData | null {
    try {
        const raw = localStorage.getItem(DAILY_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as DailyQuestData;
        if (data.date !== todayStr()) return null;
        return data;
    } catch { return null; }
}

export function saveDailyQuests(data: DailyQuestData) {
    try {
        localStorage.setItem(DAILY_KEY, JSON.stringify(data));
    } catch (e) { console.warn('Daily quests save failed:', e); }
}

// ─── Custom Questions (Admin) ────────────────────────────────
export interface CustomQuestion {
    id: string;
    subject: 'math' | 'russian' | 'geometry';
    text: string;
    correctAnswer: string;
    hint?: string;
    level: number;
    createdAt: number;
}

export function loadCustomQuestions(): CustomQuestion[] {
    try {
        const raw = localStorage.getItem(CUSTOM_Q_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function saveCustomQuestions(questions: CustomQuestion[]) {
    try {
        localStorage.setItem(CUSTOM_Q_KEY, JSON.stringify(questions));
    } catch (e) { console.warn('Custom questions save failed:', e); }
}

export function addCustomQuestion(q: Omit<CustomQuestion, 'id' | 'createdAt'>): CustomQuestion {
    const questions = loadCustomQuestions();
    const newQ: CustomQuestion = { ...q, id: `cq_${Date.now()}`, createdAt: Date.now() };
    questions.push(newQ);
    saveCustomQuestions(questions);
    return newQ;
}

export function deleteCustomQuestion(id: string) {
    saveCustomQuestions(loadCustomQuestions().filter(q => q.id !== id));
}
