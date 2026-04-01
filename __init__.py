"""
Palette Canvas - Adobe-style color mixer for ComfyUI
"""

from .palette_canvas import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Required exports for ComfyUI
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

# Optional: Add web directory specification
WEB_DIRECTORY = "./web"
