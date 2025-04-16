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
                    "Type": {"type": "string", "enum": ["Class", "Permission", "Score"]},
                    "Requirement": {"type": "string"},
                    "Grade": {"type": "string"},
                },
                "required": ["Type", "Requirement"],
            },
        },
        "Corequisites": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Type": {"type": "string", "enum": ["Class", "Permission", "Score"]},
                    "Requirement": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                "required": ["Type", "Requirement"],
            },
        },
        "Replacements": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Type": {"type": "string", "enum": ["True", "Potential"]},
                    "Replacements": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                "required": ["Type", "Replacements"],
            },
        },
        "Other": {"type": "array", "items": {"type": "string"}},
        "Alternative-reqs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "Requisite-class-getting-bypassed": {"type": "array", "items": {"type": "string"}},
                    "Bypass-method": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["Requisite-class-getting-bypassed", "Bypass-method"],
            }
        },
    },
    "required": ["Prerequisites", "Corequisites", "Replacements", "Other", "Alternative-reqs"],
}

# Create the model
generation_config: Dict[str, Any] = {
    "temperature": 0.15,
    "top_p": 0.5,
    "top_k": 40,
    "max_output_tokens": 1000,
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
                pass  # This is likely the most scuffed thing I've ever written in my entire life. This is disgusting, and I promise to fix this later.
            else:
                print(time.gmtime().tm_sec)
                length: int = len(row)
                info: str = row[length - 1]
                code: int = row[4]
                course: str = row[1]
                print(f"info: {info}")
                if info and i > 1:
                    response: genai.types.GenerateContentResponse = model.generate_content(
                        contents=f"""You work as a part of a system with the goal of helping students enroll in courses relevant to them. Your job is to review a course and transform the course description into a json file containing prerequisites, corequisites, course replacement options, prerequisite alternatives, and an other field for information that does not fit in one of the other categories.
You must complete each of the following steps:
**STEP - GATHER PREREQUISITES**
A prerequisite class is a class which a student is required to have already taken in order to take this course ({course}).
Sometimes, students are given choices between prerequisites, while other times, they are required to fulfill multiple prerequisites. The description may indicate this to you with the wording "or" vs "and".
For Example: "Credit in ABCD 1234, ABCD 4021, and EXMP 2403 are required to take this course" tells you that all three of these classes are required to take the class.
You will save each of these prerequisites in its own object, noting each to be of type "Class". Sometimes, a prerequisite will be the permission of an instructor or a minimum required test score. In these cases, they will be of type "Permission" or "Score".
If the description indicates that a student may have a choice as to which prerequisite they take, you may put all CHOICE prerequisites in a single prerequisite object, as a list. Once again, with type "Class".
You may have a mix of both of these concepts. For example: "Credit in ABCD 1234, ABCD 4021 or EXMP2403, and EXMP 1234 are required to take this course" implies that students have a choice between ABCD 4021 and EXMP 2403, but not between any others. So, you would create three objects, EXMP 1234 in one, ABCD 1234 in another, and then a list with both ABCD 4021 and 2403 in the other.

**STEP - GATHER COREQUISITES**
A corequisite class is a class which a student is required to have already enrolled in OR taken in order to take this course ({course}). In other words, even if a student has not taken the corequisite already, they may still enroll in {course} if they have ALSO enrolled in the corequisite.
Once again, students are sometimes given choices between corequisites. Format these choices in the same way as you would a prerequisite, but instead put these courses in the corequisite field of the json.
For Example: "Credit or enrollment in ABCD 1234 or EXMP 1234 to take this class" tells you that students have a choice between fulfilling this requirement by having credit or enrollment in either of the two classes presented. So, in this case, the two classes can be placed in the same corequisite object, in a list.
Just like prerequisites, you will save each corequisite in its own object unless a choice is presented, in which case two corequisites can be presented in the same object as a part of a list. Notice that there are no differences between formatting corequisite and prerequisite objects. The only difference between the two is in the definition of a corequisite vs a prerequisite.

**STEP - GATHER COURSE REPLACEMENTS**
A course replacement is a course or courses that can be taken instead of {course}, while still obtaining the same credit.
This field is strict, and should only be populated as "true" if the description tells you that a course replaces, is an alternative to or covers the material of {course}. If your only indication that a course might be a suitable replacement is a line about credit not being given for this class and another, then it must be filed as a "potential" replacement, rather than a "true" one. 
An INVALID reason to add a course to replacements as a "true" replacement: Credit will not be given for this course and ABCD 1234 or EXMP 1234.
Just because credit will not be given for this course and another course DOES NOT mean that it is a course replacement; you MUST have direct confirmation that a course (or courses) replaces, is an alternative to, or covers the material of {course} for it to be considered a "true" course replacement. Anything less than direct confirmation will result in a "potential" rating.
Since course replacements are inherently a choice, there is a difference between listing course replacements and listing them in requisites. Here, replacements are only to be added to a list if multiple courses count for the same credit as a single course.
The course description will tell you if two courses TOGETHER combine to count for the same credit as another course. Only in this case do you list multiple course replacements in a single object.
Considering the specific degree program and requirements, are there *any* courses that could fulfill the *same requirement* as {course}? If {course} is *required*, and another course is mentioned as an option, consider it an alternative only if the description doesn't explicitly forbid it, such as by mentioning that {course} is mandatory for some students.
*Honors Exception:* If an Honors version of {course} is mentioned, it is *always* considered a valid course replacement, regardless of other requirements or constraints. The Honors version may not appear in the other fields.

**STEP - GATHER ALTERNATIVE REQUIREMENTS**
An alternative requirement is a non-class requirement which may replace a prerequisite or a corequisite.
For example: "Prereq.: ABCD 1234 and EXMP 1234 or permission from professor" indicates to you that there is an exception at play here: the permission from professor. While ordinarily, both ABCD 1234 and EXMP 1234 are required to take the class, this description is telling you that the permission from a professor can allow a student to take the class without taking either of the other two classes.
This is why permission from professor or department is often a better fit for the alternative requirements field than the other fields. Remember that permission from profesors will usually end up here or in the other field, with it ONLY being valid for the prerequisite field if the class absolutely requires permission from the professor to enroll.

**STEP - GATHER OTHER**
The other field should be used when information DOESN'T FIT in any of the other four categories, but MIGHT still be useful to know about enrollment.

**{course} Description:** {info}
                        """)
                    row[length - 1] = response.text
                else:
                    print("Nope!")
                with open(file="api\scheduling\coursedata.csv", mode="a", newline="\n", encoding="Windows-1252", errors="ignore") as file:
                    class_writer: csv.writer = csv.writer(file)
                    class_writer.writerow(row)
                print(", ".join(row))
                time.sleep(0.15)
                break
# A student is attempting to enroll in a course {course} at his university as a part of his major program. He is not sure if he qualifies for the class because the description is unclear, but you will help him.
#                             Your job is to take a detailed description of the course, provided by the student, and condense them into easy-to-process json formatting. These descriptions often have irrelevant information, or information that is only relevant to some people, so take that into consideration.
#                             The student needs to know five things:

#                             1.  **Prerequisites:** What are the prerequisites for the course he wants to take? What does he need to have credit for? Only classes (in the format ABCD 1234) should be placed in prerequisites, and they should each be given their own entry unless they are a composite credit, as described below.
#                             2.  **Corequisites:** What are the corequisites he needs to enroll in or have credit for in order to take this course? What does he need to have credit for or registration in? Only classes (in the format ABCD 1234) should be placed in corequisites, and they should each be given their own entry unless they are a composite credit, as described below.
#                             3.  **Course-Alternatives:** Considering his specific degree program and requirements, are there *any* courses that could fulfill the *same requirement* as {course}? If {course} is *required*, and another course is mentioned as an option, consider it an alternative only if the description doesn't explicitly forbid it.
#                                 *   **Honors Exception:** If an Honors version of {course} is mentioned, it is *always* considered a valid Course-Alternative, regardless of other requirements or constraints. The Honors version may not appear in the other fields.
#                             4.  **Alternative-Requirements:** Which prerequisites have alternatives/methods to bypass them? An indication that a requisite class will have an alternative requirement is if the description says something along the lines of "X Score on test or Class A or Class B or Class C". In this case, you can put Class A as a (pre/co)requisite and then the test score, Class B, and Class C each in their own object as the bypass-method, with Class A in the \"Class\" field for all of them. Note that the test score was NOT placed in prerequisites here. Test scores, professor permission, or other requirements that are not a class should always be placed as an alternative, rather than a main requisite. Just think about it; most people aren't going to get permission from a professor for a class unless it is absolutely required of them.
#                             5.  **Other:** Is there anything else that might help him, or others, pursue enrollment in this course? This does not include irrelevant things like difficulty or grading scale, and *especially* includes things that may be needed, even if not in the above categories, such as permission of the instructor, etc.

#                             **NOTE:** ONLY the "Other" section may include full descriptions. Requisites and course-alternatives MUST always be a short string in the format ABCD 1234.
                            
#                             **Important Considerations and Clarifications for Interpretation:**

#                             *   **Focus on Fulfillment of Requirements:** The primary goal is to identify what courses *fulfill the student's degree requirements* rather than simply listing courses that share similar content. This is a key shift in perspective.
#                             *   **"Required" vs. "Optional":** If {course} is *required* for the student's degree, then courses that *prevent* credit for {course} (but are taken by other students) are NOT considered valid alternatives. The exception is if the description explicitly states that it *can* fulfill the requirement.
#                             *   **Non-Major Considerations:** Information about non-majors or other colleges are included in the "other" field if they may affect students in the program, but they are *never* used to determine "course alternatives".
#                             *   **"Or Equivalents":** Explicitly list the alternative methods in "Alternative-reqs".
#                             *   **Permission-Based Enrollment:** Instructor permission, department chair permission, placement by department, etc., should be noted in the "other" field.
#                             *   **No Assumption of Universal Applicability:** Assume that the student is the *target audience* of the course. Avoid giving advice based on assumptions that they are NOT in the degree program.
#                             *   **Bypass-Exclusivity:** The bypass-method field in the Alternative-reqs field of the json is exclusive to that section of the json. It does should not appear as a regular corequisite or prerequisite if it is listed as a bypass-method.
#                             *   **Requisite Inclusivity:** The requisite sections (prerequisites and corequisites) are lists of EVERY COURSE THAT MUST SATISFY THE (PRE/CO)REQUISITE CONDITION before {course} can be taken. In other words, prerequisites should only be listed if each item in the list must be taken in order to take the class. Otherwise, use the alternative-reqs section.
#                             *   **Composite Credit:** Sometimes, prerequisite, corequisite, or replacement credit (Course-Alternatives) can be in the form of multiple classes which are equivalent to the credit of another class. In this case, you must list both classes required. You should ONLY give lists when composite credit is indicated by the description. You should NOT put two independent prerequisites in a list.
#                                 *   **OR vs AND:** Remember, if one course AND another course count as a single course credit, it goes in a list. If one course OR another course is required, then they are separate entries in prerequisites, and should also be included in alternative-reqs.
                            
#                         {course} Course Description: {info}
# """# Analyze the description data and fill the json
                        # YOUR JOB is to take the description of the university class {course} and determine what is required from a student for them to enroll in the class.
                        # From this text description of the class, create a json containing a prerequisites, corequisites, replacements, and alternative-requirements, all described below in the "Definitions" section. Prerequisites are classes which must have already been completed to take this class. Corequisites are classes which you must have either registration in or credit for having taken it already. Replacement classes are classes which will substitute in for this one, or in other words, credit cannot be held for both this class and a replacement class, HOWEVER, sometimes the replacement aspect of this relationship only goes one way. For example, there may be a non-degree specific version of a class. The degree specific version is more specialized, and so it can be substituted for the less specialized one. In cases where this difference is present (often accompanied by advice concerning curriculum differences), do not say that the class is a replacement, as it is not a true replacement.
                        # A fourth field is provided to you, which may hold any \"other\" requirements, such as professor endorsements. You are free to format this however you would like.
                        # The fifth and final field available to you is the alternative-reqs field, which should contain both the method/requirement for exemption as well as what this exception is for. For example, if EX 1234 is a prerequisite of the class we're considering, but the description describes an exception given if allowed by the instructor, then the requirement being exempted is EX 1234 and the method for exemption is permission of instructor. This is an important distinction because permission from the instructor may not be a requirement to take the class, but it may allow other requirements to be bypassed. 
                        # The third field is for classes that replace the class whose description you're observing. The fifth field is for classes that replace the PRE- OR CO- REQUISITES of the class whose description you're observing. Alternative-reqs is for alternative requirements, while the replacements field is only for classes that replace this one.
                        # A Corequisite is a prerequisite, but a prerequisite is not necessarily a corequisite. In other words, a class which requires "registration in or credit for/grade of..." may be placed in both the prerequisites AND the corequisites fields, but SHOULD be placed with the corequisites. The absolute worst case scenario would be placing that class in the prerequisites field without placing it in the corequisites field. A corequisite MUST be registered as such.
                                                      
                        # Example: Prereq.: Majors only and permission of instructor and department chair required. Grade of “C� or above in ACCT 3021. Registration in or grade of C or above in EX 1234 Credit will not be given for this course and ACCT 4333. At least 20 hours per week of learning experience in accounting under the general supervision of a faculty member and direct supervision of a professional in accounting. Pass-Fail grading.
                        # Example determinations: 
                        #     - Prerequisites: ACCT 3021, Class, C. EX 1234, Class, C.
                        #     - Corequisites: [EX 1234]
                        #     - Replacements: ACCT 4333
                        #     - Other: Majors Only. Permission of instructor and department chair required.
                        #     - Alternative-reqs: Bypass-method: [], Class: []
                                                      
                        # # Definitions:
                        # Prerequisite: A class which must be taken BEFORE, not during, the term of this class.
                        # Corequisite: A class which must be taken either before or during the term of this class.
                        # Replacement: A class which may be taken instead of this class, and can replace it in all circumstances. For example, an honors version of a course can always be substituted in to replace the non-honors version.
                        # Alternative-Req: A class which may replace a speciifc prerequisite or corequisite. Class:["Prerequisite being skipped"], Bypass-method:["method description", "alternative class if known"]

                        # # Notes:
                        # The \"other\" field is not for any excess information about the contents of the class; it is only for enrollment information. Grading scales, for example, would be irrelevant.
                        # You are not required to include any data that appears irrelevant to what is required for a student to enroll in the class, such as information about the class itself.
                        # A class in the Replacements field will never appear in any other field.
                        # This class is a part of a degree program, under a college. Sometimes, this class may also be taken by people from degrees other than the degree associated with this class, in which case, there may be special notes for those degrees. Put that information in the \"other\" field.
                        # Recommendations do NOT indicate anything more than that; a recommendation. It may be included in the \"other\" field, if you feel it is relevant to enrollment in the class.
                        # If the data provides a difference between requirements/replacements for non-majors, note that information in the \"other\" field, as the main fields are primarily for major-specific content.
                        
                        # # Formatting:
                        # All saved classes are formatted as 2-4 letters followed by exactly 4 numbers. A dummy example is: \"EX 1234\"
                        # If the data says the class requires permission of instructor, college, or another entity, add it as a full description to the list in the \"other\" field.
                        # Enter NULL for any field which you are unable to fill.


                        # # Data: 
                        # {info}"""