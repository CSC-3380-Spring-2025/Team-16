from fastapi import FastAPI

app = FastAPI()

@app.get("/api/py/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/py/goodbye")
async def goodbye():
    return {"message": "Goodbye from FastAPI!"}