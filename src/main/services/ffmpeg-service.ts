import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

type ProgressCallback = (percent: number) => void;
type SuccessCallback = (outputPath: string) => void;
type ErrorCallback = (error: Error) => void;

async function matchingFilesInDir(folder: string, filter: string): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(folder)) {
      reject(new Error(`Folder: ${folder} not found!`));
      return;
    }

    const files = fs.readdirSync(folder);
    const matchingFiles = files.filter(
      (filename) => filename.indexOf(filter) !== -1
    );
    resolve(matchingFiles.length);
  });
}

export async function cutVideo(
  filePath: string,
  startTime: string,
  duration: string,
  onProgress: ProgressCallback,
  onSuccess: SuccessCallback,
  onError: ErrorCallback,
  outputPath?: string
): Promise<void> {
  try {
    // Generate output path if not provided
    if (!outputPath) {
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      let fileName = `${baseName} - chopped`;

      const downloadsPath = app.getPath('downloads');
      const matchingFiles = await matchingFilesInDir(downloadsPath, fileName);

      if (matchingFiles > 0) {
        fileName += ` - ${matchingFiles}`;
      }

      outputPath = path.join(downloadsPath, fileName + ext);
    }

    // Send initial progress
    onProgress(0);

    // Optional text overlay filters (currently disabled)
    // const filter = {
    //   filter: 'drawtext',
    //   options: {
    //     text: 'Your Text',
    //     fontfile: '/System/Library/Fonts/Supplemental/Arial Black.ttf',
    //     fontcolor: 'black',
    //     fontsize: 40,
    //     box: 1,
    //     boxcolor: 'white',
    //     boxborderw: '12',
    //     x: '(main_w/2-text_w/2)',
    //     y: '(main_h-text_h-30)',
    //     enable: 'between(t,7,7.7)',
    //   }
    // };

    // Process video
    ffmpeg(filePath)
      .setStartTime(startTime)
      .setDuration(duration)
      .withVideoBitrate('900k')
      .withSize('750x?')
      // .videoFilters([filter]) // Uncomment to enable text overlays
      .output(outputPath)
      .on('end', () => {
        console.log('Video cut successfully:', outputPath);
        onSuccess(outputPath);
      })
      .on('progress', (progress) => {
        const percent = progress.percent || 0;
        onProgress(Math.round(percent));
        console.log(`Processing: ${Math.round(percent)}%`);
      })
      .on('error', (error) => {
        console.error('FFmpeg error:', error);
        onError(error);
      })
      .run();
  } catch (error) {
    onError(error as Error);
  }
}

export async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}
