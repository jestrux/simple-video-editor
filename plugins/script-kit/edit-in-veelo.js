// Name: Edit Video in Veelo
// Description: Open the current Finder selection in Veelo video editor
// Author: Veelo
// Shortcut: cmd shift v

import "@johnlindquist/kit";

/**
 * This Script Kit script opens the currently selected file in Finder
 * with Veelo video editor using the veelo:// URL scheme
 */

async function main() {
	// Get the current Finder selection using AppleScript
	const finderSelection = await applescript(`
    tell application "Finder"
      set selectedFiles to selection as alias list
      if (count of selectedFiles) is 0 then
        return "NO_SELECTION"
      end if
      set theFile to item 1 of selectedFiles
      return POSIX path of theFile
    end tell
  `);

	// Check if we got a file
	if (finderSelection === "NO_SELECTION" || !finderSelection.trim()) {
		await div({
			html: `
        <div class="p-4">
          <h1 class="text-2xl font-bold mb-2">No File Selected</h1>
          <p class="text-gray-600">Please select a video file in Finder and try again.</p>
        </div>
      `,
			width: 400,
			height: 150,
		});
		exit();
	}

	const filePath = finderSelection.trim();

	// Check if file exists and is a video
	const videoExtensions = [
		".mp4",
		".mov",
		".avi",
		".mkv",
		".flv",
		".wmv",
		".webm",
		".m4v",
	];
	const fileExt = path.extname(filePath).toLowerCase();

	if (!videoExtensions.includes(fileExt)) {
		const proceed = await div({
			html: `
        <div class="p-4">
          <h1 class="text-2xl font-bold mb-2">⚠️ Not a Video File</h1>
          <p class="text-gray-600 mb-4">
            The selected file doesn't appear to be a video:
            <br/><br/>
            <code class="bg-gray-100 px-2 py-1 rounded">${path.basename(
				filePath
			)}</code>
          </p>
          <p class="text-sm text-gray-500">Do you want to open it anyway?</p>
        </div>
      `,
			width: 500,
			height: 200,
		});

		if (!proceed) {
			exit();
		}
	}

	// Open in Veelo using the veelo:// URL scheme
	const veeloUrl = `veelo://file?path=${encodeURIComponent(filePath)}`;

	try {
		await exec(`open "${veeloUrl}"`);
	} catch (error) {
		await div({
			html: `
        <div class="p-4">
          <h1 class="text-2xl font-bold mb-2">❌ Error</h1>
          <p class="text-gray-600 mb-2">
            Failed to open Veelo. Make sure the app is installed.
          </p>
          <p class="text-xs text-gray-500">${error.message}</p>
        </div>
      `,
			width: 400,
			height: 200,
		});
		await wait(3000);
	}
}

await main();
