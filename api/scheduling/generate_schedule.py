import csv
import json
from typing import Dict, List, Set, Union

CURRENT_USER_ID: int = 123456
MAX_HOURS: int = 20


class Course:
    def __init__(self, courseID: str, code: int) -> None:
        self.id: int = -1
        self.title: str 
        self.hours: int = 3
        self.courseID: str = courseID
        self.code: int = code
        self.requisites: Dict[str, List[str]] = {}

        with open("api\\scheduling\\coursedata.csv", newline="\n", encoding="Windows-1252", errors="ignore") as file:
            course_reader = csv.reader(file, delimiter=",")
            next(course_reader, None)  # Skip header row
            for row in course_reader:
                if row and row[3] == courseID and row[4] == str(code):  # Ensure correct string comparison
                    self.id = int(row[0])
                    self.title = row[1]
                    self.hours = int(row[2])
                    self.courseID = row[3]
                    self.code = int(row[4])
                    try:
                        self.requisites = json.loads(row[5])
                        self._convert_requisites()
                    except json.JSONDecodeError:
                        print(f"Invalid JSON format for requisites in course {courseID} {code}. Data: {row[5]}")
                        self.requisites = {}                    
                    break
    
    def _convert_requisites(self) -> None:
        for key in ["Prerequisites", "Corequisites"]:
            if key in self.requisites and isinstance(self.requisites[key], list):
                converted_courses = []
                for req in self.requisites[key]:
                    if isinstance(req, dict) and "Requirement" in req:
                        parts = req["Requirement"].split(" ")
                        if len(parts) == 2 and parts[1].isdigit():
                            converted_courses.append(Course(parts[0], int(parts[1])))
                self.requisites[key] = converted_courses  # Replace dicts with Course objects

class User:

    def __init__(self, id: int) -> None:
        self.id: int = id
        self.name: str = ""
        self.email: str = ""
        self.curric_name: str = ""
        self.credit: Dict[str, List[Union[str, Course]]] = {}

        with open("api\\scheduling\\userex.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
            class_reader = csv.reader(file, delimiter=";")
            next(class_reader, None)    # This is just meant to jump over the first csv row with the columns bc it doesnt hold relevant data. For other datasets, we'll need to implement logic surrounding this.
            for row in class_reader:
                if row and row[0].isdigit() and int(row[0]) == self.id: # If there's a row, and the row has an id and the id is a number (isdigit checks both), and that valid id is the user's id, then continue to code block
                    self.name = row[1]
                    self.email = row[2] # Email is just a string, at least for now.
                    self.curric_name = row[3] # curric_name is the name of the curriculum, which means it is the dept code (CSC, ACCT, ECON, etc.) + the first 3 letters of the concentration (CYB, SOF, DAT, etc.) w/o spaces
                    try:
                        self.credit = json.loads(row[4])    # Parse the JSON
                    except json.JSONDecodeError:
                        print(f"Invalid JSON format for user credit. Data: {row[4]}")
                        self.credit = {}
                    self._convert_courses()
                    break

    def _convert_courses(self) -> None:
        """ Converts course strings in the credit dictionary to Course objects. """
        for semester, courses in self.credit.items():
            converted_courses: List[Union[Course, str]] = []
            for course_str in courses:
                parts = course_str.split(" ")
                if len(parts) == 2 and parts[1].isdigit():
                    course_obj = Course(parts[0], int(parts[1]))    # Convert string to Course object
                    converted_courses.append(course_obj)
                else:
                    converted_courses.append(course_str)    # Keep as string if not a valid course
            self.credit[semester] = converted_courses

    def find_curriculum(self) -> "Curriculum":
        print(f"Finding curriculum for: {self.name}'s {self.curric_name} program!")
        return Curriculum(self.curric_name)
    
    # Basic coreq/prereq. Does not account for alternative reqs or replacement classes
    def find_missing_credit(self, course: Course) -> Dict[str, List[Course]]:   # In the future, this should be a dict not list of lists
        missing_dict : Dict[str, List[Course]] = {}
        credit_set : set = set(self.credit["Completed"])
        print(f"Can user take {course.courseID} {course.code}?")
        if "Prerequisites" in course.requisites:
            missing_pre : List[Course]
            prereq_set : set
            prereq_data : List[Course] = course.requisites["Prerequisites"]
            if isinstance(prereq_data, list):
                prereq_set = {prereq for prereq in prereq_data}
            else: 
                prereq_set = set()
            print(f"Extracted prereq courses: {prereq_set}")

            missing_pre : List[Course] = list(prereq_set - credit_set)            
            if missing_pre:
                missing_dict["Prerequisites"] = missing_pre
        
        if "Corequisites" in course.requisites:
            missing_co : List[Course]
            progress_set : set = set(self.credit["IP"])
            cred_regis_set : set = progress_set | credit_set    # set of classes user has credit or registration in
            coreq_set : set 
            coreq_data = course.requisites["Corequisites"]
            coreq_set = {coreq for coreq in coreq_data}
            missing_co : List[Course] = list(coreq_set-credit_set)
            if missing_co:
                missing_dict["Corequisites"] = missing_co
        print(f"User is missing: {missing_dict}")
        return missing_dict

class GenEd: # The "skeleton" implementation of the algorithm doesnt deal with gen ed classes (We do have the data on them)
    def __init__(self, type: str) -> None:
        self.type : str = type
        self.courses : List[Course] # This list will be a list of courses valid for this GenEd credit
    
    def find_credit(self) -> None:
        pass

class Curriculum:
    def __init__(self, progcode: str) -> None:
        self.program: str = progcode
        self.id: int = -1
        self.degree: str = ""
        self.type: str = ""
        self.concentration: str = ""
        self.credit: Dict[str, List[Course]] = {}
        self.hours: int = 0
        self.restrictions: str = ""

        with open("api\\scheduling\\programsex.csv", newline="\n", encoding="Windows-1252", errors="ignore") as file:
            prog_reader = csv.reader(file, delimiter=";")
            next(prog_reader, None)  # Skip header row
            for row in prog_reader:
                if row and row[1] == self.program:
                    self.id = int(row[0])
                    self.degree = row[2]
                    self.type = row[3]
                    self.concentration = row[4]
                    try:
                        raw_credit: Dict[str, List[str]] = json.loads(row[5])  # Get raw JSON data
                        self._convert_courses(raw_credit)  # Convert to Course objects
                    except json.JSONDecodeError:
                        print(f"Invalid JSON format for curriculum. Data: {row[5]}")
                        self.credit = {}
                    self.hours = int(row[6])
                    self.restrictions = row[7]
                    break

    # Converts course strings in the curriculum's credit dictionary to Course objects.
    def _convert_courses(self, raw_credit: Dict[str, List[str]]) -> None:
        for semester, courses in raw_credit.items():
            self.credit[semester] = [
                Course(parts[0], int(parts[1])) if len(parts := course_str.split(" ")) == 2 and parts[1].isdigit() 
                else
                    print(f"Gen Ed Course Found! ({course_str})") # This could be used to handle bad formats, but I'm currently using it to identify when we've come across a gen ed.
                for course_str in courses
                if len(parts := course_str.split(" ")) == 2 and parts[1].isdigit() 
            ]

    # Returns a set of available courses based on user credit.
    def get_pool(self, usr: User, **kwargs: Dict[str, str] ) -> Set[Course]: # Kwargs intended for semester: str
        semester : str = kwargs["semester"] if kwargs["semester"] else "semester 1" # defaults to semester 1
        pool: Set[Course] = set()

        for course in usr.credit.get(semester, []):
            if isinstance(course, Course):
                pool.add(course)
            else:
                print(f"Skipping invalid course entry, likely a gen ed: {course}")

        return pool

def get_hours(pool : List[Course]) -> int:
    current_hours : int
    for cred in pool:
        current_hours += cred.hours
    return current_hours

class Pool:
    def __init__(self, **kwargs: Dict[str, Union[User, Curriculum, List[Course]]]) -> None:
        self.user : User
        self.curriculum: Curriculum
        self.pool : List[Course]
        self.hours : int = 0
        self.completed : List[str] = [] 
        self.next : Pool
        
        for key, value in kwargs.items():
            match key:
                case "user":
                    self.user : User = value
                case "curriculum":
                    self.curriculum : Curriculum = value
                    pool_start : str = f"semester {len(self.completed)}" if self.completed else "semester 1"
                    self.pool = self.curriculum.get_pool(self.user, semester=pool_start)
                case "pool":
                    self.pool : List[Course] = value
    
    # update is just supposed to update a pool with every class a user could potentially take right now. This could be done recursively, and it may look more neat. 
    def update(self) -> None:
        semesters : List[str] = list(set(self.curriculum.credit.keys())-set(self.completed))
        user_credit: List[Course]= self.user.credit["Completed"]
        current_pool : List[Course] = list(set(self.pool)-set(user_credit))
        print(f"viable semesters for pool: {semesters}")
        for current_semester in semesters:
            current_pool.extend([cred for cred in self.curriculum.credit[current_semester] if cred not in user_credit and not self.user.find_missing_credit(cred)])
        self.pool = current_pool
        return
    
    def schedule_semester(self) -> List[Course]:
        comp_semesters : int = len(self.completed)
        hrs : int = 0
        schedule : List[Course] = []
        for semester in sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split()[-1])): 
            for course in self.pool:
                if semester in self.curriculum.credit and course in self.curriculum.credit[semester] and hrs+course.hours <= MAX_HOURS:
                    hrs += course.hours
                    print("COURSE HOURS: ", course.hours)
                    print("TOTAL HOURS: ", hrs)
                    
                    schedule.append(course)
        
        return schedule
                


    # update is just supposed to update a pool with every class a user could potentially take right now. This could be done recursively, and it may look more neat. 
    def scuffed_schedule_semester(self) -> List[Course]:
        semesters : List[str] = list(set(self.curriculum.credit.keys())-set(self.completed))
        user_credit: List[Course]= self.user.credit["Completed"]
        current_semester: str = semesters[0]
        current_pool : List[Course] = list(set(self.pool)-set(user_credit))
        current_hours : int = self.hours

        if current_hours > MAX_HOURS:
            print("Over hours! 1")
            return self.pool
        print("self curriculum credit[current_semester]", self.curriculum.credit[current_semester])
        for cred in self.curriculum.credit[current_semester]:   # Can't do a set here bc gen eds aren't converted to their own objects. If they were, a set could pontentially work.
            print("CREDLOOP, CRED: ", cred)
            if cred not in user_credit:                         # ^^^ could simplify in future
                try:
                    temp : int = current_hours + cred.hours
                except AttributeError:
                    print(f"curric: {self.curriculum}")
                    print(f"curric cred list: {self.curriculum.credit}")
                    print(f"What da {cred} doin?")
                if not temp > MAX_HOURS:
                    current_pool.append([cred])
                    current_hours += cred.hours
                    self.hours = current_hours
                else:
                    print("Over hours! 2")
                    self.pool = current_pool
                    return self.pool
        if self.hours < MAX_HOURS:
            print(self.hours)
            print(current_hours)
            

def main() -> None:
    user: User = User(CURRENT_USER_ID)
    curriculum: Curriculum = user.find_curriculum()
    cred: Course = user.credit
    print("User Courses:", cred)  # Debug: Check converted courses
    print("1st Completed Course: ", cred["Completed"][0].code)
    print("Curriculum Courses:", curriculum.credit)  # Debug: Check converted curriculum courses
    test: Pool = Pool(user=user, curriculum=curriculum)
    print("test pool obj: ", test)
    test.update()
    print("test pool updated: ", test.pool)
    for course in test.pool:
        print(f"Class: {course.courseID} {course.code}")
    schedule : List[Course] = test.schedule_semester()
    print("-------------SCHEDULE-------------") # Note that this schedule will NOT work right now. Reasons below.
    for course in schedule:
        print(f"Class: {course.courseID} {course.code}")
    # ----REASONS FOR FAILURE----
    # 1 - No Gen ed Handling. This can be done with a gen ed class. Maybe one that's a child of course, to make things easier. We'd also likely need alternate handling for its lists (since it will have lists where other courses have single classes)
    # 2 - DATA SAMPLE. The data sample I have does not include classes like 3102 or 1552, so even though clearly 1351 is a prereq for 3102, it will schedule you for both at once. IF given the full data set, which I would do if it was properly formatted, it would not do this.
    # 3 - Doesnt branch at all/try to find replacements for classes, and so if you have a valid replacement class or replacement requisite, it won't see that right now. This is logic that should be added in the can_take function.
    # 4 - BASIC algorithm version. This is meant to be barebones, just to show the idea and show that it can give a valid schedule, which it can. This does not include any sort of weighting system or acknowledge class successors, just to name a couple examples of areas for future improvement.

if __name__ == "__main__":
    main()
