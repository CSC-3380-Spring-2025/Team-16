import json
import pandas as pd
import sys
import re
from pathlib import Path

def loadUserCourses(path):
    with open(path, "r") as f:
        data = json.load(f)
    courses = set()
    for entry in data.get("credits", []):
        course = entry.get("course")
        if course:
            courses.add(course.strip())
    return courses

def extractCoursesFromMajor(credit_field):
    try:
        semester_dict = json.loads(credit_field)
        all_courses = []
        for semester_courses in semester_dict.values():
            all_courses.extend(semester_courses)
        return [
            re.sub(r'\s*\(.*?\)|\[.*?\]', '', course).strip()
            for course in all_courses
            if course and not any(word in course for word in [
                "Requirement", "Elective", "Approved", "General", "Humanities", "Natural", "Arts"
            ])
        ]
    except Exception:
        return []

def extractCoursesFromMinor(restrictions):
    return re.findall(r"\b[A-Z]{2,4} \d{4}\b", str(restrictions))

def getBaseDegreeLabel(degree_str: str) -> str:
    return degree_str.lower().split(",")[0].strip()

def main():
    if len(sys.argv) != 3:
        print("Usage: python masterDegree.py altMajor.json degreeRequirements.csv")
        sys.exit(1)

    user_file = Path(sys.argv[1])
    degree_file = Path(sys.argv[2])

    user_courses = loadUserCourses(user_file)
    df = pd.read_csv(degree_file)

    degree_match_scores = {}
    minor_scores = []
    seen_base_majors = set()

    for _, row in df.iterrows():
        degree_type = str(row["type"]).strip().lower()
        program = str(row["Program"]).strip()
        degree = str(row["degree"]).strip()
        display_name = re.sub(r",?\s?(B\.S\.|M\.S\.|Ph\.D\.|LL\.M\.|Certificate)$", "", degree.strip(), flags=re.IGNORECASE) if degree else program

        if degree_type == "major":
            required = extractCoursesFromMajor(row["credit"])
        elif degree_type == "minor":
            required = extractCoursesFromMinor(row["restrictions"])
        else:
            continue

        match_count = len(set(required) & user_courses)

        if degree_type == "major":
            base_key = getBaseDegreeLabel(degree)
            if base_key in seen_base_majors:
                continue
            if base_key not in degree_match_scores or match_count > degree_match_scores[base_key][1]:
                degree_match_scores[base_key] = (display_name, match_count)
                seen_base_majors.add(base_key)
        else:
            minor_scores.append((display_name, match_count))

    top_majors = sorted(degree_match_scores.values(), key=lambda x: x[1], reverse=True)[:4]
    top_minor = sorted(minor_scores, key=lambda x: x[1], reverse=True)[:1]

    print("Majors:", ", ".join(m[0] for m in top_majors))
    print("Minor:", top_minor[0][0] if top_minor else "")

if __name__ == "__main__":
    main()
