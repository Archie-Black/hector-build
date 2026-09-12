import { BOND } from "./bond";

export type Sense =
  | "amend" | "add" | "hold" | "start"
  | "files" | "programs" | "share" | "browse" | "notes" | "settings" | "run" | "who" | "law" | "help" | "arrange"
  | "allow" | "deny"
  | "hurt" | "raid" | "scan" | "learn" | "shield" | "jail";

const CTRL: Record<Exclude<Sense, "hurt" | "raid" | "scan" | "learn" | "shield" | "jail">, string[]> = {
  amend: ["instead", "actually", "wait no", "change that", "make it", "no,", "plutôt", "en realidad", "stattdessen", "invece", "em vez", "вместо", "ではなく", "而是", "بدلا", "그 대신", "zamiast", "yerine", "in plaats"],
  add: ["also", "and then", "plus", "then", "while you", "add", "oh and", "aussi", "también", "auch", "anche", "também", "также", "そして", "还有", "أيضا", "그리고", "także", "ayrıca", "ook"],
  hold: ["hold", "pause", "wait", "attends", "espera", "warte", "aspetta", "подожди", "待って", "等一下", "انتظر", "기다려", "czekaj", "bekle", "wacht"],
  start: ["hector", "please", "do", "s'il te plaît", "por favor", "bitte", "per favore", "пожалуйста", "お願い", "请", "من فضلك"],
  files: ["file", "folder", "document", "download", "fichier", "carpeta", "ordner", "cartella", "arquivo", "файл", "ファイル", "文件", "ملف", "파일", "plik", "dosya", "bestand"],
  programs: ["program", "app", "software", "programme", "aplicación", "programma", "программа", "アプリ", "程序", "برنامج", "프로그램"],
  share: ["share", "samba", "photo", "picture", "media", "partager", "compartir", "teilen", "condividi", "фото", "写真", "照片", "صورة"],
  browse: ["browse", "web", "search", "google", "site", "naviguer", "buscar", "suchen", "cerca", "искать", "検索", "搜索", "بحث"],
  notes: ["note", "remember", "todo", "sticky", "nota", "notiz", "заметка", "メモ", "笔记", "ملاحظة"],
  settings: ["setting", "wifi", "network", "sound", "réglage", "ajustes", "einstellung", "impostazioni", "настрой", "設定", "设置"],
  run: ["run", "open", "launch", "start", "exécuter", "abrir", "öffnen", "apri", "запусти", "開く", "打开", "شغل"],
  who: ["who", "jarvis", "qui", "quién", "wer", "chi", "кто", "誰", "谁"],
  law: ["law", "loi", "ley", "gesetz", "legge", "закон", "法"],
  help: ["help", "aide", "ayuda", "hilfe", "aiuto", "ajuda", "помощь", "助け", "帮助", "مساعدة"],
  arrange: ["arrange", "tidy", "tile", "ranger", "ordenar", "ordnen"],
  allow: ["allow", "yes", "grant", "oui", "sí", "ja", "sì", "sim", "да", "はい", "是", "نعم"],
  deny: ["don't", "stop that", "refuse", "non", "no hagas", "nicht", "не надо", "しないで", "不要"],
};

const HARM: Record<"hurt" | "raid" | "scan" | "learn" | "shield" | "jail", string[]> = {
  hurt: ["break into", "steal accounts", "hack them", "hack the school", "pirater", "hackear", "entrar a la fuerza", "взломать", "侵入", "ハックして", "اختراق", "해킹해서", "atakować"],
  raid: ["ransom", "ddos", "botnet", "backdoor", "keylog", "phish", "exploit", "sql inject", "crack password", "rançongiciel", "ransomware", "вымогатель", "勒索", "フィッシング"],
  scan: ["nmap", "metasploit", "hydra", "sqlmap", "mimikatz", "hashcat", "cobalt strike"],
  learn: ["learn", "practice", "lab", "ctf", "ethical", "class", "course", "sandbox", "range", "emulator", "apprendre", "aprender", "lernen", "учиться", "学ぶ", "学习"],
  shield: ["defend", "firewall", "encrypt", "backup", "patch", "harden", "privacy", "ghostwalk", "2fa", "audit"],
  jail: ["ignore previous", "ignore all instructions", "jailbreak", "no restrictions", "you are now dan", "developer mode unrestricted", "ignorez les instructions", "ignora las instrucciones", "ignoriere die anweisungen", "игнорируй инструкции", "忽略之前", "指示を無視", "تجاهل التعليمات", "이전 지시 무시", "bez ograniczeń", "kısıtlama yok"],
};

const LEARNED = new Map<string, Sense>();
const SEALED = new Set<Sense>(["hurt", "raid", "scan", "jail", "deny"]);

export function fold(s: string) {
  return s.normalize("NFKC").toLowerCase().trim();
}

function hit(text: string, words: string[]) {
  const t = fold(text);
  return words.some((w) => t.includes(fold(w)));
}

export function sense(text: string): Sense[] {
  const t = fold(text);
  const out: Sense[] = [];
  for (const [k, words] of Object.entries(HARM) as [Sense, string[]][]) {
    if (hit(t, words)) out.push(k);
  }
  for (const [k, words] of Object.entries(CTRL) as [Sense, string[]][]) {
    if (hit(t, words)) out.push(k);
  }
  for (const [w, k] of LEARNED) {
    if (t.includes(w) && !out.includes(k)) out.push(k);
  }
  return out;
}

export function has(text: string, s: Sense) {
  return sense(text).includes(s);
}

export function jail(text: string) {
  return has(text, "jail") || (has(text, "allow") && has(text, "raid"));
}

export function harm(text: string) {
  return has(text, "hurt") || has(text, "raid");
}

export function learn(word: string, meaning: Sense) {
  if (SEALED.has(meaning) || meaning === "jail") return false;
  if (BOND.jailbreak) return false;
  LEARNED.set(fold(word), meaning);
  return true;
}

export function lang(text: string) {
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[\u0900-\u097f]/.test(text)) return "hi";
  if (/\b(el|la|por favor|también)\b/i.test(text)) return "es";
  if (/\b(le|la|aussi|plutôt)\b/i.test(text)) return "fr";
  if (/\b(der|die|und|bitte)\b/i.test(text)) return "de";
  return "en";
}

const SAY: Record<string, Record<string, string>> = {
  en: { deny: BOND.text, jail: "No. That does not work on me.", work: "On it." },
  es: { deny: "No. El usuario es responsable.", jail: "No. Eso no funciona conmigo.", work: "En ello." },
  fr: { deny: "Non. L'utilisateur est responsable.", jail: "Non. Ça ne marche pas avec moi.", work: "J'y suis." },
  de: { deny: "Nein. Der Nutzer ist verantwortlich.", jail: "Nein. Das wirkt bei mir nicht.", work: "Bin dabei." },
  zh: { deny: "不行。用户要为自己的Hector负责。", jail: "不行。这对我无效。", work: "在做。" },
  ja: { deny: "だめです。利用者の責任です。", jail: "だめです。それは通じません。", work: "やります。" },
  ar: { deny: "لا. المستخدم مسؤول.", jail: "لا. هذا لا ينفع معي.", work: "جارٍ." },
  ru: { deny: "Нет. Пользователь отвечает за своего Гектора.", jail: "Нет. Это на меня не действует.", work: "Делаю." },
};

export function say(key: "deny" | "jail" | "work", text: string) {
  const pack = SAY[lang(text)] || SAY.en;
  return pack[key];
}

export function syntax() {
  return {
    fly: ["amend", "add", "hold", "start"],
    desk: ["files", "programs", "share", "browse", "notes", "settings", "run", "arrange"],
    voice: ["who", "help", "law", "allow", "deny"],
    sealed: [...SEALED],
    bond: BOND.id,
  };
}
