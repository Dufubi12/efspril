#!/usr/bin/env python3
"""
Style Extractor for Brand Book Generator
Extracts HEX colors and Font Families from HTML/CSS content.
"""

import sys
import re
import json
import urllib.request
import argparse
from collections import Counter

def fetch_content(source):
    """Fetch content from URL or read from file/stdin."""
    if source.startswith('http://') or source.startswith('https://'):
        try:
            with urllib.request.urlopen(source) as response:
                return response.read().decode('utf-8')
        except Exception as e:
            return f"Error fetching URL: {e}"
    else:
        try:
            with open(source, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            return source  # Treat as raw text if file not found

def extract_styles(content):
    """Extract colors and fonts from content."""
    
    # HEX Color Regex (3 or 6 digits)
    hex_color_pattern = r'#(?:[0-9a-fA-F]{3}){1,2}\b'
    colors = re.findall(hex_color_pattern, content)
    
    # Normalize 3-digit hex to 6-digit
    normalized_colors = []
    for color in colors:
        if len(color) == 4:
            normalized_colors.append(f"#{color[1]*2}{color[2]*2}{color[3]*2}".upper())
        else:
            normalized_colors.append(color.upper())
            
    # Count frequency to find dominant colors
    color_counts = Counter(normalized_colors).most_common()
    
    # Font Family Regex
    # Matches: font-family: "Open Sans", sans-serif;
    font_pattern = r'font-family\s*:\s*([^;]+);'
    fonts = re.findall(font_pattern, content)
    
    # Clean up fonts
    cleaned_fonts = []
    for font_str in fonts:
        # Split by comma to get individual font names/stacks
        # We usually want the first one as it's the primary font
        primary_font = font_str.split(',')[0].strip().strip("'").strip('"')
        if primary_font:
            cleaned_fonts.append(primary_font)
            
    font_counts = Counter(cleaned_fonts).most_common()

    return {
        "colors": [{"hex": color, "count": count} for color, count in color_counts],
        "fonts": [{"family": font, "count": count} for font, count in font_counts]
    }

def main():
    parser = argparse.ArgumentParser(description="Extract styles from URL or file")
    parser.add_argument("source", nargs='?', help="URL, file path, or text content")
    parser.add_argument("--test", action="store_true", help="Run with test data")
    
    args = parser.parse_args()
    
    if args.test:
        test_content = """
        <html>
        <style>
            body { font-family: 'Roboto', sans-serif; color: #333; background: #FFF; }
            h1 { color: #ff0000; font-family: "Helvetica Neue"; }
            .accent { color: #f00; border: 1px solid #00FF00; }
        </style>
        </html>
        """
        result = extract_styles(test_content)
        print(json.dumps(result, indent=2))
        return

    content = fetch_content(args.source)
    if content.startswith("Error"):
        print(json.dumps({"error": content}))
        sys.exit(1)
        
    result = extract_styles(content)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
