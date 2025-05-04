import csv
import json
from typing import Dict, List, Set, Union

CURRENT_USER_ID: int = 123456
MAX_HOURS: int = 16
MIN_HOURS: int = 12

original_user_data : Dict[str, Dict[str, List['Course']]] = {}

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
            "Bypass-method": [],
        }
        self.successors : List[Course] = []
        if isinstance(successor, Course):
            self.successors.append(successor)

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
            prereq_data = course.requisites["Prerequisites"]
            missing_pre: List[Union[Course, List[Course]]] = []

            for item in prereq_data:
                if isinstance(item, Course):  # AND requirement
                    if item not in credit_set:
                        missing_pre.append(item)
                elif isinstance(item, list):  # OR requirement. The difference being in the way the courses are stored. a list of multiple meaning it could be any of them; they all apply
                    if not any(subitem in credit_set for subitem in item if isinstance(subitem, Course)):
                        missing_pre.append(item)

            if missing_pre:
                missing_dict["Prerequisites"] = missing_pre

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
                try:
                    if isinstance(alt, Course) and alt in set(self.credit["Completed"]): # This is so inefficient im dying
                        if alt in missing_dict["Prerequisites"]:
                            missing_dict["Prerequisites"].remove(alt)
                    elif isinstance(alt, Course) and alt in set(self.credit["IP"]):
                        if alt in missing_dict["Corequisites"]:
                            missing_dict["Corequisites"].remove(alt)
                except TypeError:
                    print("String indeces must be integers, TypeError. alt =", alt)
            pass
        if "Replacements" in course.requisites:
            pass
        if "Other" in course.requisites: # The 5 if statement streak is killing me, but im leaving it here. I dont actually think it'll be used.
            pass
        ###print(f"User is missing: {missing_dict}")
        return missing_dict

    def find_completed_semesters(self) -> None:
        self.curriculum.get_completed_semesters()
        self.completed_semesters = self.curriculum.completed_semesters
        

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
        
        self.find_courses()
    
    def find_courses(self) -> None:
        with open("api\\consolidatedCrawler\\General_Education_Catalog.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
            gen_ed_reader = csv.reader(file, delimiter=",")
            next(gen_ed_reader, None)    # jumps over first line (column names)
            for row in gen_ed_reader:
                if row[0].isdigit() and row[1] == self.type: # if there's a row with an id and its type matches the gen ed type
                    self.courses.append(GenEdCourse(self, row[4], row[5]))

    def find_credit(self, user : User) -> List[GenEdCourse]:
        eligible_courses : List[GenEdCourse] = []
        for cred in self.courses:
            if not user.find_missing_credit(cred):
                eligible_courses.append(cred)
        return eligible_courses
    
    def find_next_credit(self, user : User, start : Course) -> GenEdCourse:
        for i in range(1, 11):
            code : int = int(start.code) + int(i)
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
    def get_pool(self, usr: User, **kwargs: Dict[str, str] ) -> Set[Course]: # Kwargs intended for semester: str
        semester : str = kwargs["semester"] if kwargs["semester"] else "semester 1" # defaults to semester 1
        pool: Set[Course] = set()

        for course in usr.credit.get(semester, []):
            if isinstance(course, Course):
                pool.add(course)
            else:
                pass
                ###print(f"Skipping invalid course entry, likely a gen ed: {course}")

        return pool
    
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
        self.pool : List[Union[Course, List[Course]]]
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
        current_pool : List[Union[Course, List[Course]]] = list(set(self.pool)-set(user_credit))
        ###print(f"viable semesters for pool: {semesters}")
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
                    ###print("COURSE HOURS: ", course.hours)
                    ###print("TOTAL HOURS: ", hrs)
                    
                    schedule.append(course)
        
        return schedule
                
    def alt_update(self) -> None:
        semesters : List[str] = list(set(self.curriculum.credit.keys())-set(self.completed))
        user_credit: List[Course] = self.user.credit["Completed"]
        user_progress: List[Course] = self.user.credit["IP"] 
        #new_pool : List[Course] = list((set(self.pool)-set(user_credit))-set(user_progress))
        new_pool : List[Course] = []

        j : int = 0
        for current_semester in semesters:
            for cred in self.curriculum.credit[current_semester]:

                if isinstance(cred, Course): 
                    if (
                        isinstance(cred, Course) and
                        cred not in user_credit and
                        cred not in user_progress
                    ):
                        print(f"Checking: {cred.courseID} {cred.code}")
                        missing = self.user.find_missing_credit(cred)
                        print(f" - Missing: {missing}")
                        if not missing or all(not v for v in missing.values()):
                            print(f" --> Added to pool: {cred.courseID}")
                            new_pool.append(cred)

                elif isinstance(cred, GenEd):
                    courses : GenEd = cred.courses
                    for course in courses:
                        if course not in self.user.gen_ed_credit[cred.type] and course in user_credit:
                            new_pool.append(cred.find_next_credit(self.user, course))
                    if cred.courses:
                        new_pool.append(cred.find_credit(self.user))
        self.pool = new_pool
        ##print("NEW POOL: ")
        j : int = 0
        for i in new_pool:
            j += 1
            if isinstance(i, Course):
                ##print(f"{j}. {i.courseID} {i.code}")
                pass
            elif isinstance(i, list):
                k :int = 0
                for x in i:
                    k += 1
                    ##print(f"{j}.{k}. {x}")
        ##print("-------------------------NEW-POOL-END-------------------------")
        return
            
    def alt_schedule_semester(self) -> List[Course]:
        hrs : int = 0
        schedule : List[Course] = []
        regular_courses : List[Course] = []
        grouped_gened_courses : List[List[GenEdCourse]] = []
        weights : List[Union[float, List[float]]] = []
        for credit in self.pool: # credit is either a course or a list of gen ed courses
            if isinstance(credit, Course):
                credit.set_weight(self.calc_weight(credit))
                # weights.append(self.calc_weight(credit))
                regular_courses.append(credit)
            elif isinstance(credit, list):
                #list_weights : List[float] = []
                for course in credit:
                    course.set_weight(self.calc_weight(course))
                    #list_weights.append(self.calc_weight(course))
                grouped_gened_courses.append(credit)
                #weights.append(list_weights)
        
        regular_courses.sort(key=lambda c : c.weight, reverse=True)
        for group in grouped_gened_courses:
            group.sort(key=lambda c : c.weight, reverse=True)

        #favored : List[Course] = sorted(self.pool, reverse=True)
        ##print(f"FAVORED REGULAR COURSES:")
        # for r in regular_courses:
        #     ##print(f"{r.title}")
        # ##print(f"FAVORED REGULAR WEIGHTS:")
        # for r in regular_courses:
        #     ##print(f"{r.weight}")

        ##print(self.pool)

        for semester in sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split()[-1])): 
            for course in self.pool:
                if course in self.curriculum.credit[semester] and hrs+course.hours <= MAX_HOURS:
                    hrs += course.hours
                    ##print("COURSE HOURS: ", course.hours)
                    ##print("TOTAL HOURS: ", hrs)
                    
                    if course not in self.user.credit["Completed"]: schedule.append(course)
        i = 0
        # while hrs < MAX_HOURS: 
        #     try:         
        #         for group in grouped_gened_courses:
        #             group.sort(key=lambda c : c.weight, reverse=True)
                    
        #             schedule.append(group[i])

        #             i+= 1
        #     except IndexError:
        #         return schedule

        if hrs < MAX_HOURS and len(regular_courses) > 0:
            self.alt_update()
            self.alt_schedule_semester()


        while hrs < MAX_HOURS and len(grouped_gened_courses) > 0 and grouped_gened_courses[i][i].hours+hrs <= MAX_HOURS:
            if grouped_gened_courses[i][i] not in self.user.credit["Completed"]: schedule.append(grouped_gened_courses[i][i])
            hrs += grouped_gened_courses[i][i].hours
            i+=1
            
        

        return schedule

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
        ##print(f"EXPLAIIIIIIIIIINNNN: {course}")
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
        ##print(course_semester%2)
        ##print((len(self.completed)+1)%2)
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
        return (recency/len(self.user.credit["Completed"])-1)**2 if not self.user.credit["Completed"] == 0 else 1.0  # This will end up being something like -(1/8) + 1
    
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

    def calc_weight(self, course: Course) -> float:
        w : float = 0
        ##print("THIS IS THE COURSE OBJECT BEING WEIGHTED: ", course)
        ##print("IS A LIST?", isinstance(course, list))
        w += 0.20 * self.dependency_score(course)       # X DONE X Score for how dependent other classes are on this class (i.e. how many classes prereq this class)
        w += 0.10 * self.prereq_score(course)           # X DONE X Score to give preference to classes which have more prerequisites
        w += 0.15 * self.credit_hour_score(course)      # X DONE X Weighting based on how close to the recommended credit hour mark
        w += 0.20 * self.semester_preference(course)    # X DONE X Emphasizes what semesters classes are meant to be taken in. If a class is taken in semester 4, then this value will be 0 in any odd semester. Otherwise, > .5, and remaining .5 points awarded to older classes
        # These first four are grouped because I see a way to combine the 4 of them. The core code is basically the same in 3 of them, and the other one is literally a single line. Will revisit if I have the time. Focusing on getting it working rn. I suspect the below will be similar as well
        w += 0.10 * self.successor_score(course)        # X DONE X Heavier weighting given to classes if it is a successor to a class you have recently taken.
        w += 0.10 * self.successor_prereq_score(course) # X DONE X Weight given to classes that are prerequisites of otherwise prereq-fulfilled successor classes. (More weight given to the prereq of a class with 3/4 prereqs than one with 1/3)
        w += 0.15 * self.coreq_preference(course)       # X DONE X Note: this is currently just 0/1, no between. Maybe change in the future? Havent decided.A weighting to give preference to classes that are coreqs of classes you're already enrolled in
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
