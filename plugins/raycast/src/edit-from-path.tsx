import { Action, ActionPanel, Form, showToast, Toast, open, closeMainWindow } from "@raycast/api";
import { useState } from "react";
import { existsSync } from "fs";
import { extname, basename } from "path";

interface FormValues {
  filePath: string;
}

/**
 * Allows user to enter a file path to open in Veelo
 */
export default function Command() {
  const [filePathError, setFilePathError] = useState<string | undefined>();

  async function handleSubmit(values: FormValues) {
    const { filePath } = values;

    // Validate file path
    if (!filePath || filePath.trim() === "") {
      setFilePathError("Please enter a file path");
      return;
    }

    // Expand tilde to home directory
    const expandedPath = filePath.replace(/^~/, process.env.HOME || "");

    // Check if file exists
    if (!existsSync(expandedPath)) {
      setFilePathError("File does not exist");
      await showToast({
        style: Toast.Style.Failure,
        title: "File Not Found",
        message: "The specified file does not exist",
      });
      return;
    }

    // Check if it's a video file (optional warning)
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".webm", ".m4v"];
    const fileExt = extname(expandedPath).toLowerCase();

    if (!videoExtensions.includes(fileExt)) {
      await showToast({
        style: Toast.Style.Warning,
        title: "Not a Video File",
        message: `Opening ${basename(expandedPath)} anyway...`,
      });
    }

    try {
      // Open in Veelo using the veelo:// URL scheme
      const veeloUrl = `veelo://file?path=${encodeURIComponent(expandedPath)}`;

      await closeMainWindow();
      await open(veeloUrl);

      await showToast({
        style: Toast.Style.Success,
        title: "Opening in Veelo",
        message: basename(expandedPath),
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to open file in Veelo",
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Open in Veelo" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="filePath"
        title="Video File Path"
        placeholder="/Users/username/Videos/sample.mp4"
        error={filePathError}
        onChange={() => setFilePathError(undefined)}
        info="Enter the full path to a video file. You can use ~ for home directory."
      />
      <Form.Description
        title="Supported Formats"
        text="MP4, MOV, AVI, MKV, FLV, WMV, WebM, M4V"
      />
    </Form>
  );
}
