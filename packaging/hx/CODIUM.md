# Spectral HX · VSCodium

VSCodium is the heavy editor Spectral HX launches. The desk chrome stays Spectral HX. Ghosts do not get a second IDE skin.

Install: `bash packaging/linux/install-vscodium.sh` or `bash packaging/arch/install-vscodium.sh` (Arch calls the linux installer).

Open from Spectral HX (Codium) or tell Hector “open codium”.

## Agent tools

Workspace folder: `$HECTOR_PREFIX/v01d/hx` (or `~/v01d/hx`). Tasks and terminal profiles copy here on install.

**Tasks** (Command Palette → Run Task):

- Typecheck — `npx tsc --noEmit`
- Test — `npx vitest run`
- Build — `npm run build`
- Doctor — `bash packaging/linux/doctor.sh`
- ISO profile — `bash packaging/arch/mkiso.sh`

**Terminal profiles**

- Machine Core — bash login. This is where commands run (nice -20 on the installed OS).
- Spectral HX — plain bash for the editor’s own jobs.

Diplomat Core never emits a shell. Agents pick Machine Core.

Downloads: https://www.doomchat.ca/downloads/
