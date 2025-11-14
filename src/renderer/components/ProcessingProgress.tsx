import { useApp } from '../App';

export default function ProcessingProgress() {
  const { processingStatus } = useApp();

  if (!processingStatus.isProcessing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-lg border shadow-2xl p-8 max-w-md w-full mx-4 animate-slide-in-bottom">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Processing Video
            </h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we cut your video...
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-medium text-foreground">
                {Math.round(processingStatus.progress || 0)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${processingStatus.progress || 0}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This may take a few moments depending on video size
          </p>
        </div>
      </div>
    </div>
  );
}
