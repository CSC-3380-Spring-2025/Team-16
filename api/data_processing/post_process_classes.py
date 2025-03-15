import csv
import os
import google.generativeai as genai
from google.generativeai import types
from pydantic import BaseModel
import time
from typing import Dict, Any

API_KEY: str = "AIzaSyA5Y4QTQIgp4Kx_yhPIFz1Sjz4YeSgZyyo" # We'll have to decide on a proper way to deal with API Keys.
genai.configure(api_key=API_KEY)

response_schema: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "Prerequisites": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Type": {"type": "string", "enum": ["Permission", "Class"]},
                    "Requirement": {"type": "string"},
                    "Grade": {"type": "string"},
                },
                "required": ["Type", "Requirement"],
            },
        },
        "Corequisites": {"type": "array", "items": {"type": "string"}},
        "Replacements": {"type": "array", "items": {"type": "string"}},
        "Other": {"type": "array", "items": {"type": "string"}},
        "Alternative-reqs": {
            "type": "object",
            "properties": {
                "Class": {"type": "array", "items": {"type": "string"}},
                "Bypass-method": {"type": "string"},
            },
            "required": ["Class", "Bypass-method"],
        },
    },
    "required": ["Prerequisites", "Corequisites", "Replacements", "Other", "Alternative-reqs"],
}

# Create the model
generation_config: Dict[str, Any] = {
    "temperature": 0.15,
    "top_p": 0.4,
    "top_k": 40,
    "max_output_tokens": 500,
    "response_mime_type": "application/json",
    "response_schema": response_schema,
}

model: genai.GenerativeModel = genai.GenerativeModel(
    model_name="gemini-2.0-flash-lite", generation_config=generation_config
)

with open(file="api\scheduling\data.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
    class_reader: csv.reader = csv.reader(file)
    i: int = 0
    for row in class_reader:
        i += 1
        print(f"i: {i}")
        while True:
            while not time.gmtime().tm_sec % 2 == 0:
                pass  # Placeholder for debugging comment
            else:
                print(time.gmtime().tm_sec)
                length: int = len(row)
                info: str = row[length - 1]
                print(f"info: {info}")
                if info and i > 4:
                    response: genai.types.GenerateContentResponse = model.generate_content(
                        contents=f"""# Analyze the description data and fill the json
                        YOUR JOB is to take a description of a class and determine what is required from a student for them to enroll in the class.
                        From this text description of a class at a university, create a json containing a prerequisites, corequisites, replacements, and alternative-requirements, all described below in the "Definitions" section. Prerequisites are classes which must have already been completed to take this class. Corequisites are classes which you must have either registration in or credit for having taken it already. Replacement classes are classes which will substitute in for this one, or in other words, credit cannot be held for both this class and a replacement class.
                        A fourth field is provided to you, which may hold any \"other\" requirements, such as professor endorsements. You are free to format this however you would like.
                        The fifth and final field available to you is the alternative-reqs field, which should contain both the method/requirement for exemption as well as what this exception is for. For example, if EX 1234 is a prerequisite of the class we're considering, but the description describes an exception given if allowed by the instructor, then the requirement being exempted is EX 1234 and the method for exemption is permission of instructor. This is an important distinction because permission from the instructor may not be a requirement to take the class, but it may allow other requirements to be bypassed. 
                        The third field is for classes that replace the class whose description you're observing. The fifth field is for classes that replace the PRE- OR CO- REQUISITES of the class whose description you're observing. Alternative-reqs is for alternative requirements, while the replacements field is only for classes that replace this one.
                        A Corequisite is a prerequisite, but a prerequisite is not necessarily a corequisite. In other words, a class which requires "registration in or credit for/grade of..." may be placed in both the prerequisites AND the corequisites fields, but SHOULD be placed with the corequisites. The absolute worst case scenario would be placing that class in the prerequisites field without placing it in the corequisites field. A corequisite MUST be registered as such.
                                                      
                        Example: Prereq.: Majors only and permission of instructor and department chair required. Grade of “C� or above in ACCT 3021. Registration in or grade of C or above in EX 1234 Credit will not be given for this course and ACCT 4333. At least 20 hours per week of learning experience in accounting under the general supervision of a faculty member and direct supervision of a professional in accounting. Pass-Fail grading.
                        Example determinations: 
                            - Prerequisites: ACCT 3021, Class, C. EX 1234, Class, C.
                            - Corequisites: [EX 1234]
                            - Replacements: ACCT 4333
                            - Other: Majors Only. Permission of instructor and department chair required.
                            - Alternative-reqs: Bypass-method: [], Class: []
                                                      
                        # Definitions:
                        Prerequisite: A class which must be taken BEFORE, not during, the term of this class.
                        Corequisite: A class which must be taken either before or during the term of this class.
                        Replacement: A class which may be taken instead of this class.
                        Alternative-Req: A method of bypassing either a prerequisite or corequisite for this class. Give the class credit being bypassed as well as the method of bypass.

                        # Notes:
                        The \"other\" field is not for any excess information about the contents of the class; it is only for enrollment information. Grading scales, for example, would be irrelevant.
                        You are not required to include any data that appears irrelevant to what is required for a student to enroll in the class, such as information about the class itself.
                        A class in the Replacements field will never appear in any other field.
                        
                        # Formatting:
                        All saved classes are formatted as 2-4 letters followed by exactly 4 numbers. A dummy example is: \"EX 1234\"
                        All prerequisite requirements that are NOT classes
                        If the data says the class requires permission of instructor, college, or another entity, add it as a full description to the list in the \"other\" field.
                        Enter NULL for any field which you are unable to fill.


                        # Data: 
                        {info}""")
                    row[length - 1] = response.text
                else:
                    print("Nope!")
                print(", ".join(row))
                time.sleep(0.1)
                break
                