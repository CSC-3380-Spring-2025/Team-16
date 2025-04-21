import scrapy


class WebSpider(scrapy.Spider):
    name = 'citation'

    start_urls = [
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2661'
    ]
    custom_settings = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'citations.csv',
        'FEED_EXPORT_FIELDS': ['ID', 'Degree', 'Requirements'],
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
        self.counter += 1

        # Extract and clean program name
        programName:str = response.css('title::text').get('').strip()
        programName:str = self.clean_program_name(programName)

        requirements:list = []

        contentDiv = response.xpath('//div[@class="acalog-core"]')
        if contentDiv:
            allText:str = contentDiv.xpath('.//text()').getall()
            cleanedText:str = [text.strip() for text in allText if text.strip()]

            total_hours_indices:int = [i for i, text in enumerate(cleanedText) if "Total Sem. Hrs." in text]

            for i, start_index in enumerate(total_hours_indices):
                # Start from the element after "Total Sem. Hrs."
                section_start:int = start_index + 1

                section_end:int = None

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

                sectionText:str = cleanedText[section_start:section_end] if section_end is not None else cleanedText[section_start:]
                requirements.extend(sectionText)

        yield {
            'ID': self.counter,
            'Degree': programName,
            'Requirements': requirements
        }

    def clean_program_name(self, programName: str):
        if programName.startswith("Degrees programs/curriculums/majors:"):
            programName:str = programName.replace("Degrees programs/curriculums/majors:", "").strip()
        if programName.endswith("- Louisiana State University - Modern Campus Catalog™"):
            programName:str = programName.replace("- Louisiana State University - Modern Campus Catalog™", "").strip()
        return programName
