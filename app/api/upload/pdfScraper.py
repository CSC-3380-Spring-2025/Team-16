import fitz  # PyMuPDF
import pandas as pd
import os
import re
import sys
import json
from pathlib import Path

class PDFScraper:
    # Get all course abbreviations for LSU
    @staticmethod
    def load_course_abbreviations(file_path: str) -> set:
        try:
            df = pd.read_csv(file_path, header=None)
            return set(df[0].str.strip().tolist())
        except Exception as e:
            print(json.dumps({"error": f"Failed to load abbreviations: {str(e)}"}))
            sys.exit(1)

    # Get search terms for semester headers
    @staticmethod
    def is_semester_header(line: str) -> bool:
        return bool(re.search(r'(1ST|2ND|SEM|\d{4}-\d{4})', line))

    # Get search terms for course lines
    @staticmethod
    def is_valid_course_line(line: str, abbreviations: set) -> bool:
        return any(line.startswith(abbr) for abbr in abbreviations)

    # Extract needed text from the PDF
    @staticmethod
    def extract_text_from_pdf(file_path: str, abbreviations: set) -> pd.DataFrame:
        try:
            doc = fitz.open(file_path)
            all_semester_dfs = []

            for page in doc:
                # Split the page into left and right halves
                width = page.rect.width
                left_rect = fitz.Rect(0, 0, width / 2, page.rect.height)
                right_rect = fitz.Rect(width / 2, 0, width, page.rect.height)

                for half in [left_rect, right_rect]:
                    text = page.get_text("text", clip=half)
                    lines = [line.strip() for line in text.split('\n') if line.strip()]

                    current_semester = None
                    current_courses = []

                    for line in lines:
                        if PDFScraper.is_semester_header(line):
                            if current_semester and current_courses:
                                df = pd.DataFrame(current_courses)
                                df["Semester"] = current_semester
                                all_semester_dfs.append(df)
                                current_courses = []

                            current_semester = line

                        elif current_semester and PDFScraper.is_valid_course_line(line, abbreviations):
                            match = re.match(r'^([A-Z]{2,5})\s+(\d{3,4})\s+(\S+)\s+([\d\.]+)?\s+([\d\.]+)?\s+([\d\.]+)?', line)
                            if match:
                                dept, crse, gr, carr, earn, qpts = match.groups()
                                current_courses.append({
                                    "DEPT": dept,
                                    "CRSE": crse,
                                    "GR": gr,
                                    "CARR": carr,
                                    "EARN": earn,
                                    "QPTS": qpts
                                })

                    if current_semester and current_courses:
                        df = pd.DataFrame(current_courses)
                        df["Semester"] = current_semester
                        all_semester_dfs.append(df)

            final_df = pd.concat(all_semester_dfs, ignore_index=True)
            return final_df

        except Exception as e:
            print(json.dumps({"error": f"PDF processing failed: {str(e)}"}))
            sys.exit(1)

    # Save to csv
    @staticmethod
    def save_to_csv(df: pd.DataFrame, output_path: str):
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            df.to_csv(output_path, index=False)
            print(json.dumps({"success": True, "csv_path": output_path}))
        except Exception as e:
            print(json.dumps({"error": f"CSV save failed: {str(e)}"}))
            sys.exit(1)

    @staticmethod
    def main(pdf_path: str, output_name: str):
        try:
            base_dir = Path(__file__).parent
            abbreviations_path = base_dir / "course_abbreviations.csv"
            output_dir = base_dir / "data"
            output_dir.mkdir(parents=True, exist_ok=True)

            abbreviations = PDFScraper.load_course_abbreviations(str(abbreviations_path))
            final_df = PDFScraper.extract_text_from_pdf(pdf_path, abbreviations)

            if final_df.empty:
                print(json.dumps({"error": "No matching course data found in PDF"}))
                sys.exit(1)

            output_path = output_dir / f"{output_name}.csv"
            PDFScraper.save_to_csv(final_df, str(output_path))

        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python pdfScraper.py <pdf_file> <output_name>"}))
        sys.exit(1)

    PDFScraper.main(sys.argv[1], sys.argv[2])
