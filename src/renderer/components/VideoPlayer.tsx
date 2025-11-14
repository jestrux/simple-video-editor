import { useEffect } from 'react';
import { useApp } from '../App';
import { formatTime } from '../lib/utils';

export default function VideoPlayer() {
  const { videoFile, trimSettings, videoRef, isPlaying, setIsPlaying, currentTime, setCurrentTime, setVideoFile, isLooping } = useApp();

  // Setup video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Check if we've reached the end of the trimmed section
      if (video.currentTime >= trimSettings.endTime) {
        if (isLooping) {
          // Loop: restart from the beginning
          video.currentTime = trimSettings.startTime;
        } else {
          // No loop: pause at the end
          video.pause();
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleError = (e: Event) => {
      console.error('[VideoPlayer] Video error:', video.error);
      console.error('[VideoPlayer] Video src:', video.src);
      console.error('[VideoPlayer] Error event:', e);
      // Don't automatically clear the video, let user decide
      // setVideoFile(null);
    };

    const handleLoadedMetadata = () => {
      console.log('[VideoPlayer] Video loaded successfully:', video.src);
    };

    const handleEnded = () => {
      if (isLooping) {
        // Loop: restart from the beginning of trim
        video.currentTime = trimSettings.startTime;
        video.play().catch(err => {
          console.log('[VideoPlayer] Play prevented:', err);
        });
      } else {
        // No loop: stay paused at the end
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [setCurrentTime, setIsPlaying, trimSettings.endTime, trimSettings.startTime, isLooping]);

  // Auto-play when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoFile) return;

    const handleLoadedData = () => {
      // Set to start of trim and auto-play
      video.currentTime = trimSettings.startTime;
      video.play().catch(err => {
        console.log('[VideoPlayer] Auto-play prevented:', err);
      });
    };

    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [videoFile?.path]);

  // Smart trim adjustment - preserves playback if current time is within new crop
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoFile) return;

    const wasPlaying = isPlaying;
    const currentVideoTime = video.currentTime;

    // Check if current time is within the new trim range
    const isWithinNewRange = currentVideoTime >= trimSettings.startTime && currentVideoTime <= trimSettings.endTime;

    if (isWithinNewRange) {
      // Current time is still valid - keep playing if it was playing
      if (wasPlaying) {
        video.play().catch(err => {
          console.log('[VideoPlayer] Play prevented:', err);
        });
      }
    } else {
      // Current time is outside new range - seek to start of trim
      video.currentTime = trimSettings.startTime;

      // Resume if it was playing
      if (wasPlaying) {
        video.play().catch(err => {
          console.log('[VideoPlayer] Play prevented:', err);
        });
      }
    }
  }, [trimSettings.startTime, trimSettings.endTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  if (!videoFile) {
    return null;
  }

  // Use custom protocol for local files in Electron
  const videoSrc = videoFile.path.startsWith('local-video://') || videoFile.path.startsWith('blob:') || videoFile.path.startsWith('http')
    ? videoFile.path
    : `local-video://${encodeURIComponent(videoFile.path)}`;

  console.log('[VideoPlayer] Rendering with:', { originalPath: videoFile.path, videoSrc });

  // Calculate progress data to pass to footer
  const progressData = {
    currentTime,
    trimSettings,
    progressPercent: Math.max(0, Math.min(100, ((currentTime - trimSettings.startTime) / (trimSettings.endTime - trimSettings.startTime)) * 100))
  };

  return (
    <div className="flex-1 flex items-center justify-center relative bg-black min-h-0">
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain object-center"
      />
    </div>
  );
}
