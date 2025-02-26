from pathlib import Path

import scrapy

class webSpider(scrapy.Spider):
    name = 'web'
    start_urls = [
        #'https://catalog.lsu.edu/index.php?catoid=29'
        'https://catalog.lsu.edu/content.php?catoid=29&navoid=2740',
    ]
    def parse(self, response):
        for tr in response.xpath('//tr'):
            course = tr.xpath('.//a/text()').get()
            courseLink = tr.xpath('.//a/@href').get()
            if course:
                if courseLink:
                    absolute_link = response.urljoin(courseLink)
                    yield response.follow(absolute_link, callback=self.parse_course)

        page = 'https://catalog.lsu.edu/content.php?catoid=29&catoid=29&navoid=2740&filter%5Bitem_type%5D=3&filter%5Bonly_active%5D=1&filter%5B3%5D=1&filter%5Bcpage%5D=1#acalog_template_course_filter'
        for i in range(2,60):
            nextPage = page.replace(page[-31], str(i))
            yield scrapy.Request(nextPage, callback = self.parse)

    def parse_course(self, response):
        #print(response.text)
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
                creditHours = None
                classCode = None
        #print(f"Extracted prerequisites: {CourseReq}")
        CourseReq = [req.strip() for req in CourseReq if req.strip()]
        yield {
            'course title': course,
            'Credit hours': creditHours,
            'course ID': courseID,
            'class code': classCode,
            'preReqs': CourseReq if CourseReq else None
        }

