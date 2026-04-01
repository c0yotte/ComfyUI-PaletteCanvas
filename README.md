# Coyotte's Palette Canvas (RGB)


**Control lighting in AI-generated images through color gradients and shapes.**

This ComfyUI custom node creates color canvases that serve as lighting maps for text-to-image generation workflows. By encoding these gradients through VAE and using them as initial latents with lowered denoise (0.87-0.95 instead of 1), you can precisely control the mood, atmosphere, and illumination of your generated images.

## The Concept

Traditional text-to-image generation gives you limited control over lighting. This node solves that by letting you:

1. **Paint with Light** - Create custom gradients that define how light flows across your scene
2. **Add Light Sources** - Place bright shapes on dark backgrounds to create specific illumination points
3. **Guide the AI** - Feed these light maps into your sampler to influence the final lighting without complex prompting

### Use Cases

**Atmospheric Lighting**
- Create sunset gradients (orange → purple) for golden hour lighting
- Design dark-to-light gradients for cinematic rim lighting
- Build complex multi-color gradients for fantasy scenes

**Specific Light Sources**
- Place a bright circle on dark background → creates a spotlight effect
- Use rectangle shapes as window light sources
- Position triangles for dramatic angular lighting

**Mood Control**
- Cool gradients (blues) for night/calm scenes
- Warm gradients (reds/oranges) for energetic/warm scenes
- High contrast gradients for dramatic noir lighting

## Installation

### Method 1: ComfyUI Manager (Recommended)
1. Open ComfyUI Manager
2. Click "Install Custom Nodes"
3. Search for "Palette Canvas"
4. Click Install

### Method 2: Git Clone
cd ComfyUI/custom_nodes
git clone https://github.com/yourusername/ComfyUI-PaletteCanvasRGB.git

### Method 3: Manual
1. Download this repository as ZIP
2. Extract to `ComfyUI/custom_nodes/ComfyUI-PaletteCanvasRGB/`
3. Restart ComfyUI

## Technical Details

### Why Denoise 0.87-0.95?
- **0.87-0.92**: Gradient strongly influences the final image composition
- **0.93-0.95**: Balanced - AI follows the lighting but creates natural details
- **0.96-0.99**: Subtle influence - AI uses gradient as "mood suggestion"

### Aspect Ratio Handling
The node automatically corrects for non-square aspect ratios. A circle remains circular whether your canvas is 512×512 or 896×1152.

### Shape Distortion (scale_x/y)
Use independent X/Y scaling to create:
- **Elliptical lights** (stretched circle = wide light source)
- **Anamorphic flares** (compressed height = cinematic lens flares)
- **Custom light patterns** (rectangle stretched into line = neon strip)

## Requirements

- ComfyUI (any recent version)
- Modern browser (for interactive widgets)

No additional Python packages required.

## License

MIT License - See [LICENSE](LICENSE) file

## Credits

Created by **Coyotte**
