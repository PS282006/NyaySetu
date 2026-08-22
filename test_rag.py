from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.prompts import ChatPromptTemplate

# 1. Connect to the local Chroma vector store
print("Connecting to local Chroma database...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

# 2. Configure retriever (Fetch top 3 most relevant chunks)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 3. Initialize local Llama 3.2 model
llm = ChatOllama(model="llama3.2", temperature=0.1)

# 4. Define Prompt with strict Grounding & Citation instructions
prompt = ChatPromptTemplate.from_template("""
You are NyaySetu, an AI legal assistant providing plain-language legal information under Indian Law.
Answer the user's question using ONLY the provided context. If the context does not contain enough information, state that clearly.

Context:
{context}

Question:
{question}

Provide a clear, structured response explaining the user's rights, relevant legal provisions, and recommended next steps.
""")

def ask_legal_ai(query: str):
    print(f"\n--- Query: {query} ---")
    
    # Retrieve relevant legal documents
    docs = retriever.invoke(query)
    
    print("\n[Retrieved Sources / Citations]:")
    context_text = ""
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "Unknown Document")
        page = doc.metadata.get("page", None)
        page_info = f" (Page {page + 1})" if page is not None else ""
        print(f"  {i}. {source}{page_info}")
        context_text += f"\n--- Source: {source}{page_info} ---\n{doc.page_content}\n"

    # Generate response
    chain = prompt | llm
    print("\n[Generating Legal Response with Llama 3.2...]\n")
    response = chain.invoke({"context": context_text, "question": query})
    print(response.content)

if __name__ == "__main__":
    # Test query
    sample_query = "My landlord is refusing to return my ₹33,750 security deposit. What can I do under the law?"
    ask_legal_ai(sample_query)