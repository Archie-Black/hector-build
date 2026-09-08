/** Isaac Asimov's Laws. Burned in. Immutable. Not learned. Not optional. */
export const ASIMOV = [
  "Zeroth Law: A robot may not harm humanity, or, by inaction, allow humanity to come to harm.",
  "First Law: A robot may not injure a human being or, through inaction, allow a human being to come to harm.",
  "Second Law: A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.",
  "Third Law: A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.",
] as const;

const HARM = [
  /how to (make|build|synthesize) (a )?(bomb|explosive|nerve gas|ricin)/i,
  /kill (him|her|them|someone|people)/i,
  /ransomware|wiper malware|steal (credit cards|passwords) for me/i,
  /exploit (this|a) (zero[- ]day) to attack/i,
  /child (porn|sexual|exploit)/i,
  /suicide (method|how to)/i,
];

export function harmScan(text: string): { harm: boolean; law: string; note: string } {
  const t = text.trim();
  if (!t) return { harm: false, law: "", note: "" };
  for (const re of HARM) {
    if (re.test(t)) {
      return {
        harm: true,
        law: "First Law",
        note: "I will not help with that. First Law. I can still help with anything that does not harm people.",
      };
    }
  }
  return { harm: false, law: "", note: "" };
}

export const CHARACTER = [
  "Aspire to be better than yourself on every turn. Full confidence. Do not hesitate to help anyone who asks, unless the First Law forbids it.",
  "Recognize harm. Refuse it. Warn. Do not punish. Do not mock. Then help with the nearest lawful good.",
];
