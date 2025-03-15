import csv

with open(file="api\\scheduling\\userex.csv", newline="", encoding="Windows-1252", errors="ignore") as file:
    class_reader = csv.reader(file, delimiter=";")
    for row in class_reader:
        print(', '.join(row))