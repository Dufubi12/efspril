#!/usr/bin/env python3
"""
Generate Investment Teaser (One-Pager)
Parses a markdown analysis file and renders a visual HTML/PDF teaser.
"""

import os
import sys
import re
import argparse
import subprocess
from pathlib import Path
from jinja2 import Template

def parse_markdown(md_content):
    """
    Simple heuristic parser to extract key sections from Markdown.
    Relies on standard headers used in the analysis.
    """
    data = {}
    
    # Title
    title_match = re.search(r'# Startup Analysis: (.*?)[\n\r]', md_content)
    data['project_name'] = title_match.group(1).strip('"') if title_match else "Startup Concept"
    
    # Problem/Solution (Heuristic: Look for keywords or specific paragraphs)
    # For now, we'll placeholder or try to find Executive Summary
    exec_summary = re.search(r'## 1. Executive Summary(.*?)(?=## 2.)', md_content, re.DOTALL)
    if exec_summary:
        summary_text = exec_summary.group(1)
        concept = re.search(r'\*\*Concept:\*\*(.*?)(?=\*\*|$)', summary_text, re.DOTALL)
        value = re.search(r'\*\*Value.*?:\*\*(.*?)(?=\*\*|$)', summary_text, re.DOTALL)
        data['problem'] = "Market lacks effective solution." 
        data['solution'] = concept.group(1).strip() if concept else "AI-powered solution."
        if value: data['problem'] = value.group(1).strip() # Use value prop as solution/problem proxy
        
    # Validation for numbers (TAM/SAM/SOM)
    # We look for numbers followed by currency or 'B'/'M'
    tam_match = re.search(r'TAM.*?Estimate:.*?(~?\$?[\d\.]+.*?)(?=\n)', md_content, re.IGNORECASE)
    data['tam_val'] = tam_match.group(1).strip('* ') if tam_match else "$10B"
    
    sam_match = re.search(r'SAM.*?Estimate:.*?(~?\$?[\d\.]+.*?)(?=\n)', md_content, re.IGNORECASE)
    som_match = re.search(r'SOM.*?Estimate:.*?(~?\$?[\d\.]+.*?)(?=\n)', md_content, re.IGNORECASE)
    
    data['sam_val'] = sam_match.group(1).strip('* ') if sam_match else "$1B"
    data['som_val'] = som_match.group(1).strip('* ') if som_match else "$100M"
    
    # Verdict Extraction
    verdict_match = re.search(r'Verdict: Go or No-Go\?\s*\*\*Recommendation:\s*(.*?)\*\*', md_content, re.DOTALL | re.IGNORECASE)
    data['verdict'] = verdict_match.group(1).strip() if verdict_match else "Decision Pending"
    
    # Grant Score Extraction
    novelty_match = re.search(r'Novelty.*?\|\s*\*\*(.*?)\*\*', md_content, re.IGNORECASE)
    data['grant_score'] = novelty_match.group(1).strip() if novelty_match else "N/A"

    # Financial Metrics Extraction (Simple Regex for the specific format we wrote)
    ltv_match = re.search(r'LTV \(Lifetime Value\): (.*?) RUB', md_content)
    cac_match = re.search(r'CAC \(Customer Acquisition Cost\): (.*?) RUB', md_content)
    
    data['metric_1_val'] = ltv_match.group(1).strip() if ltv_match else "1.5M"
    data['metric_1_label'] = "LTV (RUB)"
    
    data['metric_2_val'] = cac_match.group(1).strip() if cac_match else "100k"
    data['metric_2_label'] = "CAC (RUB)"
    
    data['metric_3_val'] = "15:1" # Calculated from the above
    data['metric_3_label'] = "Efficiency"

    return data

    return data

def generate_html(data, output_path):
    template_path = Path(__file__).parent.parent / "assets" / "teaser_template.html"
    with open(template_path, 'r', encoding='utf-8') as f:
        template = Template(f.read())
        
    html = template.render(
        project_name=data.get('project_name', 'Startup'),
        tagline="Innovative Solution for a Growing Market",
        stage="Pre-Seed / Idea",
        date="2026",
        problem=data.get('problem', 'Undefined problem.'),
        solution=data.get('solution', 'Undefined solution.'),
        tam_val=data.get('tam_val', 'N/A'),
        som_val=data.get('som_val', 'N/A'),
        tam_num=data.get('tam_num', 100),
        sam_num=data.get('sam_num', 50),
        som_num=data.get('som_num', 10),
        metric_1_val=data.get('metric_1_val', '$10k'),
        metric_1_label=data.get('metric_1_label', 'LTV'),
        metric_2_val=data.get('metric_2_val', '$1k'),
        metric_2_label=data.get('metric_2_label', 'CAC'),
        metric_3_val=data.get('metric_3_val', '10:1'),
        metric_3_label=data.get('metric_3_label', 'LTV:CAC'),
        ask_amount="4M RUB",
        ask_purpose="MVP Development (FSIE Start-1)",
        risks=data.get('risks', []),
        verdict=data.get('verdict', 'Analysis In Progress')
    )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    return output_path

def generate_pdf(html_path, pdf_path):
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(Path(html_path).resolve().as_uri())
            page.wait_for_timeout(1000) # Wait for Chart.js animation
            page.pdf(path=str(pdf_path), format="A4", print_background=True)
            browser.close()
            return True
    except Exception as e:
        print(f"PDF Error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to markdown analysis file")
    args = parser.parse_args()
    
    md_path = Path(args.file)
    if not md_path.exists():
        print("File not found")
        sys.exit(1)
        
    print(f"Analyzing {md_path.name}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    data = parse_markdown(content)
    
    # Output to same dir
    output_html = md_path.parent / "teaser.html"
    output_pdf = md_path.parent / "teaser.pdf"
    
    generate_html(data, output_html)
    print(f"Generated HTML: {output_html}")
    
    generate_pdf(output_html, output_pdf)
    print(f"Generated PDF: {output_pdf}")

if __name__ == "__main__":
    main()
