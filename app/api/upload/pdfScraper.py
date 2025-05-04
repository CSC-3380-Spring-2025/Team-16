import fitz  # PyMuPDF
import json
import re
import sys
import os
from pathlib import Path


class PDFScraper:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> tuple:
        doc = fitz.open(file_path)
        all_data = []
        raw_text = []

        current_section = None
        current_semester = None

        for page in doc:
            # Get the raw text from the page and save it
            page_text = page.get_text("text")
            raw_text.append(page_text)
            
            # Process the text for structured data extraction
            lines = [line.strip() for line in page_text.split('\n') if line.strip()]
            i = 0

            while i < len(lines):
                line = lines[i]

                # Detect sections
                if "Credit by Exam" in line:
                    current_section = "exam"
                    current_semester = "Credit by Exam"
                    i += 1
                    continue
                elif "External Credit" in line:
                    current_section = "external"
                    current_semester = "External Credit"
                    i += 1
                    continue
                elif re.match(r"(Fall|Spring|Summer)\sSemester\s\d{4}", line):
                    current_section = "semester"
                    current_semester = line.strip()
                    i += 1
                    continue

                # Process external/exam blocks
                if current_section in ["exam", "external"]:
                    if re.match(r"^[A-Z]{4}\s\d{4}\s-.*", line):
                        parts = line.split()
                        dept = parts[0]
                        crse = parts[1]
                        title_parts = [" ".join(parts[2:]).replace("-", "").strip()]
                        j = i + 1

                        # Keep appending lines to title until we hit something that looks like a grade
                        while j < len(lines) and not re.match(r"^[A-F][+-]?$|^Pass$|^Fail$", lines[j], re.IGNORECASE):
                            title_parts.append(lines[j].strip())
                            j += 1

                        title = " ".join(title_parts)

                        grade = lines[j] if j < len(lines) else ""
                        carr = lines[j + 1] if j + 1 < len(lines) else ""
                        earn = lines[j + 2] if j + 2 < len(lines) else ""

                        all_data.append({
                            "DEPT": dept,
                            "CRSE": crse,
                            "TITLE": title,
                            "GR": grade,
                            "CARR": carr,
                            "EARN": earn,
                            "SOURCE": current_section,
                            "SEMESTER": current_semester
                        })

                        i = j + 3
                        continue


                # Process LSU semester 5-line course blocks
                if current_section == "semester":
                    # Ensure there are enough lines ahead
                    if i + 4 < len(lines) and re.match(r"^[A-Z]{3,4}\s\d{4}", lines[i]):
                        dept_crse = lines[i].split()
                        title = lines[i + 1]
                        grade = lines[i + 2]
                        carr = lines[i + 3]
                        earn = lines[i + 4]

                        if len(dept_crse) == 2:
                            dept, crse = dept_crse
                            all_data.append({
                                "DEPT": dept,
                                "CRSE": crse,
                                "TITLE": title,
                                "GR": grade,
                                "CARR": carr,
                                "EARN": earn,
                                "SOURCE": "semester",
                                "SEMESTER": current_semester
                            })
                            i += 5
                            continue

                i += 1

        # Combine all raw text pages into a single string
        full_raw_text = '\n'.join(raw_text)
        
        return all_data, full_raw_text

    @staticmethod
    def save_to_json(data: list, output_path: str):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(json.dumps({"success": True, "json_path": output_path}))

    @staticmethod
    def main(pdf_path: str, output_name: str):
        try:
            base_dir = Path(__file__).parent
            output_dir = base_dir / "data"
            output_path = output_dir / f"{output_name}.json"

            data = PDFScraper.extract_text_from_pdf(pdf_path)
            if not data:
                print(json.dumps({"error": "No course data found in transcript"}))
                sys.exit(1)

            PDFScraper.save_to_json(data, str(output_path))

        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python pdfScraper.py <pdf_file> <output_name>"}))
        sys.exit(1)

    PDFScraper.main(sys.argv[1], sys.argv[2])
