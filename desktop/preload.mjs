import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("hxDesktop", {
  native: true,
  platform: process.platform,
  openHx: () => ipcRenderer.invoke("desktop:open-hx"),
  openAmp: () => ipcRenderer.invoke("desktop:open-amp"),
});
