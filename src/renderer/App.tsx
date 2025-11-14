import { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import type { VideoFile, TrimSettings, ProcessingStatus } from '@shared/types';
import VideoDropZone from './components/VideoDropZone';
import VideoPlayer from './components/VideoPlayer';
import TimelineControls from './components/TimelineControls';

// Context type
interface AppContextType {
  videoFile: VideoFile | null;
  setVideoFile: (file: VideoFile | null) => void;
  trimSettings: TrimSettings;
  setTrimSettings: (settings: TrimSettings) => void;
  processingStatus: ProcessingStatus;
  setProcessingStatus: (status: ProcessingStatus) => void;
  handleCutVideo: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isLooping: boolean;
  setIsLooping: (looping: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showStartTooltip: boolean;
  showEndTooltip: boolean;
  showSeekTooltip: boolean;
  setShowStartTooltip: (show: boolean) => void;
  setShowEndTooltip: (show: boolean) => void;
  setShowSeekTooltip: (show: boolean) => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Provider component
function AppProvider({ children }: { children: ReactNode }) {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({
    startTime: 0,
    endTime: 0,
  });
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(true); // Loop enabled by default
  const [stateRestored, setStateRestored] = useState(false);
  const [showStartTooltip, setShowStartTooltip] = useState(false);
  const [showEndTooltip, setShowEndTooltip] = useState(false);
  const [showSeekTooltip, setShowSeekTooltip] = useState(false);
  const savedStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const erroredDeepLinks = useRef(new Set<string>());

  // Set up IPC listeners
  useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      console.error('Electron API not available! Make sure the preload script is loaded.');
      return;
    }

    console.log('[App] Electron API detected, setting up IPC listeners...');

    // Handle deep link file opens
    window.electronAPI.onOpenFileFromLink((filePath) => {
      // Create unique key for this deep link
      const deepLinkUrl = `veelo://file?path=${filePath}`;

      // Check if we've already errored on this exact deep link
      if (erroredDeepLinks.current.has(deepLinkUrl)) {
        console.log('[App] Skipping deep link - already failed:', deepLinkUrl);
        return;
      }

      console.log('[App] Opening file from deep link:', filePath);

      // Load video metadata from file path
      const video = document.createElement('video');
      video.preload = 'metadata';
      let cleanupTimeout: NodeJS.Timeout | null = null;

      // Cleanup function to remove listeners and clear video element
      const cleanup = () => {
        if (cleanupTimeout) clearTimeout(cleanupTimeout);
        video.onloadedmetadata = null;
        video.onerror = null;
        video.src = '';
        video.remove();
      };

      video.onloadedmetadata = () => {
        const fileName = filePath.split('/').pop() || filePath;
        console.log('[App] Deep link file loaded:', {
          path: filePath,
          name: fileName,
          duration: video.duration
        });

        setVideoFile({
          path: filePath,
          name: fileName,
          duration: video.duration
        });

        // Clean up
        cleanup();
      };

      video.onerror = (event) => {
        // Only show alert once per unique deep link URL
        if (erroredDeepLinks.current.has(deepLinkUrl)) {
          console.log('[App] Suppressing duplicate error for:', deepLinkUrl);
          return;
        }

        // Mark this deep link as errored
        erroredDeepLinks.current.add(deepLinkUrl);

        // Detailed logging
        console.error('[App] Error loading video from deep link:', {
          filePath,
          deepLinkUrl,
          error: event,
          videoError: video.error
        });

        // Generic user-friendly alert
        alert('Failed to load video file');

        // Clean up
        cleanup();
      };

      // Safety timeout to force cleanup after 10 seconds
      cleanupTimeout = setTimeout(() => {
        console.warn('[App] Deep link load timeout for:', filePath);
        cleanup();
      }, 10000);

      // Use the local-video protocol to load the file
      video.src = `local-video://${encodeURIComponent(filePath)}`;
    });

    // Restore state from main process
    window.electronAPI.onRestoreState((state) => {
      console.log('[App] Restoring state:', state);
      if (state.videoFile) {
        setVideoFile(state.videoFile);
        // If we have a video but no trim settings, set defaults
        if (state.trimSettings) {
          setTrimSettings(state.trimSettings);
        } else {
          setTrimSettings({
            startTime: 0,
            endTime: state.videoFile.duration,
          });
        }
      }
      setStateRestored(true);
    });

    window.electronAPI.onCutProgress((percent) => {
      setProcessingStatus((prev) => ({
        ...prev,
        progress: percent,
      }));
    });

    window.electronAPI.onCutDone((outputPath) => {
      setProcessingStatus({
        isProcessing: false,
        progress: 100,
        outputPath,
      });

      // Reset "Saved" state after 3 seconds
      if (savedStatusTimeoutRef.current) {
        clearTimeout(savedStatusTimeoutRef.current);
      }
      savedStatusTimeoutRef.current = setTimeout(() => {
        setProcessingStatus({
          isProcessing: false,
          progress: 0,
        });
      }, 3000);
    });

    window.electronAPI.onCutError((error) => {
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        error,
      });
    });

    // Mark state as restored even if no state was sent (prevents waiting forever)
    const timeout = setTimeout(() => {
      setStateRestored(true);
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (savedStatusTimeoutRef.current) {
        clearTimeout(savedStatusTimeoutRef.current);
      }
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('cut-progress');
        window.electronAPI.removeAllListeners('cut-done');
        window.electronAPI.removeAllListeners('cut-error');
        window.electronAPI.removeAllListeners('restore-state');
        window.electronAPI.removeAllListeners('open-file-from-link');
      }
    };
  }, []);

  // Track the last video path to detect actual changes
  const lastVideoPath = useRef<string | null>(null);

  // Persist state to file via IPC
  useEffect(() => {
    if (!stateRestored) {
      console.log('[App] Not saving state - not yet restored');
      return; // Don't save until initial state is restored
    }

    if (!window.electronAPI) return;

    const state = {
      videoFile: videoFile || undefined,
      trimSettings: videoFile ? trimSettings : undefined,
    };

    console.log('[App] Saving state:', state);
    window.electronAPI.saveState(state);
  }, [videoFile, trimSettings, stateRestored]);

  // Reset trim settings when a NEW video is selected (not on restore)
  useEffect(() => {
    if (!videoFile) {
      lastVideoPath.current = null;
      return;
    }

    // Set initial trim settings if they're not set (when endTime is 0)
    if (trimSettings.endTime === 0 && videoFile.duration > 0) {
      console.log('[App] Setting initial trim settings to full duration');
      setTrimSettings({
        startTime: 0,
        endTime: videoFile.duration,
      });
    }

    // Only reset if this is a different video AND we're not on initial mount
    if (stateRestored && lastVideoPath.current !== null && lastVideoPath.current !== videoFile.path) {
      console.log('[App] New video selected, resetting trim settings');
      setTrimSettings({
        startTime: 0,
        endTime: videoFile.duration,
      });
    }

    lastVideoPath.current = videoFile.path;
  }, [videoFile?.path, videoFile?.duration, stateRestored, trimSettings.endTime]);

  const handleCutVideo = () => {
    if (!videoFile || !window.electronAPI) return;

    // Pause video and move to crop start before cutting
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = trimSettings.startTime;
    }

    const duration = trimSettings.endTime - trimSettings.startTime;
    const startTimeStr = trimSettings.startTime.toString();
    const durationStr = duration.toString();

    setProcessingStatus({
      isProcessing: true,
      progress: 0,
    });

    window.electronAPI.cutVideo(videoFile.path, startTimeStr, durationStr);
  };

  return (
    <AppContext.Provider
      value={{
        videoFile,
        setVideoFile,
        trimSettings,
        setTrimSettings,
        processingStatus,
        setProcessingStatus,
        handleCutVideo,
        videoRef,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        isLooping,
        setIsLooping,
        fileInputRef,
        showStartTooltip,
        showEndTooltip,
        showSeekTooltip,
        setShowStartTooltip,
        setShowEndTooltip,
        setShowSeekTooltip,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Main App component
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

function AppContent() {
  const {
    videoFile,
    fileInputRef,
    videoRef,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    trimSettings,
    setTrimSettings,
    setShowStartTooltip,
    setShowEndTooltip,
    setShowSeekTooltip,
    handleCutVideo
  } = useApp();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChangeVideo = () => {
    // Pause the current video
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Open file picker
    fileInputRef.current?.click();
  };

  // Helper to show tooltip temporarily
  const showTooltipTemporarily = (setter: (show: boolean) => void) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setter(true);
    tooltipTimeoutRef.current = setTimeout(() => {
      setter(false);
    }, 800);
  };

  // Cleanup tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const video = videoRef.current;
      if (!video || !videoFile) return;

      // Space: Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          video.pause();
        } else {
          video.play();
        }
        return;
      }

      // R: Restart (go to crop start)
      if (e.code === 'KeyR') {
        e.preventDefault();
        video.currentTime = trimSettings.startTime;
        return;
      }

      // Enter: Cut video
      if (e.code === 'Enter') {
        e.preventDefault();
        handleCutVideo();
        return;
      }

      // Left/Right: Seek 1 second
      if (e.code === 'ArrowLeft' && !e.shiftKey) {
        e.preventDefault();
        video.currentTime = Math.max(trimSettings.startTime, video.currentTime - 1);
        showTooltipTemporarily(setShowSeekTooltip);
        return;
      }

      if (e.code === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        video.currentTime = Math.min(trimSettings.endTime, video.currentTime + 1);
        showTooltipTemporarily(setShowSeekTooltip);
        return;
      }

      // Shift + Left/Right: Move left crop
      // Shift + Option + Left/Right: Move right crop
      if (e.shiftKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.altKey) {
          // Shift + Option + Left: Move right crop left
          setTrimSettings({
            startTime: trimSettings.startTime,
            endTime: Math.max(trimSettings.startTime + 0.1, trimSettings.endTime - 0.5)
          });
          showTooltipTemporarily(setShowEndTooltip);
        } else {
          // Shift + Left: Move left crop left
          setTrimSettings({
            startTime: Math.max(0, trimSettings.startTime - 0.5),
            endTime: trimSettings.endTime
          });
          showTooltipTemporarily(setShowStartTooltip);
        }
        return;
      }

      if (e.shiftKey && e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.altKey) {
          // Shift + Option + Right: Move right crop right
          setTrimSettings({
            startTime: trimSettings.startTime,
            endTime: Math.min(videoFile.duration, trimSettings.endTime + 0.5)
          });
          showTooltipTemporarily(setShowEndTooltip);
        } else {
          // Shift + Right: Move left crop right
          setTrimSettings({
            startTime: Math.min(trimSettings.endTime - 0.1, trimSettings.startTime + 0.5),
            endTime: trimSettings.endTime
          });
          showTooltipTemporarily(setShowStartTooltip);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoRef, videoFile, isPlaying, trimSettings, setTrimSettings, setShowStartTooltip, setShowEndTooltip, setShowSeekTooltip]);

  return (
    <div className="min-h-screen">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="bg-card h-[38px] border-b px-4 py-2 flex items-center justify-between draggable">
          <div className="flex items-center gap-2 pl-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4" viewBox="0 0 80 70">
              <defs>
                <linearGradient
                  id="linear-gradient"
                  x2="1"
                  y2="1"
                  gradientUnits="objectBoundingBox"
                >
                  <stop offset="0" stopColor="#fb7185" />
                  <stop offset="1" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              <g id="Group_166" data-name="Group 166" transform="translate(40 35)">
                <path
                  id="Path_64"
                  data-name="Path 64"
                  d="M-40-35,5,35V0H40L0-35Z"
                  opacity="0.95"
                  fill="url(#linear-gradient)"
                />
                <path
                  id="Path_65"
                  data-name="Path 65"
                  d="M5,35,40-35H25L5,10Z"
                  opacity="0.3"
                  fill="url(#linear-gradient)"
                />
              </g>
            </svg>

            <h1 className="text-sm font-bold">Veelo</h1>
          </div>

          {videoFile && (
            <button
              onClick={handleChangeVideo}
              className="-mr-3 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors non-draggable flex items-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Select Video
            </button>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <VideoDropZone />
          <VideoPlayer />
        </main>

        {/* Fixed footer with controls */}
        <TimelineControls />
      </div>
    </div>
  );
}
