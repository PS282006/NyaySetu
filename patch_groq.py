import re

with open("main.py", "r") as f:
    content = f.read()

# Add Groq import
if "from langchain_groq import ChatGroq" not in content:
    content = content.replace(
        "from langchain_community.chat_models import ChatOllama",
        "from langchain_community.chat_models import ChatOllama\nfrom langchain_groq import ChatGroq\nimport os"
    )

# Modify LLM initialization to use Groq if API key is present
old_llm_init = """llm = ChatOllama(model="llama3.2", temperature=0)"""
new_llm_init = """groq_api_key = os.environ.get("GROQ_API_KEY")
if groq_api_key:
    print("[INFO] GROQ_API_KEY detected. Using Groq Cloud (llama-3.2-90b-text-preview) for blazing fast inference!")
    llm = ChatGroq(temperature=0, model_name="llama-3.2-90b-text-preview", groq_api_key=groq_api_key)
else:
    print("[INFO] No GROQ_API_KEY detected. Falling back to local Llama 3.2 via Ollama.")
    llm = ChatOllama(model="llama3.2", temperature=0)"""

if "ChatGroq" not in content or "GROQ_API_KEY" not in content:
    content = content.replace(old_llm_init, new_llm_init)

with open("main.py", "w") as f:
    f.write(content)

print("Patched main.py with Groq support!")
