import csv
import json
from typing import Dict, List, Set, Union
from time import sleep

CURRENT_USER_ID: int = 123456
MAX_HOURS: int = 16
MIN_HOURS: int = 12

original_user_data : Dict[str, Dict[str, List['Course']]] = {}

GEN_ED_TARGETS : Dict[str, int] = {
    "English": 6,
    "Social/Behavioral": 6,
    "Natural": 9,
    "Fine": 3, # Fine Arts
    "Mathematical/Analytical": 6,
    "Humanities": 9
}

gen_ed_dictionary : Dict[str, 'GenEd'] = {}


class_dictionary : Dict[str, 'Course'] = {}

class Course:
    def __init__(self, courseID: str, code: int, successor:Union['Course', str]="none") -> None:
        self.id: int = -1
        self.title: str = ""
        self.hours: int = 3
        self.courseID: str = courseID
        self.code: int = code
        self.requisites: Dict[str, List[Union[str, Course, Dict[str, List[Union[str, Course]]]]]] = {
            "Alternative-reqs": [],
            "Prerequisites": [],
            "Corequisites": [],
            "Replacements": [],

        }
        self.successors : List[Course] = []
        if isinstance(successor, Course):
            self.successors.append(successor)

        with open("api\\scheduling\\coursedata.csv", newline="\n", encoding="Windows-1252", errors="ignore") as file:
            course_reader = csv.reader(file, delimiter=",")
            next(course_reader, None)  # Skip header row
            for row in course_reader:
                if row[3] == courseID: print(f"This is row 3 {row[3]} and this is the courseID {courseID}")
                if row[4] == code: print(f"This is row 4 {row[4]} and this is the code {code}")
                if row[3] == courseID and row[4] == str(code):  # Ensure correct string comparison
                    print("Okay so like how does this even remotely work?")
                    self.id = int(row[0])
                    self.title = row[1]
                    self.hours = int(row[2])
                    self.courseID = row[3]
                    self.code = int(row[4])
                    try:
                        self.requisites = json.loads(row[5])
                        self._convert_requisites()
                    except json.JSONDecodeError:
                        ###print(f"Invalid JSON format for requisites for course {courseID} {code} ({self.id}). Data: {row[5]}")
                        self.requisites = {}                    
                    break
        ###print("TESTING ALSO REQUISITES, COURSES REQUISITES: ", self.requisites)

        class_dictionary[self.courseID+" "+str(self.code)] = self

    def __eq__(self, value : 'Course') -> bool:
        return isinstance(value, Course) and self.courseID == value.courseID and self.code == value.code

    def __hash__(self):
        return hash((self.courseID, self.code))

    def _convert_requisites(self) -> None:
        for key in ["Prerequisites", "Corequisites"]:
            if key in self.requisites and isinstance(self.requisites[key], list):
                converted_courses : list[Course] = []
                ###print("self.requisites[key]:",self.requisites[key])
                for req in self.requisites[key]:
                    ###print("req:",req)
                    if isinstance(req, dict) and "Requirement" in req and req["Type"] == "Class":
                        ###print(req["Requirement"])
                        #class_list : list = req["Requirement"] if isinstance(req["Requirement"], list) else [req["Requirement"]]
                        temp = req["Requirement"][0] if len(req["Requirement"]) < 2 and isinstance(req["Requirement"], list) else req["Requirement"]
                        if isinstance(temp, list):
                            class_list : list[Course] = []
                            for ele in temp:
                                parts = ele.split(" ")
                                if len(parts) == 2 and parts[1].isdigit():
                                    try: 
                                        class_list.append(class_dictionary[parts[0]+" "+parts[1]]) 
                                        class_dictionary[parts[0]+" "+parts[1]].add_successor(self)
                                    except KeyError:
                                        class_list.append(Course(parts[0], int(parts[1]), successor=self))
                            if class_list[0]: converted_courses.append(class_list)
                        elif isinstance(temp, str):
                            parts = temp.split(" ")
                            if len(parts) == 2 and parts[1].isdigit():
                                try:
                                    converted_courses.append(class_dictionary[parts[0]+" "+parts[1]])
                                    class_dictionary[parts[0]+" "+parts[1]].add_successor(self)
                                except KeyError:
                                    converted_courses.append(Course(parts[0], int(parts[1]), successor=self))
                self.requisites[key] = converted_courses  # Replace dicts with Course objects

    def _convert_to_genedcourse(self, genEd : 'GenEd') -> 'GenEdCourse':
        return GenEdCourse(genEd, course=self)

    def set_weight(self, w: float) -> None:
        self.weight = w

    def set_weights(self, dependency=None, preq=None, credhr=None, semester=None, successor=None, succ_prereq=None, coreq=None):
        if dependency is not None: self.w_dependency = dependency
        if preq is not None: self.w_prereq = preq
        if credhr is not None: self.w_credhr = credhr
        if semester is not None: self.w_sempref = semester
        if successor is not None: self.w_successor = successor
        if succ_prereq is not None: self.w_succ_preq = succ_prereq
        if coreq is not None: self.w_coreq = coreq

    def add_successor(self, new_successor) -> None:
        self.successors.append(new_successor)

class User:

    def __init__(self, id: int) -> None:
        self.id: int = id
        self.name: str = ""
        self.email: str = ""
        self.curric_name: str = ""
        self.credit: Dict[str, List[Union[str, Course]]] = {} # Dict contains "completed" and "IP" (in progress), but it should also log the semester when things were completed
        original_user_data = self.credit
        self.completed_semesters : List[str] = []
        self.total_hours : int = 0
        self.gen_ed_credit : Dict[str, List[Course]] = {
            "English": [],
            "Social/Behavioral": [],
            "Natural": [],
            "Fine": [],
            "Mathematical/Analytical": [],
            "Humanities": []
        }

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
                        ###print(f"Invalid JSON format for user credit. Data: {row[4]}")
                        self.credit = {}
                    self._convert_courses()
                    break
    
    # This converts course strings in the given user's credit dictionary to Course objects
    def _convert_courses(self) -> None: 
        for semester, courses in self.credit.items():
            converted_courses: List[Union[Course, str]] = []
            for course_str in courses:
                parts = course_str.split(" ")
                if len(parts) == 2 and parts[1].isdigit():
                    course_obj : Course
                    try:
                        course_obj = class_dictionary[parts[0]+" "+parts[1]] # if existing course object is in the dictionary
                    except KeyError:
                        course_obj = Course(parts[0], int(parts[1])) # Convert string to Course object if not in dictionary
                    converted_courses.append(course_obj)
                else:
                    converted_courses.append(course_str)    # Keep as string if not a valid course
            self.credit[semester] = converted_courses

    # def update_gened_credit(self) -> None:
    #         for cred in self.credit["Completed"]:
    #             with open("api\\genEdScraper\\General_Education_Catalog.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
    #                 gened_reader = csv.reader(file, delimiter=",")
    #                 print(f"CREDIT :) : {cred.courseID} {cred.code}", cred)

    #                 for row in gened_reader:
    #                     print("ROW :) :", row)
    #                     if cred.courseID == str(row[4]) and cred.code == int(row[5]):
    #                         self.gen_ed_credit[row[1]].append(cred)
    #                         continue

    def get_curriculum(self) -> "Curriculum":
        ###print(f"Finding curriculum for: {self.name}'s {self.curric_name} program!")
        self.curriculum : Curriculum = Curriculum(self.curric_name)
        return self.curriculum
    
    # Basic coreq/prereq. Does not account for alternative reqs or replacement classes
    def find_missing_credit(self, course: Course) -> Dict[str, List[Course]]:   
        missing_dict : Dict[str, List[Union[Course, List[Course]]]] = {}
        credit_set : set = set(self.credit["Completed"])
        ###print(f"Can user take {course.courseID} {course.code}?")
        if "Prerequisites" in course.requisites:
            missing_pre : List[Course]
            prereq_set : set
            prereq_data : List[Course] = course.requisites["Prerequisites"]
            if isinstance(prereq_data, list):
                try: 
                    if isinstance(prereq_data[0], Course):
                        prereq_set = {prereq for prereq in prereq_data}
                        missing_pre : List[Course] = list(prereq_set - credit_set)            
                        if missing_pre:
                            missing_dict["Prerequisites"] = missing_pre
                    elif isinstance(prereq_data[0], list):
                        for credits in prereq_data:
                            prereq_set = {prereq for prereq in credits}
                            missing_pre : List[Course] = list(prereq_set - credit_set)            
                            if prereq_set == set(missing_pre):
                                missing_dict["Prerequisites"] = [missing_pre]
                            else:
                                prereq_set = set()
                except IndexError:
                    prereq_set = set()
            else: 
                prereq_set = set()
            ###print(f"Extracted prereq courses: {prereq_set}")

            # missing_pre : List[Course] = list(prereq_set - credit_set)            
            # if missing_pre:
            #     missing_dict["Prerequisites"] = missing_pre
        
        if "Corequisites" in course.requisites:
            missing_co : List[Course]
            progress_set : set = set(self.credit["IP"])
            cred_regis_set : set = progress_set | credit_set    # set of classes user has credit or registration in
            coreq_set : set 
            coreq_data = course.requisites["Corequisites"]
            coreq_set = {tuple(coreq) if isinstance(coreq, list) else coreq for coreq in coreq_data}
            missing_co : List[Course] = list(coreq_set-credit_set)
            if missing_co:
                missing_dict["Corequisites"] = missing_co
        if "Alternative-reqs" in course.requisites:
            for alt in course.requisites["Alternative-reqs"]:
                if isinstance(alt["bypass-method"], Course) and alt["bypass-method"] in set(self.credit["Completed"]): # This is so inefficient im dying
                    if alt["bypass-method"] in missing_dict["Prerequisites"]:
                        missing_dict["Prerequisites"].remove(alt["bypass-method"])
                elif isinstance(alt["bypass-method"], Course) and alt["bypass-method"] in set(self.credit["IP"]):
                    if alt["bypass-method"] in missing_dict["Corequisites"]:
                        missing_dict["Corequisites"].remove(alt["bypass-method"])
            pass
        if "Replacements" in course.requisites:
            pass
        if "Other" in course.requisites: # The 5 if statement streak is killing me, but im leaving it here. I dont actually think it'll be used.
            pass
        ###print(f"User is missing: {missing_dict}")
        return missing_dict

    def add_gen_ed_credit(self, credit : 'GenEdCourse') -> None:
        self.gen_ed_credit[credit.type].append(credit)

    def add_credit(self, credit : Union[List[Course], Course]) -> None:   # When better semester counts are implemented, this will need to be changed.
        if isinstance(credit, Course): 
            self.credit["Completed"].append(credit)
            if isinstance(credit, GenEdCourse):
                self.add_gen_ed_credit(credit)
        elif not isinstance(credit, str): 
            for cred in credit:
                self.add_credit(cred)
        else:
            print("How did we get here? ADD-CREDIT")

    def add_progress(self, credit : Union[List[Course], Course]):   # To add to the in progress ("IP") field of user.credit
        if isinstance(credit, Course): self.credit["IP"].append(credit)
        else: self.credit["IP"].extend(credit)

    def make_progress(self, courses) -> None: # This is different from the add_progress function, because this shifts the current contents of IP to Completed and completely overwrites IP
        self.add_credit(self.credit["IP"])
        self.credit["IP"] = courses

    def find_completed_semesters(self) -> None:
        self.curriculum.get_completed_semesters()
        self.completed_semesters = self.curriculum.completed_semesters

    def has_credit(self, credit: Course) -> bool:
        credit_list : List[Course] = self.credit["Completed"]
        for cred in self.credit["Completed"]:
            credit_list += [ele for ele in cred.requisites["Replacements"] if isinstance(ele, Course)]
        return True if credit in credit_list else False #...and not in curriculum.restrictions --- this will be updated in the future, when curriculum restrictions are implemented.
        
    def has_scheduled(self, credit: Course) -> bool:
        for item in self.credit["Completed"]:
            print(f"  - {id(item)}, type={type(item)}")

        course_list : List[Course] = self.credit["Completed"].copy()
        course_list.extend(self.credit["IP"])

        for cred in self.credit["Completed"]:
            print("Cred:", cred)
            if "Replacements" in cred.requisites: 
                course_list += [ele for ele in cred.requisites["Replacements"] if isinstance(ele, Course)]
        for cred in self.credit["IP"]:
            if "Replacements" in cred.requisites: course_list += [ele for ele in cred.requisites["Replacements"] if isinstance(ele, Course)]
        return True if credit in course_list else False #...and not in curriculum.restrictions --- this will be updated in the future, when curriculum restrictions are implemented.

    def has_gen_ed_req(self, type:str=None) -> bool:
        completed = 0
        if not type:
            for gen, credits in self.gen_ed_credit.items():
                gen_hours = 0
                for cred in credits:
                    gen_hours += cred.hours
                if gen_hours >= GEN_ED_TARGETS[gen]:
                    completed += 1
        else:
            gen_hours = 0
            for cred in self.gen_ed_credit[type]:
                gen_hours += cred.hours
            return True if gen_hours >= GEN_ED_TARGETS[type] else False
        return True if completed == 6 else False

class GenEdCourse(Course):
    def __init__(self, genEd : 'GenEd', courseID : str, code: int, course: Course = None) -> None:
        if course:
            self.id: int = course.id
            self.title: str = course.title
            self.hours: int = course.hours
            self.courseID: str = course.courseID
            self.code: int = course.code
            self.requisites: Dict[str, List[Union[str, Course]]] = course.requisites
        else: 
            super().__init__(courseID, code)
        self.genEd : GenEd = genEd
        self.type : str = genEd.type

class GenEd: # The "skeleton" implementation of the algorithm doesnt deal with gen ed classes (We do have the data on them)
    def __init__(self, type: str) -> None:
        ###print(f"Gen Ed Course Found! ({type})")
        self.type : str = type
        self.courses : List[Course] = []# This list will be a list of courses valid for this GenEd credit
        
        gen_ed_dictionary[type] = self

        self.find_courses()
    
    def find_courses(self) -> None:
        with open("api\\genEdScraper\\General_Education_Catalog.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
            gen_ed_reader = csv.reader(file, delimiter=",")
            next(gen_ed_reader, None)    # jumps over first line (column names)
            for row in gen_ed_reader:
                if row[0].isdigit() and row[1] == self.type: # if there's a row with an id and its type matches the gen ed type
                    self.courses.append(GenEdCourse(self, row[4], row[5]))

    def find_credit(self, user : User) -> List[GenEdCourse]: # This function returns a list of Gen Ed credit available for a user to take
        eligible_courses : List[GenEdCourse] = []
        if user.has_gen_ed_req(type=self.type): return []
        for cred in self.courses:
            if not user.find_missing_credit(cred) and not user.has_scheduled(cred):
                eligible_courses.append(cred)
        return eligible_courses
    
    def find_next_credit(self, user : User, start : Course) -> GenEdCourse: # This function returns the "next" credit that the user should take. (ex. Biology I -> Biology II)
        for i in range(1, 11):
            code : int = int(start.code) + i
            next_course : GenEdCourse = GenEdCourse(self, start.courseID, code) 
            if start in next_course.requisites["Corequisites"] or start in next_course.requisites["Prerequisites"]:
                return next_course
        for course in self.courses:
            if start in course.requisites["Prerequisites"]:
                return course

class Curriculum:
    def __init__(self, progcode: str) -> None:
        self.program: str = progcode
        self.id: int = -1
        self.degree: str = ""
        self.type: str = ""
        self.concentration: str = ""
        self.credit: Dict[str, List[Union[Course, GenEd]]] = {}
        self.hours: int = 0
        self.restrictions: str = ""
        self.completed_semesters : List[str] = []

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
                        ###print(f"Invalid JSON format for curriculum. Data: {row[5]}")
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
                    GenEd(course_str) # This could be used to handle bad formats, but I'm currently using it to identify when we've come across a gen ed.
                for course_str in courses
            ]

#     def _convert_courses(self, raw_credit: Dict[str, List[str]]) -> None:
#         for semester, courses in raw_credit.items():
# # #-------
# #             course_obj : Course
# #             try:
# #                 course_obj = class_dictionary[parts[0]+" "+parts[1]] # if existing course object is in the dictionary
# #             except KeyError:
# #                 course_obj = Course(parts[0], int(parts[1])) # Convert string to Course object if not in dictionary
# #             converted_courses.append(course_obj)
# # #-------
# #             self.credit[semester] = [
# #                 Course(parts[0], int(parts[1])) if len(parts := course_str.split(" ")) == 2 and parts[1].isdigit() 
# #                 else
# #                     GenEd(course_str) # This could be used to handle bad formats, but I'm currently using it to identify when we've come across a gen ed.
# #                 for course_str in courses
# #             ]
# # #-------
#             for course_str in courses:
#                 if len(parts := course_str.split(" ")) == 2 and parts[1].isdigit():
#                     try:
#                         self.credit[semester].extend(class_dictionary[parts[0]+" "+parts[1]]) # if existing course object is in the dictionary
#                     except KeyError:
#                         self.credit[semester].extend(Course(parts[0], int(parts[1]))) # Convert string to Course object if not in dictionary
#                 else:
#                     self.credit[semester].extend(GenEd(course_str))


    def get_true_credits(self) -> Dict[str, List[Union[Course, List[Course]]]]:
        for semester, courses in self.credit.items():
            self.credit[semester] = [
                course if isinstance("Course") and not issubclass("Course")
                else
                    course.courses #[course.type].extend(course.courses)
                for course in courses
            ]

    # Returns a set of available courses based on user credit.
    def get_pool(self, user: User, **kwargs: Dict[str, str] ) -> list[Course]: # Kwargs intended for semester: str
        semester : str = kwargs["semester"] if kwargs["semester"] else "semester 1" # defaults to semester 1
        print(f"Using semester: {semester}")
        pool: list[Course] = []

        for course in self.credit[semester]:
            if isinstance(course, Course):
                print(f"Valid course entry: {course.courseID} {course.code}", course)
                print(f"The user has scheduled this: ", user.has_scheduled(course))
                if not user.has_scheduled(course) and not user.find_missing_credit(course): # separated just bc i dont want gen ed warnings if it isn't one.
                    pool.append(course)
            else:
                pass
                ###print(f"Skipping invalid course entry, likely a gen ed: {course}")

        if len(pool) == 0:
            pool = self.get_pool(user,semester=("semester "+str(int(semester[-1]) + 1)))

        return list(set(pool))
    
    def in_curriculum(self, course: Course) -> bool:
        for semester in self.credit:
            if course in self.credit[semester]:
                return True
        return False
    
    def get_completed_semesters(self, user: User) -> List[str]:
        completed : List[str] = []
        for sem in self.credit:
            if all(cred in user.credit["Completed"] for cred in self.credit[sem]):
                completed.append(sem)
        ###print("Semesters completed: ", completed)
        return completed


def get_hours(pool : List[Course]) -> int:
    current_hours : int
    for cred in pool:
        current_hours += cred.hours
    return current_hours


class Pool:
    def __init__(self, **kwargs: Dict[str, Union[User, Curriculum, List[Course]]]) -> None:
        self.user : User
        self.curriculum: Curriculum
        self.pool : List[Union[Course, List[Course], GenEd]]
        self.hours : int = 0
        self.completed : List[str] = []
        self.next : Pool
        
        for key, value in kwargs.items():
            match key:
                case "user":
                    self.user : User = value
                case "curriculum":
                    self.curriculum : Curriculum = value
                    pool_start : str = f"semester {len(self.completed)}" if len(self.completed) > 1 else "semester 1"
                    print("Pool start: ", pool_start)
                    self.pool = self.curriculum.get_pool(self.user, semester=pool_start)
                    print("within init, curriculum pool: ", self.pool)
                case "pool":
                    self.pool : List[Course] = value

        print(f"Init Pool: {self.pool}")
    
    # update is just supposed to update a pool with every class a user could potentially take right now. This could be done recursively, and it may look more neat. 
    # def update(self) -> None:
    #     semesters : List[str] = list(set(self.curriculum.credit.keys())-set(self.completed))
    #     user_credit: List[Course]= self.user.credit["Completed"]
    #     current_pool : List[Union[Course, List[Course]]] = list(set(self.pool)-set(user_credit))
    #     print(f"viable semesters for pool: {semesters}")
    #     for current_semester in semesters:
    #         current_pool.extend([cred for cred in self.curriculum.credit[current_semester] if cred not in user_credit and not self.user.find_missing_credit(cred)])
    #     self.pool = current_pool
    #     return
    
    # def schedule_semester(self) -> List[Course]:
    #     comp_semesters : int = len(self.completed)
    #     hrs : int = 0
    #     schedule : List[Course] = []
    #     for semester in sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split()[-1])): 
    #         for course in self.pool:
    #             if semester in self.curriculum.credit and course in self.curriculum.credit[semester] and hrs+course.hours <= MAX_HOURS:
    #                 hrs += course.hours
    #                 print("COURSE HOURS: ", course.hours)
    #                 print("TOTAL HOURS: ", hrs)
                    
    #                 schedule.append(course)
        
    #     return schedule
    
    def __new_pool(self, user_credit, user_progress) -> List[Union[Course, GenEd]]:
        user = self.user
        new_pool : List[Course] = []
        for credit in self.pool:
            if isinstance(credit, List):
                if user.has_gen_ed_req(type=credit[0].type):
                    continue
                new_pool.append([])
                for cred in credit:
                    if not user.has_credit(cred):
                        return
            else:
                if not user.has_credit(credit):
                    return

    def re_gened_list(self) -> None:  # Convert all lists of genedcourses back to the gened object they came from and flatten all other lists
        for i, ele in enumerate(self.pool):
            if isinstance(ele, list):
                print("ELE: ", ele)
                if isinstance(ele[0], GenEdCourse):
                    self.pool[i] = gen_ed_dictionary[str(ele[0].type)]
                else:
                    for cred in ele:
                        if cred == ele[-1]:
                            self.pool[i] = cred
                        else:
                            self.pool.append(cred)

                print("NEW ELE: ", self.pool[i])

    def get_completed_semesters(self) -> list[str]:
        self.completed = self.curriculum.get_completed_semesters(self.user)

    def alt_update(self) -> None:
        self.get_completed_semesters()
        semesters : List[str] = list(set(self.curriculum.credit.keys())-set(self.completed))
        user_credit: List[Course] = self.user.credit["Completed"]

        user_progress: List[Course] = self.user.credit["IP"] # PROJECTED PROGRESS WOULD GO SOMEWHERE AROUND HERE IN THE FUTURE (IF IMPLEMENTED)
        print("POOL:",self.pool)
        print("CREDIT:",user_credit)
        print("PROGRESS:",user_progress)
        # self.pool = []
        # new_pool : List[Course] = self.__new_pool(user_credit, user_progress)
        self.re_gened_list()
        new_pool : List[Course] = list((set(self.pool)-set(user_credit))-set(user_progress))
        # new_pool : List[Course] = list(set(user_credit) | set(user_progress))
        print(f"viable semesters for pool: {semesters}")
        print("USER HAS CREDIT FOR: ")
        j : int = 0
        for i in user_credit:
            j += 1
            print(f"{j}. {i.courseID} {i.code}")
        print("-------------------------CREDIT-END-------------------------")
        # print("OLD POOL: ")
        # j : int = 0
        # for i in self.pool:
        #     j += 1
        #     print(f"{j}. {i.courseID} {i.code}")
        # print("-------------------------POOL-END-------------------------")
        # print("NEW POOL: ")
        # j : int = 0
        # for i in new_pool:
        #     j += 1
        #     print(f"{j}. {i}")
        #     print(f"{j}. {i.courseID} {i.code}")
        # print("-------------------------NEW-POOL-END-------------------------")
        curriculum_pool : List[Union[Course, GenEd]] = []
        for current_semester in semesters:
<<<<<<< carson-replacement-alt-reqs
            for cred in self.curriculum.credit[current_semester]:
                if isinstance(cred, Course): # As much as I'd like to use a list compos here, this if statement makes it tricky. Maybe there's a way, but I don't know how.
                    if cred not in user_credit and not self.user.find_missing_credit(cred):
                        if not "Replacements" in cred.requisites:
                            new_pool.append(cred)
                        else:
                            if set(user_credit) - set(cred.requisites["Replacements"]) == set(user_credit):
                                new_pool.append(cred)
                            else:
                                pass
                elif isinstance(cred, GenEd):
                    courses : GenEd = cred.courses
=======
            curriculum_pool.extend(self.curriculum.credit[current_semester])
        print(f"CURRICULUM POOL &$*&#*$$&@*(#&$*@#$): {curriculum_pool}")
        for cred in curriculum_pool:
                if isinstance(cred, GenEd):
                    courses : List[Course] = cred.courses

>>>>>>> dev
                    for course in courses:
                        if course not in self.user.gen_ed_credit[cred.type] and course in user_credit:
                            new_pool.append(cred.find_next_credit(self.user, course))
                    if cred.courses:
                        new_pool.append(cred.find_credit(self.user))
                elif isinstance(cred, Course): # As much as I'd like to use extend here, this if statement makes it tricky. Maybe there's a way, but I don't know how.
                    print(f"This is a normal credit. {cred.courseID} {cred.code}")
                    print(f"The user already has this credit: {self.user.has_credit(cred)}")
                    print(f"This credit has been scheduled already: {self.user.has_scheduled(cred)}")
                    print(f"This user is missing the following credit: {self.user.find_missing_credit(cred)}")
                    if not self.user.has_scheduled(cred) and not self.user.find_missing_credit(cred) and cred not in self.pool:
                        print(f"Adding to new_pool: {cred}, type={type(cred)}")
                        new_pool.append(cred)
        print("new_pool before assignment:", new_pool)
        self.pool = new_pool

        # print("NEW POOL: ")
        # j : int = 0
        # for i in new_pool:
        #     j += 1
        #     if isinstance(i, Course):
        #         print(f"{j}. {i.courseID} {i.code}")
        #     elif isinstance(i, list):
        #         pass
        #         # k :int = 0
        #         # for x in i:
        #         #     k += 1
        #         #     print(f"{j}.{k}. {x}")
        # print("-------------------------NEW-POOL-END-------------------------")
        return
            
    def alt_schedule_semester(self) -> List[Course]:
        hrs = 0
        schedule = []
        regular_courses = sorted(
            [credit for credit in self.pool if isinstance(credit, Course)],
            key=lambda c: self.calc_weight(c),
            reverse=True
        )
        grouped_gened_courses = [
            sorted(credit, key=lambda c: self.calc_weight(c), reverse=True)
            for credit in self.pool if isinstance(credit, list)
        ]

        # Schedule regular courses first
        completed_course_set = set(self.user.credit["Completed"])  # Optimization
        for course in regular_courses:
            if hrs + course.hours <= MAX_HOURS and course not in completed_course_set and course not in schedule:  # Deduplication
                hrs += course.hours
                schedule.append(course)
                completed_course_set.add(course)  # Update set for faster checking

        # Now schedule GenEd courses
        for gened_group in grouped_gened_courses:
            for course in gened_group:
                if hrs + course.hours <= MAX_HOURS and course not in completed_course_set and course not in schedule: # Deduplication
                    hrs += course.hours
                    schedule.append(course)
                    completed_course_set.add(course) # Update set for faster checking
                    self.user.add_gen_ed_credit(course)
                    break  # Take only one from the group


        return schedule

    def schedule(self, num_sems: int) -> Dict[str, List[Course]]:
        schedule: Dict[int, List[Course]] = {}
        for i in range(1, num_sems + 1):
            #self.user.update_gened_credit()
            self.alt_update()  # Make sure to keep updating for each semester
            print(f"-----------------REAL POOL {i}-----------------")
            for ele in self.pool:
                try:
                    if not isinstance(ele, GenEdCourse) and not isinstance(ele, GenEd) and not isinstance(ele, list):
                        print(f"(Real Pool) Course: {ele}, {ele.courseID} {ele.code}")
                except:
                    pass
            print(f"----------REAL POOL {i} END----------")
            semester_schedule = self.alt_schedule_semester()
            schedule[i] = semester_schedule

            # Update user's completed and IP only AFTER scheduling the current semester
            self.user.make_progress(semester_schedule)  # Directly update user's IP
        
        for sem in schedule:
            print(f"--- SEMESTER {sem} ---")
            for course in schedule[sem]:
                print(f"Class: {course.courseID} {course.code} ") # ({course.weight})

        print(self.user.gen_ed_credit)
        return

    def dependency_score(self, course : Course) -> float:
        # req_count : float = 0
        # for semester in sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split()[-1])):
        #     for cred in self.curriculum.credit[semester]:
        #         if isinstance(cred, GenEd):
        #             for gen_ed in cred.courses:
        #                 ##print(f"TESTINGINGINGING {gen_ed} REQUISITES: ", gen_ed.requisites)
        #                 if "Prerequisites" in gen_ed.requisites.keys() and course in gen_ed.requisites["Prerequisites"]: req_count+=1
        #         else:
        #             if "Prerequisites" in cred.requisites.keys() and course in cred.requisites["Prerequisites"]: req_count += 1
        # return min(max(req_count/5, 0), 1)
        return min(max(len(course.successors)/4, 0), 1)

    def prereq_score(self, course: Union[Course, List[Course]]) -> float:

        #print(f"EXPLAIIIIIIIIIINNNN: {course}")

        if isinstance(course, list):
            for gen_ed in course:
                if "Prerequisites" in gen_ed.requisites.keys(): 
                    return float(min(max((len(gen_ed.requisites["Prerequisites"])/5), 0), 1))
        else:
            if "Prerequisites" in course.requisites.keys(): 
                course_keys : List[str] = course.requisites.keys()
                return float(min(max((len(course_keys)/5), 0), 1))

    def credit_hour_score(self, course: Course) -> float:
        credit_hours : float = 0
        for semester in sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split()[-1])):
            cred_ct = 0     # credit count
            for cred in self.curriculum.credit[semester]:
                cred_ct += 1
                if course == cred :
                    credit_hours += (3*cred_ct)*int(semester[-1]) # rough approximation of target credit hour mark
        if credit_hours == self.user.total_hours:
            return 1
        elif credit_hours > self.user.total_hours: # ensuring we always get a value < 1
            return self.user.total_hours/credit_hours
        else: return credit_hours/self.user.total_hours

    def semester_preference(self, course: Course) -> float:
        semester_gap : float = -len(self.user.completed_semesters)
        course_semester : float = 0
        for semester in sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split()[-1])):
            for cred in self.curriculum.credit[semester]:
                if course == cred : 
                    course_semester = float(semester[-1])
                    break

        # print(course_semester%2)
        # print((len(self.completed)+1)%2)

        if not course_semester%2 == (len(self.completed)+1)%2:
            return 0.0
        else:
            semester_gap += course_semester
            return abs(semester_gap*(-0.1) + 1)
        
    def successor_score(self, course: Course) -> float:
        recency : int = len(self.user.credit["Completed"]) # measure of how recently the class was taken. Starts as the current max value, that being the length.
        for preq in course.requisites["Prerequisites"]:
            if preq in self.user.credit["Completed"]:
                cur_recency = self.user.credit["Completed"][::-1].index(preq) # Index on the reversed list so we get a lower number, as items are added onto the rightmost (greatest) index. This means the minimum number from this is 1.
                if cur_recency < recency:
                    recency = cur_recency
            elif preq in self.user.credit["IP"]:
                recency = 0
        return (recency/len(self.user.credit["Completed"])-1)**2 if not len(self.user.credit["Completed"]) == 0 else 1.0  # This will end up being something like -(1/8) + 1
    
    def successor_prereq_helper(self, credit : Union[Course, GenEd], course: Course) -> float:
        prereqs = credit.requisites["Prerequisites"]
        if course in prereqs:
            fulfilled_prereqs = [p for p in prereqs if p in self.user.credit["Completed"]]
            prereq_count = len(prereqs)

            if prereq_count > 0:
                progress : float = len(fulfilled_prereqs)/prereq_count
                return progress
        return 0.0

    def successor_prereq_score(self, course : Course) -> float:
        score : float = 0.0
        for semester in self.curriculum.credit:
            for credit in self.curriculum.credit[semester]:
                if isinstance(credit, Course):
                    score += self.successor_prereq_helper(credit, course)
                elif isinstance(credit, GenEd):
                    for cred in credit.courses:
                        score += self.successor_prereq_helper(cred, course)
                else:
                    for cred in credit:
                        score += self.successor_prereq_helper(cred, course)
        return min(score, 1.0) # It shouldnt be able to go above 1.0, so min is fine
        
    def coreq_preference(self, course : Course) -> float:
        for cred in self.user.credit["IP"]:
            if course in cred.requisites["Corequisites"] or cred in course.requisites["Corequisites"]:
                return 1.0
        return 0.0

    def regular_class_preference(self, course : Course) -> float:
        if isinstance(course, GenEdCourse):
            return 0.0
        else:
            return 1.0

    def calc_weight(self, course: Course) -> float:
        w : float = 0

        # print("THIS IS THE COURSE OBJECT BEING WEIGHTED: ", course)
        # print("IS A LIST?", isinstance(course, list))
        new_w = self.dependency_score(course)            # X DONE X Score for how dependent other classes are on this class (i.e. how many classes prereq this class)
        w += 0.15 * new_w
        course.set_weights(dependency=new_w)
        
        new_w = self.prereq_score(course)                # X DONE X Score to give preference to classes which have more prerequisites
        w += 0.10 * new_w
        course.set_weights(preq=new_w)
        
        new_w = self.credit_hour_score(course)
        w += 0.10 * new_w                               # X DONE X Weighting based on how close to the recommended credit hour mark
        course.set_weights(credhr=new_w)
        
        new_w = self.semester_preference(course)
        w += 0.15 * new_w                               # X DONE X Emphasizes what semesters classes are meant to be taken in. If a class is taken in semester 4, then this value will be 0 in any odd semester. Otherwise, > .5, and remaining .5 points awarded to older classes
        course.set_weights(semester=new_w)

        # These first four are grouped because I see a way to combine the 4 of them. The core code is basically the same in 3 of them, and the other one is literally a single line. Will revisit if I have the time. Focusing on getting it working rn. I suspect the below will be similar as well
        
        new_w = self.successor_score(course)
        w += 0.10 * new_w                               # X DONE X Heavier weighting given to classes if it is a successor to a class you have recently taken.
        course.set_weights(successor=new_w)
        
        new_w = self.successor_prereq_score(course)
        w += 0.10 * new_w                               # X DONE X Weight given to classes that are prerequisites of otherwise prereq-fulfilled successor classes. (More weight given to the prereq of a class with 3/4 prereqs than one with 1/3)
        course.set_weights(succ_prereq=new_w)
        
        new_w = self.coreq_preference(course)
        w += 0.15 * new_w                               # X DONE X Note: this is currently just 0/1, no between. Maybe change in the future? Havent decided.A weighting to give preference to classes that are coreqs of classes you're already enrolled in
        course.set_weights(coreq=new_w)

        new_w = self.regular_class_preference(course)
        w += 0.15 * new_w
        
        if isinstance(course, GenEdCourse) and self.user.has_gen_ed_req(course.type): w = 0
        return min(max(w,0),1)

    # update is just supposed to update a pool with every class a user could potentially take right now. This could be done recursively, and it may look more neat. 
    def scuffed_schedule_semester(self) -> List[Course]:
        semesters : List[str] = list(set(self.curriculum.credit.keys())-set(self.completed))
        user_credit: List[Course]= self.user.credit["Completed"]
        current_semester: str = semesters[0]
        current_pool : List[Course] = list(set(self.pool)-set(user_credit))
        current_hours : int = self.hours

        if current_hours > MAX_HOURS:
            ##print("Over hours! 1")
            return self.pool
        ##print("self curriculum credit[current_semester]", self.curriculum.credit[current_semester])
        for cred in self.curriculum.credit[current_semester]:   # Can't do a set here bc gen eds aren't converted to their own objects. If they were, a set could pontentially work.
            ##print("CREDLOOP, CRED: ", cred)
            if cred not in user_credit:                         # ^^^ could simplify in future

                try:
                    temp : int = current_hours + cred.hours
                except AttributeError:
                    pass
                    ##print(f"curric: {self.curriculum}")
                    ##print(f"curric cred list: {self.curriculum.credit}")
                    ##print(f"What da {cred} doin?")

                if not temp > MAX_HOURS:
                    current_pool.append([cred])
                    current_hours += cred.hours
                    self.hours = current_hours
                else:
                    ##print("Over hours! 2")
                    self.pool = current_pool
                    return self.pool
        if self.hours < MAX_HOURS:
            ##print(self.hours)
            ##print(current_hours)
            pass
            

def main() -> None:
    user: User = User(CURRENT_USER_ID)
    curriculum: Curriculum = user.get_curriculum()
    cred: Course = user.credit

    ##print("User Courses:", cred)  # Debug: Check converted courses
    ##print("1st Completed Course: ", cred["Completed"][0].code)
    ##print("Curriculum Courses:", curriculum.credit)  # Debug: Check converted curriculum courses

    i : int = 0
    for sem in curriculum.credit:
        for clas in curriculum.credit[sem]:
            i = i + 1
            try:
                ##print(f"Class {i}: {clas.courseID} {clas.code}")
                pass
            except AttributeError:
                pass
                ##print(f"Class {i}: {clas.type} Gen Ed")
    test: Pool = Pool(user=user, curriculum=curriculum)

    ##print("test pool obj: ", test)
    ##print("full test pool: ", test.pool)
    test.alt_update()
    ##print("test pool updated: ", test.pool)
    for course in test.pool:
        if isinstance(course, list):
            ##print(f"{course[0].type} Gen Ed Course Options: ")
            for g_ed_class in course:
                pass
                ##print(f"Option: {g_ed_class.courseID} {g_ed_class.code}")
        elif isinstance(course, Course):
            pass
            ##print(f"Class: {course.courseID} {course.code}")
        else:
            pass
            ##print(f"IDk what the fuck this is: ", course)
    schedule : List[Course] = test.alt_schedule_semester()
    #userSchedule : List[Course] = user.schedule_semester()
    ##print("-------------SCHEDULE-------------") # Note that this schedule will NOT work right now. Reasons below.
    for course in schedule:
        try:
            ##print(f"Class: {course.courseID} {course.code}")
            pass
        except AttributeError:
            pass
            ##print(f"{clas.type} Gen Ed")


    user.credit["IP"].extend(schedule)
    user.credit["Completed"].extend(user.credit["IP"])
    
    semester1 : List[str] = []
    semester2 : List[str] = []

    test.alt_update()
    schedule2 : List[Course] = test.alt_schedule_semester()
    ##print("-------------Semester 1-------------") # Note that this schedule will NOT work right now. Reasons below.
    for course in schedule:
        try:
            ##print(f"Class: {course.courseID} {course.code}")
            semester1.append(course.courseID + str(course.code))
        except AttributeError:
            ##print(f"{clas.type} Gen Ed")
            pass
    ##print("-------------Semester 2-------------") # Note that this schedule will NOT work right now. Reasons below.
    for course in schedule2:
        try:
            ##print(f"Class: {course.courseID} {course.code}")
            semester2.append(course.courseID + str(course.code))
        except AttributeError:
            ###print(f"{clas.type} Gen Ed")
            pass

    # ----REASONS FOR FAILURE----
    # 1 - No Gen ed Handling. This can be done with a gen ed class. Maybe one that's a child of course, to make things easier. We'd also likely need alternate handling for its lists (since it will have lists where other courses have single classes)
    # 2 - DATA SAMPLE. The data sample I have does not include classes like 3102 or 1552, so even though clearly 1351 is a prereq for 3102, it will schedule you for both at once. IF given the full data set, which I would do if it was properly formatted, it would not do this.
    # 3 - Doesnt branch at all/try to find replacements for classes, and so if you have a valid replacement class or replacement requisite, it won't see that right now. This is logic that should be added in the can_take function.
    # 4 - BASIC algorithm version. This is meant to be barebones, just to show the idea and show that it can give a valid schedule, which it can. This does not include any sort of weighting system or acknowledge class successors, just to name a couple examples of areas for future improvement.

    return {
        "Semester 1" : semester1,
        "Semester 2" : semester2
    }

if __name__ == "__main__":
    schedule = main()
    print(json.dumps(schedule))
