import os
import numexpr as ne
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain.agents import create_agent

# 1. Load your API keys
load_dotenv()

# 2. Build our OWN Math Tool (Bypassing LangChain's broken legacy code)
@tool
def calculator(expression: str) -> str:
    """A powerful math calculator. Evaluates mathematical expressions like '75000 * (1.15)**3'."""
    try:
        return str(ne.evaluate(expression))
    except Exception as e:
        return f"Math Error: {e}"

print("Initializing Groq Brain and Custom Math Engine...")

# 3. Set up the Groq LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="openai/gpt-oss-120b",  
    temperature=0  
)

# 4. Create the Modern Agent passing in our Custom Tool
agent = create_agent(
    model=llm,
    tools=[calculator],
    system_prompt="You are NyaySetu's math engine. Use the calculator tool to compute exact financial penalties."
)

# 5. The Test Scenario
user_query = """
A landlord in Maharashtra has illegally withheld a tenant's security deposit of 75,000 rupees for 3 years.
Calculate a 15% annual compound interest penalty on the 75,000 rupees over 3 years.
What is the exact final total amount?
"""

print("\n--- Running Legal Math Test ---")

response = agent.invoke({
    "messages": [
        {"role": "user", "content": user_query}
    ]
})

print("\n====================")
print("FINAL ANSWER TO USER:")
print(response["messages"][-1].content)
print("====================")