import scrapy


class WebSpider(scrapy.Spider):
    name = 'web'

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
        program_name = response.css('title::text').get('').strip()
        program_name = self.clean_program_name(program_name)

        # Initialize requirements list
        requirements = []

        # Extract all text content from the main content div
        content_div = response.xpath('//div[@class="acalog-core"]')
        if content_div:
            all_text = content_div.xpath('.//text()').getall()
            cleaned_text = [text.strip() for text in all_text if text.strip()]

            # Find all instances of "Total Sem. Hrs." and process each section
            total_hours_indices = [i for i, text in enumerate(cleaned_text) if "Total Sem. Hrs." in text]

            for i, start_index in enumerate(total_hours_indices):
                # Start from the element after "Total Sem. Hrs."
                section_start = start_index + 1

                # Find the next "CRITICAL REQUIREMENTS" or the next "Total Sem. Hrs."
                # or end of document
                section_end = None

                # Look for CRITICAL REQUIREMENTS first
                for j in range(section_start, len(cleaned_text)):
                    if ("CRITICAL REQUIREMENTS" in cleaned_text[j] or "Critical Requirements" in cleaned_text[j]):
                        section_end = j
                        break

                # If no CRITICAL REQUIREMENTS found, look for next Total Sem. Hrs.
                if section_end is None:
                    for j in range(section_start, len(cleaned_text)):
                        if j in total_hours_indices[i + 1:]:
                            section_end = j
                            break

                # If neither found, take until end of document
                section_text = cleaned_text[section_start:section_end] if section_end is not None else cleaned_text[section_start:]
                requirements.extend(section_text)

        yield {
            'ID': self.counter,
            'Degree': program_name,
            'Requirements': requirements
        }

    def clean_program_name(self, program_name: str):
        if program_name.startswith("Degrees programs/curriculums/majors:"):
            program_name = program_name.replace("Degrees programs/curriculums/majors:", "").strip()
        if program_name.endswith("- Louisiana State University - Modern Campus Catalog™"):
            program_name = program_name.replace("- Louisiana State University - Modern Campus Catalog™", "").strip()
        return program_name
