import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { modelScore, pickPair } from "./rank.ts";
import { ollamaOrigins, safeOllamaOrigin, vllmOrigins } from "./home.ts";

describe("home ollama", () => {
  it("ranks coder size over a tiny chat model", () => {
    const pair = pickPair(["llama3.2:3b", "qwen2.5-coder:32b", "nomic-embed-text"]);
    assert.ok(pair);
    assert.equal(pair.best, "qwen2.5-coder:32b");
    assert.ok(modelScore("qwen2.5-coder:14b") > modelScore("llama3.2:3b"));
  });

  it("prefers Qwen2.5-Coder and DeepSeek-Coder-V2-Lite, 7B as scout", () => {
    const pair = pickPair(["llama3.2:3b", "qwen2.5-coder:7b", "qwen2.5-coder:14b", "deepseek-coder-v2:16b-lite-instruct"]);
    assert.ok(pair);
    assert.equal(pair.best, "qwen2.5-coder:14b");
    assert.equal(pair.fast, "qwen2.5-coder:7b");
    assert.ok(modelScore("deepseek-coder-v2:16b-lite-instruct") > modelScore("llama3.2:3b"));
    assert.ok(modelScore("Qwen/Qwen2.5-Coder-7B-Instruct") > 50);
  });

  it("allows LAN and doomchat https, blocks link-local", () => {
    assert.equal(safeOllamaOrigin("http://192.168.1.10:11434"), "http://192.168.1.10:11434");
    assert.equal(safeOllamaOrigin("https://ollama.doomchat.ca"), "https://ollama.doomchat.ca");
    assert.equal(safeOllamaOrigin("http://169.254.1.1:11434"), null);
    assert.ok(safeOllamaOrigin("http://127.0.0.1:11434"));
    assert.ok(vllmOrigins().includes("http://127.0.0.1:8000"));
    assert.ok(ollamaOrigins().includes("http://127.0.0.1:11434"));
  });
});
