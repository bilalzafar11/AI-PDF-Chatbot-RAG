import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template

from utils.pdf_reader import load_pdf
from utils.text_chunker import chunk_text
from utils.embeddings import create_vectorstore, load_vectorstore, vectorstore_exists
from utils.rag_chain import build_rag_chain, ask_question, clear_history

load_dotenv()

UPLOAD_FOLDER = Path('uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)

app = Flask(__name__, static_folder='static', template_folder='templates')

chain = None
pdf_processed = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/process', methods=['POST'])
def process_pdf():
    global chain, pdf_processed

    if 'pdf' not in request.files:
        return jsonify({'success': False, 'error': 'PDF file missing.'}), 400

    pdf_file = request.files['pdf']
    if pdf_file.filename == '':
        return jsonify({'success': False, 'error': 'PDF file missing.'}), 400

    text = load_pdf(pdf_file)
    if isinstance(text, str) and text.startswith('Error reading PDF:'):
        return jsonify({'success': False, 'error': text}), 400

    chunks = chunk_text(text)
    if not chunks:
        return jsonify({'success': False, 'error': 'PDF se text extract nahi hua.'}), 400

    vectorstore = create_vectorstore(chunks)
    chain = build_rag_chain(vectorstore)
    pdf_processed = True
    clear_history()

    return jsonify({'success': True, 'chunks': len(chunks)})

@app.route('/api/ask', methods=['POST'])
def ask_question_route():
    global chain, pdf_processed

    if not pdf_processed or chain is None:
        return jsonify({'success': False, 'error': 'PDF abhi process nahi hua.'}), 400

    data = request.get_json(silent=True) or {}
    question = data.get('question', '').strip()
    if not question:
        return jsonify({'success': False, 'error': 'Question missing.'}), 400

    result = ask_question(chain, question)
    sources = [{'content': doc.page_content} for doc in result.get('sources', [])]

    return jsonify({'success': True, 'answer': result.get('answer', ''), 'sources': sources})

@app.route('/api/clear', methods=['POST'])
def clear_chat():
    clear_history()
    return jsonify({'success': True})

@app.route('/api/load_previous', methods=['POST'])
def load_previous():
    global chain, pdf_processed

    if not vectorstore_exists():
        return jsonify({'success': False, 'error': 'Koi previous vectorstore nahi mila.'}), 400

    vectorstore = load_vectorstore()
    chain = build_rag_chain(vectorstore)
    pdf_processed = True
    clear_history()

    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8501, debug=True)
