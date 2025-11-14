import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Loading preload script...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to main process
  log: (content: string) => ipcRenderer.send('log', content),

  cutVideo: (filePath: string, startTime: string, duration: string) => {
    ipcRenderer.send('cut-video', filePath, startTime, duration);
  },

  // State persistence
  saveState: (state: any) => {
    ipcRenderer.send('save-state', state);
  },

  onRestoreState: (callback: (state: any) => void) => {
    ipcRenderer.on('restore-state', (_event, state) => callback(state));
  },

  // Deep link handling
  onOpenFileFromLink: (callback: (filePath: string) => void) => {
    ipcRenderer.on('open-file-from-link', (_event, filePath) => callback(filePath));
  },

  // Listen for messages from main process
  onCutProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('cut-progress', (_event, percent) => callback(percent));
  },

  onCutDone: (callback: (outputPath: string) => void) => {
    ipcRenderer.on('cut-done', (_event, outputPath) => callback(outputPath));
  },

  onCutError: (callback: (error: string) => void) => {
    ipcRenderer.on('cut-error', (_event, error) => callback(error));
  },

  // Remove listeners (for cleanup)
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

console.log('[Preload] Electron API exposed successfully!');
