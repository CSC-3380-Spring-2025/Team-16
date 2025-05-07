import scrapy


class WebSpider(scrapy.Spider):
    name = 'citation'

    start_urls = [
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2661'
    ]
    custom_settings:dict = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'citations.csv',
        'FEED_EXPORT_FIELDS': ['ID', 'Program', 'Degree', 'Concentration', 'Requirements'],
    }

    def __init__(self, *args, **kwargs):
        super(WebSpider, self).__init__(*args, **kwargs)
        self.counter = 0

    def parse(self, response):
        program_links = response.xpath('//a[contains(@href, "preview_program")]/@href').getall()
        for link in program_links:
            absolute_link = response.urljoin(link)
            yield scrapy.Request(absolute_link, callback=self.parse_program)

    def parse_program(self, response):
        # Extract and clean program name
        programName: str = response.css('title::text').get('').strip()
        programName: str = self.clean_program_name(programName)
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
        # Find potential concentration headers/sections
        concentrationDivs = response.xpath('//div[@class="custom_leftpad_20"]//div[@class="acalog-core"]')

        if concentrationDivs:
            for concentrationDiv in concentrationDivs:
                concentrationName:str = concentrationDiv.xpath('.//h3/text()').get()
                if not concentrationName:
                    concentrationName:str = concentrationDiv.xpath('.//h4/a/text()').get()

                if concentrationName:
                    concentrationName:str = concentrationName.strip()
                    if concentrationName.lower().startswith("semester") or concentrationName.lower().startswith("120"):
                        continue

                    requirements: list = []

                    for div in concentrationDiv.xpath('./following-sibling::div[@class="custom_leftpad_20"][1]//div[@class="acalog-core"][9]'):
                        allText: str = div.xpath('.//text()').getall()
                        cleanedText: str = [text.strip() for text in allText if text.strip()]

                        total_hours_indices: int = [i for i, text in enumerate(cleanedText) if "Total Sem. Hrs." in text]

                        for i, start_index in enumerate(total_hours_indices):
                            # Start from the element after "Total Sem. Hrs."
                            section_start: int = start_index + 1

                            section_end: int = None

                            # Look for CRITICAL REQUIREMENTS first
                            for j in range(section_start, len(cleanedText)):
                                if ("CRITICAL REQUIREMENTS" in cleanedText[j] or "Critical Requirements" in cleanedText[j]):
                                    section_end = j
                                    break

                            # If no CRITICAL REQUIREMENTS found, look for next Total Sem. Hrs.
                            if section_end is None:
                                for j in range(section_start, len(cleanedText)):
                                    if j in total_hours_indices[i + 1:]:
                                        section_end = j
                                        break

                            sectionText: str = cleanedText[section_start:section_end] if section_end is not None else cleanedText[section_start:]
                            requirements.extend(sectionText)
                        program: str = concentrationsList.get(concentrationName)
                        self.counter += 1
                        yield {
                            'ID': self.counter,
                            'Program': program,
                            'Degree': programName,
                            'Concentration': concentrationName,
                            'Requirements': requirements
                        }
        else:
            requirements: list = []

            contentDiv = response.xpath('//div[@class="acalog-core"]')
            if contentDiv:
                allText: str = contentDiv.xpath('.//text()').getall()
                cleanedText: str = [text.strip() for text in allText if text.strip()]

                total_hours_indices: int = [i for i, text in enumerate(cleanedText) if "Total Sem. Hrs." in text]

                for i, start_index in enumerate(total_hours_indices):
                    # Start from the element after "Total Sem. Hrs."
                    section_start: int = start_index + 1

                    section_end: int = None

                    # Look for CRITICAL REQUIREMENTS first
                    for j in range(section_start, len(cleanedText)):
                        if ("CRITICAL REQUIREMENTS" in cleanedText[j] or "Critical Requirements" in cleanedText[j]):
                            section_end = j
                            break

                    # If no CRITICAL REQUIREMENTS found, look for next Total Sem. Hrs.
                    if section_end is None:
                        for j in range(section_start, len(cleanedText)):
                            if j in total_hours_indices[i + 1:]:
                                section_end = j
                                break

                    sectionText: str = cleanedText[section_start:section_end] if section_end is not None else cleanedText[section_start:]
                    requirements.extend(sectionText)
                    self.counter += 1
                yield {
                    'ID': self.counter,
                    'Program': None,
                    'Degree': programName,
                    'Concentration': None,
                    'Requirements': requirements
                }

    def clean_program_name(self, programName: str):
        if programName.startswith("Degrees programs/curriculums/majors:"):
            programName: str = programName.replace("Degrees programs/curriculums/majors:", "").strip()
        if programName.endswith("- Louisiana State University - Modern Campus Catalog™"):
            programName: str = programName.replace("- Louisiana State University - Modern Campus Catalog™", "").strip()
        return programName

