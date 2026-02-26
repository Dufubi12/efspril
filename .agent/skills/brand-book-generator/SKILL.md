---
name: brand-book-generator
description: Generates a compact, professional Brand Book (Brand Guidelines) from a website URL or project files. Extracts colors, fonts, and analyzes Tone of Voice to create a ready-to-use markdown document. Use when the user asks to "create a brand book", "analyze brand style", or "generate brand guidelines" from a site.
---

# Brand Book Generator

## Overview

This skill analyzes visual and textual content from a provided URL or local files to generate a structured Brand Book. It automates the extraction of design tokens (colors, typography) and formulates a Brand Personality (Tone of Voice).

## When to Use

- User provides a URL and asks for a "Brand Book" or "Style Guide".
- User wants to extract design elements from an existing project.
- User needs a quick starting point for brand documentation.

## Workflow

### Step 1: Generate Visual Brand Book
**Goal:** Create a professional grade HTML/PDF brand book.

1.  **Input:** Identify the source URL.
2.  **Action:** Run the `generate_book.py` script.
    ```bash
    python .agent/skills/brand-book-generator/scripts/generate_book.py <URL> --name "<Optional Project Name>"
    ```
3.  **Process:**
    - The script extracts styles and determines tone.
    - It creates a dedicated folder: `brandbook/<domain>/`.
    - It generates `BrandBook_<domain>.html` and `BrandBook_<domain>.pdf` (if Playwright is available).

### Step 2: Quality Check
**Goal:** Verify the output.

1.  **Action:** Open the generated PDF or HTML file.
2.  **Refinement:**
    - If needed, you can pass a custom project name using the `--name` flag.
    - If PDF generation fails, simply open the HTML file and print it to PDF (Ctrl+P -> Save as PDF).

## Features

- **Dropbox-Style Aesthetic:** Minimalist, grid-based layout.
- **Auto-Organization:** Files are sorted by domain name.
- **Smart Typography:** Visually showcases heading and body font hierarchies.


## Degrees of Freedom (Medium)

- **Strict:** Use the provided scripts for consistency.
- **Creative:** You can customize the `analyze_tone` function in `generate_book.py` if the user provides specific text samples.


## Degrees of Freedom (Medium)

- **Strict:** Follow the `template_brandbook.md` structure. Do not invent new sections unless necessary.
- **Creative:** You have freedom in interpreting the "Tone of Voice" and naming the usage context for colors (e.g., "Used for high-priority CTAs").

## Resources
- `scripts/extract_styles.py`: Helper to parse HTML/CSS.
- `assets/template_brandbook.md`: Structure for the output file.
