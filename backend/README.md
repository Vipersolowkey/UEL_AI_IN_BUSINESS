# Hotel Management & Analytics Backend

## Run locally

1. Create and activate a virtual environment.
2. Install dependencies:
   `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and update secrets.
4. Start PostgreSQL and Redis.
5. Seed the database:
   `set PYTHONPATH=backend && python backend/scripts/seed_db.py`
6. Run the API:
   `set PYTHONPATH=backend && uvicorn app.main:app --reload --app-dir backend`
7. Optional AI provider:
   - Groq mode:
     - set `GROQ_API_KEY`
     - optional `GROQ_MODEL=llama-3.3-70b-versatile`
     - optional `LLM_PROVIDER=groq`
   - Ollama mode:
     - local mode: run Ollama on `http://127.0.0.1:11434`
     - cloud mode: set `OLLAMA_BASE_URL=https://ollama.com` and `OLLAMA_API_KEY`
     - example cloud model: `qwen3.5:cloud`
   - `LLM_PROVIDER=auto` will try Groq first, then Ollama as fallback
