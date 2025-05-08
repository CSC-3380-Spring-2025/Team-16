import csv
from mistralai import Mistral
from mistralai.models import sdkerror
import time
from datetime import datetime, timedelta

API_KEY = "jay0AWPWbhQA9kCTCxQr5eizqrEBpllQ" # Definitely shouldn't be in a github repo like this, but also I think this whole thing needs to be able to run on JLD's system, so I'm leaving it here so it works.
model = "mistral-small-2501"

client = Mistral(api_key=API_KEY)

# Opens course catalog csv, containing data from scrapers
with open(file="api\consolidatedCrawler\course_catalog.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
    class_reader: csv.reader = csv.reader(file)
    last_time : int = 0
    more_rows : bool = True
    skipped : bool = False
    next(class_reader) # Skips the top line, so we don't get extra column names
    while more_rows:
        minute_start = datetime.now()
        end_time = minute_start + timedelta(minutes=1)
        while datetime.now() < end_time: # Part of a while loop to pace the api calls so we know when we get rate limited and we know when we can begin sending requests again
            try:
                if not skipped: # The skipped var is to solve for a bug where a rate limit response caused a row to be skipped, and the data to not get processed. There's definitely a cleaner way of doing this, but this works.
                    try:
                        row = next(class_reader)
                    except StopIteration: # end condition
                        more_rows = False
                        break
                
                info: str = row[-1]
                code: int = row[4] # Course code (3102, from csc 3102, for example)
                course: str = row[1]
                print("Time:", last_time)
                print(f"info: {info}")
                if info:
                    chat_response = client.agents.complete(
                        agent_id="ag:25736692:20250320:coursedataagent:1bc93b16",
                        messages=[
                            {
                                "role": "user",
                                "content": f"course = {course if course else row[3]+str(code)}\ninfo = {info}",
                            },
                        ],
                    ) # getting the json response
                    row[-1] = chat_response.choices[0].message.content.replace('\n', '').replace("\n", "") # squashing the json into one line
                    with open(file="api\scheduling\coursedata.csv", mode="a", newline="\n", encoding="Windows-1252", errors="ignore") as file:
                        class_writer: csv.writer = csv.writer(file)
                        class_writer.writerow(row) # writing processed data into the csv.
                    print(", ".join(row))
                    skipped = False
                    time.sleep(1)
                else:
                    print("Nope!")
            except sdkerror.SDKError: # to catch when we get rate limited
                print("Rate limit reached, waiting until next minute...")
                print(f"Course rate limited: {row[3]}{code} {course}")
                remaining = (end_time - datetime.now()).total_seconds()
                skipped = True
                if remaining > 0:
                    time.sleep(remaining)# sleep until the next minute, since the rate limit we hit when running this script is the minute to minute limit
                break