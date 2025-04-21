

import scrapy
import json  # For serializing complex data structures

class WebSpider(scrapy.Spider):
    name:str = 'degree'
    start_urls = [
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2661'
    ]
    custom_settings = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'degreeRequirements.csv',
        'FEED_EXPORT_FIELDS': ['ID', 'Program', 'degree', 'type', 'concentration', 'credit', 'hours', 'restrictions']
    }

    def __init__(self, *args, **kwargs):
        super(WebSpider, self).__init__(*args, **kwargs)
        self.counter:int = 0  # Initialize the counter to 0

    def parse(self, response):
        # Extract links to individual program pages
        program_links = response.xpath('//a[contains(@href, "preview_program")]/@href').getall()
        for link in program_links:
            absolute_link = response.urljoin(link)
            yield scrapy.Request(absolute_link, callback=self.parse_program)

    def parse_program(self, response):
        Hours:int = 120  # default credit hours
        type:str = 'Major' #default type
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
                    for div in concentrationDiv.xpath(
                            './following-sibling::div[@class="custom_leftpad_20"][1]//div[@class="acalog-core"]'):
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
                            continue

                        restrictions:list = []
                        allText:str = div.xpath('.//p//em//text()').getall()
                        cleanedText:str = [text.strip() for text in allText if text.strip()]
                        startIndex:int = None
                        for i, text in enumerate(cleanedText):
                            if 'will not receive degree credit' in text:
                                startIndex:int = i + 1
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
                                parts:list = course.split(" ")
                                course_tag:str = parts[0]
                                course_code:str = parts[1]
                                course:str = course_tag + ' ' + course_code
                                if course_tag == "General":
                                    course:str = parts[4]
                                courses.append(course.strip())
                            else:
                                course:str = li.xpath('.//text()').get()
                                if course:
                                    parts:list = course.split(" ")
                                    if parts[0] == "General":
                                        course = parts[4]
                                    courses.append(course.strip())
                                else:
                                    nestedCourses:list = li.xpath('.//li//text()').getall()
                                    if nestedCourses:
                                        courses.extend([c.strip() for c in nestedCourses if c.strip()])
                        if "" in courses:
                            emptyIndex = courses.index("")
                            courses = courses[emptyIndex + 1:]
                        if semesterName and courses:
                            semesters[semesterName]:list = courses

                    if concentrationName and semesters:
                        self.counter += 1
                        concentrations[concentrationName]:list = semesters
                        yield {
                            'ID': self.counter,
                            'Program': programName.split()[0] + concentrationName.split()[0],
                            'degree': programName,
                            'type': type,
                            'concentration': concentrationName,
                            'credit': json.dumps(semesters),  # Serialize to JSON string
                            'hours': Hours,
                            'restrictions': json.dumps(restrictions) if restrictions else None,  # Serialize to JSON string
                        }
            return  # Exit after processing concentrations

        # Case 2: Programs without concentrations
        semesters:list = {}
        for div in response.xpath('.//div[contains(@class, "acalog-core")]'):
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
                continue

            restrictions:list = []
            allText:str = div.xpath('.//p//em//text()').getall()
            cleanedText:str = [text.strip() for text in allText if text.strip()]
            startIndex:int = None
            for i, text in enumerate(cleanedText):
                if 'will not receive degree credit' in text:
                    startIndex:int = i + 1
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
                    parts:list = course.split(" ")
                    course_tag:str = parts[0]
                    course_code:str = parts[1]
                    course:str = course_tag + ' ' + course_code
                    if course_tag == "General":
                        course:str = parts[4]
                    courses.append(course.strip())
                else:
                    course:str = li.xpath('.//text()').get()
                    if course:
                        parts:list = course.split(" ")
                        if parts[0] == "General":
                            course:str = parts[4]
                        courses.append(course.strip())
                    else:
                        nestedCourses:list = li.xpath('.//li//text()').getall()
                        if nestedCourses:
                            courses.extend([c.strip() for c in nestedCourses if c.strip()])
            if "" in courses:
                emptyIndex = courses.index("")
                courses:list = courses[emptyIndex + 1:]
            if semesterName and courses:
                semesters[semesterName]:list = courses

        if semesters:
            self.counter += 1
            if 'Minor' in programName:
                type:str = 'Minor'
            else:
                if 'PhD' in programName:
                    type:str = 'PhD'
                else:
                    parts:list = programName.split(" ")
                    type:str = parts[-1]
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
            programDescription:str = response.xpath('//div[contains(@class, "program_description")]//p//text()').getall()
            if programDescription:
                programDescription = " ".join(programDescription).strip()
                programDescription = self.clean_programDescription(programDescription)
            else:
                programDescription:str = "No description available"
            self.counter += 1
            if 'Minor' in programName:
                type:str = 'Minor'
            else:
                if 'PhD' in programName:
                    type:str = 'PhD'
                else:
                    parts:list = programName.split(" ")
                    type:str = parts[-1]
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

    def clean_program_name(self, program_name):
        if program_name.startswith("Degrees programs/curriculums/majors:"):
            program_name = program_name.replace("Degrees programs/curriculums/majors:", "").strip()
        if program_name.endswith("- Louisiana State University - Modern Campus Catalog™"):
            program_name = program_name.replace("- Louisiana State University - Modern Campus Catalog™", "").strip()
        return program_name

    def clean_programDescription(self, programDescription):
        return programDescription.replace("\r\n", " ").replace("\n", " ").replace(" "," ").strip()



