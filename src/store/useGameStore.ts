import { create } from 'zustand';
import { saveGame, loadGame, updateLeaderboard, loadDailyQuests, saveDailyQuests, todayStr, DailyQuestData, DailyQuestEntry } from '@/utils/saveGame';

// ─── Types ────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  quantity: number;
  type: 'potion' | 'scroll' | 'artifact';
}

export type CharacterClass = 'mage' | 'knight' | 'archer';
export type SkinTone = 'light' | 'tan' | 'olive' | 'brown' | 'dark' | 'deep';
export type HairColor = 'blonde' | 'brown' | 'red' | 'black' | 'white' | 'blue';

export interface CharacterAppearance {
  class: CharacterClass;
  skinTone: SkinTone;
  hairColor: HairColor;
}

export const CLASS_INFO: Record<CharacterClass, {
  name: string; emoji: string; description: string;
  bonusText: string; baseHp: number; xpMult: number;
}> = {
  mage: { name: 'Маг', emoji: '🧙', description: 'Чародей знаний и заклинаний', bonusText: '+20% к XP после побед', baseHp: 80, xpMult: 1.2 },
  knight: { name: 'Рыцарь', emoji: '⚔️', description: 'Воин, закалённый в боях', bonusText: '+40 HP, крепкая броня', baseHp: 140, xpMult: 1.0 },
  archer: { name: 'Лучник', emoji: '🏹', description: 'Ловкий охотник за знаниями', bonusText: 'Щит удачи раз в бою', baseHp: 100, xpMult: 1.0 },
};

export const SKIN_TONES: Record<SkinTone, string> = {
  light: '#FDDBB4', tan: '#E8B88A', olive: '#D4956A',
  brown: '#B5713C', dark: '#8B4513', deep: '#4A2C0A',
};

export const HAIR_COLORS: Record<HairColor, string> = {
  blonde: '#F5D77E', brown: '#6B3A2A', red: '#C0392B',
  black: '#1A1A1A', white: '#E8E8E8', blue: '#3B82F6',
};

export interface Player {
  id: string | null;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  mathLevel: number;
  rusLevel: number;
  hp: number;
  maxHp: number;
  appearance: CharacterAppearance;
  xpMult: number;
}

// ─── Quest Types ─────────────────────────────────────────────
export type QuestGoalType = 'kill' | 'solve';
export type QuestZone = 'math' | 'russian' | 'geometry';

export interface QuestGoal {
  type: QuestGoalType;
  zone: QuestZone;
  target: number;
  current: number;
}

export interface QuestReward {
  xp: number;
  gold: number;
  item?: Omit<InventoryItem, 'quantity'>;
}

export interface Quest {
  id: string;
  npcId: string;
  title: string;
  description: string;
  goal: QuestGoal;
  reward: QuestReward;
  status: 'locked' | 'available' | 'active' | 'ready' | 'completed';
}

// ─── Skill Types ──────────────────────────────────────────────
export type SkillEffect = 'xpBoost' | 'showHint' | 'skipQuestion' | 'extraAttempts' | 'damageShield' | 'goldBoost';

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effect: SkillEffect;
  unlockLevel: number;
  unlocked: boolean;
}

export const SKILLS_CATALOG: Skill[] = [
  { id: 'fireball', name: 'Огненный шар', emoji: '🔥', description: '+50% XP за эту победу', effect: 'xpBoost', unlockLevel: 1, unlocked: true },
  { id: 'scroll', name: 'Свиток мудрости', emoji: '📜', description: 'Показывает подсказку к вопросу', effect: 'showHint', unlockLevel: 2, unlocked: false },
  { id: 'iceray', name: 'Ледяной луч', emoji: '❄️', description: 'Пропустить вопрос (победа зачтена)', effect: 'skipQuestion', unlockLevel: 3, unlocked: false },
  { id: 'thunder', name: 'Громовое слово', emoji: '⚡', description: '+3 дополнительные попытки', effect: 'extraAttempts', unlockLevel: 5, unlocked: false },
  { id: 'shield', name: 'Щит знаний', emoji: '🛡️', description: 'Защита от урона при следующей ошибке', effect: 'damageShield', unlockLevel: 7, unlocked: false },
  { id: 'greatspell', name: 'Великое заклинание', emoji: '✨', description: 'x2 золота за эту победу', effect: 'goldBoost', unlockLevel: 9, unlocked: false },
];

// ─── NPC Dialog ───────────────────────────────────────────────
export interface NpcDialogState {
  isOpen: boolean;
  npcId: string | null;
}

interface BattleContext {
  isActive: boolean;
  enemyId: string | null;
  enemyType: 'goblin' | 'slime' | 'troll' | 'witch' | 'dragon' | 'phoenix' | null;
  subject: 'math' | 'russian' | 'geometry' | null;
  difficulty: number;
  currentQuestion: { text: string; correctAnswer: string; hint?: string } | null;
  zone: 'math' | 'russian' | 'geometry';
  attempts: number;
  activeSkillEffect: SkillEffect | null;
  skillUsedThisBattle: boolean;
}

type GameStateType = 'LOADING' | 'MENU' | 'NAME_ENTRY' | 'DIAGNOSTIC' | 'PLAYING' | 'BATTLE' | 'INVENTORY' | 'SHOP' | 'DEATH';

interface GameStore {
  gameState: GameStateType;
  player: Player;
  battleContext: BattleContext;
  inventory: InventoryItem[];
  lastDrop: InventoryItem | null;
  quests: Quest[];
  questLogOpen: boolean;
  npcDialog: NpcDialogState;
  diagnosticDone: boolean;
  rusZoneUnlocked: boolean;
  geoZoneUnlocked: boolean;
  skills: Skill[];
  skillsPanelOpen: boolean;
  leaderboardOpen: boolean;
  dailyPanelOpen: boolean;
  dailyQuests: DailyQuestData | null;
  wins: number;

  setGameState: (state: GameStateType) => void;
  triggerBattle: (enemyData: any, subject: 'math' | 'russian' | 'geometry', zone: 'math' | 'russian' | 'geometry') => void;
  finishBattle: (isVictory: boolean, reward: { xp: number; gold: number }) => void;
  initPlayer: (name: string, appearance: CharacterAppearance) => void;
  loadSave: () => boolean;
  addItem: (item: Omit<InventoryItem, 'quantity'>) => void;
  useItem: (itemId: string) => void;
  clearLastDrop: () => void;
  setGold: (gold: number) => void;
  takeDamage: (amount: number) => void;
  respawn: () => void;

  // Diagnostic
  finishDiagnostic: (mathLvl: number, rusLvl: number) => void;

  // Quest system
  acceptQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  setQuestLogOpen: (open: boolean) => void;

  // NPC
  openNpcDialog: (npcId: string) => void;
  closeNpcDialog: () => void;

  // Skills
  useSkill: (skillId: string) => void;
  resetSkillEffect: () => void;
  setSkillsPanelOpen: (open: boolean) => void;

  // Leaderboard & Daily
  setLeaderboardOpen: (open: boolean) => void;
  setDailyPanelOpen: (open: boolean) => void;
  initDailyQuests: () => void;
  claimDailyBonus: () => void;
}

// ─── XP Table ─────────────────────────────────────────────────
export const XP_TABLE = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 999999];
const xpToNext = (level: number) => XP_TABLE[Math.min(level, XP_TABLE.length - 1)];

// ─── Question Generator ───────────────────────────────────────
type QResult = { text: string; correctAnswer: string; hint?: string };

function rnd(max: number, min = 1) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Geometry Question Generator ─────────────────────────────
function generateGeometryQuestion(level: number): QResult {
  type GOp = 'perimeter' | 'area' | 'angle' | 'proportion' | 'power' | 'coord' | 'volume';
  const avail: GOp[] = ['perimeter', 'area', 'angle'];
  if (level >= 4) avail.push('proportion');
  if (level >= 5) avail.push('power', 'coord');
  if (level >= 7) avail.push('volume');

  const op = pick(avail);

  if (op === 'perimeter') {
    const shapes = [
      () => { const a = rnd(12, 2), b = rnd(12, 2); return { text: `Периметр прямоуг. ${a}×${b} = ?`, ans: String(2 * (a + b)), hint: 'P = 2(a+b)' }; },
      () => { const a = rnd(10, 2); return { text: `Периметр квадрата со стороной ${a} = ?`, ans: String(4 * a), hint: 'P = 4a' }; },
      () => { const a = rnd(8, 2), b = rnd(8, 2), c = rnd(8, 2); return { text: `Периметр треуг. со сторонами ${a}, ${b}, ${c} = ?`, ans: String(a + b + c), hint: 'P = a+b+c' }; },
    ];
    const s = pick(shapes)();
    return { text: s.text, correctAnswer: s.ans, hint: s.hint };
  }
  if (op === 'area') {
    const shapes = [
      () => { const a = rnd(10, 2), b = rnd(10, 2); return { text: `Площадь прямоуг. ${a}×${b} = ?`, ans: String(a * b), hint: 'S = a×b' }; },
      () => { const a = rnd(10, 2); return { text: `Площадь квадрата со стороной ${a} = ?`, ans: String(a * a), hint: 'S = a²' }; },
      () => { const b = rnd(10, 2), h = rnd(10, 2); return { text: `Площадь треуг. с основ. ${b} и высотой ${h} = ?`, ans: String((b * h) / 2), hint: 'S = b×h/2' }; },
    ];
    const s = pick(shapes)();
    return { text: s.text, correctAnswer: s.ans, hint: s.hint };
  }
  if (op === 'angle') {
    const a = rnd(80, 20), b = rnd(170 - a, 20);
    return { text: `Два угла треугольника: ${a}° и ${b}°. Третий?`, correctAnswer: String(180 - a - b), hint: 'Сумма углов = 180°' };
  }
  if (op === 'proportion') {
    const a = rnd(8, 2), b = rnd(8, 2), c = rnd(8, 2);
    return { text: `${a}/x = ${b}/${a * c / b * b}\nНайди x (округли до целого)`, correctAnswer: String(Math.round(a * (a * c / b * b) / b)), hint: 'Пропорция: a/b = c/d' };
  }
  if (op === 'power') {
    const n = rnd(5, 2);
    const powers = [{ base: n, exp: 2, text: `${n}² = ?` }, { base: n, exp: 3, text: `${n}³ = ?` }];
    const p = pick(powers);
    return { text: p.text, correctAnswer: String(Math.pow(p.base, p.exp)), hint: 'Степень числа' };
  }
  if (op === 'coord') {
    const x1 = rnd(5, -5), y1 = rnd(5, -5), x2 = rnd(5, 1);
    return { text: `Точка A(${x1}, ${y1}). Сдвинь на ${x2} по X. Новый X?`, correctAnswer: String(x1 + x2), hint: 'Координатная ось' };
  }
  // volume
  const a = rnd(8, 2), b = rnd(8, 2), c = rnd(8, 2);
  return { text: `Объём параллелепипеда ${a}×${b}×${c} = ?`, correctAnswer: String(a * b * c), hint: 'V = a×b×c' };
}

export const generateQuestion = (subject: 'math' | 'russian' | 'geometry', level: number): QResult => {
  if (subject === 'geometry') return generateGeometryQuestion(level);
  // ─── MATH ─────────────────────────────────────────────────────
  if (subject === 'math') {
    type Op = 'add' | 'sub' | 'mul' | 'div' | 'eq' | 'sq' | 'pct' | 'word' | 'frac' | 'neg';
    const avail: Op[] = ['add'];
    if (level >= 2) avail.push('sub');
    if (level >= 3) avail.push('mul');
    if (level >= 4) avail.push('div', 'eq');
    if (level >= 5) avail.push('frac', 'neg');
    if (level >= 6) avail.push('sq');
    if (level >= 7) avail.push('pct', 'word');

    const op = pick(avail);
    const M = Math.min(level * 10, 100);

    if (op === 'add') {
      const a = rnd(M), b = rnd(M);
      return { text: `${a} + ${b} = ?`, correctAnswer: String(a + b), hint: 'Сложение' };
    }
    if (op === 'sub') {
      const b = rnd(M - 1), a = rnd(M, b);
      return { text: `${a} − ${b} = ?`, correctAnswer: String(a - b), hint: 'Вычитание' };
    }
    if (op === 'mul') {
      const a = rnd(Math.min(level + 5, 12)), b = rnd(Math.min(level + 5, 12));
      return { text: `${a} × ${b} = ?`, correctAnswer: String(a * b), hint: 'Умножение' };
    }
    if (op === 'div') {
      const b = rnd(10, 2), res = rnd(10);
      return { text: `${b * res} ÷ ${b} = ?`, correctAnswer: String(res), hint: 'Деление' };
    }
    if (op === 'eq') {
      const b = rnd(20), c = rnd(40, b + 1);
      return { text: `x + ${b} = ${c}\nНайди x`, correctAnswer: String(c - b), hint: 'Уравнение' };
    }
    if (op === 'frac') {
      const den = pick([2, 4, 5, 10]);
      const num = rnd(den - 1);
      const base = den * rnd(10);
      return { text: `${num}/${den} от ${base} = ?`, correctAnswer: String((base * num) / den), hint: 'Дроби' };
    }
    if (op === 'neg') {
      const a = rnd(20), b = rnd(30, a + 1);
      return { text: `${a} − ${b} = ?`, correctAnswer: String(a - b), hint: 'Отрицательные числа' };
    }
    if (op === 'sq') {
      const n = rnd(Math.min(level, 12), 2);
      return { text: `${n}² = ?`, correctAnswer: String(n * n), hint: 'Квадрат числа' };
    }
    if (op === 'pct') {
      const pct = pick([10, 20, 25, 50]);
      const base = rnd(10) * 10;
      return { text: `${pct}% от ${base} = ?`, correctAnswer: String((base * pct) / 100), hint: 'Проценты' };
    }
    // word problems
    const words = [
      { text: 'В классе 30 учеников. Ушло 7. Сколько осталось?', ans: '23' },
      { text: 'У Маши 5 яблок, у Пети в 3 раза больше. Сколько у Пети?', ans: '15' },
      { text: 'Маг победил 4 гоблина и 6 слизней. Сколько всего?', ans: '10' },
      { text: 'В кошельке 50 монет. Потратили 18. Сколько осталось?', ans: '32' },
      { text: 'Поезд едет 80 км/ч. За 2 часа проедет сколько км?', ans: '160' },
      { text: 'Прямоугольник 6×4. Найди периметр.', ans: '20' },
      { text: 'Прямоугольник 5×3. Найди площадь.', ans: '15' },
      { text: 'Три угла треугольника: 60°, 70°, ?°', ans: '50' },
      { text: 'Купили 3 тетради по 12 руб. Сколько заплатили?', ans: '36' },
      { text: 'В день читаю 15 стр. За неделю сколько страниц?', ans: '105' },
      { text: 'Скорость 60 км/ч, время 3 ч. Расстояние?', ans: '180' },
      { text: 'Периметр квадрата 28. Сторона?', ans: '7' },
      { text: 'Куплено 4 кг по 35 руб/кг. Итого?', ans: '140' },
      { text: '15% от 200 = ?', ans: '30' },
      { text: '2³ = ?', ans: '8' },
    ];
    const w = pick(words);
    return { text: w.text, correctAnswer: w.ans, hint: 'Задача' };
  }

  // ─── RUSSIAN ──────────────────────────────────────────────────
  type RW = { q: string; a: string; lvl: number; hint?: string };
  const pool: RW[] = [
    // ── Уровень 1: базовые словарные слова ─────────────────────
    { q: 'Молоко или малоко?', a: 'молоко', lvl: 1 },
    { q: 'Собака или сабака?', a: 'собака', lvl: 1 },
    { q: 'Корова или карова?', a: 'корова', lvl: 1 },
    { q: 'Яблоко или яблако?', a: 'яблоко', lvl: 1 },
    { q: 'Солнце или сонце?', a: 'солнце', lvl: 1 },
    { q: 'Ворона или варона?', a: 'ворона', lvl: 1 },
    { q: 'Петух или питух?', a: 'петух', lvl: 1 },
    { q: 'Ребята или рибята?', a: 'ребята', lvl: 1 },
    { q: 'Медведь или медветь?', a: 'медведь', lvl: 1 },
    { q: 'Морковь или морков?', a: 'морковь', lvl: 1 },
    { q: 'Огурец или агурец?', a: 'огурец', lvl: 1 },
    { q: 'Девочка или девачка?', a: 'девочка', lvl: 1 },
    { q: 'Мальчик или малчик?', a: 'мальчик', lvl: 1 },
    { q: 'Учитель или учетель?', a: 'учитель', lvl: 1 },
    { q: 'Тетрадь или тетрать?', a: 'тетрадь', lvl: 1 },
    { q: 'Карандаш или карандош?', a: 'карандаш', lvl: 1 },

    // ── Уровень 2: ЖИ-ШИ, ЧА-ЩА, ЧУ-ЩУ, удвоенные ──────────
    { q: 'Живот или жывот?', a: 'живот', lvl: 2, hint: 'ЖИ-ШИ пиши с И' },
    { q: 'Шина или шына?', a: 'шина', lvl: 2, hint: 'ЖИ-ШИ пиши с И' },
    { q: 'Жираф или жыраф?', a: 'жираф', lvl: 2, hint: 'ЖИ-ШИ пиши с И' },
    { q: 'Чашка или чяшка?', a: 'чашка', lvl: 2, hint: 'ЧА-ЩА пиши с А' },
    { q: 'Щавель или щявель?', a: 'щавель', lvl: 2, hint: 'ЧА-ЩА пиши с А' },
    { q: 'Чудо или чюдо?', a: 'чудо', lvl: 2, hint: 'ЧУ-ЩУ пиши с У' },
    { q: 'Щука или щюка?', a: 'щука', lvl: 2, hint: 'ЧУ-ЩУ пиши с У' },
    { q: 'Класс или клас?', a: 'класс', lvl: 2, hint: 'Удвоенная согласная' },
    { q: 'Суббота или субота?', a: 'суббота', lvl: 2, hint: 'Удвоенная согласная' },
    { q: 'Аллея или алея?', a: 'аллея', lvl: 2, hint: 'Удвоенная согласная' },
    { q: 'Коллекция или колекция?', a: 'коллекция', lvl: 2 },
    { q: 'Программа или програма?', a: 'программа', lvl: 2 },
    { q: 'Дружить или дружыть?', a: 'дружить', lvl: 2, hint: 'После Ж — И' },
    { q: 'Хорошо или харашо?', a: 'хорошо', lvl: 2 },
    { q: 'Ребёнок или рябёнок?', a: 'ребёнок', lvl: 2 },
    { q: 'Железо или жылезо?', a: 'железо', lvl: 2 },

    // ── Уровень 3: мягкий/твёрдый знак, приставки ───────────
    { q: 'Мышь или мыш?', a: 'мышь', lvl: 3, hint: 'Ь у сущ. жен. рода после шипящей' },
    { q: 'Ночь или ноч?', a: 'ночь', lvl: 3, hint: 'Ь у сущ. жен. рода' },
    { q: 'Врач или врачь?', a: 'врач', lvl: 3, hint: 'Без Ь у сущ. муж. рода' },
    { q: 'Вещь или вещ?', a: 'вещь', lvl: 3, hint: 'Ь у сущ. жен. рода' },
    { q: 'Подъезд или подезд?', a: 'подъезд', lvl: 3, hint: 'Ъ после приставки перед Е' },
    { q: 'Объявление или обявление?', a: 'объявление', lvl: 3, hint: 'Ъ после приставки' },
    { q: 'Съезд или сезд?', a: 'съезд', lvl: 3, hint: 'Ъ после С перед Е' },
    { q: 'Пьеса или песа?', a: 'пьеса', lvl: 3, hint: 'Разделительный Ь' },
    { q: 'Сделать или зделать?', a: 'сделать', lvl: 3, hint: 'Приставка С-' },
    { q: 'Сбежать или збежать?', a: 'сбежать', lvl: 3, hint: 'Приставка С-' },
    { q: 'Расписание или разписание?', a: 'расписание', lvl: 3, hint: 'РАС- перед глухими' },
    { q: 'Разрисовать или расрисовать?', a: 'разрисовать', lvl: 3, hint: 'РАЗ- перед звонкими' },
    { q: 'Безграмотный или бесграмотный?', a: 'безграмотный', lvl: 3, hint: 'БЕЗ- перед звонкими' },
    { q: 'Бесполезный или безполезный?', a: 'бесполезный', lvl: 3, hint: 'БЕС- перед глухими' },

    // ── Уровень 4: сложные слова ────────────────────────────
    { q: 'Беспокойство или безпокойство?', a: 'беспокойство', lvl: 4 },
    { q: 'Расстояние или растояние?', a: 'расстояние', lvl: 4 },
    { q: 'Впечатление или впичатление?', a: 'впечатление', lvl: 4 },
    { q: 'Путешествие или путишествие?', a: 'путешествие', lvl: 4 },
    { q: 'Участвовать или учавствовать?', a: 'участвовать', lvl: 4 },
    { q: 'Чувствовать или чюствовать?', a: 'чувствовать', lvl: 4 },
    { q: 'Здравствуйте или здраствуйте?', a: 'здравствуйте', lvl: 4 },
    { q: 'Пожалуйста или пожалуста?', a: 'пожалуйста', lvl: 4 },
    { q: 'Президент или прездент?', a: 'президент', lvl: 4 },
    { q: 'Экскурсия или экскурция?', a: 'экскурсия', lvl: 4 },
    { q: 'Профессия или професия?', a: 'профессия', lvl: 4 },
    { q: 'Территория или терирория?', a: 'территория', lvl: 4 },
    { q: 'Замечательный или замечятельный?', a: 'замечательный', lvl: 4 },
    { q: 'Разговор или раговор?', a: 'разговор', lvl: 4 },

    // ── Уровень 5: синонимы и антонимы ────────────────────
    { q: 'Синоним слова «радость»:', a: 'счастье', lvl: 5, hint: 'Близкое по смыслу' },
    { q: 'Антоним слова «грустный»:', a: 'весёлый', lvl: 5 },
    { q: 'Синоним слова «большой»:', a: 'огромный', lvl: 5 },
    { q: 'Антоним слова «быстро»:', a: 'медленно', lvl: 5 },
    { q: 'Синоним слова «храбрый»:', a: 'смелый', lvl: 5 },
    { q: 'Антоним слова «начало»:', a: 'конец', lvl: 5 },
    { q: 'Синоним слова «смотреть»:', a: 'глядеть', lvl: 5 },
    { q: 'Антоним слова «добрый»:', a: 'злой', lvl: 5 },
    { q: 'Синоним слова «говорить»:', a: 'произносить', lvl: 5 },
    { q: 'Антоним слова «трудный»:', a: 'лёгкий', lvl: 5 },

    // ── Уровень 6: части речи, разбор ─────────────────────
    { q: 'Часть речи слова «красивый»:', a: 'прилагательное', lvl: 6 },
    { q: 'Часть речи слова «бежать»:', a: 'глагол', lvl: 6 },
    { q: 'Часть речи слова «он»:', a: 'местоимение', lvl: 6 },
    { q: 'Часть речи слова «быстро»:', a: 'наречие', lvl: 6 },
    { q: 'Часть речи слова «и»:', a: 'союз', lvl: 6 },
    { q: 'Часть речи слова «ах»:', a: 'междометие', lvl: 6 },
    { q: 'Сколько слогов в «яблоко»?', a: '3', lvl: 6 },
    { q: 'Корень слова «переход»:', a: 'ход', lvl: 6, hint: 'пере-ход' },
    { q: 'Приставка в «подснежник»:', a: 'под', lvl: 6, hint: 'под-снежник' },
    { q: 'Суффикс в слове «учитель»:', a: 'тель', lvl: 6, hint: 'учи-тель' },
  ];

  const eligible = pool.filter(w => w.lvl <= Math.max(level, 1));
  const item = pick(eligible);
  return { text: item.q, correctAnswer: item.a, hint: item.hint };
};


// ─── Item Drop Table ──────────────────────────────────────────
const DROP_TABLE: Array<{ chance: number; item: Omit<InventoryItem, 'quantity'> }> = [
  { chance: 0.30, item: { id: 'health_potion', name: 'Зелье здоровья', emoji: '🧪', description: 'Восстанавливает 30 HP', type: 'potion' } },
  { chance: 0.15, item: { id: 'math_scroll', name: 'Свиток Счёта', emoji: '📜', description: 'Помощник в математике', type: 'scroll' } },
  { chance: 0.10, item: { id: 'rus_scroll', name: 'Свиток Слова', emoji: '📖', description: 'Помощник в правописании', type: 'scroll' } },
  { chance: 0.05, item: { id: 'amulet', name: 'Амулет удачи', emoji: '🔮', description: '+5% к XP навсегда', type: 'artifact' } },
];

function rollDrop(): Omit<InventoryItem, 'quantity'> | null {
  const r = Math.random();
  let cumulative = 0;
  for (const entry of DROP_TABLE) {
    cumulative += entry.chance;
    if (r < cumulative) return entry.item;
  }
  return null;
}

// ─── Starter Inventory ────────────────────────────────────────
const STARTER_ITEMS: InventoryItem[] = [
  { id: 'health_potion', name: 'Зелье здоровья', emoji: '🧪', description: 'Восстанавливает 30 HP', quantity: 2, type: 'potion' },
  { id: 'math_scroll', name: 'Свиток Счёта', emoji: '📜', description: 'Помощник в математике', quantity: 1, type: 'scroll' },
];

const DEFAULT_APPEARANCE: CharacterAppearance = {
  class: 'mage', skinTone: 'light', hairColor: 'brown',
};

const DEFAULT_PLAYER: Player = {
  id: null, name: 'Маг-Ученик',
  level: 1, xp: 0, xpToNextLevel: 100,
  gold: 0, mathLevel: 1, rusLevel: 1,
  hp: 80, maxHp: 80,
  appearance: DEFAULT_APPEARANCE,
  xpMult: 1.2,
};

// ─── Starting Quests ──────────────────────────────────────────
export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q_math_1', npcId: 'npc_mathius',
    title: 'Первый бой',
    description: 'Профессор Матиус просит тебя победить хотя бы одного монстра в зоне арифмантии.',
    goal: { type: 'kill', zone: 'math', target: 1, current: 0 },
    reward: { xp: 50, gold: 20 },
    status: 'available',
  },
  {
    id: 'q_math_2', npcId: 'npc_mathius',
    title: 'Ученик мага чисел',
    description: 'Победи 3 гоблина в зоне арифмантии, чтобы доказать свою силу.',
    goal: { type: 'kill', zone: 'math', target: 3, current: 0 },
    reward: { xp: 120, gold: 50 },
    status: 'locked',
  },
  {
    id: 'q_math_3', npcId: 'npc_mathius',
    title: 'Мастер сложения',
    description: 'Победи 5 слизней. Докажи, что ты настоящий маг арифмантии!',
    goal: { type: 'kill', zone: 'math', target: 5, current: 0 },
    reward: { xp: 200, gold: 80, item: { id: 'math_scroll', name: 'Свиток Счёта', emoji: '📜', description: 'Помощник в математике', type: 'scroll' } },
    status: 'locked',
  },
  {
    id: 'q_rus_1', npcId: 'npc_wordkeeper',
    title: 'Слово — не воробей',
    description: 'Хранитель Слова просит победить одного врага в зоне словесной магии.',
    goal: { type: 'kill', zone: 'russian', target: 1, current: 0 },
    reward: { xp: 50, gold: 20 },
    status: 'available',
  },
  {
    id: 'q_rus_2', npcId: 'npc_wordkeeper',
    title: 'Грамотный воин',
    description: 'Победи 3 тролля в зоне словесной магии, чтобы стать истинным мастером слова.',
    goal: { type: 'kill', zone: 'russian', target: 3, current: 0 },
    reward: { xp: 120, gold: 50 },
    status: 'locked',
  },
  {
    id: 'q_rus_3', npcId: 'npc_wordkeeper',
    title: 'Страж правописания',
    description: 'Одолей 5 ведьм в зоне словесной магии. Знание — твоё главное оружие!',
    goal: { type: 'kill', zone: 'russian', target: 5, current: 0 },
    reward: { xp: 200, gold: 80, item: { id: 'rus_scroll', name: 'Свиток Слова', emoji: '📖', description: 'Помощник в правописании', type: 'scroll' } },
    status: 'locked',
  },
  {
    id: 'q_geo_1', npcId: 'npc_geomancer',
    title: 'Первый шаг в мир форм',
    description: 'Архимаг Геометр просит тебя победить хотя бы одного дракона или феникса в Академии Геометрии.',
    goal: { type: 'kill', zone: 'geometry', target: 1, current: 0 },
    reward: { xp: 80, gold: 40 },
    status: 'available',
  },
  {
    id: 'q_geo_2', npcId: 'npc_geomancer',
    title: 'Охотник на драконов',
    description: 'Победи 3 существ в Академии Геометрии. Покажи, что ты достоин звания Мага Форм!',
    goal: { type: 'kill', zone: 'geometry', target: 3, current: 0 },
    reward: { xp: 180, gold: 80 },
    status: 'locked',
  },
  {
    id: 'q_geo_3', npcId: 'npc_geomancer',
    title: 'Постижение Пространства',
    description: 'Одолей 5 могучих существ Академии Геометрии и обрети артефакт высшей мудрости!',
    goal: { type: 'kill', zone: 'geometry', target: 5, current: 0 },
    reward: { xp: 300, gold: 120, item: { id: 'geo_crystal', name: 'Кристалл Форм', emoji: '💎', description: 'Символ мастерства геометрии', type: 'artifact' } },
    status: 'locked',
  },
];

// ─── Store ────────────────────────────────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'MENU',
  player: DEFAULT_PLAYER,
  battleContext: {
    isActive: false, enemyId: null, enemyType: null,
    subject: null, difficulty: 1, currentQuestion: null,
    zone: 'math', attempts: 0,
    activeSkillEffect: null, skillUsedThisBattle: false,
  },
  inventory: STARTER_ITEMS,
  lastDrop: null,
  quests: INITIAL_QUESTS,
  questLogOpen: false,
  npcDialog: { isOpen: false, npcId: null },
  diagnosticDone: false,
  rusZoneUnlocked: false,
  geoZoneUnlocked: false,
  skills: SKILLS_CATALOG.map(s => ({ ...s })),
  skillsPanelOpen: false,
  leaderboardOpen: false,
  dailyPanelOpen: false,
  dailyQuests: null,
  wins: 0,

  setGameState: (state) => set({ gameState: state }),

  triggerBattle: (enemyData, subject, zone) => {
    const { player } = get();
    const relLevel = subject === 'math' ? player.mathLevel
      : subject === 'russian' ? player.rusLevel
        : player.level; // geometry uses overall level
    set({
      gameState: 'BATTLE',
      battleContext: {
        isActive: true,
        enemyId: enemyData.id,
        enemyType: enemyData.type,
        subject,
        difficulty: enemyData.difficulty || 1,
        currentQuestion: generateQuestion(subject, relLevel),
        zone,
        attempts: 0,
        activeSkillEffect: null,
        skillUsedThisBattle: false,
      },
    });
  },

  finishBattle: (isVictory, reward) => set((state) => {
    if (!isVictory) {
      const newHp = Math.max(0, state.player.hp - 10);
      const newPlayer = { ...state.player, hp: newHp };
      const isDead = newHp <= 0;
      if (!isDead) saveGame(newPlayer, state.inventory, state.quests, state.diagnosticDone, state.rusZoneUnlocked);
      return {
        gameState: isDead ? 'DEATH' : 'PLAYING',
        battleContext: { ...state.battleContext, isActive: false, enemyId: null, currentQuestion: null },
        player: newPlayer,
      };
    }

    const zone = state.battleContext.zone;

    // ─ Update quest progress ──────────────────────────────────
    const updatedQuests = state.quests.map(q => {
      if (q.status !== 'active') return q;
      if (q.goal.type === 'kill' && q.goal.zone === zone) {
        const newCurrent = q.goal.current + 1;
        const reached = newCurrent >= q.goal.target;
        return { ...q, goal: { ...q.goal, current: newCurrent }, status: reached ? 'ready' : 'active' } as Quest;
      }
      return q;
    });

    // Unlock next quests in chain
    const finalQuests = updatedQuests.map((q, idx, arr) => {
      if (q.status === 'locked') {
        const prevCompleted = idx > 0 && arr[idx - 1].npcId === q.npcId &&
          (arr[idx - 1].status === 'completed' || arr[idx - 1].status === 'ready');
        if (prevCompleted) return { ...q, status: 'available' } as Quest;
      }
      return q;
    });

    // Apply skill effects to reward
    const skillEffect = state.battleContext.activeSkillEffect;
    const rawXp = reward.xp * (skillEffect === 'xpBoost' ? 1.5 : 1);
    const rawGold = reward.gold * (skillEffect === 'goldBoost' ? 2 : 1);

    const newXp = state.player.xp + Math.round(rawXp * state.player.xpMult);
    const newGold = state.player.gold + Math.round(rawGold);
    const nextLvl = xpToNext(state.player.level);
    const didLvlUp = newXp >= nextLvl;
    const newLevel = didLvlUp ? state.player.level + 1 : state.player.level;
    const newMathLvl = state.battleContext.subject === 'math' && didLvlUp ? state.player.mathLevel + 1 : state.player.mathLevel;
    const newRusLvl = state.battleContext.subject === 'russian' && didLvlUp ? state.player.rusLevel + 1 : state.player.rusLevel;
    const newMaxHp = CLASS_INFO[state.player.appearance.class].baseHp + (newLevel - 1) * 20;
    const rusZoneUnlocked = state.rusZoneUnlocked || newLevel >= 3;
    const geoZoneUnlocked = state.geoZoneUnlocked || newLevel >= 5;

    // Unlock skills based on new level
    const updatedSkills = state.skills.map(s => s.unlockLevel <= newLevel ? { ...s, unlocked: true } : s);

    const droppedItem = rollDrop();
    let newInventory = [...state.inventory];
    if (droppedItem) {
      const existing = newInventory.find(i => i.id === droppedItem.id);
      if (existing) {
        newInventory = newInventory.map(i => i.id === droppedItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newInventory = [...newInventory, { ...droppedItem, quantity: 1 }];
      }
    }

    const newPlayer: Player = {
      ...state.player,
      xp: newXp, gold: newGold,
      level: newLevel, xpToNextLevel: xpToNext(newLevel),
      mathLevel: newMathLvl, rusLevel: newRusLvl,
      maxHp: newMaxHp,
      hp: didLvlUp ? newMaxHp : state.player.hp,
    };

    saveGame(newPlayer, newInventory, finalQuests, state.diagnosticDone, rusZoneUnlocked, geoZoneUnlocked);

    // Update daily quests progress
    let newDailyQuests = state.dailyQuests;
    if (newDailyQuests && isVictory) {
      newDailyQuests = {
        ...newDailyQuests,
        quests: newDailyQuests.quests.map(dq => {
          if (dq.completed || dq.zone !== zone) return dq;
          const newCurrent = dq.current + 1;
          const completed = newCurrent >= dq.target;
          // Give per-quest XP/gold reward when just completed
          if (completed && !dq.completed) {
            newPlayer.xp += dq.xpReward;
            newPlayer.gold += dq.goldReward;
          }
          return { ...dq, current: newCurrent, completed };
        }),
      };
      saveDailyQuests(newDailyQuests);
    }

    // Update leaderboard
    const newWins = state.wins + 1;
    updateLeaderboard(newPlayer, newWins);

    return {
      gameState: 'PLAYING',
      battleContext: { ...state.battleContext, isActive: false, enemyId: null, currentQuestion: null, activeSkillEffect: null, skillUsedThisBattle: false },
      player: newPlayer,
      inventory: newInventory,
      lastDrop: droppedItem ? { ...droppedItem, quantity: 1 } : null,
      quests: finalQuests,
      rusZoneUnlocked,
      geoZoneUnlocked,
      skills: updatedSkills,
      dailyQuests: newDailyQuests,
      wins: newWins,
    };
  }),

  initPlayer: (name, appearance) => {
    const info = CLASS_INFO[appearance.class];
    const baseHp = info.baseHp;
    const player: Player = {
      ...DEFAULT_PLAYER,
      name: name.trim() || 'Маг-Ученик',
      appearance,
      xpMult: info.xpMult,
      hp: baseHp, maxHp: baseHp,
    };
    const inventory: InventoryItem[] = [
      ...STARTER_ITEMS,
      ...(appearance.class === 'archer' ? [{ id: 'shield_rune', name: 'Руна защиты', emoji: '🛡️', description: 'Щит удачи в бою', quantity: 1, type: 'artifact' as const }] : []),
    ];
    saveGame(player, inventory, INITIAL_QUESTS, false, false, false);
    set({
      player, inventory, quests: INITIAL_QUESTS, diagnosticDone: false, rusZoneUnlocked: false, geoZoneUnlocked: false,
      skills: SKILLS_CATALOG.map(s => ({ ...s, unlocked: s.unlockLevel <= 1 })), gameState: 'DIAGNOSTIC'
    });
  },

  finishDiagnostic: (mathLvl, rusLvl) => set((state) => {
    const newLevel = Math.max(1, Math.floor((mathLvl + rusLvl) / 2));
    const info = CLASS_INFO[state.player.appearance.class];
    const newMaxHp = info.baseHp + (newLevel - 1) * 20;
    const rusZoneUnlocked = newLevel >= 3;
    const geoZoneUnlocked = newLevel >= 5;
    const updatedSkills = state.skills.map(s => s.unlockLevel <= newLevel ? { ...s, unlocked: true } : s);
    const newPlayer: Player = {
      ...state.player,
      mathLevel: mathLvl, rusLevel: rusLvl,
      level: newLevel, xpToNextLevel: xpToNext(newLevel),
      maxHp: newMaxHp, hp: newMaxHp,
    };
    saveGame(newPlayer, state.inventory, state.quests, true, rusZoneUnlocked, geoZoneUnlocked);
    return { player: newPlayer, diagnosticDone: true, rusZoneUnlocked, geoZoneUnlocked, skills: updatedSkills, gameState: 'PLAYING' };
  }),

  loadSave: () => {
    const save = loadGame();
    if (!save) return false;
    const savedLevel = save.player.level ?? 1;
    const updatedSkills = SKILLS_CATALOG.map(s => ({ ...s, unlocked: s.unlockLevel <= savedLevel }));
    set({
      player: save.player,
      inventory: save.inventory,
      quests: save.quests ?? INITIAL_QUESTS,
      diagnosticDone: save.diagnosticDone ?? true,
      rusZoneUnlocked: save.rusZoneUnlocked ?? false,
      geoZoneUnlocked: (save as any).geoZoneUnlocked ?? false,
      skills: updatedSkills,
      gameState: 'PLAYING',
    });
    return true;
  },

  acceptQuest: (questId) => set((state) => {
    const quests = state.quests.map(q =>
      q.id === questId && q.status === 'available' ? { ...q, status: 'active' as const } : q
    );
    saveGame(state.player, state.inventory, quests, state.diagnosticDone, state.rusZoneUnlocked, state.geoZoneUnlocked);
    return { quests };
  }),

  completeQuest: (questId) => set((state) => {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'ready') return {};

    // Apply reward
    const newXp = state.player.xp + quest.reward.xp;
    const newGold = state.player.gold + quest.reward.gold;
    const nextLvl = xpToNext(state.player.level);
    const didLvlUp = newXp >= nextLvl;
    const newLevel = didLvlUp ? state.player.level + 1 : state.player.level;
    const newMaxHp = CLASS_INFO[state.player.appearance.class].baseHp + (newLevel - 1) * 20;
    const rusZoneUnlocked = state.rusZoneUnlocked || newLevel >= 3;
    const geoZoneUnlocked = state.geoZoneUnlocked || newLevel >= 5;
    const updatedSkills = state.skills.map(s => s.unlockLevel <= newLevel ? { ...s, unlocked: true } : s);

    const newPlayer: Player = {
      ...state.player, xp: newXp, gold: newGold,
      level: newLevel, xpToNextLevel: xpToNext(newLevel),
      maxHp: newMaxHp, hp: didLvlUp ? newMaxHp : state.player.hp,
    };

    let newInventory = [...state.inventory];
    if (quest.reward.item) {
      const existing = newInventory.find(i => i.id === quest.reward.item!.id);
      if (existing) {
        newInventory = newInventory.map(i => i.id === quest.reward.item!.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newInventory = [...newInventory, { ...quest.reward.item!, quantity: 1 }];
      }
    }

    // Mark completed, unlock next
    let quests = state.quests.map(q => q.id === questId ? { ...q, status: 'completed' as const } : q);
    quests = quests.map((q, idx, arr) => {
      if (q.status === 'locked') {
        const prev = idx > 0 ? arr[idx - 1] : null;
        if (prev && prev.npcId === q.npcId && prev.status === 'completed') {
          return { ...q, status: 'available' as const };
        }
      }
      return q;
    });

    saveGame(newPlayer, newInventory, quests, state.diagnosticDone, rusZoneUnlocked, geoZoneUnlocked);
    return { player: newPlayer, inventory: newInventory, quests, rusZoneUnlocked, geoZoneUnlocked, skills: updatedSkills };
  }),

  setQuestLogOpen: (open) => set({ questLogOpen: open }),
  openNpcDialog: (npcId) => set({ npcDialog: { isOpen: true, npcId } }),
  closeNpcDialog: () => set({ npcDialog: { isOpen: false, npcId: null } }),

  // Skills
  useSkill: (skillId) => set((state) => {
    if (state.battleContext.skillUsedThisBattle) return {};
    const skill = state.skills.find(s => s.id === skillId && s.unlocked);
    if (!skill) return {};

    // For skipQuestion — immediately win the battle
    if (skill.effect === 'skipQuestion') {
      window.dispatchEvent(new CustomEvent('enemyDefeated', { detail: state.battleContext.enemyId }));
      // finishBattle will be called from BattleModal after this effect is set
    }
    return {
      battleContext: {
        ...state.battleContext,
        activeSkillEffect: skill.effect,
        skillUsedThisBattle: true,
      },
    };
  }),

  resetSkillEffect: () => set((state) => ({
    battleContext: { ...state.battleContext, activeSkillEffect: null },
  })),

  setSkillsPanelOpen: (open) => set({ skillsPanelOpen: open }),

  addItem: (item) => set((state) => {
    const existing = state.inventory.find(i => i.id === item.id);
    const inventory = existing
      ? state.inventory.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...state.inventory, { ...item, quantity: 1 }];
    saveGame(state.player, inventory, state.quests, state.diagnosticDone, state.rusZoneUnlocked, state.geoZoneUnlocked);
    return { inventory };
  }),

  useItem: (itemId) => set((state) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item || item.quantity <= 0) return {};
    let playerUpdate: Partial<Player> = {};
    if (itemId === 'health_potion') {
      playerUpdate = { hp: Math.min(state.player.hp + 30, state.player.maxHp) };
    }
    const newPlayer = { ...state.player, ...playerUpdate };
    const newInventory = state.inventory
      .map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);
    saveGame(newPlayer, newInventory, state.quests, state.diagnosticDone, state.rusZoneUnlocked, state.geoZoneUnlocked);
    return { player: newPlayer, inventory: newInventory };
  }),

  clearLastDrop: () => set({ lastDrop: null }),

  setGold: (gold) => set(state => {
    const newPlayer = { ...state.player, gold };
    saveGame(newPlayer, state.inventory, state.quests, state.diagnosticDone, state.rusZoneUnlocked, state.geoZoneUnlocked);
    return { player: newPlayer };
  }),

  takeDamage: (amount) => set((state) => {
    const newHp = Math.max(0, state.player.hp - amount);
    const newPlayer = { ...state.player, hp: newHp };
    if (newHp <= 0) return { player: newPlayer, gameState: 'DEATH' as GameStateType };
    return { player: newPlayer };
  }),

  respawn: () => set((state) => {
    const newPlayer = { ...state.player, hp: Math.floor(state.player.maxHp * 0.5) };
    saveGame(newPlayer, state.inventory, state.quests, state.diagnosticDone, state.rusZoneUnlocked, state.geoZoneUnlocked);
    return { player: newPlayer, gameState: 'PLAYING' as GameStateType };
  }),

  // ─── Leaderboard & Daily Quests ──────────────────────────────
  setLeaderboardOpen: (open) => set({ leaderboardOpen: open }),
  setDailyPanelOpen: (open) => set({ dailyPanelOpen: open }),

  initDailyQuests: () => set(() => {
    const existing = loadDailyQuests();
    if (existing) return { dailyQuests: existing };

    const quests: DailyQuestEntry[] = [
      { id: 'dq_math', title: 'Победи 3 монстра в Зоне Математики', emoji: '⚔️', target: 3, current: 0, zone: 'math', xpReward: 60, goldReward: 30, completed: false },
      { id: 'dq_russian', title: 'Победи 2 монстра в Зоне Русского языка', emoji: '📖', target: 2, current: 0, zone: 'russian', xpReward: 50, goldReward: 25, completed: false },
      { id: 'dq_any', title: 'Победи 1 монстра в любой зоне', emoji: '🌟', target: 1, current: 0, zone: 'math', xpReward: 40, goldReward: 20, completed: false },
    ];
    const data: DailyQuestData = { date: todayStr(), quests, bonusClaimed: false };
    saveDailyQuests(data);
    return { dailyQuests: data };
  }),

  claimDailyBonus: () => set((state) => {
    if (!state.dailyQuests || state.dailyQuests.bonusClaimed) return {};
    if (!state.dailyQuests.quests.every(q => q.completed)) return {};
    const newPlayer = {
      ...state.player,
      xp: state.player.xp + 150,
      gold: state.player.gold + 80,
    };
    const bonusItem = { id: 'health_potion_big', name: 'Большое зелье', emoji: '🧪', description: 'Восстанавливает 60 HP', type: 'potion' as const };
    const existing = state.inventory.find(i => i.id === bonusItem.id);
    const newInventory = existing
      ? state.inventory.map(i => i.id === bonusItem.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...state.inventory, { ...bonusItem, quantity: 1 }];
    const newDailyQuests = { ...state.dailyQuests, bonusClaimed: true };
    saveDailyQuests(newDailyQuests);
    saveGame(newPlayer, newInventory, state.quests, state.diagnosticDone, state.rusZoneUnlocked, state.geoZoneUnlocked);
    return { player: newPlayer, inventory: newInventory, dailyQuests: newDailyQuests };
  }),
}));
