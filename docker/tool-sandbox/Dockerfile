FROM python:3.11-slim

WORKDIR /sandbox

# Pre-install common packages so bootstrap is fast for most workflows
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    langchain \
    langchain-community \
    langchain-experimental \
    langchain-groq \
    requests \
    httpx \
    numpy \
    pandas \
    pydantic \
    ddgs \
    wikipedia \
    arxiv

COPY executor.py .
COPY server.py .

LABEL driverdirect.sandbox="true"

EXPOSE 8080

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "error"]
