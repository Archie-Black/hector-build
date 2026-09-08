// Hector Build + Spectral HX — Windows .exe (no .bat required).
// Cross-compiled: GOOS=windows GOARCH=amd64
package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

func main() {
	name := strings.ToLower(filepath.Base(os.Args[0]))
	switch {
	case strings.Contains(name, "uninstall"):
		runUninstall()
	case strings.Contains(name, "setup") || strings.Contains(name, "install"):
		runSetup()
	case strings.Contains(name, "spectral") || strings.Contains(name, "hx"):
		runLaunch("spectral-hx")
	default:
		runLaunch("hector-build")
	}
}

func runSetup() {
	exe, err := os.Executable()
	if err != nil {
		alert("Hector Build", "Could not locate this installer.")
		return
	}
	ps1 := filepath.Join(filepath.Dir(exe), "install.ps1")
	if _, err := os.Stat(ps1); err != nil {
		alert("Hector Build", "Unzip the full app first. Keep HectorBuild-Setup.exe next to install.ps1.")
		return
	}
	if wslPath() == "" {
		alert("Hector Build", "WSL is missing.\n\nOpen PowerShell as Administrator and run:\n\n    wsl --install\n\nReboot, open Ubuntu once, then run this Setup again.")
		return
	}
	cmd := exec.Command("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1)
	cmd.Dir = filepath.Dir(exe)
	if err := cmd.Run(); err != nil {
		alert("Hector Build", "Install failed.\n\n"+err.Error()+"\n\nIf WSL is new, open Ubuntu once, then run Setup again.")
		return
	}
	copyLaunchers(filepath.Dir(exe))
	alert("Hector Build", "Installed.\n\nUse HectorBuild.exe and SpectralHX.exe on the Desktop or Start Menu.")
}

func runUninstall() {
	exe, err := os.Executable()
	if err != nil {
		return
	}
	ps1 := filepath.Join(filepath.Dir(exe), "uninstall.ps1")
	if _, err := os.Stat(ps1); err != nil {
		alert("Hector Build", "uninstall.ps1 not found next to this exe.")
		return
	}
	cmd := exec.Command("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1)
	cmd.Dir = filepath.Dir(exe)
	_ = cmd.Run()
	alert("Hector Build", "Uninstall finished.")
}

func runLaunch(bin string) {
	wsl := wslPath()
	if wsl == "" {
		alert("Hector Build", "WSL is missing. Run HectorBuild-Setup.exe first.\n\nOr as Administrator: wsl --install")
		return
	}
	script := "export PATH=$HOME/.local/bin:$PATH; export NVM_DIR=$HOME/.nvm; [ -s $NVM_DIR/nvm.sh ] && . $NVM_DIR/nvm.sh; command -v " + bin + " >/dev/null || { echo missing; exit 42; }; exec " + bin
	cmd := exec.Command(wsl, "-e", "bash", "-lc", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	err := cmd.Start()
	if err != nil {
		alert("Hector Build", "Could not start WSL.\n\n"+err.Error())
		return
	}
	_ = cmd.Wait()
	if cmd.ProcessState != nil && cmd.ProcessState.ExitCode() == 42 {
		alert("Hector Build", "Not installed yet. Run HectorBuild-Setup.exe from the unzipped folder.")
	}
}

func copyLaunchers(srcDir string) {
	self, err := os.Executable()
	if err != nil {
		return
	}
	data, err := os.ReadFile(self)
	if err != nil {
		return
	}
	home, _ := os.UserHomeDir()
	desk := filepath.Join(home, "Desktop")
	start := filepath.Join(os.Getenv("APPDATA"), `Microsoft\Windows\Start Menu\Programs\Hector Build`)
	local := filepath.Join(os.Getenv("LOCALAPPDATA"), "HectorBuild")
	_ = os.MkdirAll(start, 0755)
	_ = os.MkdirAll(local, 0755)
	for _, dir := range []string{srcDir, desk, start, local} {
		_ = os.WriteFile(filepath.Join(dir, "HectorBuild.exe"), data, 0755)
		_ = os.WriteFile(filepath.Join(dir, "SpectralHX.exe"), data, 0755)
	}
}

func wslPath() string {
	root := os.Getenv("SystemRoot")
	if root == "" {
		root = `C:\Windows`
	}
	p := filepath.Join(root, "System32", "wsl.exe")
	if _, err := os.Stat(p); err == nil {
		return p
	}
	if _, err := exec.LookPath("wsl.exe"); err == nil {
		return "wsl.exe"
	}
	return ""
}

func alert(title, text string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	proc := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(title)
	b, _ := syscall.UTF16PtrFromString(text)
	_, _, _ = proc.Call(0, uintptr(unsafe.Pointer(b)), uintptr(unsafe.Pointer(t)), 0x40)
}
