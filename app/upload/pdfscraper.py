import fitz  # PyMuPDF
from typing import List
import pandas as pd

class PDFscraper:

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extracts text from all pages of a given PDF file."""
        read_pdf: fitz.Document = fitz.open(file_path)
        text: str = ""
        
        # Extract text from all pages in the PDF
        for page_num in range(len(read_pdf)):  # All pages
            page: fitz.Page = read_pdf[page_num]
            text += page.get_text()
        
        return text
    @staticmethod
    def filter_lines_by_class_codes(text: str, class_codes: List[str]) -> List[str]:
        """Filters lines that contain any of the given class codes, removing leading whitespaces."""
        lines: List[str] = text.split("\n")
        
        # Strip leading whitespaces from each line and filter lines that contain any of the class codes
        return [line.strip() for line in lines if any(line.strip().startswith(code) for code in class_codes)]

    @staticmethod
    def main(course_file):
        file_path: str = course_file
        # Read class codes from names.csv file
        class_codes_df: pd.DataFrame = pd.read_csv("schedule-lsu/app/upload/course_abbreviations.csv")
        class_codes: List[str] = class_codes_df['First Name'].tolist()

        extracted_text: str = PDFscraper.extract_text_from_pdf(file_path)
        matching_lines: List[str] = PDFscraper.filter_lines_by_class_codes(extracted_text, class_codes)

        # Put matching lines into a DataFrame
        df: pd.DataFrame = pd.DataFrame([line.split() for line in matching_lines], columns=["DEPT", "CRSE", "GR", "CARR", "EARN", "QPTS", "EXTRA"])

        # Remove rows where CRSE is not 4 digits
        df = df[df['CRSE'].str.match(r'^\d{4}$')]
        
        #get rid of the EXTRAS column
        df = df.drop(columns=['EXTRA'])

        return df
