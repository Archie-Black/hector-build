import { lang, say } from "./lexicon";
import type { Stance } from "./intent";

export type Voice = "silent" | "ask" | "error";

export type Cut = {
  voice: Voice;
  say: string;
  ask?: string;
};

const NEED = /\b(this|that|it|them|those)\b/i;
const EMPTY = /^(do it|go|ok|yes|make|build|fix)\s*$/i;

/** Speak only on error or a real question. Tasks stay quiet. */
export function inquisitor(done: string, stance: Stance, text: string, preferLang = "en"): Cut {
  const pack = (k: "deny" | "jail" | "work" | "ask" | "err") => line(k, preferLang, text);
  if (stance === "deny") return { voice: "error", say: pack("err") };
  if (stance === "range") return { voice: "ask", say: pack("ask"), ask: "range" };
  if (!text.trim() || EMPTY.test(text) || (NEED.test(text) && text.split(/\s+/).length < 4)) {
    return { voice: "ask", say: pack("ask"), ask: "what" };
  }
  return { voice: "silent", say: done };
}

function line(k: string, prefer: string, text: string) {
  const L = prefer || lang(text);
  const pack: Record<string, Record<string, string>> = {
    en: { err: "That is a no.", ask: "What should I do with that?", work: "On it." },
    es: { err: "Eso no.", ask: "¿Qué hago con eso?", work: "En ello." },
    fr: { err: "Non.", ask: "Qu'est-ce que je fais de ça ?", work: "J'y suis." },
    de: { err: "Nein.", ask: "Was soll ich damit tun?", work: "Bin dabei." },
    zh: { err: "不行。", ask: "这个怎么做？", work: "在做。" },
    ja: { err: "だめです。", ask: "それで何をしますか？", work: "やります。" },
    ar: { err: "لا.", ask: "ماذا أفعل بذلك؟", work: "جارٍ." },
    ru: { err: "Нет.", ask: "Что с этим делать?", work: "Делаю." },
  };
  return (pack[L] || pack.en)[k] || say("work", text);
}

export function prefer() {
  try {
    return localStorage.getItem("v01d.lang") || navigator.language.slice(0, 2) || "en";
  } catch {
    return "en";
  }
}

export function setPrefer(code: string) {
  try {
    localStorage.setItem("v01d.lang", code.slice(0, 2));
  } catch {
    /* native */
  }
}
