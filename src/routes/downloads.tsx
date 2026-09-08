import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/downloads")({ component: DownloadsPage });

function DownloadsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-2xl font-medium tracking-tight">Releases</h1>
      <p className="text-sm text-muted text-pretty">
        Hector Build is the host intelligence. Spectral HX is the coding floor. Grok is Hector’s
        assistant. Windows install uses WSL. Linux install is native.
      </p>
      <section className="rounded-lg p-5 glass-window">
        <h2 className="text-lg">Hector Build</h2>
        <p className="mt-1 text-sm text-muted">Host window. Talk. Hector delegates to HX.</p>
        <a href="/downloads/hector-build.zip" className="mt-4 flex h-12 items-center justify-center rounded-md bg-accent text-sm text-accent-fg">
          Download Hector Build
        </a>
        <Link to="/" className="mt-2 flex h-11 items-center justify-center text-sm">
          Open live
        </Link>
      </section>
      <section className="rounded-lg p-5 glass-window">
        <h2 className="text-lg">Spectral HX</h2>
        <p className="mt-1 text-sm text-muted">Coding-floor window. Any chatbot.</p>
        <a href="/downloads/spectral-hx.zip" className="mt-4 flex h-12 items-center justify-center rounded-md bg-accent text-sm text-accent-fg">
          Download Spectral HX
        </a>
        <Link to="/hx" className="mt-2 flex h-11 items-center justify-center text-sm">
          Open live
        </Link>
      </section>
      <section className="rounded-lg p-5 glass-window">
        <h2 className="text-lg">Windows .exe</h2>
        <p className="mt-1 text-sm text-muted text-pretty">
          Unzip onto NTFS, then double-click HectorBuild-Setup.exe. After that use HectorBuild.exe
          and SpectralHX.exe. WSL required.
        </p>
        <a href="/downloads/HectorBuild-Setup.exe" className="mt-4 flex h-12 items-center justify-center rounded-md bg-accent text-sm text-accent-fg">
          HectorBuild-Setup.exe
        </a>
        <a href="/downloads/HectorBuild.exe" className="mt-2 flex h-11 items-center justify-center rounded-md glass-thin text-sm">
          HectorBuild.exe
        </a>
        <a href="/downloads/SpectralHX.exe" className="mt-2 flex h-11 items-center justify-center rounded-md glass-thin text-sm">
          SpectralHX.exe
        </a>
        <a href="/downloads/winamp_latest_full.exe" className="mt-2 flex h-11 items-center justify-center rounded-md glass-thin text-sm">
          Winamp (Windows)
        </a>
      </section>
      <section className="rounded-lg p-5 glass-window">
        <h2 className="text-lg">Linux</h2>
        <p className="mt-1 text-sm text-muted text-pretty">
          Unzip, then run bash packaging/linux/install.sh. Commands: hector-build and spectral-hx.
        </p>
      </section>
    </main>
  );
}
