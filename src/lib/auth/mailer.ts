import { createServerFn } from "@tanstack/react-start";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type Payload = { email: string; code: string; token: string; origin: string };

export const sendVerifyMail = createServerFn({ method: "POST" })
  .validator((p: Payload) => p)
  .handler(async ({ data }) => {
    const origin = data.origin.replace(/\/$/, "");
    const link = `${origin}/verify?t=${encodeURIComponent(data.token)}`;
    const body = `Verify Hector Build\n\nCode: ${data.code}\nLink: ${link}\n`;
    const dir = join(process.cwd(), "data/mail");
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, "outbox.jsonl"), JSON.stringify({ to: data.email, at: Date.now(), link }) + "\n");
    const key = process.env.RESEND_API_KEY?.trim();
    if (key) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.MAIL_FROM?.trim() || "Hector Build <noreply@doomchat.ca>",
          to: [data.email],
          subject: "Verify your Hector Build account",
          text: body,
        }),
      });
      return { sent: res.ok, link };
    }
    return { sent: false, link };
  });
