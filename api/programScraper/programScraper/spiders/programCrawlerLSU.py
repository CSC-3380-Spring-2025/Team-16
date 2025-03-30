import scrapy

class WebSpider(scrapy.Spider):
    name = 'web'
    start_urls = [
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2661'
    ]
    custom_settings = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'degreeRequirements.csv',
        'FEED_EXPORT_FIELDS': ['ID', 'Program', 'output','hours'],
    }

    def __init__(self, *args, **kwargs):
        super(WebSpider, self).__init__(*args, **kwargs)
        self.counter = 0  # Initialize the counter to 0

    def parse(self, response):
        # Extract links to individual program pages
        program_links = response.xpath('//a[contains(@href, "preview_program")]/@href').getall()
        for link in program_links:
            absolute_link = response.urljoin(link)
            yield scrapy.Request(absolute_link, callback=self.parse_program)

    def parse_program(self, response):
        # Increment the counter for each program
        self.counter += 1
        Hours = 120 #default credit hours
        programName:str = response.css('title::text').get()
        if programName:
            programName:str = programName.strip()
            programName:str = self.clean_program_name(programName)
        else:
            self.logger.error('Program name not found')
        concentrations = {}
        concentrationDivs = response.xpath('//div[@class="custom_leftpad_20"]//div[@class="acalog-core"]')

        if concentrationDivs:
            # Case 1: Programs with concentrations
            for concentrationDiv in concentrationDivs:
                # Extract concentration name (if it exists)
                concentrationName:str = concentrationDiv.xpath('.//h3/text()').get()
                if not concentrationName:
                    concentrationName:str = concentrationDiv.xpath('.//h4/a/text()').get()
                if concentrationName:
                    concentrationName:str = concentrationName.strip()
                    if concentrationName.lower().startswith("semester") or concentrationName.lower().startswith("120"):
                        continue  # Skip to the next iteration

                    semesters:list = {}
                    for div in concentrationDiv.xpath('./following-sibling::div[@class="custom_leftpad_20"][1]//div[@class="acalog-core"]'):
                        # Extract semester name from either <h3> or <h4> tag
                        semesterName:str = None
                        for tag in ['h3', 'h4']:
                            semesterName = div.xpath(f'.//{tag}/a[@name]/text()').get()
                            if not semesterName:
                                semesterName:str = div.xpath(f'.//{tag}/text()').get()
                            if semesterName:
                                semesterName:str = semesterName.strip()
                                break  # Stop searching once we find the semester name

                        if not semesterName:
                            self.logger.error('Semester name not found')
                            continue  # Skip this semester if no name is found

                        # Extract all <li> elements within the semester
                        courses:list = []
                        for li in div.xpath('.//ul//li'):
                            course:str = li.xpath('.//a/text()').get()
                            if course:
                                courses.append(course.strip())
                            else:
                                # Handle cases where the course is plain text
                                course:str = li.xpath('.//text()').get()
                                if course:
                                    courses.append(course.strip())
                                else:
                                    # Handle nested <li> elements or other structures
                                    nestedCourses:str = li.xpath('.//li//text()').getall()
                                    if nestedCourses:
                                        courses.extend([c.strip() for c in nestedCourses if c.strip()])
                        if "" in courses:
                            emptyIndex = courses.index("")
                            courses:list = courses[emptyIndex + 1:]
                        if semesterName and courses:
                            semesters[semesterName] = courses
                            # Add the concentration and its courses to the concentrations dictionary
                        if concentrationName and semesters:
                            concentrations[concentrationName] = semesters
            if concentrations:
                yield {
                    'ID': self.counter,
                    'Program': programName,
                    'output': concentrations,
                    'hours': Hours
                }
            else:
                semesters:list = {}
                for div in response.xpath('.//div[contains(@class, "acalog-core")]'):
                    # Extract semester name from either <h3> or <h4> tag
                    semesterName = None
                    for tag in ['h3', 'h4']:
                        semesterName:str = div.xpath(f'.//{tag}/a[@name]/text()').get()
                        if not semesterName:
                            semesterName:str = div.xpath(f'.//{tag}/text()').get()
                        if semesterName:
                            semesterName:str = semesterName.strip()
                            break

                    if not semesterName:
                        self.logger.error('Semester name not found')
                        continue  # Skip this semester if no name is found

                    # Extract all <li> elements within the semester
                    courses:list = []
                    for li in div.xpath('.//ul//li'):
                        course:str = li.xpath('.//a/text()').get()
                        if course:
                            courses.append(course.strip())
                        else:
                            # Handle cases where the course is plain text (e.g., "General Education Course")
                            course:str = li.xpath('.//text()').get()
                            if course:
                                courses.append(course.strip())
                            else:
                                # Handle nested <li> elements or other structures
                                nestedCourses:str = li.xpath('.//li//text()').getall()
                                if nestedCourses:
                                    courses.extend([c.strip() for c in nestedCourses if c.strip()])
                    if "" in courses:
                        emptyIndex = courses.index("")
                        courses:list = courses[emptyIndex + 1:]
                    if semesterName and courses:
                        semesters[semesterName] = courses
                # If no concentrations are found, fall back to extracting the program description
                programDescription:str = response.xpath('//div[contains(@class, "program_description")]//p//text()').getall()
                if programDescription:
                    programDescription:str = " ".join(programDescription).strip()  # Combine all paragraphs into a single string
                    programDescription:str = self.clean_programDescription(programDescription)
                else:
                    programDescription:str = "No description available"
                if semesters:
                    yield {
                        'ID': self.counter,
                        'Program': programName,
                        'output': semesters,
                        'hours': Hours
                    }
                else:
                    yield {
                        'ID': self.counter,
                        'Program': programName,
                        'output': programDescription,
                        'hours': Hours
                    }
        else:

            # Extract the program description
            programDescription:str = response.xpath('//div[contains(@class, "program_description")]//p//text()').getall()
            if programDescription:
                programDescription:str = " ".join(programDescription).strip()  # Combine all paragraphs into a single string
                programDescription:str = self.clean_programDescription(programDescription)
            else:
                programDescription:str = "No description available"
            yield {
                'ID': self.counter,
                'Program': programName,
                'output': programDescription,
                'hours': Hours
            }

    def clean_program_name(self, program_name:str):
        if program_name.startswith("Degrees programs/curriculums/majors:"):
            program_name:str = program_name.replace("Degrees programs/curriculums/majors:", "").strip()
        if program_name.endswith("- Louisiana State University - Modern Campus Catalog™"):
            program_name:str = program_name.replace("- Louisiana State University - Modern Campus Catalog™", "").strip()

        return program_name

    def clean_programDescription(self, programDescription):
        return programDescription.replace("\r\n", " ").replace("\n", " ").replace(" ","").strip()






