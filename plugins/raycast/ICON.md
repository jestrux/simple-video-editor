# Icon for Raycast Extension

To complete the Raycast extension, you need to add an `icon.png` file in this directory.

## Requirements

- **Size**: 512x512 pixels
- **Format**: PNG
- **Background**: Transparent (recommended) or solid color
- **Style**: Simple, recognizable icon that represents Veelo

## Where to Get the Icon

You can use:
1. The Veelo app icon (if available)
2. A custom icon you design
3. Export from `src/renderer/assets/icons/icon@2x.png` and resize to 512x512

## Creating the Icon

If you want to use the existing Veelo logo:

```bash
# Using ImageMagick (install with: brew install imagemagick)
convert ../src/renderer/assets/icons/icon@2x.png -resize 512x512 icon.png

# Or using sips (built-in macOS tool)
sips -z 512 512 ../../src/renderer/assets/icons/icon@2x.png --out icon.png
```

## Alternative

You can also use a generic video editor icon until you have the proper Veelo icon ready.
