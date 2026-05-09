import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv()

# Chat history list — keep it within session
chat_history = []


def build_rag_chain(vectorstore: FAISS):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file!")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        google_api_key=api_key,
        convert_system_message_to_human=True
    )

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )

    return {"llm": llm, "retriever": retriever}


def ask_question(chain: dict, question: str) -> dict:
    global chat_history

    llm = chain["llm"]
    retriever = chain["retriever"]

    # Retrieve relevant documents
    docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in docs])

    # Format chat history
    history_text = ""
    for msg in chat_history[-6:]:  # last 3 exchanges
        if isinstance(msg, HumanMessage):
            history_text += f"User: {msg.content}\n"
        elif isinstance(msg, AIMessage):
            history_text += f"Assistant: {msg.content}\n"

    # Create prompt
    prompt = f"""Answer the question based on the given context and conversation history.
If the answer is not available in the context, say "I could not find any relevant information in the PDF."

Conversation History:
{history_text}

Context:
{context}

Question: {question}

Answer:"""

    # Call LLM
    response = llm.invoke(prompt)
    answer = response.content

    # Update history
    chat_history.append(HumanMessage(content=question))
    chat_history.append(AIMessage(content=answer))

    return {
        "answer": answer,
        "sources": docs
    }


def clear_history():
    global chat_history
    chat_history = []