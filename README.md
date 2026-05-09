# AI PDF Chatbot

An AI-powered PDF chatbot built using **Python, Flask, LangChain, FAISS, and Google Gemini API**. This project allows users to upload PDF documents and ask questions in natural language. The chatbot reads the document, retrieves relevant information, and generates intelligent answers using a RAG (Retrieval-Augmented Generation) system.

## Features

* Upload and process PDF files
* AI-powered question answering using Gemini API
* Smart document search with FAISS vector database
* Interactive chatbot interface
* Retrieval-Augmented Generation (RAG)
* Fast response generation
* Load previously processed vector data
* Clear chat functionality

## Technologies Used

## Backend

* Python
* Flask
* LangChain
* FAISS
* Google Gemini API

## Frontend

* HTML
* CSS
* JavaScript

## How the Project Works

1. User uploads a PDF document.
2. The system extracts text from the PDF.
3. Text is divided into smaller chunks.
4. Chunks are converted into embeddings.
5. Embeddings are stored in a FAISS vector database.
6. User asks a question.
7. The system retrieves the most relevant chunks.
8. Gemini AI generates an answer using the retrieved context.
9. The answer is displayed in the chatbot interface.

## Project Preview

* Upload PDF documents
* Ask questions from uploaded files
* Get AI-generated answers instantly
* Modern chatbot user interface

## Project Structure

AI-PDF-Chatbot/
│
├── static/
│   ├── style.css
│   └── app.js
│
├── templates/
│   └── index.html
│
├── uploads/
├── vectorstore/
├── app.py
├── rag_chain.py
├── requirements.txt
├── .env
└── README.md
