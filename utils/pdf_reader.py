import fitz

def load_pdf(uploaded_file):
    try:
        pdf_bytes = uploaded_file.read()
        with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
            text = ""
            for page in document:
                text += page.get_text()
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"