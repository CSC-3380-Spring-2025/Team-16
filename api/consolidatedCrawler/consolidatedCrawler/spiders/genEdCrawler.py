
import scrapy

class WebSpider(scrapy.Spider):
    name:str = 'gened'

    start_urls = [
        'https://catalog.lsu.edu/preview_program.php?catoid=29&poid=12725',
        'https://catalog.lsu.edu/preview_program.php?catoid=29&poid=12726',
        'https://catalog.lsu.edu/preview_program.php?catoid=29&poid=12727',
        'https://catalog.lsu.edu/preview_program.php?catoid=29&poid=12728',
        'https://catalog.lsu.edu/preview_program.php?catoid=29&poid=12729',
        'https://catalog.lsu.edu/preview_program.php?catoid=29&poid=12730',
    ]
    custom_settings = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'General_Education_Catalog.csv',
        'FEED_EXPORT_FIELDS': ['ID', 'Category', 'course title', 'Credit hours', 'course ID', 'class code'],
    }

    def __init__(self, *args, **kwargs):
        super(WebSpider, self).__init__(*args, **kwargs)
        self.counter = 0  # Initialize the counter to 0

    def parse(self, response):
        for span in response.xpath('//span'):
            category:str = response.css('title::text').get()
            category:str = category.strip()
            catParts = category.split()
            category = catParts[3]
            GeneralEd:str = span.xpath('.//a/text()').get()
            if GeneralEd:
                self.counter += 1
                GeneralEd:str = GeneralEd.strip()
                parts = GeneralEd.split(' ')
                # Ensure the split produces enough parts
                GeneralEdID:str = parts[0] if len(parts) > 0 else None
                GeneralEdCodeChar:str = parts[1] if len(parts) > 1 else None
                creditHoursChar:str = GeneralEd[-2] if len(GeneralEd) >= 2 else None
                if GeneralEdCodeChar and GeneralEdCodeChar.isdigit() and creditHoursChar and creditHoursChar.isdigit():
                    creditHours:int = int(creditHoursChar)
                    GeneralEdCode:int = int(GeneralEdCodeChar)
                else:
                    creditHours = None
                    GeneralEdCode = None
                    category = None
                    GeneralEd = None
                    GeneralEdID = None
                yield {
                    'ID': self.counter,
                    'Category': category,
                    'course title': GeneralEd,
                    'Credit hours': creditHours,
                    'course ID': GeneralEdID,
                    'class code': GeneralEdCode,
                }
