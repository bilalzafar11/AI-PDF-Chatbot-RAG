// ── DOM refs ─────────────────────────────────────
const uploadForm      = document.getElementById('upload-form');
const pdfFile         = document.getElementById('pdf-file');
const processBtn      = document.getElementById('process-btn');
const loadPrevBtn     = document.getElementById('load-previous-btn');
const clearChatBtn    = document.getElementById('clear-chat-btn');
const statusMsg       = document.getElementById('status-message');
const chatHistory     = document.getElementById('chat-history');
const questionForm    = document.getElementById('question-form');
const questionInput   = document.getElementById('question');
const askBtn          = questionForm.querySelector('button[type="submit"]');
const chatStatus      = document.getElementById('chat-status');
const loadingOverlay  = document.getElementById('loading-overlay');
const loadingText     = document.getElementById('loading-text');

let pdfReady = false;

// ── Helpers ───────────────────────────────────────
function showLoading(text = 'Processing...') {
  loadingText.textContent = text;
  loadingOverlay.classList.add('show');
}

function hideLoading() {
  loadingOverlay.classList.remove('show');
}

function setStatus(msg, type = '') {
  statusMsg.textContent = msg;
  statusMsg.className = type; // '', 'success', 'error', 'loading'
}

function setChatStatus(ready) {
  pdfReady = ready;
  chatStatus.textContent = ready ? '● PDF Ready' : 'PDF required before ask.';
  chatStatus.className = ready ? 'ready' : '';
  questionInput.disabled = !ready;
  askBtn.disabled = !ready;
}

function appendMessage(role, text, sources = []) {
  // Remove empty state if present
  const empty = chatHistory.querySelector('.empty-state');
  if (empty) empty.remove();

  const wrap = document.createElement('div');
  wrap.className = `message ${role}`;

  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'You' : 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  wrap.appendChild(label);
  wrap.appendChild(bubble);

  // Sources
  if (sources.length > 0) {
    const sourcesBox = document.createElement('div');
    sourcesBox.className = 'sources';

    const toggle = document.createElement('button');
    toggle.className = 'sources-toggle';
    toggle.textContent = `▸ Sources (${sources.length} chunks)`;
    toggle.type = 'button';

    const content = document.createElement('div');
    content.className = 'sources-content';

    sources.forEach((src, i) => {
      const chunk = document.createElement('div');
      chunk.className = 'source-chunk';
      chunk.innerHTML = `<strong>Chunk ${i + 1}</strong><br>${src}`;
      content.appendChild(chunk);
    });

    toggle.addEventListener('click', () => {
      content.classList.toggle('open');
      toggle.textContent = content.classList.contains('open')
        ? `▾ Sources (${sources.length} chunks)`
        : `▸ Sources (${sources.length} chunks)`;
    });

    sourcesBox.appendChild(toggle);
    sourcesBox.appendChild(content);
    wrap.appendChild(sourcesBox);
  }

  chatHistory.appendChild(wrap);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'message bot typing-indicator';
  wrap.id = 'typing';

  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>`;

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  chatHistory.appendChild(wrap);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

// ── Process PDF ───────────────────────────────────
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!pdfFile.files[0]) {
    setStatus('⚠ Pehle PDF file select karo.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('pdf', pdfFile.files[0]);

  showLoading('PDF process ho rahi hai...');
  processBtn.disabled = true;

  try {
    const res = await fetch('/api/process', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      setStatus(`✓ PDF ready — ${data.chunks} chunks bane.`, 'success');
      setChatStatus(true);
    } else {
      setStatus(`✗ Error: ${data.error}`, 'error');
    }
  } catch (err) {
    setStatus(`✗ Network error: ${err.message}`, 'error');
  } finally {
    hideLoading();
    processBtn.disabled = false;
  }
});

// ── Load Previous ─────────────────────────────────
loadPrevBtn.addEventListener('click', async () => {
  showLoading('Pichla data load ho raha hai...');
  loadPrevBtn.disabled = true;

  try {
    const res = await fetch('/api/load_previous', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      setStatus('✓ Pichla data load ho gaya.', 'success');
      setChatStatus(true);
    } else {
      setStatus(`✗ Error: ${data.error}`, 'error');
    }
  } catch (err) {
    setStatus(`✗ Network error: ${err.message}`, 'error');
  } finally {
    hideLoading();
    loadPrevBtn.disabled = false;
  }
});

// ── Clear Chat ────────────────────────────────────
clearChatBtn.addEventListener('click', async () => {
  showLoading('Chat clear ho rahi hai...');

  try {
    await fetch('/api/clear', { method: 'POST' });
    chatHistory.innerHTML = '<div class="empty-state"><p>👋 Upload and process your PDF, then start asking questions!</p></div>';
    setStatus('✓ Chat clear ho gayi.', 'success');
  } catch (err) {
    setStatus(`✗ Error: ${err.message}`, 'error');
  } finally {
    hideLoading();
  }
});

// ── Ask Question ──────────────────────────────────
questionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  appendMessage('user', question);
  questionInput.value = '';
  showTyping();

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();

    removeTyping();

    if (data.success) {
      appendMessage('bot', data.answer, data.sources.map(s => s.content));
      setStatus('✓ Answer received.', 'success');
    } else {
      setStatus(`✗ Error: ${data.error}`, 'error');
    }
  } catch (err) {
    removeTyping();
    setStatus(`✗ Network error: ${err.message}`, 'error');
  }
});

// ── Init ──────────────────────────────────────────
setChatStatus(false);


  wrap.appendChild(label);
  wrap.appendChild(bubble);
  chatHistory.appendChild(wrap);
  chatHistory.scrollTop = chatHistory.scrollHeight;


function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

// ── Process PDF ───────────────────────────────────
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!pdfFile.files[0]) {
    setStatus('⚠ First Select the PDF file.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('pdf', pdfFile.files[0]);

  setStatus('⏳ PDF processed...', 'loading');
  processBtn.disabled = true;

  try {
    const res = await fetch('/process', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      setStatus(`✓ PDF ready — ${data.chunks} Chunks created.`, 'success');
      setChatStatus(true);
    } else {
      setStatus(`✗ Error: ${data.error}`, 'error');
    }
  } catch (err) {
    setStatus(`✗ Network error: ${err.message}`, 'error');
  } finally {
    processBtn.disabled = false;
  }
});

// ── Load Previous ─────────────────────────────────
loadPrevBtn.addEventListener('click', async () => {
  setStatus('⏳ Loading previous data...', 'loading');
  loadPrevBtn.disabled = true;

  try {
    const res = await fetch('/load', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      setStatus('✓ Previous vector store loaded successfully.', 'success');
      setChatStatus(true);
    } else {
      setStatus(`✗ Error: ${data.error}`, 'error');
    }
  } catch (err) {
    setStatus(`✗ Network error: ${err.message}`, 'error');
  } finally {
    loadPrevBtn.disabled = false;
  }
});

// ── Clear Chat ────────────────────────────────────
clearChatBtn.addEventListener('click', async () => {
  await fetch('/clear', { method: 'POST' });
  chatHistory.innerHTML = '';
  showEmptyState();
});

function showEmptyState() {
  chatHistory.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📄</div>
      <p>Upload your PDF, process it, and then ask your questions here.</p>
    </div>`;
}

// ── Ask Question ──────────────────────────────────
questionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const q = questionInput.value.trim();
  if (!q || !pdfReady) return;

  appendMessage('user', q);
  questionInput.value = '';
  questionInput.disabled = true;
  askBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    });
    const data = await res.json();
    removeTyping();

    if (data.answer) {
      appendMessage('bot', data.answer, data.sources || []);
    } else {
      appendMessage('bot', `Error: ${data.error}`);
    }
  } catch (err) {
    removeTyping();
    appendMessage('bot', `Network error: ${err.message}`);
  } finally {
    questionInput.disabled = false;
    askBtn.disabled = false;
    questionInput.focus();
  }
});

// Enter to send
questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    questionForm.dispatchEvent(new Event('submit'));
  }
});

// ── Init ──────────────────────────────────────────
setChatStatus(false);
showEmptyState();