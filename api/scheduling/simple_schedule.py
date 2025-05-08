#!/usr/bin/env python3
import json
import sys
from datetime import datetime

def generate_simple_schedule():
    """
    Generate a simple schedule without relying on external files.
    This is a simplified version that returns a hardcoded schedule.
    """
    # Create a sample schedule with common LSU courses
    schedule = {
        "Fall 2024": [
            "CSC 1350 - COMPUTER SCIENCE I FOR MAJORS",
            "MATH 1550 - CALCULUS I",
            "ENGL 1001 - ENGLISH COMPOSITION I",
            "BIOL 1201 - INTRODUCTORY BIOLOGY FOR SCIENCE MAJORS I",
            "HIST 1001 - WESTERN CIVILIZATION TO 1500"
        ],
        "Spring 2025": [
            "CSC 1351 - COMPUTER SCIENCE II FOR MAJORS",
            "MATH 1552 - CALCULUS II",
            "ENGL 2000 - ENGLISH COMPOSITION II",
            "BIOL 1202 - INTRODUCTORY BIOLOGY FOR SCIENCE MAJORS II",
            "CMST 1061 - FUNDAMENTALS OF COMMUNICATION"
        ],
        "Fall 2025": [
            "CSC 2259 - DISCRETE STRUCTURES",
            "CSC 2610 - PYTHON FOR DATA SCIENCE",
            "MATH 2090 - LINEAR ALGEBRA",
            "PHYS 2110 - PHYSICS FOR TECHNICAL STUDENTS I",
            "ECON 2000 - PRINCIPLES OF MICROECONOMICS"
        ],
        "Spring 2026": [
            "CSC 3102 - ADVANCED DATA STRUCTURES & ALGORITHM ANALYSIS",
            "CSC 3380 - OBJECT-ORIENTED DESIGN",
            "CSC 3501 - COMPUTER ORGANIZATION AND DESIGN",
            "PHYS 2113 - PHYSICS FOR TECHNICAL STUDENTS II",
            "PHIL 2020 - ETHICS"
        ]
    }
    
    return schedule

if __name__ == "__main__":
    # Generate the schedule
    schedule = generate_simple_schedule()
    
    # Print the schedule as JSON to stdout
    print(json.dumps(schedule))
