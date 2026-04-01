# Coyotte's Palette Canvas (RGB)

**Control lighting in AI-generated images through color gradients and shapes.**

This ComfyUI custom node creates color canvases that serve as lighting maps for text-to-image generation workflows. By encoding these gradients through VAE and using them as initial latents with high denoise (0.93-0.97), you can precisely control the mood, atmosphere, and illumination of your generated images.

## The Concept

Traditional text-to-image generation gives you limited control over lighting. This node solves that by letting you:

1. **Paint with Light** - Create custom gradients that define how light flows across your scene
2. **Add Light Sources** - Place bright shapes on dark backgrounds to create specific illumination points
3. **Guide the AI** - Feed these light maps into your sampler to influence the final lighting without complex prompting

### Workflow Example
```
Palette Canvas (RGB) → VAE Encode → KSampler (denoise: 0.93-0.97) → Image with controlled lighting
```

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
3. Search for "Coyotte's Palette Canvas"
4. Click Install

### Method 2: Git Clone
cd ComfyUI/custom_nodes
git clone https://github.com/yourusername/ComfyUI-PaletteCanvasRGB.git

### Method 3: Manual
1. Download this repository as ZIP
2. Extract to `ComfyUI/custom_nodes/ComfyUI-PaletteCanvasRGB/`
3. Restart ComfyUI

## How to Use

### Basic Lighting Control

1. **Add the node**: Right-click → `image` → `Coyotte's Palette Canvas (RGB)`

2. **Set up your light map**:
   - **Background**: Your base ambient color (e.g., dark blue for night)
   - **Gradient**: Optional color transition (e.g., orange for sunset glow)
   - **Shape**: Bright color for specific light sources (e.g., white circle for lamp)

3. **Connect to your workflow**:
   ```
   [Palette Canvas] → [VAE Encode] → [KSampler]
                                      ↑
                                [Prompt and other inputs]
   ```

4. **Set denoise to 0.93-0.97** in your sampler. Lower values (0.93) keep more of your gradient structure, higher values (0.97) give AI more freedom while maintaining the light direction.

### Parameters Explained

| Parameter | Purpose | Lighting Effect |
|-----------|---------|-----------------|
| **background** | Base ambient color | Overall scene mood (dark=blue night, light=white studio) |
| **gradient** | Secondary light color | Directional light flow (sunset, skylight) |
| **shape** | Point light source | Specific lamps, spotlights, glowing objects |
| **shape_position** | Light source location | Where the "lamp" is in your scene |
| **shape_scale_x/y** | Light spread | Wide beam vs focused spotlight |
| **gradient_angle** | Light direction | Which way the light flows |

## Practical Examples

### Example 1: Sunset Portrait
```
Background: #1a1a2e (deep blue)
Gradient: #ff6b35 (orange)
Gradient Direction: 270° (from top)
Denoise: 0.94
```
Result: Subject lit from above with warm sunset glow, cool shadows below.

### Example 2: Studio Spotlight
```
Background: #0f0f0f (near black)
Shape: #ffffff (white)
Shape Type: circle
Shape Scale: 0.3
Position: X: -0.5, Y: 0.3 (left side, slightly up)
Denoise: 0.95
```
Result: Dramatic side lighting as if from a studio softbox on the left.

### Example 3: Cinematic Window Light
```
Background: #2d2d2d (dark gray)
Shape: #ffe4b5 (warm cream)
Shape Type: rectangle
Shape Scale X: 1.5, Shape Scale Y: 0.4 (wide, flat)
Position: X: 0.8, Y: 0 (right side, center)
Denoise: 0.93
```
Result: Subject illuminated from the right as if by a large window.

## Technical Details

### Why Denoise 0.93-0.97?
- **0.90-0.93**: Gradient strongly influences the final image composition
- **0.94-0.96**: Balanced - AI follows the lighting but creates natural details
- **0.97-0.99**: Subtle influence - AI uses gradient as "mood suggestion"

### Aspect Ratio Handling
The node automatically corrects for non-square aspect ratios. A circle remains circular whether your canvas is 512×512 or 896×1152.

### Shape Distortion (scale_x/y)
Use independent X/Y scaling to create:
- **Elliptical lights** (stretched circle = wide light source)
- **Anamorphic flares** (compressed height = cinematic lens flares)
- **Custom light patterns** (rectangle stretched into line = neon strip)

## Tips & Tricks

1. **Start Simple**: Begin with just a background color and denoise 0.95, then add complexity
2. **Contrast is Key**: The bigger the difference between dark and bright areas, the stronger the lighting effect
3. **Color Temperature**: Match your gradient colors to real light sources (warm = fire/sun, cool = moon/ice)
4. **Multiple Shapes**: Combine several shapes for complex lighting setups (key + fill + rim lights)
5. **Animate Gradients**: Connect values to other nodes (like sine waves) for animated light effects in video workflows

## Node Reference

### Inputs
| Name | Type | Default | Range | Description |
|------|------|---------|-------|-------------|
| width | INT | 512 | 8-8192 | Canvas width |
| height | INT | 512 | 8-8192 | Canvas height |
| use_gradient | BOOLEAN | false | - | Enable color blending |
| use_shape | BOOLEAN | false | - | Enable light source shape |
| background | COLOR | #ff0000 | - | Base ambient color |
| gradient | COLOR | #0000ff | - | Gradient end color |
| shape | COLOR | #00ff00 | - | Light source color |
| shape_type | COMBO | circle | 4 options | Shape geometry |
| shape_scale | FLOAT | 0.5 | 0.1-2.0 | Overall light size |
| shape_scale_x | FLOAT | 0.0 | -2.5-2.5 | Horizontal stretch |
| shape_scale_y | FLOAT | 0.0 | -2.5-2.5 | Vertical stretch |
| shape_offset_x | FLOAT | 0.0 | -1.0-1.0 | Horizontal position |
| shape_offset_y | FLOAT | 0.0 | -1.0-1.0 | Vertical position |
| gradient_angle | FLOAT | 0.0 | 0-360° | Light flow direction |
| dither | BOOLEAN | true | - | Smooth gradient noise |
| dither_strength | FLOAT | 0.02 | 0.0-0.05 | Noise amount |

### Outputs
| Name | Type | Description |
|------|------|-------------|
| image | IMAGE | RGB tensor for VAE encoding |

## Requirements

- ComfyUI (any recent version)
- Modern browser (for interactive widgets)

No additional Python packages required.

## License

MIT License - See [LICENSE](LICENSE) file

## Credits

Created by **Coyotte**