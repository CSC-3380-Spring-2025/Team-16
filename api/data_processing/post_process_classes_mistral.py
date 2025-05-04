import csv
import time
import os
from typing import Dict, Any
from mistralai import Mistral
from mistralai.models import sdkerror
from datetime import datetime, timedelta

API_KEY = "jay0AWPWbhQA9kCTCxQr5eizqrEBpllQ"
model = "mistral-small-2501"

client = Mistral(api_key=API_KEY)


with open(file="api\consolidatedCrawler\course_catalog.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
    class_reader: csv.reader = csv.reader(file)
    last_time : int = 0
    more_rows : bool = True
    skipped : bool = False
    next(class_reader)
    while more_rows:
        minute_start = datetime.now()
        end_time = minute_start + timedelta(minutes=1)
        while datetime.now() < end_time:
            try:
                if not skipped:
                    try:
                        row = next(class_reader)
                    except StopIteration:
                        more_rows = False
                        break
                
                info: str = row[-1]
                code: int = row[4]
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
                    )
                    row[-1] = chat_response.choices[0].message.content.replace('\n', '').replace("\n", "")
                    with open(file="api\scheduling\coursedata.csv", mode="a", newline="\n", encoding="Windows-1252", errors="ignore") as file:
                        class_writer: csv.writer = csv.writer(file)
                        class_writer.writerow(row)
                    print(", ".join(row))
                    skipped = False
                    time.sleep(1)
                else:
                    print("Nope!")
            except sdkerror.SDKError:
                print("Rate limit reached, waiting until next minute...")
                print(f"Course rate limited: {row[3]}{code} {course}")
                remaining = (end_time - datetime.now()).total_seconds()
                skipped = True
                if remaining > 0:
                    time.sleep(remaining)
                break