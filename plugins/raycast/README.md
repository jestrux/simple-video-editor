# Raycast Extension for Veelo

This Raycast extension allows you to quickly open video files in Veelo from anywhere on your Mac.

## Prerequisites

1. **Install Raycast**: Download from [raycast.com](https://www.raycast.com/)
2. **Build and Install Veelo**: Make sure Veelo is built and installed on your system
3. **Node.js**: Required to build the extension (v18 or higher recommended)

## Installation

### Option 1: Install from Source (Development)

1. Navigate to the extension directory:
   ```bash
   cd plugins/raycast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Import the extension into Raycast:
   ```bash
   npm run dev
   ```
   This will open Raycast and import the extension in development mode.

### Option 2: Build and Install

1. Build the extension:
   ```bash
   npm run build
   ```

2. Import the built extension in Raycast settings

## Commands

### 1. Edit Selected Video in Veelo

Opens the currently selected file in Finder with Veelo.

**Usage:**
1. Select a video file in Finder
2. Open Raycast (default: `cmd + space`)
3. Type "Edit Selected Video in Veelo"
4. Press Enter

**Tip:** Assign a hotkey in Raycast preferences for even faster access!

### 2. Edit Video File in Veelo

Opens a form where you can enter a file path to open in Veelo.

**Usage:**
1. Open Raycast
2. Type "Edit Video File in Veelo"
3. Press Enter
4. Enter the full path to your video file
5. Press Enter to open in Veelo

**Features:**
- Supports `~` for home directory
- Validates file existence
- Warns if file is not a video format
- Supports drag & drop of files

## Supported Video Formats

- MP4
- MOV
- AVI
- MKV
- FLV
- WMV
- WebM
- M4V

## Customization

### Assign Keyboard Shortcuts

1. Open Raycast Preferences (`cmd + ,`)
2. Go to Extensions → Veelo Video Editor
3. Click on a command
4. Assign your preferred hotkey

**Suggested shortcuts:**
- `cmd + shift + v` - Edit Selected Video in Veelo
- `cmd + option + v` - Edit Video File in Veelo

### Add to Finder Quick Actions (macOS 13+)

You can use Raycast's Quick Actions feature:
1. Right-click a video file in Finder
2. Quick Actions → Edit Selected Video in Veelo

## Development

### Project Structure

```
raycast/
├── src/
│   ├── edit-selected-file.tsx   # Command: Open selected Finder file
│   └── edit-from-path.tsx       # Command: Open from file path input
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

### Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build extension
- `npm run lint` - Lint code
- `npm run fix-lint` - Fix linting issues
- `npm run publish` - Publish to Raycast Store

### Making Changes

1. Edit the TypeScript files in `src/`
2. The extension will hot-reload in development mode
3. Test your changes
4. Build with `npm run build`

## Troubleshooting

**Extension doesn't appear in Raycast:**
- Make sure you've run `npm install` and `npm run dev`
- Check Raycast Extensions preferences

**"No File Selected" error:**
- Make sure a file is selected in Finder
- Try using the "Edit Video File in Veelo" command instead

**Veelo doesn't open:**
- Ensure Veelo is built and installed
- Make sure you've built the production version (not just dev)
- The veelo:// URL scheme only works in production builds
- Try opening Veelo manually first to ensure it's properly installed

**File path not found:**
- Make sure the path is absolute (starts with `/` or `~`)
- Check that the file exists at the specified location

## Publishing

To publish this extension to the Raycast Store:

1. Update `package.json` with your information:
   - Change `author` to your Raycast username
   - Add your GitHub repository URL
   - Update description if needed

2. Create an icon:
   - Add a 512x512 PNG icon as `icon.png` in the root directory
   - Use Veelo's logo or create a custom icon

3. Build and test thoroughly:
   ```bash
   npm run build
   ```

4. Publish:
   ```bash
   npm run publish
   ```

## Example Workflows

### Workflow 1: Quick Edit from Finder
1. Browse videos in Finder
2. Select the video you want to edit
3. Press your hotkey (e.g., `cmd + shift + v`)
4. Veelo opens instantly with your video!

### Workflow 2: Open Recent File
1. Open Raycast
2. Type "Edit Video File"
3. Paste or drag a file path
4. Hit Enter
5. Start editing!

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
