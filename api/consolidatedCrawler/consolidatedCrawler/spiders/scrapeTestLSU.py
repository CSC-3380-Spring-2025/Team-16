import scrapy


class webSpider(scrapy.Spider):
    name: str = 'course'
    custom_settings = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'course_catalog.csv',
        'FEED_EXPORT_FIELDS': ['ID','course title', 'Credit hours', 'course ID', 'class code', 'preReqs'],
    }

    start_urls = [
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2740', #the starting page of the course catalog webcrawler
    ]
    def __init__(self, *args, **kwargs):
        super(webSpider, self).__init__(*args, **kwargs)
        self.counter = 0  # Initialize the counter to 0

    def parse(self, response):
        for tr in response.xpath('//tr'):
            course = tr.xpath('.//a/text()').get()
            courseLink = tr.xpath('.//a/@href').get()
            if course:
                if courseLink:
                    absolute_link = response.urljoin(courseLink)
                    yield response.follow(absolute_link, callback=self.parse_course)

        page = 'https://catalog.lsu.edu/content.php?catoid=29&catoid=29&navoid=2740&filter%5Bitem_type%5D=3&filter%5Bonly_active%5D=1&filter%5B3%5D=1&filter%5Bcpage%5D=1#acalog_template_course_filter'
        #this for loop will iterate through all page links, starting from the base website
        for i in range(2,60):
            nextPage:str = page.replace(page[-31], str(i))
            yield scrapy.Request(nextPage, callback = self.parse)

    def parse_course(self, response):
        self.counter += 1
        course = response.css('title::text').get()
        CourseReq = response.xpath('//td[contains(@class, "block_content")]//em//text()').getall()

        if course:
            course = course.strip()
            creditHoursChar = course[-27] if len(course) >= 2 else None
            courseID = course.split(' ')[0] if len(course) >= 12 else None
            classCodeChar = course.split(' ')[1] if len(course) >= 12 else None

            if creditHoursChar and creditHoursChar.isdigit() and classCodeChar and classCodeChar.isdigit():
                creditHours = int(creditHoursChar)
                classCode = int(classCodeChar)
            else:
                creditHours = 1
                classCode = None

        CourseReq = [req.strip() for req in CourseReq if req.strip()]

        # Find the index of "Prereq.:" in the CourseReq list
        try:
            prereq_index = CourseReq.index("Prereq.:")
            # Slice the list to keep only the elements after "Prereq.:"
            CourseReq = CourseReq[prereq_index + 1:]
        except ValueError:
            # If "Prereq.:" is not found, keep the original list
            pass

        yield {
            'ID': self.counter,
            'course title': course,
            'Credit hours': creditHours,
            'course ID': courseID,
            'class code': classCode,
            'preReqs': CourseReq if CourseReq else None
        }
