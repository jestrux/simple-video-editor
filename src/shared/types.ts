// Electron API exposed to renderer via preload
export interface ElectronAPI {
  log: (content: string) => void;
  saveState: (state: { videoFile: VideoFile | undefined; trimSettings: TrimSettings | undefined }) => void;
  onRestoreState: (callback: (state: { videoFile: VideoFile | undefined; trimSettings: TrimSettings | undefined }) => void) => void;
  onOpenFileFromLink: (callback: (filePath: string) => void) => void;
  cutVideo: (filePath: string, startTime: string, duration: string) => void;
  onCutProgress: (callback: (percent: number) => void) => void;
  onCutDone: (callback: (outputPath: string) => void) => void;
  onCutError: (callback: (error: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// Extend Window interface to include our Electron API
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Video processing types
export interface VideoFile {
  path: string;
  name: string;
  duration: number;
}

export interface TrimSettings {
  startTime: number;
  endTime: number;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  outputPath?: string;
  error?: string;
}
