import fitz  # PyMuPDF
import pandas as pd
import os
import re 
import json


class PDFscraper:


   @staticmethod
   def load_course_abbreviations(file_path: str) -> set:
       """Load course abbreviations from a CSV into a set for quick lookup."""
       df = pd.read_csv(file_path, header=None)
       return set(df[0].str.strip().tolist())


   @staticmethod
   def extract_text_from_half(page: fitz.Page, left_side: bool) -> list:
       """Extracts text from one half of the page (left or right)."""
       width = page.rect.width
       height = page.rect.height
       bbox = (0, 0, width / 2, height) if left_side else (width / 2, 0, width, height)
       text = page.get_text("text", clip=fitz.Rect(bbox))
       return text.split("\n")


   @staticmethod
   def extract_text_from_pdf(file_path: str, abbreviations: set) -> list:
       """Extract and filter semester headers with relevant courses from both halves of a PDF."""
       read_pdf: fitz.Document = fitz.open(file_path)
       all_matching_lines = []


       for page_num in range(len(read_pdf)):
           page: fitz.Page = read_pdf[page_num]
           all_matching_lines.extend(PDFscraper.process_page(page, abbreviations, left_side=True))
           all_matching_lines.extend(PDFscraper.process_page(page, abbreviations, left_side=False))


       return all_matching_lines


   @staticmethod
   def process_page(page: fitz.Page, abbreviations: set, left_side: bool) -> list:
       """Processes a page by semester and returns relevant courses."""
       lines = PDFscraper.extract_text_from_half(page, left_side)
       matching_lines = []
       current_semester = None


       for line in lines:
           line = line.strip()


           # Check for valid semester header or valid course line
           if PDFscraper.is_semester_header(line):
               current_semester = line 


           # Only consider valid courses under the current semester
           elif current_semester and PDFscraper.is_valid_course_line(line, abbreviations):
               matching_lines.append(f"{current_semester} - {line}")


       return matching_lines


   @staticmethod
   def is_semester_header(line: str) -> bool:
       """Check if a line represents a semester header."""
       # Semester header pattern: "1ST SEM", "2ND SEM", or "2023-2024" etc.
       return bool(re.search(r'(1ST|2ND|SEM|\d{4}-\d{4})', line))


   @staticmethod
   def is_valid_course_line(line: str, abbreviations: set) -> bool:
       """Check if a line is a valid course based on course abbreviations."""
       return any(line.startswith(abbr) for abbr in abbreviations)


   @staticmethod
   def save_to_csv(matching_lines: list, file_name: str):
       """Save the matching lines to a CSV file in the 'data' folder."""
       # Split the matching lines into a list of tuples (semester, course)
       data = []
       for line in matching_lines:
           semester, course = line.split(" - ", 1)  # Split based on the first " - " found
           data.append([semester, course])


       # Create a DataFrame with appropriate headers
       df = pd.DataFrame(data, columns=["Semester", "Course"])
      
       os.makedirs(os.path.dirname(file_name), exist_ok=True)
       df.to_csv(file_name, index=False)


   @staticmethod
   def main(course_file, uploaded_file_name):
       try:
           file_path: str = course_file
           class_codes_df: pd.DataFrame = pd.read_csv("../schedule-lsu/app/upload/course_abbreviations.csv")
           class_codes: set = PDFscraper.load_course_abbreviations("../schedule-lsu/app/upload/course_abbreviations.csv")


           # Extract relevant text from the PDF
           matching_lines: list = PDFscraper.extract_text_from_pdf(file_path, class_codes)


           if not matching_lines:
               raise ValueError("No matching lines found for the given PDF.")


           # Save the matching lines to a CSV file in the 'data' folder
           output_csv_path = f"../schedule-lsu/app/upload/data/{uploaded_file_name}.csv"
           PDFscraper.save_to_csv(matching_lines, output_csv_path)


           # Output the result as JSON (this will be captured by the Node.js backend)
           result = {"data": matching_lines}
           print(json.dumps(result))  # Printing to stdout for backend processing


       except Exception as e:
           error_message = {"error": str(e)}
           print(json.dumps(error_message))  # Print error as JSON for backend processing




if __name__ == "__main__":
   import sys
   course_file = sys.argv[1] 
   uploaded_file_name = sys.argv[2] 
   PDFscraper.main(course_file, uploaded_file_name)



