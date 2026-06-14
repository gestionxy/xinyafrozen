# -*- coding: utf-8 -*-
import re
import sys
import subprocess
from pathlib import Path
from datetime import datetime

def install_if_missing(package_name, import_name=None):
    if import_name is None:
        import_name = package_name
    try:
        __import__(import_name)
    except ImportError:
        print(f"Installing missing package: {package_name}")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])

def clean_path(path_text):
    path_text = str(path_text).strip()
    while len(path_text) >= 2 and path_text[0] == '"' and path_text[-1] == '"':
        path_text = path_text[1:-1].strip()
    return path_text

def get_pdf_path():
    if len(sys.argv) < 2:
        print("PDF path was not received from BAT.")
        input("Press Enter to exit...")
        sys.exit(1)
    raw_path = " ".join(sys.argv[1:])
    pdf_path = Path(clean_path(raw_path))
    if not pdf_path.exists():
        print()
        print("File not found:")
        print(pdf_path)
        input("Press Enter to exit...")
        sys.exit(1)
    if pdf_path.suffix.lower() != ".pdf":
        print()
        print("This is not a PDF file:")
        print(pdf_path)
        input("Press Enter to exit...")
        sys.exit(1)
    return pdf_path

def is_product_start(line):
    return re.match(r"^\d{6}\s+.+", line.strip()) is not None

def split_product_blocks(lines):
    blocks = []
    current = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if is_product_start(line):
            if current:
                blocks.append(current)
            current = [line]
        else:
            if current:
                current.append(line)
    if current:
        blocks.append(current)
    return blocks

def extract_one_block(block, page_number):
    first_line = block[0].strip()
    m_start = re.match(r"^(\d{6})\s+(.+)$", first_line)
    if not m_start:
        return None

    code = m_start.group(1).strip()
    english_name = m_start.group(2).strip()
    block_text = " ".join(block)

    chinese_desc = ""
    master_case_unit = ""

    m_chinese = re.search(
        r"Chinese Desc\s*(.*?)\s*Pallet\s*\(TI\s*X\s*HI\)",
        block_text,
        flags=re.IGNORECASE
    )
    if m_chinese:
        chinese_desc = m_chinese.group(1).strip()

    m_master = re.search(
        r"Master Case Unit\s*(.*?)\s*Gross WT",
        block_text,
        flags=re.IGNORECASE
    )
    if m_master:
        master_case_unit = m_master.group(1).strip()

    final_result = f"{code} {english_name} - {chinese_desc} - {master_case_unit}"

    return {
        "Code": code,
        "English Name": english_name,
        "Chinese Desc": chinese_desc,
        "Master Case Unit": master_case_unit,
        "Final Result": final_result,
        "Page": page_number,
    }

def extract_all_products(pdf_path):
    import pdfplumber
    results = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            lines = text.splitlines()
            blocks = split_product_blocks(lines)
            for block in blocks:
                item = extract_one_block(block, page_index)
                if item:
                    results.append(item)
    return results

def main():
    print("THL ALL products extractor started.")

    install_if_missing("pdfplumber", "pdfplumber")
    install_if_missing("pandas", "pandas")
    install_if_missing("openpyxl", "openpyxl")

    import pandas as pd

    pdf_path = get_pdf_path()

    print()
    print("Reading PDF:")
    print(pdf_path)

    data = extract_all_products(pdf_path)

    if not data:
        print()
        print("No product records found.")
        input("Press Enter to exit...")
        sys.exit(1)

    py_folder = Path(__file__).resolve().parent
    output_folder = py_folder / "THL"
    output_folder.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_file = output_folder / f"THL_{timestamp}.xlsx"

    df = pd.DataFrame(data)
    df = df[["Code", "English Name", "Chinese Desc", "Master Case Unit", "Final Result", "Page"]]

    with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="THL")
        ws = writer.book["THL"]
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        widths = {"A": 12, "B": 45, "C": 35, "D": 22, "E": 95, "F": 10}
        for col, width in widths.items():
            ws.column_dimensions[col].width = width

    print()
    print(f"Extracted records: {len(data)}")
    print("Excel created successfully:")
    print(output_file)
    print()
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()
