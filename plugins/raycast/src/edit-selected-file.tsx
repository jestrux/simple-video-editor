import { showToast, Toast, getSelectedFinderItems, open, closeMainWindow } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { existsSync } from "fs";
import { extname, basename } from "path";

/**
 * Opens the currently selected file in Finder with Veelo video editor
 */
export default async function Command() {
  try {
    await closeMainWindow();

    // Get selected Finder items
    let selectedFiles;
    try {
      selectedFiles = await getSelectedFinderItems();
    } catch (error) {
      // Fallback to AppleScript if getSelectedFinderItems fails
      const script = `
        tell application "Finder"
          set selectedFiles to selection as alias list
          if (count of selectedFiles) is 0 then
            return ""
          end if
          set theFile to item 1 of selectedFiles
          return POSIX path of theFile
        end tell
      `;

      const result = await runAppleScript(script);
      if (!result || result.trim() === "") {
        await showToast({
          style: Toast.Style.Failure,
          title: "No File Selected",
          message: "Please select a video file in Finder",
        });
        return;
      }

      selectedFiles = [{ path: result.trim() }];
    }

    // Check if we have a selection
    if (!selectedFiles || selectedFiles.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No File Selected",
        message: "Please select a video file in Finder",
      });
      return;
    }

    const filePath = selectedFiles[0].path;

    // Validate file exists
    if (!existsSync(filePath)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "File Not Found",
        message: "The selected file does not exist",
      });
      return;
    }

    // Check if it's a video file (optional warning)
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".webm", ".m4v"];
    const fileExt = extname(filePath).toLowerCase();

    if (!videoExtensions.includes(fileExt)) {
      await showToast({
        style: Toast.Style.Warning,
        title: "Not a Video File",
        message: `Opening ${basename(filePath)} anyway...`,
      });
    }

    // Open in Veelo using the veelo:// URL scheme
    const veeloUrl = `veelo://file?path=${encodeURIComponent(filePath)}`;

    await open(veeloUrl);

    await showToast({
      style: Toast.Style.Success,
      title: "Opening in Veelo",
      message: basename(filePath),
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: error instanceof Error ? error.message : "Failed to open file in Veelo",
    });
  }
}
