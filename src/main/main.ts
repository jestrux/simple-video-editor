import { app, BrowserWindow, ipcMain, Notification, shell, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { cutVideo } from './services/ffmpeg-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let pendingUrl: string | null = null;

// Determine if we're in development mode
const isDev = process.env['ELECTRON_RENDERER_URL'] !== undefined;

// Set as default protocol client for veelo:// (only in production)
if (!isDev) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('veelo', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('veelo');
  }
  console.log('[Deep Link] Protocol client registered for veelo://');
} else {
  console.log('[Deep Link] Skipping protocol registration in development mode');
}

// Handle deep link URL
function handleDeepLink(url: string) {
  console.log('[Deep Link] Processing URL:', url);

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'veelo:') {
      console.warn('[Deep Link] Invalid protocol:', parsedUrl.protocol);
      return;
    }

    // Parse veelo://file?path=...
    if (parsedUrl.hostname === 'file' || parsedUrl.pathname.startsWith('//file')) {
      const params = new URLSearchParams(parsedUrl.search);
      const filePath = params.get('path');

      if (filePath && fs.existsSync(filePath)) {
        console.log('[Deep Link] Opening file:', filePath);

        if (mainWindow) {
          // Focus window and send file
          mainWindow.focus();
          mainWindow.webContents.send('open-file-from-link', filePath);
        } else {
          // Store for later when window is ready
          pendingUrl = filePath;
        }
      } else {
        console.warn('[Deep Link] File not found:', filePath);
      }
    }
  } catch (error) {
    console.error('[Deep Link] Error parsing URL:', error);
  }
}

// State persistence
const STATE_FILE = path.join(app.getPath('userData'), 'app-state.json');

interface AppState {
  videoFile?: {
    path: string;
    name: string;
    duration: number;
  };
  trimSettings?: {
    startTime: number;
    endTime: number;
  };
}

function loadState(): AppState | null {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Main] Error loading state:', error);
  }
  return null;
}

function saveState(state: AppState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Main] Error saving state:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff'
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          process.env['ELECTRON_RENDERER_URL']
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* data: blob: local-video:; img-src 'self' data: local-video: blob:; media-src 'self' local-video: data: blob:;"
            : "default-src 'self' local-video:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: local-video: blob:; media-src 'self' local-video: data: blob:;"
        ]
      }
    });
  });

  // Load the app
  // In electron-vite, ELECTRON_RENDERER_URL is set in dev mode
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Send initial state when ready
  mainWindow.webContents.on('did-finish-load', () => {
    const state = loadState();
    if (state) {
      mainWindow?.webContents.send('restore-state', state);
    }

    // Send pending deep link if any
    if (pendingUrl) {
      console.log('[Deep Link] Sending pending file:', pendingUrl);
      mainWindow?.webContents.send('open-file-from-link', pendingUrl);
      pendingUrl = null;
    }
  });
}

// Set ffmpeg path
function setupFfmpeg() {
  // Try to find ffmpeg in common locations
  const possiblePaths = [
    '/opt/homebrew/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
    'ffmpeg' // Will use PATH
  ];

  for (const ffmpegPath of possiblePaths) {
    try {
      if (ffmpegPath === 'ffmpeg' || fs.existsSync(ffmpegPath)) {
        ffmpeg.setFfmpegPath(ffmpegPath);
        console.log('[FFmpeg] Using ffmpeg at:', ffmpegPath);
        return;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  console.warn('[FFmpeg] ffmpeg not found in common locations, will try system PATH');
}

// Handle single instance lock (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle deep links when app is already running (Windows/Linux) - only in production
  if (!isDev) {
    app.on('second-instance', (_event, commandLine) => {
      // Someone tried to run a second instance, focus our window
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }

      // Process deep link from command line
      const url = commandLine.find((arg) => arg.startsWith('veelo://'));
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links on macOS
    app.on('open-url', (event, url) => {
      event.preventDefault();
      handleDeepLink(url);
    });
  }

  // Register custom protocol to serve local video files
  app.whenReady().then(() => {
    // Setup ffmpeg
    setupFfmpeg();

    // Register protocol to serve local files
    protocol.registerFileProtocol('local-video', (request, callback) => {
      const url = request.url.replace('local-video://', '');
      const filePath = decodeURIComponent(url);
      callback({ path: filePath });
    });

    createWindow();

    // Check for deep link in command line args (Windows/Linux on first launch) - only in production
    if (!isDev) {
      const url = process.argv.find((arg) => arg.startsWith('veelo://'));
      if (url) {
        handleDeepLink(url);
      }
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.on('log', (_event, content: string) => {
  console.log('[Renderer]:', content);
});

ipcMain.on('save-state', (_event, state: AppState) => {
  console.log('[Main] Saving state:', state);
  saveState(state);
});

ipcMain.handle('get-file-path', async (_event, filePath: string) => {
  // In Electron, File objects from input elements have a path property
  // This handler just returns the path as-is, but validates it exists
  return filePath;
});

ipcMain.on('cut-video', async (_event, filePath: string, startTime: string, duration: string) => {
  if (!mainWindow) return;

  try {
    await cutVideo(
      filePath,
      startTime,
      duration,
      (percent: number) => {
        mainWindow?.webContents.send('cut-progress', percent);
      },
      (outputPath: string) => {
        mainWindow?.webContents.send('cut-done', outputPath);

        // Show success notification
        const notification = new Notification({
          title: 'Video Successfully Cut',
          body: 'Click to preview your video'
        });

        notification.on('click', () => {
          shell.showItemInFolder(outputPath);
        });

        notification.show();
      },
      (error: Error) => {
        mainWindow?.webContents.send('cut-error', error.message);

        // Show error notification
        const notification = new Notification({
          title: 'Failed to Cut Video',
          body: error.message
        });

        notification.show();
      }
    );
  } catch (error) {
    console.error('Error cutting video:', error);
    mainWindow?.webContents.send('cut-error', (error as Error).message);
  }
});
