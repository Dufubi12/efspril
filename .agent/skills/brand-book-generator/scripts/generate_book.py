#!/usr/bin/env python3
"""
Brand Book Generator Script (Visual Upgrade)
- Dropbox-style minimalist design
- URL-based folder organization
- PDF generation via Playwright
"""

import os
import sys
import json
import argparse
import subprocess
import datetime
from urllib.parse import urlparse
from pathlib import Path

# Try to import jinja2
try:
    from jinja2 import Template
except ImportError:
    print("Error: jinja2 is required. Please install it using 'pip install jinja2'")
    sys.exit(1)

def get_domain_name(url):
    """Extract domain from URL (e.g., https://example.com -> example.com)."""
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    if domain.startswith("www."):
        domain = domain[4:]
    return domain

def run_extraction(url):
    """Run extract_styles.py and return result."""
    script_path = Path(__file__).parent / "extract_styles.py"
    try:
        # Run extraction script and capture output
        result = subprocess.check_output(
            [sys.executable, str(script_path), url], 
            stderr=subprocess.STDOUT
        )
        return json.loads(result)
    except subprocess.CalledProcessError as e:
        print(f"Error running extraction: {e.output.decode()}")
        return None
    except json.JSONDecodeError:
        print(f"Error parsing extraction output: {result}")
        return None

def analyze_tone(url):
    """
    Placeholder for Tone of Voice analysis.
    """
    return {
        "primary": "Professional & Trustworthy",
        "intro": f"These brand guidelines for {url} ensure consistency across all visual and textual communications. Our voice is clear, helpful, and modern.",
        "traits": [
            {"name": "Clear", "desc": "We communicate complex ideas simply and directly."},
            {"name": "Helpful", "desc": "We are empathetic and always ready to assist our users."},
            {"name": "Modern", "desc": "We use forward-thinking design and language."}
        ]
    }

def generate_html(data, output_path):
    """Render HTML from template."""
    template_path = Path(__file__).parent.parent / "assets" / "brandbook_template.html"
    
    with open(template_path, 'r', encoding='utf-8') as f:
        template = Template(f.read())
        
    html_content = template.render(
        project_name=data.get("project_name", "Brand Book"),
        domain=data.get("domain", ""),
        date=datetime.date.today().strftime("%B %d, %Y"),
        primary_color=data["colors"][0]["hex"] if data["colors"] else "#000000",
        secondary_color=data["colors"][1]["hex"] if len(data["colors"]) > 1 else "#333333",
        accent_color=data["colors"][2]["hex"] if len(data["colors"]) > 2 else "#666666",
        font_heading=data["fonts"][0]["family"] if data["fonts"] else "Arial",
        font_body=data["fonts"][1]["family"] if len(data["fonts"]) > 1 else (data["fonts"][0]["family"] if data["fonts"] else "sans-serif"),
        introduction=data["tone"]["intro"],
        tone_primary=data["tone"]["primary"],
        tone_traits=data["tone"]["traits"]
    )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return output_path

def generate_pdf(html_path, pdf_path):
    """
    Attempt to generate PDF using Playwright.
    Handles installation of chromium if needed.
    """
    try:
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            # Launch browser (this might fail if chromium is not installed)
            try:
                browser = p.chromium.launch()
            except Exception:
                print("⚠️ Chromium not found. Installing...")
                subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
                browser = p.chromium.launch()

            page = browser.new_page()
            # Convert local path to file:// URL (handle Windows paths correctly)
            file_url = Path(html_path).resolve().as_uri()
            page.goto(file_url)
            # Wait for specific elements or network idle
            page.wait_for_load_state("networkidle")
            
            # Print configuration for A4, high quality
            page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                margin={"top": "0", "bottom": "0", "left": "0", "right": "0"}
            )
            browser.close()
            return True
            
    except ImportError:
        print("Warning: Playwright not installed. Skipping PDF generation.")
        print("Tip: Install playwright with 'pip install playwright'")
        return False
    except Exception as e:
        print(f"Warning: PDF generation failed: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Generate Brand Book PDF/HTML")
    parser.add_argument("url", help="URL of the website")
    parser.add_argument("--name", "-n", help="Project Name (optional)")
    parser.add_argument("--output", "-o", help="Base output directory", default="brandbook")
    
    args = parser.parse_args()
    
    domain = get_domain_name(args.url)
    project_name = args.name if args.name else domain.capitalize()
    
    print(f"🚀 Starting Brand Book generation for {domain}...")
    
    # 0. Setup Directories
    output_dir = Path(args.output) / domain
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"📂 Output folder: {output_dir}")
    
    # 1. Extract Styles
    print("🎨 Extracting styles...")
    style_data = run_extraction(args.url)
    if not style_data:
        print("❌ Failed to extract styles.")
        sys.exit(1)
        
    # 2. Analyze Tone
    print("🗣️ Analyzing tone of voice...")
    tone_data = analyze_tone(args.url)
    
    # 3. Combine Data
    full_data = {
        "project_name": project_name,
        "domain": domain,
        "colors": style_data.get("colors", []),
        "fonts": style_data.get("fonts", []),
        "tone": tone_data
    }
    
    # 4. Generate HTML
    filename_base = f"BrandBook_{domain}"
    html_path = output_dir / f"{filename_base}.html"
    generate_html(full_data, html_path)
    print(f"✅ Generated HTML: {html_path}")
    
    # 5. Generate PDF
    pdf_path = output_dir / f"{filename_base}.pdf"
    print("📄 Attempting PDF generation...")
    if generate_pdf(html_path, pdf_path):
        print(f"✅ Generated PDF: {pdf_path}")
    else:
        print("⚠️ PDF generation skipped or failed.")
        print(f"👉 Open {html_path} and 'Print to PDF' manually.")

if __name__ == "__main__":
    main()
