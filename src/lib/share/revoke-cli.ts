#!/usr/bin/env node
import { autoRevoke } from "./keys.ts";

const r = autoRevoke();
process.stdout.write(`${JSON.stringify({ object: "hector.keys.revoke", ...r })}\n`);
