import type { Priority, Recurrence } from '@/types';

/**
 * すばやく追加の入力を解析する。
 * 例:「資料作成 明日15時 #仕事 !高」→ タイトル「資料作成」、期限 明日 15:00、タグ「仕事」、優先度 高
 *
 * - 空白（全角を含む）で区切った語のうち、日付・時刻・#タグ・!優先度 として読めるものを取り出し、残りをタイトルにする
 * - 日付: 今日 / 明日 / 明後日 / 来週（次の月曜日）/ 月曜〜日曜（今日を含む次のその曜日）/ 11/25・2026/11/25・11-25
 * - 時刻: 15時 / 15時30分 / 15時半 / 午後3時 / 15:30（「明日15時」のように日付に続けて書いてもよい）
 * - 日付だけのときは 23:59、時刻だけのときは今日（その時刻を過ぎていれば明日）にする
 * - #タグ: 既存のタグ名と一致すればそれを使い、なければ新しいタグとして扱う
 * - 優先度: !高 / !中 / !低
 * - 繰り返し: 毎日 / 平日 / 毎週 / 毎月 / 毎年 / 毎週月曜（日付が無ければ今日、毎週◯曜ならその曜日を期限にする）
 */
export interface QuickAddResult {
    title: string;
    /** 「2026-11-20T15:00」の形式（datetime-local と同じ）。指定がなければ null */
    dueDate: string | null;
    priority: Priority | null;
    /** #タグの名前。指定がなければ null */
    tagName: string | null;
    recurrence: Recurrence | null;
}

const PRIORITY_WORDS: Record<string, Priority> = {
    高: 'high',
    中: 'medium',
    低: 'low',
};

const RECURRENCE_WORDS: Record<string, Recurrence> = {
    毎日: 'daily',
    平日: 'weekdays',
    毎週: 'weekly',
    毎月: 'monthly',
    毎年: 'yearly',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const DATE_PATTERN =
    '(今日|きょう|明日|あした|明後日|あさって|来週|[月火水木金土日]曜日?|(?:\\d{4}[/-])?\\d{1,2}[/-]\\d{1,2})';
const TIME_PATTERN =
    '((?:午前|午後)?\\d{1,2}時(?:\\d{1,2}分|半)?|\\d{1,2}:\\d{2})';
const DATE_TIME_RE = new RegExp(`^${DATE_PATTERN}?${TIME_PATTERN}?$`);

/** 全角の英数字・記号を半角にする */
const toHalfWidth = (s: string) =>
    s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

const pad = (n: number) => String(n).padStart(2, '0');

const formatLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 日付の語を、その日の 0 時の Date にする。読めなければ null */
const parseDate = (word: string, now: Date): Date | null => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plus = (days: number) =>
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);

    if (word === '今日' || word === 'きょう') return today;
    if (word === '明日' || word === 'あした') return plus(1);
    if (word === '明後日' || word === 'あさって') return plus(2);
    if (word === '来週') return plus((8 - today.getDay()) % 7 || 7);

    const weekday = word.match(/^([月火水木金土日])曜日?$/);
    if (weekday) {
        const target = WEEKDAYS.indexOf(weekday[1]);
        return plus((target - today.getDay() + 7) % 7);
    }

    const md = word.match(/^(?:(\d{4})[/-])?(\d{1,2})[/-](\d{1,2})$/);
    if (md) {
        const month = Number(md[2]) - 1;
        const day = Number(md[3]);
        let year = md[1] ? Number(md[1]) : today.getFullYear();
        let date = new Date(year, month, day);
        // 年を省略して過去の日付になる場合は来年とみなす
        if (!md[1] && date < today) {
            year += 1;
            date = new Date(year, month, day);
        }
        // 2/30 のような存在しない日付は読まない
        if (date.getMonth() !== month || date.getDate() !== day) return null;
        return date;
    }
    return null;
};

/** 時刻の語を [時, 分] にする。読めなければ null */
const parseTime = (word: string): [number, number] | null => {
    const colon = word.match(/^(\d{1,2}):(\d{2})$/);
    const ja = word.match(/^(午前|午後)?(\d{1,2})時(?:(\d{1,2})分|(半))?$/);
    let hour: number;
    let minute: number;
    if (colon) {
        hour = Number(colon[1]);
        minute = Number(colon[2]);
    } else if (ja) {
        hour = Number(ja[2]);
        minute = ja[4] ? 30 : Number(ja[3] ?? 0);
        if (ja[1] === '午後' && hour < 12) hour += 12;
        if (ja[1] === '午前' && hour === 12) hour = 0;
    } else {
        return null;
    }
    if (hour > 23 || minute > 59) return null;
    return [hour, minute];
};

export function parseQuickAdd(
    input: string,
    now: Date = new Date(),
): QuickAddResult {
    const titleWords: string[] = [];
    let date: Date | null = null;
    let time: [number, number] | null = null;
    let priority: Priority | null = null;
    let tagName: string | null = null;
    let recurrence: Recurrence | null = null;

    for (const raw of input.trim().split(/[\s　]+/)) {
        if (raw === '') continue;
        const word = toHalfWidth(raw);

        // !高 / !中 / !低
        const p = word.match(/^!([高中低])$/);
        if (p && !priority) {
            priority = PRIORITY_WORDS[p[1]];
            continue;
        }

        // #タグ（タグ名は全角のまま使う）
        if (/^#./.test(word) && !tagName) {
            tagName = raw.slice(1);
            continue;
        }

        // 繰り返し（毎週月曜 のように曜日を続けてもよい）
        const r = word.match(
            /^(毎日|平日|毎週|毎月|毎年)(?:([月火水木金土日])曜日?)?$/,
        );
        if (r && !recurrence && (!r[2] || (r[1] === '毎週' && !date))) {
            recurrence = RECURRENCE_WORDS[r[1]];
            if (r[2]) date = parseDate(`${r[2]}曜`, now);
            continue;
        }

        // 日付・時刻（同じ種類を 2 回書いた場合は、2 回目以降をタイトルとして扱う）
        const dt = word.match(DATE_TIME_RE);
        if (dt && (dt[1] || dt[2])) {
            const d = dt[1] ? parseDate(dt[1], now) : null;
            const t = dt[2] ? parseTime(dt[2]) : null;
            const readable = (!dt[1] || d) && (!dt[2] || t);
            const duplicated = (d && date) || (t && time);
            if (readable && !duplicated) {
                if (d) date = d;
                if (t) time = t;
                continue;
            }
        }

        titleWords.push(raw);
    }

    // 繰り返しで日付も時刻も無いときは、今日（平日の繰り返しで今日が土日なら次の月曜）にする
    if (recurrence && !date && !time) {
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const day = today.getDay();
        if (recurrence === 'weekdays' && (day === 0 || day === 6)) {
            today.setDate(today.getDate() + (day === 6 ? 2 : 1));
        }
        date = today;
    }

    let dueDate: string | null = null;
    if (date || time) {
        const due = date
            ? new Date(date)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (time) {
            due.setHours(time[0], time[1]);
            // 時刻だけで、すでに過ぎているときは明日にする
            if (!date && due < now) due.setDate(due.getDate() + 1);
        } else {
            due.setHours(23, 59);
        }
        dueDate = formatLocal(due);
    }

    return {
        title: titleWords.join(' '),
        dueDate,
        priority,
        tagName,
        recurrence,
    };
}
