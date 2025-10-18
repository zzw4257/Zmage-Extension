#!/usr/bin/env python3
"""
Generate placeholder icons for Zmage Chrome Extension
"""

from PIL import Image, ImageDraw, ImageFont
import os


def create_icon(size, output_path):
    """Create a simple placeholder icon with 'Z' letter"""
    # Create a new image with blue background
    img = Image.new("RGBA", (size, size), color=(74, 144, 226, 255))
    draw = ImageDraw.Draw(img)

    # Try to use a nice font, fallback to default if not available
    try:
        # Try common font locations
        font_size = int(size * 0.6)
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/Library/Fonts/Arial.ttf", font_size)
        except:
            # Use default font
            font = ImageFont.load_default()

    # Draw the letter 'Z' in the center
    text = "Z"

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Calculate position to center the text
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    # Draw white text
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)

    # Add rounded corners (optional enhancement)
    # Create a mask for rounded corners
    radius = size // 8
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)

    # Apply mask
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)

    # Save the icon
    output.save(output_path, "PNG")
    print(f"Created {output_path}")


def main():
    """Generate all required icon sizes"""
    icons_dir = "icons"

    # Ensure icons directory exists
    os.makedirs(icons_dir, exist_ok=True)

    # Generate icons in required sizes
    sizes = [16, 32, 48, 128]

    for size in sizes:
        output_path = os.path.join(icons_dir, f"icon{size}.png")
        create_icon(size, output_path)

    print("\nAll icons generated successfully!")
    print("Note: These are placeholder icons. Replace them with your final design.")


if __name__ == "__main__":
    main()
