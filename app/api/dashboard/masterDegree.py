import os
import json
import pandas as pd

# Dynamically construct base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
DEGREE_PATH = os.path.join(BASE_DIR, '..', '..', 'consolidatedCrawler', 'degreeRequirements.csv')
RESULT_PATH = os.path.join(DATA_DIR, 'result.json')
USER_CREDIT_PATH = os.path.join(DATA_DIR, 'userCredit.json')

def load_user_credits(path):
    with open(path, 'r') as f:
        data = json.load(f)
    completed_courses = []
    if "Completed" in data:
        for sem in data["Completed"]:
            if ":" in sem:
                _, courses = sem.split(":", 1)
                courses = courses.strip(" []\"")
                completed_courses.extend([c.strip(" \"") for c in courses.split(",") if c.strip()])
    return completed_courses

def main():
    print("--- Starting Degree Match Process ---")
    try:
        print("Loading user credit data from:", USER_CREDIT_PATH)
        user_courses = load_user_credits(USER_CREDIT_PATH)
        print(f"Parsed {len(user_courses)} user courses:", set(user_courses))
    except Exception as e:
        print("Error loading userCredit.json:", e)
        return

    try:
        print("Loading degree requirement data from:", DEGREE_PATH)
        df = pd.read_csv(DEGREE_PATH)
    except Exception as e:
        print("Error loading degreeRequirements.csv:", e)
        return

    df['course ID'] = df['course ID'].astype(str)
    grouped = df.groupby('major')

    match_scores = []
    for major, group in grouped:
        req_courses = group['course ID'].dropna().unique()
        matches = len(set(req_courses).intersection(set(user_courses)))
        match_scores.append((major, matches))

    match_scores.sort(key=lambda x: x[1], reverse=True)
    top_majors = [m[0] for m in match_scores[:3]]

    top_minor = match_scores[3][0] if len(match_scores) > 3 else "None"

    result = {
        "majors": top_majors,
        "minor": top_minor
    }

    try:
        with open(RESULT_PATH, 'w') as f:
            json.dump(result, f)
        print(f"Result written to {RESULT_PATH}")
    except Exception as e:
        print("Error writing result.json:", e)

if __name__ == "__main__":
    main()
