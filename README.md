# ScheduleLSU : 16
# Members
Project Manager: Jakobe Allen (JakobeAllen)\
Communications Lead: Thar Htoo (tharHHtoo)\
Git Master: Carson Bourgeois (C-Bourgeois)\
Design Lead: Myles Guidry (Thinktank02)\
Quality Assurance Tester: Taylor Wall (Twall05)

# About Our Software

A website that creates a potential roadmap of courses for students based on a transcript and specified parameters of the student. This is designed specifically to work for LSU students, and rather than just list out every course offering, it will advise the student of the best path to achieve their goal. 
Students will be able to give feedback, tailoring their schedule however they would like.
## Platforms Tested on
- MacOS
- Android
- iOS
- Linux
- Windows
# Important Links
Kanban Board: [link]\
Designs: [link]\
Styles Guide [link](https://docs.google.com/document/d/1Rt3F9NFNyDTGtjTZZBeBchfzsihJFzLzBOJCiSvnrbo/edit?usp=sharing)

# How to Run Dev and Test Environment

## Dependencies
- List all dependencies here
- Don't forget to include versions
### Downloading Dependencies
Describe where to download the dependencies here. Some will likely require a web download. Provide links here. For IDE extensions, make sure your project works with the free version of them, and detail which IDE(s) these are available in. 

**Install Node.js**
Go to [Node.js' official site](https://nodejs.org/)
Download the latest version
Run the installer
Verify it's installed by opening the terminal and running the following commands:
```sh
node -v
npm -v
```	

**Install Python**
`If you don't already have python`
Install Python version 3.10.7
`If you already have python`
Create a virtual environment
```sh
python -m venv [desired\virtual\environment\path]
~OR, IF CURRENTLY IN PROJECT PATH~
python -m venv [venv-name]
```

**These Dependencies Will be Installed During the Create App Step Below**
autoprefixer: ^10.4.20
eslint: ^9
eslint-config-next: 15.1.6
next: 15.1.6
postcss: ^8
react: ^19.0.0
react-dom: ^19.0.0
tailwindcss: ^3.4.1
typescript: ^5

## Commands

Next, navigate to the desired install directory, and create the app from this github
```sh
npx create-next-app@15.1.6 --example "https://github.com/CSC-3380-Spring-2025/Team-16" schedule-lsu
cd schedule-lsu
```



Describe how the commands and process to launch the project on the main branch in such a way that anyone working on the project knows how to check the affects of any code they add.

```sh
Example terminal command syntax
```

It is very common in these sections to see code in peculiar boxes to help them stand out. Check the markdown section of the Project Specifications to see how to add more / customize these.

```python
def code_highlight_example(m: int, m: float, s: str) -> str:
	return s + str(n*m)
```

```java
public static void main(String[] args){
	System.out.println("Hello, World!");
}
```

```c#
static void Main(){
	Console.WriteLine("Hello, World!");
}
```
