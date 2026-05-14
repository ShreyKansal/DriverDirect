import subprocess
import sys
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from executor import run_tool

app = FastAPI()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"output": None, "error": traceback.format_exc(), "executionMs": 0}
    )


class BootstrapRequest(BaseModel):
    packages: list[str]


class ExecuteRequest(BaseModel):
    code: str
    function_name: str
    input: str


@app.get("/health")
def health():
    return {"status": "ready"}


@app.post("/bootstrap")
def bootstrap(req: BootstrapRequest):
    if not req.packages:
        return {"ready": True, "installed": []}

    results = []
    failed = []

    for pkg in req.packages:
        proc = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", "--no-cache-dir", pkg],
            capture_output=True,
            text=True,
            timeout=120
        )
        if proc.returncode == 0:
            results.append(pkg)
        else:
            failed.append({"package": pkg, "error": proc.stderr.strip()})

    if failed:
        return {
            "ready": False,
            "installed": results,
            "failed": failed,
            "error": f"Failed to install: {', '.join(f['package'] for f in failed)}"
        }

    return {"ready": True, "installed": results}


@app.post("/execute")
def execute(req: ExecuteRequest):
    result = run_tool(req.code, req.function_name, req.input)
    return result
