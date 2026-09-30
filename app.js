// ============================================================
// app.js — SynapseCode Intelligent Coding Tutor
// Clean UI orchestration for the redesigned single-column layout
// ============================================================

// ── State ──────────────────────────────────────────────────
let currentMode    = 'explain';   // 'explain' | 'question' | 'challenge'
let currentLang    = 'javascript';
let hintCount      = 0;
let maxHints       = 3;
let currentChallenge = null;
let starterCode    = '';

// ── DOM refs ───────────────────────────────────────────────
const screenHome      = document.getElementById('screen-home');
const screenChat      = document.getElementById('screen-chat');
const userInputEl     = document.getElementById('user-input');
const chatInputEl     = document.getElementById('chat-input');
const chatMessages    = document.getElementById('chat-messages');
const btnSubmit       = document.getElementById('btn-submit');
const btnChatSubmit   = document.getElementById('btn-chat-submit');
const btnBackHome     = document.getElementById('btn-back-home');
const btnSettings     = document.getElementById('btn-settings');
const btnMemory       = document.getElementById('btn-memory');
const chatModeLabel   = document.getElementById('chat-mode-label');
const progressBar     = document.getElementById('progress-bar');
const progressPct     = document.getElementById('progress-pct');
const progressLvlTxt  = document.getElementById('progress-level-text');
const navLevelPill    = document.getElementById('nav-level-pill');
const navLevelText    = document.getElementById('nav-level-text');
const langSelect      = document.getElementById('language-select');

// ── Helpers ────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMarkdown(text) {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang || 'javascript'}">${escapeHtml(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3} (.+)$/gm, '<strong class="text-white block mt-3 mb-1">$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── Progress bar ───────────────────────────────────────────
function updateProgress() {
  const memory = window.cognitiveMemory;
  if (!memory) return;
  const level = memory.getProfile().level;
  const elo   = memory.getProfile().elo || 1000;
  const levelMap = { Beginner: 0, Intermediate: 33, Advanced: 66 };
  const base  = levelMap[level] ?? 0;
  const extra = Math.min(33, Math.round(((elo - 1000) / 800) * 33));
  const pct   = Math.min(99, base + extra);

  progressBar.style.width = pct + '%';
  progressPct.textContent = pct + '%';
  progressLvlTxt.textContent = level;
  navLevelText.textContent   = level;
  navLevelPill.classList.remove('hidden');
}

// ── Screen switch ──────────────────────────────────────────
function goToChat(mode, label) {
  currentMode = mode;
  chatModeLabel.textContent = label;
  screenHome.classList.add('hidden');
  screenChat.classList.remove('hidden');
  screenChat.classList.add('flex');
  document.getElementById('challenge-panel').classList.add('hidden');
  chatInputEl.focus();
}

function goToHome() {
  screenChat.classList.add('hidden');
  screenHome.classList.remove('hidden');
  userInputEl.focus();
}

// ── Add message to chat ────────────────────────────────────
function addMessage(role, content, isHtml = false) {
  const wrapper = document.createElement('div');
  wrapper.className = role === 'tutor' ? 'msg-tutor' : 'msg-user';

  if (role === 'tutor') {
    const avatar = document.createElement('div');
    avatar.className = 'tutor-avatar';
    avatar.textContent = '🧠';
    wrapper.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = isHtml ? content : formatMarkdown(content);
  wrapper.appendChild(bubble);

  chatMessages.appendChild(wrapper);
  scrollToBottom();

  // Re-run Prism on new code blocks
  if (window.Prism) Prism.highlightAllUnder(bubble);
  return bubble;
}

function addTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg-tutor';
  wrapper.id = 'typing-indicator';

  const avatar = document.createElement('div');
  avatar.className = 'tutor-avatar';
  avatar.textContent = '🧠';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ── Submit from home screen ────────────────────────────────
async function handleHomeSubmit() {
  const text = userInputEl.value.trim();
  if (!text) { userInputEl.focus(); return; }

  const modeLabels = {
    explain:   'Explaining Code',
    question:  'Answering Question',
    challenge: 'Challenge Mode',
  };
  goToChat(currentMode, modeLabels[currentMode] || 'Tutoring');
  addMessage('user', text);
  userInputEl.value = '';

  addTypingIndicator();
  btnSubmit.disabled = true;

  try {
    const engine = window.tutorEngine;
    const result = await engine.processUserInput(text, currentMode, currentLang);

    removeTypingIndicator();
    addMessage('tutor', result.explanation || result.response || 'Here is my response!');

    if (result.challenge) {
      showChallenge(result.challenge);
    }
    updateProgress();
  } catch (err) {
    removeTypingIndicator();
    addMessage('tutor', '⚠️ Something went wrong. Please try again.');
    console.error(err);
  } finally {
    btnSubmit.disabled = false;
  }
}

// ── Submit from chat reply ────────────────────────────────
async function handleChatSubmit() {
  const text = chatInputEl.value.trim();
  if (!text) return;

  addMessage('user', text);
  chatInputEl.value = '';

  addTypingIndicator();
  btnChatSubmit.disabled = true;

  try {
    const engine = window.tutorEngine;
    const result = await engine.processUserInput(text, currentMode, currentLang);

    removeTypingIndicator();
    addMessage('tutor', result.explanation || result.response || 'Here is my response!');

    if (result.challenge && !currentChallenge) {
      showChallenge(result.challenge);
    }
    updateProgress();
  } catch (err) {
    removeTypingIndicator();
    addMessage('tutor', '⚠️ Something went wrong. Please try again.');
    console.error(err);
  } finally {
    btnChatSubmit.disabled = false;
    chatInputEl.focus();
  }
}

// ── Show challenge panel ───────────────────────────────────
function showChallenge(challenge) {
  currentChallenge = challenge;
  hintCount = 0;
  document.getElementById('hint-label').textContent = `Hint (0/${maxHints})`;

  document.getElementById('challenge-panel').classList.remove('hidden');
  document.getElementById('challenge-title').textContent = challenge.title || 'Your Challenge';
  document.getElementById('challenge-difficulty-tag').textContent =
    (challenge.difficulty || 'Intermediate').toUpperCase() + (challenge.xp ? ` • +${challenge.xp} XP` : '');
  document.getElementById('challenge-description').textContent = challenge.description || '';
  document.getElementById('hints-container').classList.add('hidden');
  document.getElementById('hints-container').innerHTML = '';

  // Set up code editor
  const filename = currentLang === 'python' ? 'solution.py' :
                   currentLang === 'java'   ? 'Solution.java' : 'solution.js';
  document.getElementById('editor-filename').textContent = filename;

  starterCode = challenge.starterCode || getDefaultStarter(currentLang);
  const editor = document.getElementById('code-editor');
  editor.value = starterCode;
  updateLineNumbers();

  document.getElementById('test-results-view').classList.add('hidden');
  document.getElementById('test-results-view').innerHTML = '';

  scrollToBottom();
}

function getDefaultStarter(lang) {
  const starters = {
    javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
    python:     '# Write your solution here\ndef solution():\n    pass\n',
    java:       '// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n',
    typescript: '// Write your solution here\nfunction solution(): void {\n  \n}\n',
    cpp:        '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
    go:         '// Write your solution here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    \n}\n',
  };
  return starters[lang] || '// Write your solution here\n';
}

// ── Line numbers ───────────────────────────────────────────
function updateLineNumbers() {
  const editor = document.getElementById('code-editor');
  const lineNumEl = document.getElementById('editor-line-numbers');
  const lines = editor.value.split('\n').length;
  lineNumEl.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('<br>');
}

// ── Hints ──────────────────────────────────────────────────
function handleHint() {
  if (!currentChallenge || hintCount >= maxHints) return;

  const hints = currentChallenge.hints || [
    '💡 Think about what the function needs to return.',
    '💡 Consider edge cases: what if the input is empty?',
    '💡 Look at your loop termination condition carefully.',
  ];

  hintCount++;
  document.getElementById('hint-label').textContent = `Hint (${hintCount}/${maxHints})`;

  const hintsContainer = document.getElementById('hints-container');
  hintsContainer.classList.remove('hidden');

  const hintEl = document.createElement('div');
  hintEl.className = 'hint-card';
  hintEl.innerHTML = `<strong>Hint ${hintCount}:</strong> ${hints[hintCount - 1] || 'Think carefully about the algorithm!'}`;
  hintsContainer.appendChild(hintEl);
}

// ── Run tests ──────────────────────────────────────────────
async function handleRunTests() {
  const editor = document.getElementById('code-editor');
  const code = editor.value;
  const testView = document.getElementById('test-results-view');

  testView.classList.remove('hidden');
  testView.innerHTML = '<div class="text-slate-400">⏳ Running tests...</div>';

  try {
    const runner = window.sandboxRunner;
    const results = await runner.runTests(code, currentChallenge?.testCases || [], currentLang);

    let html = '';
    let allPassed = true;
    results.forEach((r, i) => {
      const icon  = r.passed ? '✓' : '✗';
      const cls   = r.passed ? 'test-pass' : 'test-fail';
      if (!r.passed) allPassed = false;
      html += `<div class="${cls}">${icon} Test ${i + 1}: ${escapeHtml(r.message || '')}</div>`;
    });

    testView.innerHTML = html || '<div class="text-slate-400">No tests to run.</div>';

    if (allPassed && results.length > 0) {
      if (window.confetti) confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ['#7c3aed','#a78bfa','#4f46e5'] });
      addMessage('tutor', '🎉 All tests passed! Great work. Ready for a harder challenge?');
      updateProgress();
    }
  } catch (err) {
    testView.innerHTML = `<div class="test-error">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// ── Quick action cards ─────────────────────────────────────
document.querySelectorAll('.quick-action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    // Hint text in textarea
    const placeholders = {
      explain:   "Paste your code here and I'll explain it step by step...",
      question:  "Ask me anything — 'What is a closure?' or 'Why does my loop break?'",
      challenge: "Tell me a topic to be challenged on, or just press Ask Tutor!",
    };
    userInputEl.placeholder = placeholders[currentMode] || userInputEl.placeholder;
    userInputEl.focus();
  });
});

// ── Settings modal ─────────────────────────────────────────
btnSettings.addEventListener('click', () => {
  document.getElementById('modal-settings').classList.remove('hidden');
  loadSettingsFromMemory();
});
document.getElementById('btn-close-settings').addEventListener('click', () => {
  document.getElementById('modal-settings').classList.add('hidden');
});
document.getElementById('btn-save-settings').addEventListener('click', () => {
  const persona  = document.querySelector('.persona-card.active')?.dataset.persona || 'socratic';
  const level    = document.querySelector('.level-select-btn.active')?.dataset.level || 'Intermediate';
  const apiKey   = document.getElementById('gemini-api-key').value.trim();

  if (window.cognitiveMemory) {
    window.cognitiveMemory.setPersona(persona);
    window.cognitiveMemory.setLevel(level);
    if (apiKey) window.cognitiveMemory.setGeminiKey(apiKey);
  }
  if (window.tutorEngine) window.tutorEngine.setPersona(persona);

  updateProgress();
  document.getElementById('modal-settings').classList.add('hidden');
});

document.querySelectorAll('.persona-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.persona-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});
document.querySelectorAll('.level-select-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-select-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function loadSettingsFromMemory() {
  if (!window.cognitiveMemory) return;
  const profile = window.cognitiveMemory.getProfile();
  const persona = profile.persona || 'socratic';
  const level   = profile.level  || 'Intermediate';
  const apiKey  = profile.geminiKey || '';

  document.querySelectorAll('.persona-card').forEach(c => {
    c.classList.toggle('active', c.dataset.persona === persona);
  });
  document.querySelectorAll('.level-select-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.level === level);
  });
  document.getElementById('gemini-api-key').value = apiKey;
}

// ── Memory modal ───────────────────────────────────────────
btnMemory.addEventListener('click', () => {
  document.getElementById('modal-memory').classList.remove('hidden');
  renderMemoryModal();
});
document.getElementById('btn-close-memory').addEventListener('click', () => {
  document.getElementById('modal-memory').classList.add('hidden');
});

function renderMemoryModal() {
  const list = document.getElementById('modal-memory-list');
  if (!window.cognitiveMemory) { list.innerHTML = '<p class="text-slate-400 text-xs">No memory data yet.</p>'; return; }

  const memories = window.cognitiveMemory.getAllMemories();
  if (!memories.length) {
    list.innerHTML = '<p class="text-slate-400 text-sm">No memories yet — start learning and I\'ll remember your journey!</p>';
    return;
  }
  list.innerHTML = memories.map(m => `
    <div class="memory-chip ${m.type}">
      <span>${m.type === 'struggle' ? '⚠️' : m.type === 'success' ? '✅' : '📌'}</span>
      <span>${escapeHtml(m.text)}</span>
    </div>
  `).join('');
}

document.getElementById('btn-export-memory').addEventListener('click', () => {
  if (!window.cognitiveMemory) return;
  const data = JSON.stringify(window.cognitiveMemory.exportProfile(), null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], {type:'application/json'}));
  a.download = 'synapsecode-profile.json';
  a.click();
});
document.getElementById('btn-import-memory').addEventListener('click', () => {
  document.getElementById('file-import-memory').click();
});
document.getElementById('file-import-memory').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      window.cognitiveMemory?.importProfile(data);
      renderMemoryModal();
      updateProgress();
    } catch { alert('Invalid profile file.'); }
  };
  reader.readAsText(file);
});
document.getElementById('btn-reset-all-memory').addEventListener('click', () => {
  if (confirm('Reset all learning history? This cannot be undone.')) {
    window.cognitiveMemory?.reset();
    renderMemoryModal();
    updateProgress();
  }
});

// ── Back to home ───────────────────────────────────────────
btnBackHome.addEventListener('click', goToHome);

// ── Submit handlers ────────────────────────────────────────
btnSubmit.addEventListener('click', handleHomeSubmit);
btnChatSubmit.addEventListener('click', handleChatSubmit);

userInputEl.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleHomeSubmit(); }
});
chatInputEl.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleChatSubmit(); }
});

// ── Code editor ────────────────────────────────────────────
document.getElementById('code-editor').addEventListener('input', updateLineNumbers);
document.getElementById('code-editor').addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta = e.target;
    const start = ta.selectionStart;
    ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = start + 2;
    updateLineNumbers();
  }
});
document.getElementById('btn-reset-code').addEventListener('click', () => {
  document.getElementById('code-editor').value = starterCode;
  updateLineNumbers();
});
document.getElementById('btn-run-tests').addEventListener('click', handleRunTests);

// ── Hint button ────────────────────────────────────────────
document.getElementById('btn-hint').addEventListener('click', handleHint);

// ── Difficulty feedback ────────────────────────────────────
document.querySelectorAll('.feedback-rate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const rate = btn.dataset.rate;
    if (window.tutorEngine) window.tutorEngine.handleDifficultyFeedback(rate);
    const msgs = {
      too_easy: "Got it — I'll ramp up the difficulty! 🚀",
      just_right: "Perfect! I'll keep challenges at this level. 🎯",
      too_hard: "No worries! I'll ease up and build up from here. 💪",
    };
    addMessage('tutor', msgs[rate] || 'Thanks for the feedback!');
  });
});

// ── Language select ────────────────────────────────────────
langSelect.addEventListener('change', () => {
  currentLang = langSelect.value;
});

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  userInputEl.focus();

  // Show welcome message if this is the first ever visit
  if (window.cognitiveMemory) {
    const profile = window.cognitiveMemory.getProfile();
    if (!profile.visitCount) {
      window.cognitiveMemory.incrementVisit?.();
    }
  }
});
