import smtplib
import random
import os
import sys
import json

class EmailSender:
    # Method to generate a random 5-letter code
    @staticmethod
    def generate_letter_code() -> str:
        return ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))

    # Method to send an email with the generated code
    @staticmethod
    def send_email(sender_email: str, receiver_email: str) -> str:
        sender_password = "fuhgnkismnfvydjr"
        if not sender_password:
            print(json.dumps({"error": "Missing EMAIL_PASSWORD in environment"}))
            return ""

        subject = "Verification Code"
        code = EmailSender.generate_letter_code()
        message = f"Subject: {subject}\n\nYour verification code is: {code}"

        try:
            # Connect to the Gmail SMTP server
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message)
            server.quit()
            print(f"Email sent to {receiver_email}")
            print(f"CODE_START:{code}:CODE_END")  
            return code
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return ""

# For page.tsx
if __name__ == "__main__":
    if len(sys.argv) == 2:
        email = sys.argv[1]
        EmailSender.send_email("scheduleLSU@gmail.com", email)
    else:
        print(json.dumps({"error": "Expected 1 argument (receiver_email)"}))
