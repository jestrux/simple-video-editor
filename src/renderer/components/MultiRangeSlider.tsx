import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';

interface MultiRangeSliderProps {
  min: number;
  max: number;
  startValue: number;
  endValue: number;
  onChange: (start: number, end: number) => void;
  step?: number;
  formatLabel?: (value: number) => string;
  showStartTooltip?: boolean;
  showEndTooltip?: boolean;
}

export default function MultiRangeSlider({
  min,
  max,
  startValue,
  endValue,
  onChange,
  step = 0.1,
  formatLabel = (v) => v.toFixed(1),
  showStartTooltip = false,
  showEndTooltip = false
}: MultiRangeSliderProps) {
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startThumbRef = useRef<HTMLDivElement>(null);
  const endThumbRef = useRef<HTMLDivElement>(null);

  // Calculate percentage position
  const getPercent = useCallback(
    (value: number) => ((value - min) / (max - min)) * 100,
    [min, max]
  );

  // Get value from mouse position
  const getValueFromMouseEvent = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      if (!trackRef.current) return min;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      const value = (percent / 100) * (max - min) + min;

      // Round to step
      return Math.round(value / step) * step;
    },
    [min, max, step]
  );

  // Handle track click (jump to position)
  const handleTrackClick = (event: React.MouseEvent) => {
    if (isDraggingStart || isDraggingEnd) return;

    const value = getValueFromMouseEvent(event);
    const distanceToStart = Math.abs(value - startValue);
    const distanceToEnd = Math.abs(value - endValue);

    // Move the closest thumb
    if (distanceToStart < distanceToEnd) {
      onChange(Math.min(value, endValue - step), endValue);
    } else {
      onChange(startValue, Math.max(value, startValue + step));
    }
  };

  // Mouse move handler for dragging
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingStart && !isDraggingEnd) return;

      const value = getValueFromMouseEvent(event);

      if (isDraggingStart) {
        const newStart = Math.min(value, endValue - step);
        onChange(Math.max(min, newStart), endValue);
      } else if (isDraggingEnd) {
        const newEnd = Math.max(value, startValue + step);
        onChange(startValue, Math.min(max, newEnd));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, startValue, endValue, min, max, step, onChange, getValueFromMouseEvent]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!startThumbRef.current && !endThumbRef.current) return;

      const activeElement = document.activeElement;
      const isStartActive = activeElement === startThumbRef.current;
      const isEndActive = activeElement === endThumbRef.current;

      if (!isStartActive && !isEndActive) return;

      let handled = false;
      const largeStep = step * 10;

      if (isStartActive) {
        if (event.key === 'ArrowLeft') {
          onChange(Math.max(min, startValue - step), endValue);
          handled = true;
        } else if (event.key === 'ArrowRight') {
          onChange(Math.min(endValue - step, startValue + step), endValue);
          handled = true;
        } else if (event.key === 'PageDown') {
          onChange(Math.max(min, startValue - largeStep), endValue);
          handled = true;
        } else if (event.key === 'PageUp') {
          onChange(Math.min(endValue - step, startValue + largeStep), endValue);
          handled = true;
        } else if (event.key === 'Home') {
          onChange(min, endValue);
          handled = true;
        }
      } else if (isEndActive) {
        if (event.key === 'ArrowLeft') {
          onChange(startValue, Math.max(startValue + step, endValue - step));
          handled = true;
        } else if (event.key === 'ArrowRight') {
          onChange(startValue, Math.min(max, endValue + step));
          handled = true;
        } else if (event.key === 'PageDown') {
          onChange(startValue, Math.max(startValue + step, endValue - largeStep));
          handled = true;
        } else if (event.key === 'PageUp') {
          onChange(startValue, Math.min(max, endValue + largeStep));
          handled = true;
        } else if (event.key === 'End') {
          onChange(startValue, max);
          handled = true;
        }
      }

      if (handled) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [startValue, endValue, min, max, step, onChange]);

  const startPercent = getPercent(startValue);
  const endPercent = getPercent(endValue);

  return (
    <div className="relative h-8 cursor-pointer group" ref={trackRef} onClick={handleTrackClick}>
      {/* Background track */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden" />

      {/* Active range */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-horizontal rounded-full overflow-hidden"
        style={{
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`
        }}
      />

      {/* Start thumb */}
      <div
        ref={startThumbRef}
        tabIndex={0}
        role="slider"
        aria-label="Start time"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={startValue}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingStart(true);
        }}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
          'w-3 h-3 rounded-full shadow-sm',
          'bg-gradient-to-br from-rose-400 to-orange-400',
          'cursor-grab active:cursor-grabbing',
          'hover:scale-125 transition-transform',
          isDraggingStart && 'scale-125'
        )}
        style={{ left: `${startPercent}%` }}
      >
        {/* Tooltip */}
        {(isDraggingStart || showStartTooltip) && (
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-xs rounded whitespace-nowrap">
            {formatLabel(startValue)}
          </div>
        )}
      </div>

      {/* End thumb */}
      <div
        ref={endThumbRef}
        tabIndex={0}
        role="slider"
        aria-label="End time"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={endValue}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingEnd(true);
        }}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
          'w-3 h-3 rounded-full shadow-sm',
          'bg-gradient-to-br from-rose-400 to-orange-400',
          'cursor-grab active:cursor-grabbing',
          'hover:scale-125 transition-transform',
          isDraggingEnd && 'scale-125'
        )}
        style={{ left: `${endPercent}%` }}
      >
        {/* Tooltip */}
        {(isDraggingEnd || showEndTooltip) && (
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-xs rounded whitespace-nowrap">
            {formatLabel(endValue)}
          </div>
        )}
      </div>
    </div>
  );
}
