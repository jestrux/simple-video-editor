# Veelo Plugins

This directory contains plugins and integrations for Veelo video editor, allowing you to open files in Veelo from various productivity tools.

## Available Plugins

### 🔧 Script Kit

Location: `script-kit/`

A Script Kit script that lets you open the currently selected Finder file in Veelo.

**Quick Start:**
- Install [Script Kit](https://www.scriptkit.com/)
- Copy `script-kit/edit-in-veelo.js` to your Script Kit scripts folder
- Select a video in Finder and press `cmd + shift + v`

[View Script Kit Plugin Documentation →](script-kit/README.md)

### ⚡ Raycast

Location: `raycast/`

A Raycast extension providing two commands to open videos in Veelo.

**Quick Start:**
```bash
cd raycast
npm install
npm run dev
```

Then assign hotkeys in Raycast preferences for instant access!

[View Raycast Extension Documentation →](raycast/README.md)

## How Deep Linking Works

All plugins use Veelo's custom URL scheme: `veelo://`

**URL Format:**
```
veelo://file?path=/absolute/path/to/video.mp4
```

**Example:**
```bash
open "veelo://file?path=/Users/username/Videos/sample.mp4"
```

This will:
1. Launch Veelo (if not running)
2. Focus the Veelo window (if already running)
3. Load the specified video file

## Prerequisites

Before using any plugin, make sure:

1. **Veelo is installed**: Build and install the production version
   ```bash
   npm run build
   # Install the app from the dist/ folder
   ```

2. **Deep linking is enabled**: Deep linking only works in production builds, not in development mode

## Supported Video Formats

All plugins support these video formats:
- MP4
- MOV
- AVI
- MKV
- FLV
- WMV
- WebM
- M4V

## Creating Your Own Plugin

Want to integrate Veelo with another tool? Here's how:

### 1. Get the Selected File Path

Most productivity tools have a way to get the current file selection:

**AppleScript (macOS):**
```applescript
tell application "Finder"
  set theFile to selection as alias
  return POSIX path of theFile
end tell
```

**Shell:**
```bash
osascript -e 'tell application "Finder" to set theFile to POSIX path of (selection as alias)'
```

### 2. Open with Veelo URL Scheme

Once you have the file path, open it with:

```bash
open "veelo://file?path=$(printf %s "$FILE_PATH" | jq -sRr @uri)"
```

Or in JavaScript/TypeScript:
```javascript
const veeloUrl = `veelo://file?path=${encodeURIComponent(filePath)}`;
await exec(`open "${veeloUrl}"`);
```

### 3. Add Error Handling

- Check if file exists
- Validate it's a video file (optional)
- Show helpful error messages
- Handle cases where Veelo isn't installed

## Plugin Ideas

Here are some ideas for additional Veelo plugins:

- **Alfred Workflow**: Quick file actions in Alfred
- **Keyboard Maestro**: Macro to edit videos
- **Automator Service**: Right-click context menu in Finder
- **Hammerspoon**: Lua-based automation
- **BetterTouchTool**: Custom gestures and shortcuts
- **PopClip Extension**: Select text → open video
- **VS Code Extension**: Open videos from project
- **Obsidian Plugin**: Edit video attachments

## Testing Your Plugin

1. Build Veelo in production mode
2. Install the app
3. Test the `veelo://` URL scheme:
   ```bash
   open "veelo://file?path=/path/to/test-video.mp4"
   ```
4. If Veelo opens with the video, your plugin should work!

## Troubleshooting

**Veelo doesn't open when clicking link:**
- Make sure you've built and installed the production version
- Deep linking is disabled in development mode
- Try opening Veelo manually to ensure it's properly installed

**"File not found" error:**
- Ensure the file path is absolute (starts with `/`)
- Check that the file actually exists
- Make sure special characters are URL-encoded

**Plugin doesn't appear in tool:**
- Check the plugin's README for installation instructions
- Restart the productivity tool
- Verify the plugin file is in the correct location

## Contributing

Have you created a Veelo plugin? We'd love to include it!

1. Create a new folder in `plugins/`
2. Add your plugin code
3. Include a README with installation and usage instructions
4. Submit a pull request

## License

All plugins in this directory are MIT licensed unless otherwise specified.

---

**Need help?** Check the individual plugin READMEs or open an issue on GitHub.
