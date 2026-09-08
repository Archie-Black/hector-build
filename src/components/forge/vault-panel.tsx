import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { createVault, recoverVault, unlockVault, vaultExists } from "@/lib/security/vault";

export function VaultPanel() {
  const [has, setHas] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpSvg, setOtpSvg] = useState("");
  const [recSvg, setRecSvg] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"setup" | "unlock" | "recover">("setup");

  useEffect(() => {
    setHas(vaultExists());
    if (vaultExists()) setMode("unlock");
  }, []);

  async function qr(text: string) {
    return QRCode.toString(text, {
      type: "svg",
      margin: 1,
      color: { dark: "#6ea8ff", light: "#00000000" },
    });
  }

  return (
    <div>
      <p className="text-xs tracking-[0.14em] text-subtle uppercase">Geometric vault</p>
      <p className="mt-2 text-sm text-muted text-pretty">
        Password plus authenticator. Recovery QR for your phone if the password is lost. Hybrid
        post-quantum wrap: ML-KEM-768 (Module-LWE) plus AES-256. Geometry holds the ciphertext.
        Hardness is the lattice, not a slogan.
      </p>
      {mode === "setup" && !has ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void createVault(password).then(async (v) => {
              setCodes(v.recovery);
              setOtpSvg(await qr(v.otpauth));
              setRecSvg(await qr(v.recoveryPayload));
              setHas(true);
              setMsg("Scan both. Store the codes.");
            });
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Vault password"
            className="h-11 rounded-md bg-inset px-3 text-sm"
          />
          <Button type="submit">Create vault</Button>
        </form>
      ) : null}
      {otpSvg ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-subtle">Authenticator</p>
            <div className="mt-1 max-w-[12rem]" dangerouslySetInnerHTML={{ __html: otpSvg }} />
          </div>
          <div>
            <p className="text-xs text-subtle">Phone recovery</p>
            <div className="mt-1 max-w-[12rem]" dangerouslySetInnerHTML={{ __html: recSvg }} />
          </div>
        </div>
      ) : null}
      {codes.length ? (
        <p className="mt-2 font-mono text-xs text-muted">{codes.join("  ")}</p>
      ) : null}
      {has && mode === "unlock" ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void unlockVault(password, code)
              .then(() => setMsg("Vault open."))
              .catch((err: Error) => setMsg(err.message));
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-11 rounded-md bg-inset px-3 text-sm"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="h-11 rounded-md bg-inset px-3 text-sm"
            inputMode="numeric"
          />
          <Button type="submit">Unlock</Button>
          <button type="button" className="text-xs text-muted" onClick={() => setMode("recover")}>
            Lost password — use recovery QR
          </button>
        </form>
      ) : null}
      {mode === "recover" ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void recoverVault(password, code)
              .then(() => setMsg("Recovered."))
              .catch((err: Error) => setMsg(err.message));
          }}
        >
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Recovery key from QR (RK=)"
            className="h-11 rounded-md bg-inset px-3 text-sm"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Authenticator or recovery code"
            className="h-11 rounded-md bg-inset px-3 text-sm"
          />
          <Button type="submit">Recover</Button>
        </form>
      ) : null}
      {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
    </div>
  );
}
