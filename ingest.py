from langchain_community.document_loaders import PyPDFDirectoryLoader, DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

print("Scanning the 'data' folder for PDFs and Text files...")

# 1. Load the PDFs you successfully downloaded
pdf_loader = PyPDFDirectoryLoader("data/")
pdf_docs = pdf_loader.load()

# 2. Load the 2 missing laws we just generated as Text files
txt_loader = DirectoryLoader("data/", glob="**/*.txt", loader_cls=TextLoader)
txt_docs = txt_loader.load()

# 3. Combine them all together
all_docs = pdf_docs + txt_docs
print(f"Found and loaded {len(all_docs)} total document pages/sections.")

# 4. Chunk and Store
print("Breaking documents into searchable chunks...")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(all_docs)

print("Embedding and storing locally (your M2 Air is processing this now)...")
vectorstore = Chroma.from_documents(
    documents=splits,
    embedding=OllamaEmbeddings(model="nomic-embed-text"), 
    persist_directory="./chroma_db"
)
print(f"SUCCESS: Indexed {len(splits)} chunks into your local database!")