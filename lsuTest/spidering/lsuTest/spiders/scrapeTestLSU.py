from pathlib import Path

import scrapy

import os
import google.generativeai as genai

# api_key = os.environ["AIzaSyA5Y4QTQIgp4Kx_yhPIFz1Sjz4YeSgZyyo"]
genai.configure(api_key="AIzaSyA5Y4QTQIgp4Kx_yhPIFz1Sjz4YeSgZyyo")

# Create the model
generation_config = {
  "temperature": 0.15,
  "top_p": 0.4,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-pro",
  generation_config=generation_config,
)

chat_session = model.start_chat(
  history=[
  ]
)

class webSpider(scrapy.Spider):
    name: str = 'web'
    custom_settings = {
        'FEED_FORMAT': 'csv',
        'FEED_URI': 'course_catalog.csv',
        'FEED_EXPORT_FIELDS': ['course title', 'Credit hours', 'course ID', 'class code', 'preReqs'],
    }

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
            nextPage:str = page.replace(page[-31], str(i))
            yield scrapy.Request(nextPage, callback = self.parse)

    def parse_course(self, response):
        course = response.css('title::text').get()
        CourseReq = response.xpath('//td[contains(@class, "block_content")]//em//text()').getall()
        if course:
            course: str = course.strip()
            creditHoursChar:str = course[-27] if len(course) >= 2 else None
            courseID:str = course.split(' ')[0] if len(course) >= 12 else None
            classCodeChar: str = course.split(' ')[1] if len(course) >= 12 else None
            if creditHoursChar and creditHoursChar.isdigit() and classCodeChar and classCodeChar.isdigit():
                creditHours: int = int(creditHoursChar)
                classCode: int = int(classCodeChar)
            else:
                creditHours = 1
                classCode = None
        CourseReq = [req.strip() for req in CourseReq if req.strip()]
        response = chat_session.send_message(f"From this text description of a class at a university, create a json file containing a list of prerequisites, a list of corequisites, and a list of replacements. Prerequisites will often be preceded with \"Prereq.:\". Corequisites are classes which you must have either credit for or concurrent enrollment in. Replacement classes are classes which will substitute in for this one, or in other words, credit cannot be held for both this class and a replacement class.\nA fourth field is provided to you, which may hold any \"other\" requirements, such as professor endorsements. You are free to format this however you would like.\nFormatting:\nAll saved classes will always have the format of 2-4 letters followed by exactly 4 numbers. A dummy example is: \"EX 1234\"\nAll prerequisite requirements that are NOT classes\nData: {CourseReq}") if CourseReq else None

        yield {
            'course title': course,
            'Credit hours': creditHours,
            'course ID': courseID,
            'class code': classCode,
            'preReqs': CourseReq if CourseReq else None
        }

