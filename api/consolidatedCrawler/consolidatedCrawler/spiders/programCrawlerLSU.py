
import scrapy
import json  # For serializing complex data structures

class WebSpider(scrapy.Spider):
    name:str = 'degree'
    start_urls = [
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2661'
    ]
    custom_settings:dict = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'degreeRequirements.csv',
        'FEED_EXPORT_FIELDS': ['ID', 'Program', 'degree', 'type', 'concentration', 'credit', 'hours', 'restrictions']
    }

    #Note - The goal of this scraper was to get information on each and every single program, list their concentrations and semesters, and output a csv that holds such complex data types. Pain in the butt to make, but honestly, probably one of my proudest work. lol

    def __init__(self, *args, **kwargs):
        super(WebSpider, self).__init__(*args, **kwargs)
        self.counter:int = 0  # Initialize the counter to 0

    def parse(self, response):
        program_links = response.xpath('//a[contains(@href, "preview_program")]/@href').getall()
        for link in program_links:
            absolute_link = response.urljoin(link)
            yield scrapy.Request(absolute_link, callback=self.parse_program)

    def parse_program(self, response):
        Hours:int = 120  # default credit hours
        type:str = 'Major' #default program type
        concentrationsList: dict = {
            "Agricultural Leadership and Development": "ALAD",
            "Teaching in Formal Education": "TFE",
            "Agribusiness Analytics": "AGBALY",
            "Agribusiness Finance": "AGBFIN",
            "Food Industry Management": "FIM",
            "International Business": "INTBUS",
            "Rural Development": "AGBRDV",
            "Animal Production": "ANPROD",
            "Animal Products Processing": "APP",
            "Pre-veterinary Medicine-Animal Science": "PVMANI",
            "Science & Technology - Animal": "STANI",
            "Agricultural Pest Management (Entomology Emphasis)": "APME",
            "Agricultural Pest Management (Plant Pathology Emphasis)": "APMP",
            "Crop Science": "CROPSC",
            "Horticulture Sciences": "HRTSCS",
            "Medicinal Plant Sciences": "MPS",
            "Soil Science": "SOILSC",
            "Sustainable Production Systems": "SPS",
            "Turf & Landscape Management": "TELDMT",
            "Urban Entomology": "URBENT",
            "Dietetics": "DIET",
            "Food Science and Technology": "FST",
            "Nutrition, Health & Society": "NHS",
            "Nutritional Sciences/Pre-Medical": "NUTR",
            "Environmental Analysis & Risk Management": "EARM",
            "Policy Analysis": "PLCYAN",
            "Resource Conservation": "RESCON",
            "Conservation Biology": "CNSVBL",
            "Ecological Restoration": "ECRSTR",
            "Fisheries & Aquaculture": "FSHAQU",
            "Forest Resources Management": "FMGMT",
            "Preveterinary Medicine - Animal": "PVMEDW",
            "Watershed Science": "WATERS",
            "Wetland Science": "WTLNDS",
            "Wildlife Ecology": "WLDECL",
            "Wildlife Habitat Conservation & Management": "WHCM",
            "Apparel Design": "APPARL",
            "Merchandising": "MERCHD",
            "Textile Science": "TEXTIL",
            "Art History": "ARTHS",
            "Digital Art": "DIGIT",
            "Graphic Design": "GRDESN",
            "Studio Art": "START",
            "Analytics": "ISAA",
            "Cyber Risk": "ISACR",
            "Digital Services & Consulting": "ISADSC",
            "Business Analytics": "BANLYT",
            "Digital Marketing": "DGMKT",
            "Human Resource Management": "HRM",
            "Information Technology Management": "INTECH",
            "Marketing Analytics": "MIKAN",
            "Professional Sales": "PASAL",
            "Empirical Economic Analysis": "EEAE",
            "Economic Empirical Analysis": "EEAE",
            "International Management": "INTMGT",
            "Strategic Leadership": "STRLD",
            "Applied Coastal Environmental Science": "ACES",
            "Coastal Meteorology": "COMET",
            "Deltaic Science": "DELTA",
            "Environmental Health (3+2 LSUHSC SPH)": "ENHS",
            "Environmental Law (3+3 LSU Law)": "ENL",
            "Environmental Science and Research": "ESR",
            "Cloud Computing and Networking": "CSCCCN",
            "Computer Science & Second Discipline": "CSCSD",
            "Cybersecurity": "CSCCYB",
            "Data Science and Analytics": "CSCDSA",
            "Software Engineering": "CSCSEG",
            "Carbon Capture, Utilization and Storage": "CCUS",
            "Four Year Teacher Certification, Grades 1-5": "1-5CRT",
            "Holmes Certification, Grades 1-5": "1-5HCT",
            "Exercise Science and Human Performance": "ESHP",
            "Health and Physical Education Teacher Certification": "HPEERT",
            "Human Movement Science": "HUMVT",
            "Physical Activity and Health": "PHYAH",
            "Pre-Athletic Training": "PREAT",
            "Sport Commerce": "SPCOM",
            "Sport Leadership": "SPLEAD",
            "Child & Family Studies": "HCFS",
            "Child Life": "HCL",
            "Creative Writing": "ENCW",
            "Literature": "ENLT",
            "Rhetoric, Writing, and Culture": "RWC",
            "Secondary Education - English": "ENGLSE",
            "Secondary Education-FREN": "FRENSE",
            "Climatology": "CLIMA",
            "Disaster Science & Management": "DSMA",
            "Environmental Studies": "EVSA",
            "Geographic Information Science": "GISA",
            "Secondary Education-History": "HISTSE",
            "General Studies": "ISGS",
            "Individualized Studies": "INDVID",
            "Informatics": "INFOR",
            "Organizational Dynamics": "ISOD",
            "Public Policy Advocacy": "ISPPA",
            "Urban and Regional Planning": "ISURP",
            "Africa": "AFRICA",
            "Asia": "ASIA",
            "Environment & Development": "ENVDEV",
            "Europe": "EUROPE",
            "Global Cultures": "GLBCUL",
            "Global Diplomacy": "GLBDPL",
            "Global Studies": "GLOBST",
            "Latin America and Caribbean": "LTACRB",
            "Middle East and North Africa": "MOENA",
            "Classical Civilization": "CLCIV",
            "Women's, Gender and Sexuality Studies": "WGSS",
            "Law, Ethics, and Social Justice": "LESJ",
            "Religious Studies": "REL",
            "American Government & Politics": "AMGP",
            "Comparative Government & Politics": "COGP",
            "International Politics & Law": "INTPL",
            "Law & Legal Systems": "LLSYS",
            "Political Theory": "POLTH",
            "Public Policy and Political Analysis": "PPPA",
            "Race Ethnicity and Gender": "REG",
            "Cognitive Neuroscience": "COGNS",
            "Forensic Psychology": "FORPSY",
            "History, Theory, & Criticism": "HTC",
            "Production": "PROD",
            "Screenwriting": "SCRW",
            "Criminology": "CRIM",
            "Secondary Education-SPAN": "SPANSE",
            "Digital Advertising": "ADV",
            "Journalism": "JOURN",
            "Political Communication": "POLCM",
            "Pre-Law Digital Advertising 3+3": "LADV",
            "Pre-Law Journalism 3+3": "LJOURN",
            "Pre-Law Political Communication 3+3": "LPOLCM",
            "Pre-Law Public Relations 3+3": "LPR",
            "Public Relations": "PR",
            "Academic Studies": "ACST",
            "Arts Administration": "AADMIN",
            "Brass": "BRASS",
            "Church Music": "CHURCH",
            "Composition": "COMP",
            "Experimental Music & Digital Media": "EMDM",
            "Intradisciplinary Music": "INTRA",
            "Jazz": "JAZZ",
            "Percussion": "PERC",
            "Piano Pedagogy": "PIAPD",
            "Piano Performance": "PIAPE",
            "Strings": "STRNG",
            "Theatre": "THEA",
            "Voice": "VOICE",
            "Woodwind": "WWIND",
            "Instrumental": "INSTM",
            "Vocal": "VOCAL",
            "Design/Technology": "TD&T",
            "Performance": "PERF",
            "Physical Theatre": "PHYTH",
            "Theatre Studies": "THTRST",
            "Marine Biology": "MARINE",
            "Secondary Education-BIOL": "BIOLSE",
            "Biological Chemistry": "BCHEM",
            "Chemical Physics": "CHEMPH",
            "Chemistry": "CHEMA",
            "Chemistry & Second Discipline": "CHEMSD",
            "Environmental Chemistry": "ENVCHM",
            "Forensic Chemistry": "CHMFOR",
            "Polymers": "CHMPLY",
            "Pre-Health": "CHMPHA",
            "Secondary Education - Chemistry": "CHEMSE",
            "Environmental Geology": "ENVGEO",
            "Geology": "GEOLP",
            "Geology & Second Discipline": "GEOSD",
            "Geophysics": "GEOP",
            "Actuarial Science": "MACTSC",
            "Computational Mathematics": "MACMP",
            "Data Science": "DATASC",
            "Mathematical Statistics": "MATHST",
            "Mathematics": "MATH",
            "Mathematics and a Second Discipline": "MASD",
            "Secondary Education - Mathematics": "MATHSE",
            "Astronomy": "ASTR",
            "Medical Physics": "MPHYS",
            "Physics": "PHYS",
            "Physics & Second Discipline": "PHYSD",
            "Secondary Education - Physics": "PHYSSE"
        }
        programName:str = response.css('title::text').get()
        if programName:
            programName:str = self.clean_program_name(programName.strip())
        else:
            self.logger.error('Program name not found')
            return  # Exit if no program name

        concentrations:list = {}
        concentrationDivs = response.xpath('//div[@class="custom_leftpad_20"]//div[@class="acalog-core"]')

        if concentrationDivs:
            # Case 1: Programs with concentrations
            for concentrationDiv in concentrationDivs:
                concentrationName:str = concentrationDiv.xpath('.//h3/text()').get()
                if not concentrationName:
                    concentrationName:str = concentrationDiv.xpath('.//h4/a/text()').get()
                if concentrationName:
                    concentrationName:str = concentrationName.strip()
                    if concentrationName.lower().startswith("semester") or concentrationName.lower().startswith("120"):
                        continue

                    semesters:list = {}
                    for div in concentrationDiv.xpath('./following-sibling::div[@class="custom_leftpad_20"][1]//div[@class="acalog-core"]'):
                        semesterName:str = None
                        for tag in ['h3', 'h4']:
                            semesterName:str = div.xpath(f'.//{tag}/a[@name]/text()').get()
                            if not semesterName:
                                semesterName:str = div.xpath(f'.//{tag}/text()').get()
                            if semesterName:
                                semesterName:str = semesterName.strip()
                                break

                        if not semesterName:
                            self.logger.error('Semester name not found')
                            continue

                        restrictions:list = []
                        allText:str = div.xpath('.//p//em//text()').getall()
                        cleanedText = [text.strip() for text in allText if text.strip()]
                        startIndex:int = None
                        for i, text in enumerate(cleanedText):
                            if 'will not receive degree credit' in text:
                                startIndex = i + 1
                                break
                        if startIndex is not None:
                            endIndex:int = None
                            for i in range(startIndex, len(cleanedText)):
                                if "." in cleanedText[i]:
                                    endIndex = i
                                    break
                            restrictions:list = cleanedText[startIndex:endIndex] if endIndex is not None else cleanedText[startIndex:]

                        courses:list = []
                        for li in div.xpath('.//ul//li'):
                            course:str = li.xpath('.//a/text()').get()
                            if course:
                                course = self.clean_course_name(course)
                                parts:list = course.split(" ")
                                course_tag:str = parts[0]
                                course_code:str = parts[1]
                                course:str = course_tag + ' ' + course_code
                                if course_tag == "General":
                                    course:str = parts[4]
                                courses.append(course.strip())
                            else:
                                course:str = li.xpath('.//text()').get()
                                sup:str = li.xpath('.//sup/text()').get()
                                if sup:
                                    course:str = course + '['+sup+']' #This would help the algorithm find the specific citation, alongside the program name, which is already given, allowing for cross-referencing with two datasets
                                if course:
                                    course = self.clean_course_name(course)
                                    parts:list = course.split(" ")
                                    if parts[0] == "General":
                                        course:str = parts[4]
                                    courses.append(course.strip())
                                else:
                                    nestedCourses = li.xpath('.//li//text()').getall()
                                    if nestedCourses:
                                        courses.extend([c.strip() for c in nestedCourses if c.strip()]) #The reason for this existing is that for some super esoteric programs, the courses for some reason are nested within one another, making standardized scraping across all platforms a pain.
                        if "" in courses:
                            emptyIndex = courses.index("")
                            courses = courses[emptyIndex + 1:]
                        if semesterName and courses:
                            semesters[semesterName]:list = courses

                    if concentrationName and semesters:
                        self.counter += 1
                        program: str = concentrationsList.get(concentrationName)
                        concentrations[concentrationName]:list = semesters
                        yield {
                            'ID': self.counter,
                            'Program': program,
                            'degree': programName,
                            'type': type,
                            'concentration': concentrationName,
                            'credit': json.dumps(semesters),  # Serialize to JSON string
                            'hours': Hours,
                            'restrictions': json.dumps(restrictions) if restrictions else None,  # Serialize to JSON string
                        }
            return  # Exit after processing concentrations

        # Case 2: Programs without concentrations
        semesters:dict = {}
        for div in response.xpath('.//div[contains(@class, "acalog-core")]'):
            semesterName:str = None
            for tag in ['h3', 'h4']:
                semesterName:str = div.xpath(f'.//{tag}/a[@name]/text()').get()
                if not semesterName:
                    semesterName:str = div.xpath(f'.//{tag}/text()').get()
                if semesterName:
                    semesterName:str = semesterName.strip()
                    break

            if not semesterName:
                self.logger.error('Semester name not found')
                continue

            restrictions:list = []
            allText:str = div.xpath('.//p//em//text()').getall()
            cleanedText = [text.strip() for text in allText if text.strip()]
            startIndex = None
            for i, text in enumerate(cleanedText):
                if 'will not receive degree credit' in text:
                    startIndex = i + 1
                    break
            if startIndex is not None:
                endIndex = None
                for i in range(startIndex, len(cleanedText)):
                    if "." in cleanedText[i]:
                        endIndex = i
                        break
                restrictions = cleanedText[startIndex:endIndex] if endIndex is not None else cleanedText[startIndex:]

            courses:list = []
            for li in div.xpath('.//ul//li'):
                course = li.xpath('.//a/text()').get()
                if course:
                    course = self.clean_course_name(course)
                    parts:list = course.split(" ")
                    course_tag:str = parts[0]
                    course_code:str = parts[1]
                    course:str = course_tag + ' ' + course_code
                    if course_tag == "General":
                        course = parts[4]
                    courses.append(course.strip())
                else:
                    course:str = li.xpath('.//text()').get()
                    sup:str = li.xpath('.//sup/text()').get()
                    if sup:
                        course:str = course + '[' + sup + ']'
                    if course:
                        course = self.clean_course_name(course)
                        parts = course.split(" ")
                        if parts[0] == "General":
                            course = parts[4]
                        courses.append(course.strip())
                    else:
                        nestedCourses = li.xpath('.//li//text()').getall()
                        if nestedCourses:
                            courses.extend([c.strip() for c in nestedCourses if c.strip()])
            if "" in courses:
                emptyIndex = courses.index("")
                courses = courses[emptyIndex + 1:]
            if semesterName and courses:
                semesters[semesterName] = courses
        if semesters:
            self.counter += 1
            if 'Minor' in programName:
                type = 'Minor'
            else:
                if 'PhD' in programName:
                    type = 'PhD'
                else:
                    parts = programName.split(" ")
                    type = parts[-1]
            yield {
                'ID': self.counter,
                'Program': programName.split()[0],
                'degree': programName,
                'type': type,
                'concentration': None,
                'credit': json.dumps(semesters),  # Serialize to JSON string
                'hours': Hours,
                'restrictions': json.dumps(restrictions) if restrictions else None,  # Serialize to JSON string
            }
        else:
            programDescription = response.xpath('//div[contains(@class, "program_description")]//p//text()').getall()
            if programDescription:
                programDescription:str = " ".join(programDescription).strip()
                programDescription:str = self.clean_programDescription(programDescription)
            else:
                programDescription:str = "No description available"
            self.counter += 1
            if 'Minor' in programName:
                type = 'Minor'
            else:
                if 'PhD' in programName:
                    type = 'PhD'
                else:
                    parts = programName.split(" ")
                    type = parts[-1]
            yield {
                'ID': self.counter,
                'Program': programName.split()[0],
                'degree': programName,
                'type': type,
                'concentration': None,
                'credit': programDescription,
                'hours': Hours,
                'restrictions': None,
            }
    # methods below are pretty standard name-cleaning stuff: for courses, program name, and some descriptions
    def clean_program_name(self, program_name):
        if program_name.startswith("Degrees programs/curriculums/majors:"):
            program_name = program_name.replace("Degrees programs/curriculums/majors:", "").strip()
        if program_name.endswith("- Louisiana State University - Modern Campus Catalog™"):
            program_name = program_name.replace("- Louisiana State University - Modern Campus Catalog™", "").strip()
        return program_name

    def clean_course_name(self, course):
        if not course or not isinstance(course, str):
            return course
        course = (course.replace("\u00a0", " ").replace("\\u00a0", " ").replace("u00a0", " ").replace("&nbsp;", " "))
        return course.strip()

    def clean_programDescription(self, programDescription):
        return programDescription.replace("\r\n", " ").replace("\n", " ").replace(" "," ").strip()



