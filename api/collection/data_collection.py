import requests

POST_URL = "https://appl020tm.lsu.edu/stu/degreeaudit.nsf/Introduction?OpenForm&Seq=4"
GET_URL = "https://appl020tm.lsu.edu/stu/degreeaudit.nsf/$ByUniversalID/5A934727BDEFE6C686258C49006D5F21?EditDocument"
headers = {
    "User-Agent": "Chrome/133.0.0.0",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": "https://appl020tm.lsu.edu/stu/degreeaudit.nsf/Introduction?OpenForm&Seq=3",
}

cookies = {
    "LtpaToken": "AAECAzY3Q0Y0MzExNjdDRkMxRERjYm91MTE5QGxzdS5lZHVHDHLNnsBM0QsZmQBn+MEpu/Uhtw==",
    "__unam": "7ac2274-194b4682efe-70ebe206-41",
    "acceptCookies": "true",
}

post_data = {
    "_Click": "0",
    "%%Surrogate_CampusCode": "1",
    "CampusCode": "01",
    "%%Surrogate_CampusCode_1": "1",
    "CampusCode_1": "01",
    "%%Surrogate_CollegeCode": "1",
    "CollegeCode": "AGRI",
    "%%Surrogate_DegreeProgram": "1",
    "DegreeProgram": "AGEE ALAD",
    "ButtonAction": "View Degree Audit"
}

session = requests.Session()
session.cookies.update(cookies)

post_response = session.post(POST_URL, data=post_data, headers=headers)

if post_response.status_code == 200:
    print("POST request successful.")
else:
    print(f"POST request failed with status: {post_response.status_code}")
    exit()

get_response = session.get(GET_URL, headers=headers)

if get_response.status_code == 200:
    print("GET request successful.")
    html_content = get_response.text
else:
    print(f"GET request failed with status: {get_response.status_code}")
    exit()

with open("output.html", "w", encoding="utf-8") as file:
    file.write(html_content)

print("HTML saved successfully!")

