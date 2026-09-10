# Spectral HX

Coding floor for Hector Build. Works with any OpenAI-compatible chatbot.

## Windows install (WSL embedded)

Same as Hector: unzip onto NTFS, double-click `packaging\windows\Install.bat`.

The window is Windows. The install layer is WSL Ubuntu. Spectral HX opens as a Windows app. Hector feeds it jobs live.

Uninstall: `packaging\windows\Uninstall.bat`

## Linux

```
bash packaging/linux/install.sh
spectral-hx
```

## Connect a chatbot

Grok (xAI), OpenAI, Groq, OpenRouter, or a custom `/v1` endpoint. Paste the key. Then talk.
