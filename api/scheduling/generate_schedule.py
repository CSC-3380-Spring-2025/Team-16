import csv
import json
from typing import Dict, List, Set, Union, Optional

CURRENT_USER_ID: int = 123456 # Its really unfortunate that I have constants here. I really wanted to show more of the algorithm. If you're reading this and curious about what I spent weeks on, I encourage you to play around with this number to see more of the algorithm
CURRENT_USER_DATA: Dict[str, str] = {} 
MAX_HOURS: int = 16
MIN_HOURS: int = 12

class_dictionary: Dict[str, 'Course'] = {}
gen_ed_cache: Dict[str, 'GenEd'] = {}


#This method provides a way to get instances of courses that are shared throughout the entire duration of the schedule generation. This avoids re-initialzing courses that hae already been initialized.
def get_course_instance(courseID: str, code: int) -> 'Course':
    key = f"{courseID} {code}"
    if key in class_dictionary:
        return class_dictionary[key]
    else:
        new_course = Course(courseID, code)
        return new_course

# The course class is the class type for all courses, and holds all information about a course down to if it has labs.
class Course:
    def __init__(self, courseID: str, code: int) -> None:
        self.id: int = -1
        self.title: str = ""
        self.hours: int = 3
        self.courseID: str = courseID
        self.code: int = code
        self.requisites: Dict[str, List[Union[str, 'Course', List['Course']]]] = {
            "Alternative-reqs": [],
            "Prerequisites": [],
            "Corequisites": [],
            "Replacements": [],
            "Bypass-method": [],
            "Other": [],
        }
        self.successors : List[Course] = []
        self.weight: float = 0.0
        self.fulfills_gen_ed_types: List[str] = []
        self.lab_parents: List[Course] = []
        self.assoc_labs: List[Course] = []

        key = f"{self.courseID} {self.code}"
        
        if key not in class_dictionary or not class_dictionary[key].title :
            try:
                with open("api/scheduling/coursedata.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
                    course_reader = csv.reader(file, delimiter=",")
                    next(course_reader, None)
                    for row in course_reader:
                        if row and len(row) > 5 and row[3] == courseID and row[4] == str(code):
                            self.id = int(row[0]) if row[0].isdigit() else -1
                            self.title = row[1]
                            self.hours = int(row[2]) if row[2].isdigit() else 3
                            try:
                                loaded_reqs = json.loads(row[5])
                                for req_key_init in self.requisites.keys(): self.requisites[req_key_init] = []
                                for req_key_load in loaded_reqs:
                                    if req_key_load in self.requisites:
                                         self.requisites[req_key_load] = loaded_reqs[req_key_load]
                            except json.JSONDecodeError: pass
                            break
            except Exception: pass # Stubs where I had debug statements, but they were broken down because I removed all of my print statements indiscriminately.
            
            if key not in class_dictionary:
                 class_dictionary[key] = self
            
            self._convert_requisites()

    def __eq__(self, value : object) -> bool:
        return isinstance(value, Course) and self.courseID == value.courseID and self.code == value.code

    def __hash__(self):
        return hash((self.courseID, self.code))

    def __repr__(self) -> str:
        return f"Course('{self.courseID} {self.code}' | {self.hours})"

    def _convert_requisites(self) -> None: # Data in the CSV is stored in a json with a structure like "{""Prerequisites"" : [{""Requisite"" : [class1, class2], ""Type"" : "Class",}, {""Requisite"" : [class3], ...}, ... ]}" so it has to be parsed down.
        for key in ["Prerequisites", "Corequisites"]:
            if key in self.requisites and isinstance(self.requisites[key], list):
                processed_requirements_for_key: List[Union[Course, List[Course]]] = []
                for req_item_json in self.requisites[key]:
                    if isinstance(req_item_json, dict) and req_item_json.get("Type") == "Class": # This is in reference to the ""Type"" field in the json above. Essentially, this line is just making sure that the requisite item is a json and it's a class that can be processed
                        raw_course_strings = req_item_json.get("Requirement", [])
                        if isinstance(raw_course_strings, str): 
                            raw_course_strings = [raw_course_strings]
                        if isinstance(raw_course_strings, list) and raw_course_strings:
                            if len(raw_course_strings) > 1:
                                or_group_courses: List[Course] = []
                                for course_str in raw_course_strings:
                                    parts = course_str.split(" ")
                                    if len(parts) == 2 and parts[1].isdigit():
                                        course_obj = get_course_instance(parts[0], int(parts[1]))
                                        course_obj.add_successor(self)
                                        or_group_courses.append(course_obj)
                                if or_group_courses:
                                    processed_requirements_for_key.append(or_group_courses)
                            elif len(raw_course_strings) == 1:
                                parts = raw_course_strings[0].split(" ")
                                if len(parts) == 2 and parts[1].isdigit():
                                    course_obj = get_course_instance(parts[0], int(parts[1]))
                                    course_obj.add_successor(self)
                                    processed_requirements_for_key.append(course_obj)
                self.requisites[key] = processed_requirements_for_key
    
    def set_weight(self, w: float) -> None: # simple setter for weight
        self.weight = w

    def add_successor(self, new_successor: 'Course') -> None: # Adds a provided successor to the course's list of successors. A successor is a class which requires THIS class to take. A logical successor.
        if new_successor not in self.successors: self.successors.append(new_successor)

    def _id_lab(self): # Short for identify lab, this function also sets all lab specifics and appends this course to the parent lab's list of labs. Basically, you can find the parent from the lab, and the lab from the parent because of this function.

        if self.hours == 1 and "lab" in self.title.lower():
            coreqs_processed = self.requisites.get("Corequisites", [])
            
            potential_parents: List[Course] = []
            for coreq_item in coreqs_processed:
                if isinstance(coreq_item, Course):
                    potential_parents.append(coreq_item)
                elif isinstance(coreq_item, list):
                    for course_in_or_group in coreq_item:
                        if isinstance(course_in_or_group, Course):
                           potential_parents.append(course_in_or_group)
            
            if potential_parents:
                for parent_cand in potential_parents:
                    parent_obj = get_course_instance(parent_cand.courseID, parent_cand.code)

                    if parent_obj not in self.lab_parents:
                        self.lab_parents.append(parent_obj)
                    if self not in parent_obj.assoc_labs:
                        parent_obj.assoc_labs.append(self)


def identify_all_lab_relationships(class_dict: Dict[str, Course]) -> None: # This function is handled specially because we need to check lab info AFTER all courses have been initialized
    for course_obj in class_dict.values():
        course_obj._id_lab()

# Main class for users. A single user should be represented by this class.
class User:
    def __init__(self, id_num: int) -> None:
        self.id: int = id_num
        self.name: str = ""
        self.email: str = ""
        self.curric_name: str = ""
        self.credit: Dict[str, List[Course]] = {
            "Completed": [],
            "IP": [],
            }
        self.completed_semesters : List[str] = []
        self.total_hours : int = 0
        self.gen_ed_credit : Dict[str, List[Course]] = {
            "English": [],
            "Social/Behavioral": [],
            "Natural": [],
            "Fine": [],
            "Mathematical/Analytical": [],
            "Humanities": [],
            "Natural-Lab": [],
        }
        self.curriculum: Optional[Curriculum] = None
        self.honors : bool = False

        try:
            with open("api/scheduling/userex.csv", newline="", encoding="Windows-1252", errors="ignore") as file: # Every file processing system was based on the first, so they're all pretty similar to it in structure.
                class_reader = csv.reader(file, delimiter=";")
                next(class_reader, None)
                for row in class_reader:
                    if row and row[0].isdigit() and int(row[0]) == self.id:
                        self.name = row[1]; self.email = row[2]; self.curric_name = row[3]
                        try:
                            raw_credit_data = json.loads(row[4])
                            self.credit["Completed"] = raw_credit_data.get("Completed", [])
                            self.credit["IP"] = raw_credit_data.get("IP", [])
                        except json.JSONDecodeError: pass
                        self._convert_credit_strings_to_courses()
                        break
        except FileNotFoundError: pass
        except Exception: pass# Again, more debug stubs.

        if self.credit.get("IP"):
            self.credit["Completed"].extend(self.credit["IP"])
            self.credit["IP"] = [] # Moving the user's in progress (IP, yes I know its an inconvenient abbreviation) classes to completed and setting IP to [] allows for the schedule to prepare the user's "next" semester. This is done on init because the user may have existing IP classes
        self.update_total_hours()

    def _convert_credit_strings_to_courses(self) -> None: # Converting credit strings to courses
        for key in ["Completed", "IP"]:
            converted_list: List[Course] = []
            current_list = self.credit.get(key, [])
            if not isinstance(current_list, list): current_list = []
            for item in current_list:
                if isinstance(item, str):
                    parts = item.split(" ")
                    if len(parts) == 2 and parts[1].isdigit():
                        converted_list.append(get_course_instance(parts[0], int(parts[1]))) # gets sent through get_course_instance, though, as this method is responsible for ensuring that duplicate course instances are not added.
                elif isinstance(item, Course):
                    converted_list.append(item)
            self.credit[key] = converted_list
    
    def update_total_hours(self) -> None:
        self.total_hours = sum(c.hours for c in self.credit.get("Completed", []) if isinstance(c, Course))

    def _populate_gen_ed_credit(self) -> None:
        for key in self.gen_ed_credit: self.gen_ed_credit[key] = []
        relevant_gen_ed_types = set(self.gen_ed_credit.keys())
        if self.curriculum:
            for sem_courses in self.curriculum.credit.values():
                for c_or_g in sem_courses:
                    if isinstance(c_or_g, GenEd): relevant_gen_ed_types.add(c_or_g.type)
        
        for ge_type in relevant_gen_ed_types:
            if ge_type not in gen_ed_cache: gen_ed_cache[ge_type] = GenEd(ge_type)

        for course_obj in self.credit.get("Completed", []):
            for gen_ed_type_fulfilled in course_obj.fulfills_gen_ed_types:
                if gen_ed_type_fulfilled == "Natural-Lab" and not course_obj.lab_parents:
                    continue
                if gen_ed_type_fulfilled in relevant_gen_ed_types:
                     if course_obj not in self.gen_ed_credit.get(gen_ed_type_fulfilled, []):
                        self.gen_ed_credit.setdefault(gen_ed_type_fulfilled, []).append(course_obj)

    def get_curriculum(self) -> "Curriculum":
        if not self.curriculum: self.curriculum = Curriculum(self.curric_name)
        return self.curriculum
    
    # Find missing credit is the main way of determining if a user is able to take a class or not. It returns a dict of any missing courses, if there are any.
    def find_missing_credit(self, course: Course, temp_ip: Optional[List[Course]] = None) -> Dict[str, List[Union[Course, List[Course]]]]:
        missing_dict : Dict[str, List[Union[Course, List[Course]]]] = {}
        completed_courses_set: Set[Course] = set(self.credit.get("Completed", []))
        current_ip_set: Set[Course] = set(self.credit.get("IP", []))
        if temp_ip: current_ip_set = current_ip_set.union(set(temp_ip))
        taken_or_ip_set = completed_courses_set.union(current_ip_set)
        
        if "Prerequisites" in course.requisites: # Checking prereqs
            prereq_groups_or_courses = course.requisites["Prerequisites"]
            missing_pre: List[Union[Course, List[Course]]] = []
            for req_item in prereq_groups_or_courses:
                if isinstance(req_item, Course):
                    if req_item not in completed_courses_set:
                        missing_pre.append(req_item)
                elif isinstance(req_item, list):
                    if not any(or_option_course in completed_courses_set for or_option_course in req_item if isinstance(or_option_course, Course)):
                        missing_pre.append(req_item)
            if missing_pre: missing_dict["Prerequisites"] = missing_pre

        if "Corequisites" in course.requisites: # Checking coreqs
            coreq_groups_or_courses = course.requisites["Corequisites"]
            missing_co: List[Union[Course, List[Course]]] = []
            for req_item in coreq_groups_or_courses:
                if isinstance(req_item, Course):
                    if req_item not in taken_or_ip_set:
                        missing_co.append(req_item)
                elif isinstance(req_item, list):
                    if not any(or_option_course in taken_or_ip_set for or_option_course in req_item if isinstance(or_option_course, Course)):
                        missing_co.append(req_item)
            if missing_co: missing_dict["Corequisites"] = missing_co
        return missing_dict

    def find_completed_semesters(self) -> None: # This function lets the algorithm skip semesters that it knows it already has all credits for.
        if not self.curriculum: self.get_curriculum()
        self.completed_semesters = self.curriculum.get_completed_semesters(self)

class GenEd:
    def __init__(self, type_name: str) -> None:
        self.type: str = type_name
        self.courses: List[Course] = []
        self._populate_courses_for_this_gened_type()
    
    def __repr__(self) -> str:
        return f"GenEd('{self.type}', {len(self.courses)} options)"

    def _populate_courses_for_this_gened_type(self) -> None:
        try:
            with open("api/consolidatedCrawler/General_Education_Catalog.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
                gen_ed_reader = csv.reader(file, delimiter=",")
                next(gen_ed_reader, None)
                for row in gen_ed_reader:
                    if row and len(row) > 5 and row[1] == self.type:
                        try:
                            code = int(row[5])
                            course_obj = get_course_instance(row[4], code)
                            if self.type not in course_obj.fulfills_gen_ed_types:
                                course_obj.fulfills_gen_ed_types.append(self.type)
                            if course_obj not in self.courses:
                                self.courses.append(course_obj)
                        except ValueError: pass
        except FileNotFoundError: pass
        except Exception: pass

    def find_credit(self, user : User) -> List[Course]:
        eligible_courses : List[Course] = []
        for course_option in self.courses:
            if self.type in course_option.fulfills_gen_ed_types:
                if self.type == "Natural-Lab" and not course_option.lab_parents:
                    continue
                
                missing_reqs = user.find_missing_credit(course_option, temp_ip=user.credit["IP"])
                if not any(missing_reqs.values()):
                    if course_option not in user.credit.get("Completed", []) and \
                       course_option not in user.credit.get("IP", []):
                        eligible_courses.append(course_option)
        return eligible_courses

# Each degree should be its own curriculum, so this class is meant to store an instance of a curriculum, including all the credit that one must have to get the degree associated with it.
class Curriculum:
    def __init__(self, progcode: str) -> None:
        self.program: str = progcode; self.id: int = -1; self.degree: str = ""
        self.type: str = ""; self.concentration: str = ""
        self.credit: Dict[str, List[Union[Course, GenEd]]] = {}
        self.hours: int = 0; self.restrictions: str = ""
        self._total_gen_ed_slots: Optional[Dict[str, int]] = None
        try:
            with open("api/consolidatedCrawler/degreeRequirements.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
                prog_reader = csv.reader(file, delimiter=",")
                next(prog_reader, None)
                for row in prog_reader:
                    if row and len(row) > 6 and row[1] == self.program:
                        self.id=int(row[0]) if row[0].isdigit() else -1; self.degree=row[2]; self.type=row[3]; self.concentration=row[4]
                        try:
                            raw_credit_json: Dict[str,List[str]] = json.loads(row[5])
                            self._convert_courses(raw_credit_json)
                        except json.JSONDecodeError: pass
                        self.hours=int(row[6]) if row[6].isdigit() else 0; self.restrictions=row[7]
                        break
        except FileNotFoundError: pass
        except Exception: pass
        self._calculate_total_gen_ed_slots()

    def _calculate_total_gen_ed_slots(self):
        self._total_gen_ed_slots = {}
        sorted_sem_keys = sorted(self.credit.keys(), key=lambda x: int(x.split(" ")[-1]) if " " in x else 0)
        for sem_key_iter in sorted_sem_keys:
            for c_or_g in self.credit[sem_key_iter]:
                if isinstance(c_or_g, GenEd):
                    self._total_gen_ed_slots[c_or_g.type] = self._total_gen_ed_slots.get(c_or_g.type, 0) + 1

    def _convert_courses(self, raw_credit: Dict[str, List[str]]) -> None:
        for semester, course_str_list in raw_credit.items():
            converted_semester_list: List[Union[Course, GenEd]] = []
            for course_str in course_str_list:
                parts = course_str.split(" ")
                if len(parts) == 2 and parts[1].isdigit():
                    converted_semester_list.append(get_course_instance(parts[0], int(parts[1])))
                else:
                    if course_str not in gen_ed_cache: gen_ed_cache[course_str] = GenEd(course_str)
                    converted_semester_list.append(gen_ed_cache[course_str])
            self.credit[semester] = converted_semester_list
    
    def get_completed_semesters(self, user: User) -> List[str]:
        completed_sem_list : List[str] = []
        for sem_name, sem_template_courses in sorted(self.credit.items(), key=lambda item_tuple: int(item_tuple[0].split(" ")[-1]) if " " in item_tuple[0] else 0):
            sem_is_complete = True
            temp_sem_gen_ed_fulfillment_count: Dict[str, int] = {}
            for slot in sem_template_courses:
                if isinstance(slot, Course):
                    if slot not in user.credit.get("Completed", []): sem_is_complete = False; break
                elif isinstance(slot, GenEd):
                    user_completed_count = len(user.gen_ed_credit.get(slot.type, []))
                    slots_seen_this_sem_check = temp_sem_gen_ed_fulfillment_count.get(slot.type, 0)
                    if user_completed_count > slots_seen_this_sem_check:
                        temp_sem_gen_ed_fulfillment_count[slot.type] = slots_seen_this_sem_check + 1
                    else: sem_is_complete = False; break
            if sem_is_complete: completed_sem_list.append(sem_name)
            else: break
        return completed_sem_list

# The pool of classes is the complete list of courses which can be taken by the user. All scheduling related operations are operations performed on the pool, as a pool is specific to a user's circumstance.
# The pool changes as new courses are scheduled, and so it changes between semesters, but otherwise just reflects the user's data.
class Pool:
    def __init__(self, user: User, curriculum: Curriculum) -> None:
        self.user = user; self.curriculum = curriculum
        self.pool : List[Union[Course, GenEd]] = []
        self.completed_user_semesters = user.completed_semesters
    
    def alt_update(self) -> None:
        self.completed_user_semesters = self.user.completed_semesters
        new_pool: List[Union[Course, GenEd]] = []
        user_completed_set: Set[Course] = set(self.user.credit.get("Completed", []))
        user_ip_set: Set[Course] = set(self.user.credit.get("IP", []))

        start_sem_index = len(self.completed_user_semesters)
        sorted_sem_keys = sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split(" ")[-1]) if " " in x else 0)
        relevant_semesters = sorted_sem_keys[start_sem_index:]
        
        placeholders_added: Dict[str, int] = {}
        total_gen_ed_slots_map = self.curriculum._total_gen_ed_slots or {}

        for sem_key in relevant_semesters:
            for item_template in self.curriculum.credit[sem_key]:
                if isinstance(item_template, Course):
                    actual_course = get_course_instance(item_template.courseID, item_template.code)
                    is_in_pool = any(isinstance(p_item, Course) and p_item == actual_course for p_item in new_pool)
                    
                    honors_check : bool # Kind of a misnomer, but this just checks to make sure that if the user is trying to take an HNRS class, they need to be an honors student for it to go through.
                    is_in_pool = any(isinstance(p_item, Course) and p_item == actual_course for p_item in new_pool)
                    if not (self.user.honors and actual_course.courseID == "HNRS") or not actual_course.courseID == "HNRS":
                        honors_check = True
                    else:
                        honors_check = False
                    if actual_course not in user_completed_set and actual_course not in user_ip_set and not is_in_pool and honors_check:
                        missing_reqs = self.user.find_missing_credit(actual_course, temp_ip=list(user_ip_set))
                        if not missing_reqs.get("Prerequisites"):
                            new_pool.append(actual_course)
                elif isinstance(item_template, GenEd):
                    ge_type = item_template.type
                    user_has = len(self.user.gen_ed_credit.get(ge_type, []))
                    placeholders_for_type = placeholders_added.get(ge_type, 0)
                    total_needed = total_gen_ed_slots_map.get(ge_type, 0)
                    if user_has + placeholders_for_type < total_needed:
                        new_pool.append(item_template)
                        placeholders_added[ge_type] = placeholders_for_type + 1
        self.pool = new_pool
            
    def _can_schedule_bundle(self, bundle: List[Course], current_schedule: List[Course], current_hrs: int) -> bool: # bundles are especially important for things like coreqs or labs. Cases where you want to optimize by taking both classes at once.
        bundle_hrs = sum(c.hours for c in bundle)
        if current_hrs + bundle_hrs > MAX_HOURS:
            return False
        hypothetical_ip = list(current_schedule) + bundle
        for course_in_bundle in bundle:
            missing = self.user.find_missing_credit(course_in_bundle, temp_ip=hypothetical_ip)
            if missing.get("Prerequisites") or missing.get("Corequisites"):
                return False
        return True

    def alt_schedule_semester(self) -> List[Course]:
        hrs = 0
        schedule: List[Course] = []
        
        initial_candidates: List[Course] = []
        for item_from_pool in self.pool:
            if isinstance(item_from_pool, Course):
                item_from_pool.set_weight(self.calc_weight(item_from_pool, None))
                initial_candidates.append(item_from_pool)
            elif isinstance(item_from_pool, GenEd):
                slot_semester_num = -1
                for sem_idx, (s_name, s_courses) in enumerate(sorted(self.curriculum.credit.items(), key=lambda t: int(t[0].split(" ")[-1]) if " " in t[0] else 0)):
                    if item_from_pool in s_courses: slot_semester_num = sem_idx + 1; break
                
                eligible_ge_courses: List[Course] = item_from_pool.find_credit(self.user)
                for ge_course_opt in eligible_ge_courses:
                    ge_course_opt.set_weight(self.calc_weight(ge_course_opt, slot_semester_num)) # weight is calculated
                    initial_candidates.append(ge_course_opt) # first round of candidates is sent through, not done processing though. Other things such as labs and bundled classes need to be considered.
        
        unique_candidates = []
        seen_candidates = set()
        for cand_course in sorted(initial_candidates, key=lambda c: c.weight, reverse=True): # sorting by weight
            if cand_course not in seen_candidates:
                unique_candidates.append(cand_course)
                seen_candidates.add(cand_course)
        
        remaining_candidates_to_process = list(unique_candidates)

        while remaining_candidates_to_process:
            course_cand = remaining_candidates_to_process.pop(0)

            if course_cand in schedule:
                continue

            bundle_to_consider = [course_cand]
            
            if course_cand.assoc_labs:
                for lab in course_cand.assoc_labs:
                    if lab not in schedule and lab not in self.user.credit["Completed"]:
                        missing_for_lab = self.user.find_missing_credit(lab, temp_ip=[course_cand] + schedule)
                        if not missing_for_lab.get("Prerequisites") and not missing_for_lab.get("Corequisites"):
                            if lab not in bundle_to_consider: bundle_to_consider.append(lab)
            
            elif course_cand.lab_parents:
                parent_to_bundle_with_lab: Optional[Course] = None
                for parent_lec in course_cand.lab_parents:
                    if parent_lec not in schedule and parent_lec not in self.user.credit["Completed"]:
                        missing_for_parent = self.user.find_missing_credit(parent_lec, temp_ip=[course_cand] + schedule)
                        if not missing_for_parent.get("Prerequisites") and not missing_for_parent.get("Corequisites"):
                            parent_to_bundle_with_lab = parent_lec
                            break
                
                if parent_to_bundle_with_lab and parent_to_bundle_with_lab not in bundle_to_consider:
                    bundle_to_consider.append(parent_to_bundle_with_lab)

            if self._can_schedule_bundle(bundle_to_consider, schedule, hrs):
                for c_add in bundle_to_consider:
                    if c_add not in schedule:
                        schedule.append(c_add)
                        hrs += c_add.hours
                        if c_add in remaining_candidates_to_process:
                            remaining_candidates_to_process.remove(c_add)

        return schedule


    def calc_weight(self, course: Course, gen_ed_slot_curriculum_sem: Optional[int]) -> float:
        w = 0.0
        w += 0.20 * self.dependency_score(course) # How many courses led to this one? The other half of the dependency score coin
        w += 0.10 * self.prereq_score(course) 
        w += 0.05 * self.credit_hour_score(course) # Does it come close to matching the expected credit hours for this class? ex. if you're expected to take this at 59 credit hours and you're at 0, you'll get a low score.
        w += 0.25 * self.semester_preference(course, gen_ed_slot_curriculum_sem) # Higher preference for if you're trying to take this class in the same EXACT semester. Gives preference to fall/spring semesters in the only way we can, since LSU killed the schedule booklet
        w += 0.15 * self.successor_score(course) # How many courses succeed this one? How other courses are dependent on this? i.e. how much does it lead to?
        w += 0.15 * self.successor_prereq_score(course) # if it is the prereq to a would-be successor class
        w += 0.10 * self.coreq_preference(course) # If it's a coreq of another class you're taking, it gets extra preference
        return min(max(w,0),1)

    def dependency_score(self, course : Course) -> float: 
        return min(max(len(course.successors)/5.0, 0), 1)
    
    def prereq_score(self, course: Course) -> float:
        return min(max(len(course.requisites.get("Prerequisites",[])) / 5.0, 0), 1)
    
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
    
    def semester_preference(self, course: Course, gen_ed_slot_curriculum_sem: Optional[int]) -> float:
        course_sem_num_in_template = -1
        if gen_ed_slot_curriculum_sem is not None and any(ge_type in course.fulfills_gen_ed_types for ge_type in self.user.gen_ed_credit.keys()):
            is_lab_for_slot = gen_ed_slot_curriculum_sem > 0 and "Natural-Lab" in [ge.type for ge in self.curriculum.credit.get(f"semester {gen_ed_slot_curriculum_sem}",[]) if isinstance(ge, GenEd)]
            if is_lab_for_slot and not course.lab_parents:
                pass
            else:
                course_sem_num_in_template = gen_ed_slot_curriculum_sem

        if course_sem_num_in_template == -1:
            sorted_template_sem_keys = sorted(self.curriculum.credit.keys(), key=lambda x: int(x.split(" ")[-1]) if " " in x else 0)
            for i, sem_key in enumerate(sorted_template_sem_keys):
                for template_item in self.curriculum.credit[sem_key]:
                    if isinstance(template_item, Course) and template_item == course:
                        course_sem_num_in_template = i + 1
                        break
                    elif isinstance(template_item, GenEd) and any(fulfilled_type == template_item.type for fulfilled_type in course.fulfills_gen_ed_types):
                        if template_item.type == "Natural-Lab" and not course.lab_parents: continue # This is super scuffed and should probably some form of searching for the term lab, but I couldnt find any other instances of labs to justify switching it
                        course_sem_num_in_template = i + 1
                        break
                if course_sem_num_in_template != -1:
                    break
        
        if course_sem_num_in_template == -1: 
            return 0.2
        user_next_logical_sem_num = len(self.completed_user_semesters) + 1
        
        if course_sem_num_in_template == user_next_logical_sem_num: 
            return 1.0
        elif course_sem_num_in_template > user_next_logical_sem_num:
            return max(0, 1.0 - (course_sem_num_in_template - user_next_logical_sem_num) * 0.25)
        else: 
            return 0.1

    def successor_score(self, course: Course) -> float:
        if not course.requisites.get("Prerequisites"): return 0.0
        for prereq_slot in course.requisites["Prerequisites"]:
            completed_credits = set(self.user.credit.get("Completed", []))

            if isinstance(prereq_slot, Course) and prereq_slot in completed_credits: 
                return 1.0

            elif isinstance(prereq_slot, list) and any(p in completed_credits for p in prereq_slot): 
                return 1.0
        return 0.0

    def successor_prereq_score(self, course : Course) -> float:
        total_progress_score = 0; num_successors_checked = 0
        user_completed_credits = set(self.user.credit.get("Completed", []))
        for successor_course in course.successors:
            num_successors_checked +=1
            if not successor_course.requisites.get("Prerequisites"): continue
            num_total_prereqs_for_successor = 0; num_fulfilled_prereqs_for_successor = 0
            for prereq_slot in successor_course.requisites["Prerequisites"]:

                if isinstance(prereq_slot, Course):
                    num_total_prereqs_for_successor +=1
                    if prereq_slot == course: num_fulfilled_prereqs_for_successor +=1
                    elif prereq_slot in user_completed_credits: num_fulfilled_prereqs_for_successor +=1

                elif isinstance(prereq_slot, list):
                    num_total_prereqs_for_successor +=1
                    if course in prereq_slot or any(p in user_completed_credits for p in prereq_slot):
                        num_fulfilled_prereqs_for_successor +=1
            if num_total_prereqs_for_successor > 0: # prevent dividing by zero.
                total_progress_score += num_fulfilled_prereqs_for_successor / num_total_prereqs_for_successor
        if num_successors_checked == 0: 
            return 0.0

        return min(total_progress_score / num_successors_checked, 1.0) # It shouldnt be able to go above 1.0, so min is fine

    def coreq_preference(self, course : Course) -> float:
        user_ip_credits = set(self.user.credit.get("IP", []))
        for ip_course in user_ip_credits:
            if isinstance(ip_course, Course):
                if "Corequisites" in ip_course.requisites:
                    for coreq_slot in ip_course.requisites["Corequisites"]:
                        if isinstance(coreq_slot, Course) and coreq_slot == course: 
                            return 1.0
                        elif isinstance(coreq_slot, list) and course in coreq_slot: # Note: I believe this is 3 loops deep, so I can't go futher
                            return 1.0
                        
                if "Corequisites" in course.requisites:
                    for coreq_slot in course.requisites["Corequisites"]:
                        if isinstance(coreq_slot, Course) and coreq_slot == ip_course: 
                            return 1.0
                        elif isinstance(coreq_slot, list) and ip_course in coreq_slot: 
                            return 1.0
        return 0.0

def main() -> dict[str, List[str]]:
    user = User(CURRENT_USER_ID)
    curriculum = user.get_curriculum()
    identify_all_lab_relationships(class_dictionary)
    user._populate_gen_ed_credit(); user.find_completed_semesters()
    schedules_output: Dict[str, List[str]] = {}
    max_semesters_to_schedule = 8

    for i in range(1, max_semesters_to_schedule + 1):
        user_semester_label = f"Semester {i}"
        user.credit["IP"] = []

        current_pool = Pool(user=user, curriculum=curriculum)
        current_pool.alt_update()

        scheduled_courses: List[Course] = current_pool.alt_schedule_semester()
        schedules_output[user_semester_label] = [f"{c.courseID}{c.code}" for c in scheduled_courses]

        user.credit.get("Completed", []).extend(scheduled_courses)
        user.update_total_hours(); user._populate_gen_ed_credit(); user.find_completed_semesters()

        if len(user.completed_semesters) == len(curriculum.credit):
            all_specific_courses_done = True
            for sem_key_curric, courses_in_curric_sem in curriculum.credit.items():
                for c_or_g_curric in courses_in_curric_sem:
                    if isinstance(c_or_g_curric, Course) and c_or_g_curric not in user.credit["Completed"]:
                        all_specific_courses_done = False; 
                        break
                if not all_specific_courses_done: 
                    break

            all_gen_eds_met = True
            if curriculum._total_gen_ed_slots:
                for ge_type_req, num_slots_req in curriculum._total_gen_ed_slots.items():
                    if len(user.gen_ed_credit.get(ge_type_req,[])) < num_slots_req:
                        all_gen_eds_met = False; 
                        break

            if all_specific_courses_done and all_gen_eds_met: 
                break

    return schedules_output

if __name__ == "__main__":
    import os
    if not os.path.exists("api/scheduling/coursedata.csv"): exit(1)
    final_schedule = main()
    print(json.dumps(final_schedule, indent=4))