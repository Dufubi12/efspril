// Leaderboard utility – persists top-10 scores locally

export interface LeaderboardEntry {
    name: string;
    level: number;
    xp: number;
    gold: number;
    savedAt: number;
}

const LB_KEY = 'school_magic_leaderboard_v1';

export function getLeaderboard(): LeaderboardEntry[] {
    try {
        const raw = localStorage.getItem(LB_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as LeaderboardEntry[];
    } catch {
        return [];
    }
}

export function submitScore(entry: Omit<LeaderboardEntry, 'savedAt'>) {
    try {
        const board = getLeaderboard();
        // Replace existing entry with same name if new XP is higher
        const existing = board.findIndex(e => e.name === entry.name);
        if (existing >= 0) {
            if (entry.xp > board[existing].xp) {
                board[existing] = { ...entry, savedAt: Date.now() };
            }
        } else {
            board.push({ ...entry, savedAt: Date.now() });
        }
        // Keep top-10 by XP
        board.sort((a, b) => b.xp - a.xp);
        const trimmed = board.slice(0, 10);
        localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch {
        return [];
    }
}
