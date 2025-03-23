import smtplib
import random
import os
import json


class EmailSender:


    @staticmethod
    def generate_letter_code() -> str:
        """Generates a random 5-letter code."""
        return ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))


    @staticmethod
    def send_email(sender_email: str, receiver_email: str, first_name: str, last_name: str) -> str:
        """Sends an email with a verification code and logs the receiver's info to a text file."""
        # Use a hardcoded password (for now, but better to use environment variables)
        sender_password = "fuhgnkismnfvydjr"
       
        subject = "Verification Code"
        code = EmailSender.generate_letter_code()
        message = f"Your verification code is: {code}"
        text = f"Subject: {subject}\n\n{message}"


        try:
            # Sending email
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, text)
            server.quit()
            print(f"Email has been sent to {receiver_email}")
           
            # Create and write to the text file in the specified path
            file_name = f"C:/Users/taylo/OneDrive/Desktop/test/schedule-lsu/app/login/data/{first_name}{last_name}Verification.txt"
            with open(file_name, 'w') as f:
                f.write(f"Receiver Email: {receiver_email}\nVerification Code: {code}")
           
            return code
        except Exception as e:
            error_message = {"error": str(e)}
            print(json.dumps(error_message))
            return ""


    @staticmethod
    def verify_code(expected_code: str):
        """Verifies the user-provided code."""
        user_code = input("Enter your verification code: ").strip().upper()
        if user_code == expected_code:
            print("Verification successful!")
        else:
            print("Invalid code. Verification failed.")


    @staticmethod
    def main():
        """Main function to send the email and verify the code."""
        try:
            sender_email = "scheduleLSU@gmail.com"
            first_name = input("Enter your first name: ")
            last_name = input("Enter your last name: ")
            receiver_email = input("Enter the receiver's email: ")


            # Call the send_email function
            verification_code = EmailSender.send_email(sender_email, receiver_email, first_name, last_name)


            if verification_code:
                EmailSender.verify_code(verification_code)


        except Exception as e:
            error_message = {"error": str(e)}
            print(json.dumps(error_message))


if __name__ == "__main__":
    EmailSender.main()



