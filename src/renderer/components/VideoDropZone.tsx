import { useState, DragEvent } from 'react';
import { useApp } from '../App';
import { cn } from '../lib/utils';

export default function VideoDropZone() {
  const { videoFile, setVideoFile, fileInputRef } = useApp();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const videoFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/x-flv', 'video/x-ms-wmv'];
    if (!videoFormats.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|flv|wmv)$/i)) {
      alert('Please select a valid video file');
      return;
    }

    // Create video element to get duration
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const filePath = (file as File & { path?: string }).path || file.name;
      window.URL.revokeObjectURL(video.src);

      console.log('[VideoDropZone] File selected:', {
        path: filePath,
        name: file.name,
        duration: video.duration
      });

      setVideoFile({
        path: filePath,
        name: file.name,
        duration: video.duration
      });
    };

    video.onerror = () => {
      console.error('[VideoDropZone] Error loading video metadata');
      alert('Error loading video file');
    };

    video.src = URL.createObjectURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {!videoFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "group flex-1 flex items-center justify-center cursor-pointer m-4 rounded-lg transition-all",
            isDragging
              ? "border-gradient-glow"
              : "border-2 border-dashed border-muted-foreground/30 hover:border-gradient-glow"
          )}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary opacity-15 dark:opacity-100" />
              <svg
                className={cn(
                  "w-8 h-8 transition-colors relative z-10",
                  isDragging ? "text-primary" : "text-primary/60 group-hover:text-primary"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                {isDragging ? 'Drop video here' : 'Drag & drop your video'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 opacity-50 group-hover:opacity-90 transition-opacity">
                or click to browse
              </p>
            </div>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
