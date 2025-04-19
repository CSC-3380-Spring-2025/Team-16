from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

SPIDERS = [
    'gened',
    'citation',
    'degree',
    'course'
]

def run_spiders():
    process = CrawlerProcess(get_project_settings())

    for spider_name in SPIDERS:
        print(f"Running spider: {spider_name}")
        process.crawl(spider_name)

    process.start()

if __name__ == "__main__":
    run_spiders()
