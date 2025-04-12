import fitz  # PyMuPDF
import pandas as pd
import os
import re 
import sys
import json
from pathlib import Path

class PDFScraper:
    @staticmethod
    def load_course_abbreviations(file_path: str) -> set:
        """Load course abbreviations from a CSV into a set for quick lookup."""
        try:
            df = pd.read_csv(file_path, header=None)
            return set(df[0].str.strip().tolist())
        except Exception as e:
            print(json.dumps({"error": f"Failed to load abbreviations: {str(e)}"}))
            sys.exit(1)

    @staticmethod
    def extract_text_from_pdf(file_path: str, abbreviations: set) -> list:
        """Extract and group semester headers with their courses."""
        try:
            doc = fitz.open(file_path)
            all_matching_lines = []

            for page in doc:
                text = page.get_text("text")
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                
                current_semester = None
                for line in lines:
                    if PDFScraper.is_semester_header(line):
                        current_semester = line
                        all_matching_lines.append({
                            "Semester": current_semester,
                            "Course": ""
                        })
                    elif current_semester and PDFScraper.is_valid_course_line(line, abbreviations):
                        all_matching_lines.append({
                            "Semester": "",
                            "Course": line
                        })

            return all_matching_lines
        except Exception as e:
            print(json.dumps({"error": f"PDF processing failed: {str(e)}"}))
            sys.exit(1)


    @staticmethod
    def is_semester_header(line: str) -> bool:
        return bool(re.search(r'(1ST|2ND|SEM|\d{4}-\d{4})', line))

    @staticmethod
    def is_valid_course_line(line: str, abbreviations: set) -> bool:
        return any(line.startswith(abbr) for abbr in abbreviations)

    @staticmethod
    def save_to_csv(data: list, output_path: str):
        """Save data to CSV with proper error handling."""
        try:
            df = pd.DataFrame(data)
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

            
            # Ensure output directory exists
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Process PDF
            abbreviations = PDFScraper.load_course_abbreviations(str(abbreviations_path))
            course_data = PDFScraper.extract_text_from_pdf(pdf_path, abbreviations)
            
            if not course_data:
                print(json.dumps({"error": "No matching course data found in PDF"}))
                sys.exit(1)
                
            # Save CSV
            output_path = output_dir / f"{output_name}.csv"
            PDFScraper.save_to_csv(course_data, str(output_path))
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python pdfScraper.py <pdf_file> <output_name>"}))
        sys.exit(1)
        
    PDFScraper.main(sys.argv[1], sys.argv[2])