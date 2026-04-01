import torch
import numpy as np
import math

class PaletteCanvasGradient:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "width": ("INT", {"default": 512, "min": 8, "max": 8192, "step": 8}),
                "height": ("INT", {"default": 512, "min": 8, "max": 8192, "step": 8}),
                "use_gradient": ("BOOLEAN", {"default": False}),
                "use_shape": ("BOOLEAN", {"default": False}),
            },
            "optional": {
                # VAE input for latent encoding
                "vae": ("VAE",),
                # Colors
                "background": ("COLOR", {"default": "#ff0000"}),
                "gradient": ("COLOR", {"default": "#0000ff"}),
                "shape": ("COLOR", {"default": "#00ff00"}),
                
                # Shape controls
                "shape_type": (["circle", "square", "triangle", "rectangle"],),
                "shape_scale": ("FLOAT", {"default": 0.5, "min": 0.1, "max": 2.0, "step": 0.01}),
                "shape_scale_x": ("FLOAT", {"default": 0.0, "min": -2.5, "max": 2.5, "step": 0.01}),
                "shape_scale_y": ("FLOAT", {"default": 0.0, "min": -2.5, "max": 2.5, "step": 0.01}),
                "shape_offset_x": ("FLOAT", {"default": 0.0, "min": -1.0, "max": 1.0, "step": 0.01}),
                "shape_offset_y": ("FLOAT", {"default": 0.0, "min": -1.0, "max": 1.0, "step": 0.01}),
                
                # Gradient controls
                "gradient_angle": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 360.0, "step": 1.0}),
                
                "dither": ("BOOLEAN", {"default": True}),
                "dither_strength": ("FLOAT", {"default": 0.02, "min": 0.0, "max": 0.05, "step": 0.001}),
            },
        }

    RETURN_TYPES = ("IMAGE", "LATENT")
    RETURN_NAMES = ("image", "latent")
    FUNCTION = "make_canvas"
    CATEGORY = "image"

    def hex_to_rgb_tensor(self, hex_color):
        """Convert HEX color to RGB tensor (0-1 range)"""
        hex_color = hex_color.lstrip('#')
        r = int(hex_color[0:2], 16) / 255.0
        g = int(hex_color[2:4], 16) / 255.0
        b = int(hex_color[4:6], 16) / 255.0
        return torch.tensor([r, g, b], dtype=torch.float32)

    def create_shape_mask(self, width, height, shape_type, scale, scale_x=0.0, scale_y=0.0, offset_x=0.0, offset_y=0.0):
        """Create a mask for the specified geometric shape"""
        aspect = width / height
        
        y_grid, x_grid = torch.meshgrid(
            torch.linspace(-1.0, 1.0, height, dtype=torch.float32),
            torch.linspace(-1.0, 1.0, width, dtype=torch.float32),
            indexing="ij"
        )
        
        # Apply aspect ratio correction to prevent shape distortion
        # Scale x coordinates so that 1 unit in X equals 1 unit in Y in pixel space
        x_grid = x_grid * aspect
        offset_x = offset_x * aspect
        
        # Apply independent X/Y scaling (0 = no distortion, positive = stretch, negative = squeeze)
        # Convert -2..2 range to 0.25..4.0 scale factor (0 -> 1.0, 2 -> 4.0, -2 -> 0.25)
        scale_factor_x = 2.0 ** (-scale_x)  # 0 -> 1, 1 -> 0.5, -1 -> 2
        scale_factor_y = 2.0 ** (-scale_y)
        x_grid = x_grid * scale_factor_x
        y_grid = y_grid * scale_factor_y
        
        # Apply offset to shift shape position
        # Positive offset_x moves shape RIGHT (subtract from grid to move shape right)
        # Positive offset_y moves shape DOWN (add to grid to move shape down)
        x_grid = x_grid - offset_x
        y_grid = y_grid + offset_y
        
        mask = torch.zeros((height, width), dtype=torch.float32)
        
        if shape_type == "circle":
            # Circle: x^2 + y^2 <= r^2
            distance = torch.sqrt(x_grid**2 + y_grid**2)
            mask = (distance <= scale).float()
        
        elif shape_type == "square":
            # Square: max(|x|, |y|) <= size
            mask = ((torch.abs(x_grid) <= scale) & (torch.abs(y_grid) <= scale)).float()
        
        elif shape_type == "rectangle":
            # Rectangle: wider than tall (2:1 aspect ratio)
            scale_x = scale * 1.5
            scale_y = scale * 0.75
            mask = ((torch.abs(x_grid) <= scale_x) & (torch.abs(y_grid) <= scale_y)).float()
        
        elif shape_type == "triangle":
            # Equilateral triangle pointing up
            # Make it smaller to fit within the scale and correct aspect ratio
            triangle_scale = scale * 0.5  # Reduce overall size
            sqrt3 = math.sqrt(3)
            
            # Transform coordinates - center the triangle
            y_offset = y_grid + triangle_scale * 0.5
            
            # Define three edges of the equilateral triangle
            # Height of equilateral triangle = sqrt(3)/2 * base
            # For proper proportions, we scale x by sqrt(3) to match the triangle geometry
            edge1 = x_grid * sqrt3 + y_offset * 3 <= triangle_scale * 1.5
            edge2 = -x_grid * sqrt3 + y_offset * 3 <= triangle_scale * 1.5
            edge3 = y_offset >= -triangle_scale * 0.5
            
            mask = (edge1 & edge2 & edge3).float()
        
        return mask

    def make_canvas(self, width, height, use_gradient, use_shape,
                   vae=None,
                   background="#ff0000",
                   gradient="#0000ff",
                   shape="#00ff00",
                   shape_type="circle", shape_scale=0.5,
                   shape_scale_x=0.0, shape_scale_y=0.0,
                   shape_offset_x=0.0, shape_offset_y=0.0,
                   gradient_angle=0.0,
                   dither=True, dither_strength=0.02):
        
        # Debug print to verify offset values are being received
        print(f"Shape offset - X: {shape_offset_x}, Y: {shape_offset_y}")
        
        # Convert HEX colors directly to RGB tensors
        background = self.hex_to_rgb_tensor(background)
        gradient = self.hex_to_rgb_tensor(gradient)
        shape = self.hex_to_rgb_tensor(shape)
        
        # Start with background color
        img = torch.full((height, width, 3), fill_value=0.0, dtype=torch.float32)
        img[:] = background
        
        # Apply gradient if enabled
        if use_gradient:
            # Convert angle to direction vector
            # Angle in degrees where 0В° = right, 90В° = up, 180В° = left, 270В° = down
            angle_rad = math.radians(gradient_angle)
            direction_x = math.cos(angle_rad)
            direction_y = -math.sin(angle_rad)  # Invert Y for correct direction
            
            dir_vec = np.array([direction_x, direction_y], dtype=np.float32)
            norm = np.linalg.norm(dir_vec)
            dir_vec = dir_vec / norm if norm != 0 else np.array([1.0, 0.0], dtype=np.float32)
            
            y_grid, x_grid = torch.meshgrid(
                torch.linspace(-1.0, 1.0, height, dtype=torch.float32),
                torch.linspace(-1.0, 1.0, width, dtype=torch.float32),
                indexing="ij"
            )
            
            dot = x_grid * dir_vec[0] + y_grid * dir_vec[1]
            dot = (dot - dot.min()) / (dot.max() - dot.min())
            
            if dither and dither_strength > 0.0:
                noise = (torch.rand_like(dot) - 0.5) * 2.0 * dither_strength
                dot = torch.clamp(dot + noise, 0.0, 1.0)
            
            dot = dot.unsqueeze(-1)
            img = background * (1.0 - dot) + gradient * dot
        
        # Apply shape if enabled
        if use_shape:
            shape_mask = self.create_shape_mask(width, height, shape_type, shape_scale, shape_scale_x, shape_scale_y, shape_offset_x, shape_offset_y)
            shape_mask = shape_mask.unsqueeze(-1)  # Add channel dimension
            
            # Blend shape color with existing image
            img = img * (1.0 - shape_mask) + shape * shape_mask
        
        img = img.unsqueeze(0)

        latent = None
        if vae is not None:
            latent = {"samples": vae.encode(img)}

        return (img, latent)

NODE_CLASS_MAPPINGS = {
    "PaletteCanvasGradient": PaletteCanvasGradient
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PaletteCanvasGradient": "Coyotte's Palette Canvas"
}