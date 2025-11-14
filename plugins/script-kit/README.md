# Script Kit Plugin for Veelo

This Script Kit script allows you to quickly open video files in Veelo directly from Finder.

## Prerequisites

1. **Install Script Kit**: Download from [scriptkit.com](https://www.scriptkit.com/)
2. **Build and Install Veelo**: Make sure Veelo is built and installed on your system

## Installation

### Option 1: Copy to Script Kit Scripts Folder

1. Open Script Kit
2. Run the "Open Scripts Folder" command (or press `cmd + k` then search for it)
3. Copy `edit-in-veelo.js` to your scripts folder
4. The script will appear in Script Kit automatically

### Option 2: Use Script Kit to Install

1. Open Script Kit
2. Run "New Script from URL" command
3. Paste the path or URL to `edit-in-veelo.js`

## Usage

### Method 1: Via Script Kit UI

1. Select a video file in Finder
2. Open Script Kit (default: `cmd + ;`)
3. Search for "Edit Video in Veelo"
4. Press Enter

### Method 2: Via Keyboard Shortcut

1. Select a video file in Finder
2. Press `cmd + shift + v`
3. The video will open in Veelo

## Customization

You can customize the script by editing these values in `edit-in-veelo.js`:

- **Shortcut**: Change `// Shortcut: cmd shift v` to your preferred keyboard shortcut
- **Video Extensions**: Modify the `videoExtensions` array to add/remove supported formats
- **Notifications**: Customize the HTML in the `div()` calls to change the look of notifications

## Features

- ✅ Opens currently selected Finder file in Veelo
- ✅ Validates file is a video (with option to proceed anyway)
- ✅ Shows helpful error messages
- ✅ Visual feedback with notifications
- ✅ Keyboard shortcut support

## Troubleshooting

**Script doesn't appear in Script Kit:**
- Make sure the file is in your Script Kit scripts folder
- Restart Script Kit

**"No File Selected" error:**
- Make sure a file is selected in Finder before running the script

**Veelo doesn't open:**
- Ensure Veelo is built and installed
- Make sure you've built the production version (not just dev)
- The veelo:// URL scheme only works in production builds

## Example Workflow

1. Browse videos in Finder
2. Select a video you want to edit
3. Press `cmd + shift + v`
4. Veelo opens with your video ready to trim!
