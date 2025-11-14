import { useApp } from '../App';
import { formatTime } from '../lib/utils';
import MultiRangeSlider from './MultiRangeSlider';
import { useState, useRef, useEffect } from 'react';

export default function TimelineControls() {
  const { videoFile, trimSettings, setTrimSettings, handleCutVideo, processingStatus, setProcessingStatus, videoRef, isPlaying, currentTime, isLooping, setIsLooping, showStartTooltip, showEndTooltip, showSeekTooltip } = useApp();
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isHoveringProgressBar, setIsHoveringProgressBar] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  if (!videoFile) {
    return null;
  }

  const handleSliderChange = (start: number, end: number) => {
    setTrimSettings({ startTime: start, endTime: end });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    if (!progressBar || !video) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = trimSettings.startTime + (percent * (trimSettings.endTime - trimSettings.startTime));

    video.currentTime = Math.max(trimSettings.startTime, Math.min(trimSettings.endTime, newTime));
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * (trimSettings.endTime - trimSettings.startTime);

    setHoveredTime(time);
  };

  const isProcessing = processingStatus.isProcessing;
  const duration = trimSettings.endTime - trimSettings.startTime;

  // Calculate trimmed duration and progress
  const trimmedDuration = trimSettings.endTime - trimSettings.startTime;
  const progressPercent = Math.max(0, Math.min(100, ((currentTime - trimSettings.startTime) / trimmedDuration) * 100));

  return (
    <footer className="border-t bg-card h-[100px] flex flex-col">
      {/* Video title and progress bar section */}
      <div className="px-4 py-2 h-[54px] space-y-2">
        {/* Video title */}
        <div className="text-center">
          <span className="text-sm font-medium text-foreground truncate block">
            {videoFile.name}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {/* Start time */}
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(Math.max(0, currentTime - trimSettings.startTime))}
          </span>
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="flex-1 relative cursor-pointer group"
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressBarMouseMove}
            onMouseEnter={() => setIsHoveringProgressBar(true)}
            onMouseLeave={() => {
              setIsHoveringProgressBar(false);
              setHoveredTime(null);
            }}
            style={{ padding: '8px 0', marginTop: '-8px', marginBottom: '-8px' }}
          >
            <div className="h-1 bg-muted rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-horizontal rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  transition: 'width 0.1s linear'
                }}
              />
            </div>
            {/* Hover Tooltip */}
            {isHoveringProgressBar && hoveredTime !== null && (
              <div
                className="absolute bottom-full mb-2 left-0 px-1.5 py-0.5 bg-foreground text-background text-xs rounded whitespace-nowrap pointer-events-none"
                style={{
                  left: `${(hoveredTime / trimmedDuration) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatTime(hoveredTime)}
              </div>
            )}
            {/* Seek Tooltip (keyboard shortcut) */}
            {showSeekTooltip && !isHoveringProgressBar && (
              <div
                className="absolute bottom-full mb-2 left-0 px-1.5 py-0.5 bg-foreground text-background text-xs rounded whitespace-nowrap pointer-events-none"
                style={{
                  left: `${progressPercent}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatTime(Math.max(0, currentTime - trimSettings.startTime))}
              </div>
            )}
          </div>
          {/* End time */}
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(trimmedDuration)}
          </span>
        </div>
      </div>

      {/* Controls section - bottom half */}
      <div className="flex items-center px-4 gap-3 flex-1">
        {/* Play button */}
        <button
          onClick={togglePlay}
          className="w-7 h-7 bg-gradient-primary text-primary-foreground rounded flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

      {/* Slider with crop start/end labels */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {formatTime(trimSettings.startTime)}
        </div>
        <div className="flex-1">
          <MultiRangeSlider
            min={0}
            max={videoFile.duration}
            startValue={trimSettings.startTime}
            endValue={trimSettings.endTime}
            onChange={handleSliderChange}
            step={0.1}
            formatLabel={formatTime}
            showStartTooltip={showStartTooltip}
            showEndTooltip={showEndTooltip}
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {formatTime(trimSettings.endTime)} / {formatTime(videoFile.duration)}
        </div>
      </div>

      {/* Status/Error message */}
      {processingStatus.error && (
        <div className="text-xs text-destructive max-w-xs truncate">
          {processingStatus.error}
        </div>
      )}
      {processingStatus.outputPath && !processingStatus.isProcessing && (
        <div className="text-xs text-muted-foreground max-w-xs truncate">
          Saved
        </div>
      )}

      {/* Loop button */}
      <button
        onClick={() => setIsLooping(!isLooping)}
        className={`w-7 h-7 rounded flex items-center justify-center transition-all flex-shrink-0 border relative overflow-hidden ${
          isLooping
            ? 'text-primary dark:text-foreground border-primary/30 dark:border-foreground/40 hover:opacity-80'
            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
        }`}
        title={isLooping ? 'Loop enabled' : 'Loop disabled'}
      >
        {isLooping && (
          <div className="absolute inset-0 bg-gradient-primary opacity-15 dark:opacity-25" />
        )}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

        {/* Cut button */}
        <button
          onClick={handleCutVideo}
          disabled={isProcessing || duration <= 0}
          className="relative px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 disabled:cursor-not-allowed transition-opacity whitespace-nowrap min-w-[140px] overflow-hidden bg-gradient-primary text-primary-foreground"
        >
          {/* Dimmed overlay for unfilled portion only */}
          {isProcessing && (
            <div
              className="absolute inset-0 bg-black/40 transition-all duration-100"
              style={{
                clipPath: `inset(0 0 0 ${processingStatus.progress}%)`
              }}
            />
          )}

          {/* Default text - hidden when processing */}
          <span className={`relative z-10 transition-opacity duration-200 ${isProcessing || processingStatus.progress === 100 ? 'opacity-0' : ''}`}>
            Cut Video
          </span>

          {/* Processing text with mask effect */}
          {isProcessing && processingStatus.progress < 100 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-500">
              {/* Filled portion (left side) - full opacity text */}
              <span
                className="absolute inset-0 flex items-center justify-center transition-all duration-100"
                style={{
                  clipPath: `inset(0 ${100 - processingStatus.progress}% 0 0)`
                }}
              >
                Saving...{processingStatus.progress}%
              </span>

              {/* Unfilled portion (right side) - reduced opacity text */}
              <span
                className="absolute inset-0 flex items-center justify-center opacity-40 transition-all duration-100"
                style={{
                  clipPath: `inset(0 0 0 ${processingStatus.progress}%)`
                }}
              >
                Saving...{processingStatus.progress}%
              </span>
            </div>
          )}

          {/* Saved state - shown when progress is 100 */}
          {!isProcessing && processingStatus.progress === 100 && (
            <>
              {/* Success overlay */}
              <div className="absolute inset-0 bg-black/20 transition-opacity duration-500" />

              <span className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 transition-all duration-500" style={{ scale: '1' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
