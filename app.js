/**
 * SynapseCode — Main Application Controller & UI Orchestration
 * Handles user interactions, editor synchronization, test execution,
 * cognitive error diagnosis rendering, multi-perspective tabs,
 * 4-session journey stepping, sound synthesis, and state updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Application State
  let activeMode = 'explain'; // 'explain', 'question', 'challenge'
  let currentLanguage = 'javascript';
  let activeTab = 'test-cases'; // 'test-cases', 'tracer', 'console'
  let isSoundEnabled = true;

  // DOM Elements - Main Layout
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const btnSubmit = document.getElementById('btn-submit');
  const btnClearInput = document.getElementById('btn-clear-input');
  const codeEditor = document.getElementById('code-editor');
  const lineNumbers = document.getElementById('editor-line-numbers');
  const btnRunTests = document.getElementById('btn-run-tests');
  const btnHint = document.getElementById('btn-hint');
  const hintLabel = document.getElementById('hint-label');
  const hintsContainer = document.getElementById('hints-container');
  const btnResetCode = document.getElementById('btn-reset-code');
  const challengeTitle = document.getElementById('challenge-title');
  const challengeDiffTag = document.getElementById('challenge-difficulty-tag');
  const challengeDesc = document.getElementById('challenge-description');
  const challengeMemoryText = document.getElementById('challenge-memory-text');
  const testResultsView = document.getElementById('test-results-view');
  const stateTracerView = document.getElementById('state-tracer-view');
  const consoleOutputView = document.getElementById('console-output-view');
  const languageSelect = document.getElementById('language-select');
  const editorFilename = document.getElementById('editor-filename');

  // Sidebar Elements
  const studentName = document.getElementById('student-name');
  const studentAvatar = document.getElementById('student-avatar');
  const studentTitle = document.getElementById('student-title');
  const streakCount = document.getElementById('streak-count');
  const currentLevelDisplay = document.getElementById('current-level-display');
  const eloDisplay = document.getElementById('elo-display');
  const memoryCountBadge = document.getElementById('memory-count-badge');
  const memoryChipsContainer = document.getElementById('memory-chips-container');
  const masteryBarsContainer = document.getElementById('mastery-bars-container');
  const overallMasteryPct = document.getElementById('overall-mastery-pct');
  const historyList = document.getElementById('history-list');
  const sessionCount = document.getElementById('session-count');

  // Modals & Controls
  const personaBadge = document.getElementById('persona-badge');
  const personaIcon = document.getElementById('persona-icon');
  const personaName = document.getElementById('persona-name');
  const btnSettings = document.getElementById('btn-settings');
  const modalSettings = document.getElementById('modal-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings-modal');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const geminiApiKeyInput = document.getElementById('gemini-api-key');

  const btnMemoryToggle = document.getElementById('btn-memory-toggle');
  const modalMemory = document.getElementById('modal-memory');
  const btnCloseMemory = document.getElementById('btn-close-memory-modal');
  const modalMemoryList = document.getElementById('modal-memory-list');
  const btnAddMemory = document.getElementById('btn-add-memory');
  const newMemoryType = document.getElementById('new-memory-type');
  const newMemoryText = document.getElementById('new-memory-text');
  const btnExportMemory = document.getElementById('btn-export-memory');
  const btnImportMemory = document.getElementById('btn-import-memory');
  const fileImportMemory = document.getElementById('file-import-memory');
  const btnResetAllMemory = document.getElementById('btn-reset-all-memory');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  // Sidebar Tab Switchers
  const tabMasteryBtn = document.getElementById('tab-mastery-btn');
  const tabHistoryBtn = document.getElementById('tab-history-btn');
  const tabMastery = document.getElementById('tab-mastery');
  const tabHistory = document.getElementById('tab-history');

  // Test Runner Tab Switchers
  const tabTestCasesBtn = document.getElementById('tab-test-cases-btn');
  const tabTracerBtn = document.getElementById('tab-tracer-btn');
  const tabConsoleBtn = document.getElementById('tab-console-btn');

  // -------------------------------------------------------------
  // Web Audio API Synthesizer (Harmonic Soundscapes)
  // -------------------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSynthSound(type) {
    if (!isSoundEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'failure') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'hint') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  // -------------------------------------------------------------
  // UI Renderers & State Sync
  // -------------------------------------------------------------
  function renderStudentProfile() {
    const student = window.memorySystem.getStudent();
    const mastery = window.memorySystem.getMastery();
    const struggles = window.memorySystem.getStruggles();
    const history = window.memorySystem.getSessionHistory();

    studentName.textContent = student.name;
    studentAvatar.textContent = student.avatar;
    studentTitle.textContent = student.title;
    streakCount.textContent = `${student.streakDays}d streak`;
    currentLevelDisplay.textContent = student.level;
    eloDisplay.textContent = `(ELO: ${student.elo})`;

    const personaMap = {
      socratic: { name: 'Socratic Mentor', icon: '🦉' },
      senior_dev: { name: 'Senior Engineer', icon: '🛠️' },
      visual: { name: 'Visual Intuitive', icon: '🎨' },
      speedrun: { name: 'Speed-Run Coach', icon: '⚡' }
    };
    const p = personaMap[student.persona] || personaMap.socratic;
    personaIcon.textContent = p.icon;
    personaName.textContent = p.name;

    // Active Struggles Chips
    memoryChipsContainer.innerHTML = '';
    const activeStruggles = struggles.filter(s => !s.resolved);
    memoryCountBadge.textContent = activeStruggles.length;

    if (activeStruggles.length === 0) {
      memoryChipsContainer.innerHTML = `
        <div class="text-[11px] text-emerald-400/90 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-800/40">
          ✨ Zero active struggles! Concepts are reinforced and verified.
        </div>
      `;
    } else {
      activeStruggles.slice(0, 3).forEach(s => {
        const categoryBadge = s.category === 'careless_mistake' 
          ? '<span class="text-[9px] px-1 rounded bg-blue-900/60 text-blue-300 font-mono">Careless</span>'
          : (s.category === 'knowledge_gap' 
            ? '<span class="text-[9px] px-1 rounded bg-red-900/60 text-red-300 font-mono">Knowledge Gap</span>'
            : '<span class="text-[9px] px-1 rounded bg-purple-900/60 text-purple-300 font-mono">Application</span>');

        const chip = document.createElement('div');
        chip.className = 'p-2 rounded-lg bg-dark-800/90 border border-purple-500/30 text-[11px] space-y-1 hover:border-purple-400/60 transition group';
        chip.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-semibold text-purple-300 flex items-center space-x-1.5 truncate">
              <span>⚠️</span>
              <span class="truncate">${s.tag}</span>
            </span>
            ${categoryBadge}
          </div>
          <p class="text-slate-300 text-[10px] line-clamp-2">${s.description}</p>
        `;
        memoryChipsContainer.appendChild(chip);
      });
    }

    // Mastery Bars
    masteryBarsContainer.innerHTML = '';
    let totalScore = 0;
    let topicCount = 0;

    for (const [key, topicData] of Object.entries(mastery)) {
      totalScore += topicData.score;
      topicCount++;

      const barRow = document.createElement('div');
      barRow.className = 'space-y-1';
      barRow.innerHTML = `
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-slate-300 truncate">${topicData.label}</span>
          <span class="font-mono text-cyan-400 font-medium">${topicData.score}%</span>
        </div>
        <div class="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500" style="width: ${topicData.score}%"></div>
        </div>
      `;
      masteryBarsContainer.appendChild(barRow);
    }

    const overallPct = Math.round(totalScore / topicCount);
    overallMasteryPct.textContent = `${overallPct}%`;

    // History list
    historyList.innerHTML = '';
    sessionCount.textContent = history.length;
    if (history.length === 0) {
      historyList.innerHTML = `<p class="text-xs text-slate-500 italic">No past sessions yet.</p>`;
    } else {
      history.forEach(sess => {
        const item = document.createElement('div');
        item.className = 'p-2.5 rounded-lg bg-dark-800 border border-dark-700 text-xs space-y-1';
        item.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-medium text-slate-200 truncate">${sess.challengeTitle || sess.topic}</span>
            <span class="text-[10px] font-mono ${sess.eloChange >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
              ${sess.eloChange >= 0 ? '+' : ''}${sess.eloChange} ELO
            </span>
          </div>
          <p class="text-[11px] text-slate-400 line-clamp-2">${sess.summary}</p>
        `;
        historyList.appendChild(item);
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // -------------------------------------------------------------
  // Memory Modal Renderer
  // -------------------------------------------------------------
  function renderMemoryModal() {
    const struggles = window.memorySystem.getStruggles();
    const successes = window.memorySystem.getSuccesses();

    modalMemoryList.innerHTML = '';

    // Active Struggles
    const struggleSection = document.createElement('div');
    struggleSection.className = 'space-y-1.5';
    struggleSection.innerHTML = `<h5 class="text-purple-300 font-semibold text-[11px] flex items-center space-x-1"><span>⚠️ Tracked Struggles & Cognitive Categories</span></h5>`;
    
    if (struggles.length === 0) {
      struggleSection.innerHTML += `<p class="text-slate-500 italic">No recorded struggles.</p>`;
    } else {
      struggles.forEach(s => {
        const card = document.createElement('div');
        card.className = `p-2.5 rounded-lg border flex items-start justify-between gap-2 ${s.resolved ? 'bg-emerald-950/20 border-emerald-800/40 opacity-70' : 'bg-dark-900 border-dark-700'}`;
        
        let catText = 'Application Gap';
        let catColor = 'bg-purple-900/60 text-purple-300';
        if (s.category === 'careless_mistake') {
          catText = 'Careless Slip';
          catColor = 'bg-blue-900/60 text-blue-300';
        } else if (s.category === 'knowledge_gap') {
          catText = 'Knowledge Gap';
          catColor = 'bg-red-900/60 text-red-300';
        }

        card.innerHTML = `
          <div class="space-y-1 flex-1">
            <div class="flex items-center space-x-2">
              <span class="font-medium ${s.resolved ? 'line-through text-slate-400' : 'text-slate-200'}">${s.tag}</span>
              <span class="text-[10px] px-1.5 rounded ${catColor} font-mono">${catText}</span>
              ${s.resolved ? '<span class="text-[10px] px-1.5 rounded bg-emerald-900/60 text-emerald-300">Resolved</span>' : '<span class="text-[10px] px-1.5 rounded bg-amber-900/60 text-amber-300">Active</span>'}
            </div>
            <p class="text-slate-400 text-[11px] leading-relaxed">${s.description}</p>
            ${s.pedagogicalNotes ? `<p class="text-[10px] text-cyan-400/90 italic">Mentor Note: ${s.pedagogicalNotes}</p>` : ''}
          </div>
          <button class="btn-delete-mem text-slate-500 hover:text-red-400 p-1" data-id="${s.id}" title="Remove memory">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        `;
        struggleSection.appendChild(card);
      });
    }
    modalMemoryList.appendChild(struggleSection);

    // Successes
    const successSection = document.createElement('div');
    successSection.className = 'space-y-1.5 pt-2';
    successSection.innerHTML = `<h5 class="text-emerald-300 font-semibold text-[11px] flex items-center space-x-1"><span>🏆 Breakthrough Successes</span></h5>`;
    
    if (successes.length === 0) {
      successSection.innerHTML += `<p class="text-slate-500 italic">No recorded successes yet.</p>`;
    } else {
      successes.forEach(sc => {
        const card = document.createElement('div');
        card.className = 'p-2.5 rounded-lg border bg-dark-900 border-dark-700 flex items-start justify-between gap-2';
        card.innerHTML = `
          <div class="space-y-0.5 flex-1">
            <span class="font-medium text-emerald-300">${sc.tag}</span>
            <p class="text-slate-300 text-[11px]">${sc.description}</p>
          </div>
          <button class="btn-delete-mem text-slate-500 hover:text-red-400 p-1" data-id="${sc.id}" title="Remove memory">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        `;
        successSection.appendChild(card);
      });
    }
    modalMemoryList.appendChild(successSection);

    modalMemoryList.querySelectorAll('.btn-delete-mem').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.memorySystem.deleteMemory(id);
        renderMemoryModal();
        renderStudentProfile();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // -------------------------------------------------------------
  // Challenge Setup & Code Editor
  // -------------------------------------------------------------
  function loadChallengeIntoEditor(challenge) {
    challengeTitle.textContent = `Active Challenge: ${challenge.title}`;
    challengeDiffTag.textContent = `LEVEL: ${challenge.difficulty.toUpperCase()} • +${challenge.xp} XP`;
    challengeDesc.innerHTML = challenge.description.replace(/\n/g, '<br>');
    
    if (challenge.memoryNote) {
      challengeMemoryText.textContent = challenge.memoryNote;
      document.getElementById('challenge-memory-note').classList.remove('hidden');
    } else {
      document.getElementById('challenge-memory-note').classList.add('hidden');
    }

    hintLabel.textContent = `Hint (0/${challenge.hints.length})`;
    hintsContainer.innerHTML = '';
    hintsContainer.classList.add('hidden');

    codeEditor.value = challenge.starterCode;
    updateLineNumbers();

    renderTestCases(challenge.testCases);
    stateTracerView.innerHTML = `<div class="text-slate-500 italic">// Run your code to inspect step execution trace and assertion diffs</div>`;
  }

  function renderTestCases(testCases) {
    testResultsView.innerHTML = '';
    testCases.forEach((t, i) => {
      const item = document.createElement('div');
      item.id = `test-item-${i}`;
      item.className = 'p-2 rounded bg-dark-800/80 border border-dark-700/60 flex items-center justify-between';
      item.innerHTML = `
        <div class="flex items-center space-x-2 truncate">
          <span class="w-2 h-2 rounded-full bg-slate-500 test-indicator shrink-0"></span>
          <span class="text-slate-300 font-mono text-[11px] truncate">${t.name || t.call}</span>
        </div>
        <span class="test-badge text-[10px] text-slate-500 font-mono">Ready</span>
      `;
      testResultsView.appendChild(item);
    });
  }

  function renderStateTracer(trace) {
    if (!trace || trace.length === 0) {
      stateTracerView.innerHTML = `<div class="text-slate-500 italic">// No execution steps recorded.</div>`;
      return;
    }

    stateTracerView.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-dark-700/60 pb-1">
          <span>Execution Step</span>
          <span>Assertion Result</span>
        </div>
        ${trace.map(step => `
          <div class="p-2 rounded bg-dark-800 border ${step.status === 'PASSED' ? 'border-emerald-700/40' : 'border-red-700/50'} text-[11px] space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-cyan-300 font-mono font-semibold">Step ${step.step}: <code>${escapeHtml(step.expression)}</code></span>
              <span class="${step.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'} font-bold">${step.status} (${step.durationMs}ms)</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-dark-900/80 p-1.5 rounded">
              <div><span class="text-slate-500">Expected:</span> <code class="text-amber-300">${escapeHtml(step.expected)}</code></div>
              <div><span class="text-slate-500">Actual:</span> <code class="${step.status === 'PASSED' ? 'text-emerald-300' : 'text-red-300'}">${escapeHtml(step.actual)}</code></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function updateLineNumbers() {
    const lines = codeEditor.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= Math.max(12, lines); i++) {
      numbers += i + '<br>';
    }
    lineNumbers.innerHTML = numbers;
  }

  codeEditor.addEventListener('input', updateLineNumbers);
  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
      updateLineNumbers();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runChallengeTests();
    }
  });

  codeEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
  });

  // -------------------------------------------------------------
  // Test Runner Execution & Diagnostic Evaluation
  // -------------------------------------------------------------
  async function runChallengeTests() {
    const challenge = window.tutorEngine.activeChallenge;
    if (!challenge) return;

    btnRunTests.disabled = true;
    btnRunTests.innerHTML = `<span class="typing-dot"></span><span class="ml-2">Running...</span>`;

    const userCode = codeEditor.value;
    const testCases = challenge.testCases;

    let result;
    if (currentLanguage === 'python') {
      result = await window.codeSandbox.runPython(userCode, testCases);
    } else {
      result = await window.codeSandbox.runJavaScript(userCode, testCases);
    }

    btnRunTests.disabled = false;
    btnRunTests.innerHTML = `
      <i data-lucide="play" class="w-3 h-3"></i>
      <span>Run Code (Ctrl+Enter)</span>
    `;
    if (window.lucide) window.lucide.createIcons();

    // Render results in UI
    if (result.results && result.results.length > 0) {
      result.results.forEach((r, i) => {
        const item = document.getElementById(`test-item-${i}`);
        if (item) {
          const indicator = item.querySelector('.test-indicator');
          const badge = item.querySelector('.test-badge');

          if (r.passed) {
            indicator.className = 'w-2 h-2 rounded-full bg-emerald-400 test-indicator shrink-0 shadow-sm shadow-emerald-400/50';
            badge.className = 'test-badge text-[10px] text-emerald-400 font-mono font-semibold';
            badge.textContent = `PASS (${r.durationMs}ms)`;
          } else {
            indicator.className = 'w-2 h-2 rounded-full bg-red-400 test-indicator shrink-0';
            badge.className = 'test-badge text-[10px] text-red-400 font-mono font-semibold';
            badge.textContent = `FAIL`;
          }
        }
      });
    }

    // Console logs view
    if (result.logs && result.logs.length > 0) {
      consoleOutputView.innerHTML = result.logs.map(l => `<div class="py-0.5">${escapeHtml(l)}</div>`).join('');
    } else if (result.error) {
      consoleOutputView.innerHTML = `<div class="text-red-400 py-0.5">Runtime Error: ${escapeHtml(result.error)}</div>`;
    } else {
      consoleOutputView.innerHTML = `<div class="text-slate-500 italic">// Code executed with no console output</div>`;
    }

    // State tracer view
    renderStateTracer(result.trace);

    // Evaluate solution with Tutor Engine
    const evalResult = window.tutorEngine.evaluateChallengeSolution(result, userCode);

    if (evalResult.status === 'passed') {
      playSynthSound('success');
      
      if (window.confetti) {
        window.confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.7 }
        });
      }

      appendTutorMessage({
        personaIntro: '🎯 **Challenge Mastered!**',
        body: `${evalResult.message}\n\n**+${evalResult.eloGain} ELO Gained!** Your rating is now **${evalResult.newElo}**. The mentor has updated your mastery radar!`,
        takeaways: [
          'Clean algorithmic invariant preservation.',
          'All edge case tests passed successfully.'
        ]
      });

      renderStudentProfile();

    } else if (evalResult.status === 'failed') {
      playSynthSound('failure');

      const diag = evalResult.diagnosis;
      let badgeLabel = 'Application Gap';
      let badgeColor = 'bg-purple-900/60 border-purple-700/60 text-purple-300';
      if (diag.category === 'careless_mistake') {
        badgeLabel = 'Careless Slip (Syntax/Boundary)';
        badgeColor = 'bg-blue-900/60 border-blue-700/60 text-blue-300';
      } else if (diag.category === 'knowledge_gap') {
        badgeLabel = 'Knowledge Gap (Concept Foundation)';
        badgeColor = 'bg-red-900/60 border-red-700/60 text-red-300';
      }

      const diagnosticCardHtml = `
        <div class="p-3 my-2 rounded-xl bg-dark-800/90 border border-dark-700 text-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <span>🔍 Cognitive Diagnosis:</span>
              <span class="text-amber-400">${diag.title}</span>
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full border ${badgeColor} font-mono">${badgeLabel}</span>
          </div>
          <p class="text-slate-300 leading-relaxed">${diag.explanation}</p>
          <div class="pt-2 border-t border-dark-700/80 text-[11px] text-cyan-300 flex items-center space-x-1.5">
            <i data-lucide="arrow-right-circle" class="w-3.5 h-3.5 shrink-0"></i>
            <span><strong>Recommended Action:</strong> ${diag.suggestedAction}</span>
          </div>
        </div>
      `;

      appendTutorMessage({
        personaIntro: '💡 **Pedagogical Assessment**',
        body: `${evalResult.message}\n\n${diagnosticCardHtml}`,
        takeaways: [
          'Click the "Hint" button in the challenge header for a progressive clue.',
          'Inspect the "State Tracer" tab below the editor for exact input/output differences.'
        ]
      });

      renderStudentProfile();
    }
  }

  // -------------------------------------------------------------
  // Progressive Hints
  // -------------------------------------------------------------
  btnHint.addEventListener('click', () => {
    const nextHint = window.tutorEngine.getNextHint();
    if (!nextHint) return;

    playSynthSound('hint');

    hintsContainer.classList.remove('hidden');
    const hintCard = document.createElement('div');
    hintCard.className = 'p-2 rounded bg-amber-950/30 border border-amber-600/40 text-amber-200 text-[11px] animate-in fade-in duration-200';
    hintCard.innerHTML = `<strong>Tier ${nextHint.index} Hint:</strong> ${nextHint.hint}`;
    hintsContainer.appendChild(hintCard);

    hintLabel.textContent = `Hint (${nextHint.index}/${nextHint.total})`;
  });

  btnResetCode.addEventListener('click', () => {
    if (window.tutorEngine.activeChallenge) {
      codeEditor.value = window.tutorEngine.activeChallenge.starterCode;
      updateLineNumbers();
    }
  });

  // -------------------------------------------------------------
  // Chat Messaging System with Multi-Perspective Tabs
  // -------------------------------------------------------------
  function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'flex items-start justify-end space-x-3';
    msg.innerHTML = `
      <div class="user-bubble max-w-xl p-4 rounded-2xl rounded-tr-none text-sm text-slate-100 shadow-md">
        <div class="font-mono text-xs text-cyan-300 font-semibold mb-1 flex items-center space-x-1">
          <span>You</span>
        </div>
        <div class="whitespace-pre-wrap font-mono text-xs leading-relaxed">${escapeHtml(text)}</div>
      </div>
      <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold shrink-0 shadow">
        ${window.memorySystem.getStudent().avatar}
      </div>
    `;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTutorMessage(data) {
    const student = window.memorySystem.getStudent();
    const personaMap = {
      socratic: { name: 'Socratic Mentor', icon: '🦉' },
      senior_dev: { name: 'Senior Engineer', icon: '🛠️' },
      visual: { name: 'Visual Intuitive', icon: '🎨' },
      speedrun: { name: 'Speed-Run Coach', icon: '⚡' }
    };
    const p = personaMap[student.persona] || personaMap.socratic;

    const msg = document.createElement('div');
    msg.className = 'flex items-start space-x-3';

    let takeawaysHtml = '';
    if (data.takeaways && data.takeaways.length > 0) {
      takeawaysHtml = `
        <div class="mt-3 pt-3 border-t border-dark-700/60">
          <span class="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1">Key Takeaways</span>
          <ul class="list-disc list-inside space-y-0.5 text-xs text-slate-300">
            ${data.takeaways.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let bugAlertHtml = '';
    if (data.detectedBug) {
      bugAlertHtml = `
        <div class="p-3 my-2 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 space-y-1">
          <div class="font-bold flex items-center space-x-1 text-red-300">
            <span>🚨</span>
            <span>Identified Issue: ${data.detectedBug.title}</span>
          </div>
          <p class="text-[11px] text-red-200/90 leading-relaxed">${data.detectedBug.detail}</p>
        </div>
      `;
    }

    let greetingHtml = '';
    if (data.greeting) {
      greetingHtml = `
        <div class="p-2.5 mb-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs text-purple-200 memory-active-glow flex items-start space-x-2">
          <i data-lucide="sparkles" class="w-4 h-4 text-purple-400 shrink-0 mt-0.5"></i>
          <div>${formatMarkdownToHtml(data.greeting)}</div>
        </div>
      `;
    }

    // Multi-perspective explanation tabs (Analogy, Walkthrough, Socratic, Senior Dev)
    let perspectiveTabsHtml = '';
    if (data.perspectives) {
      perspectiveTabsHtml = `
        <div class="flex items-center space-x-1 border-b border-dark-700/60 pb-1 mb-2 text-[11px]">
          <span class="text-slate-500 mr-1 text-[10px] uppercase font-mono">Style:</span>
          <button class="tab-persp px-2 py-0.5 rounded text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 font-medium" data-style="analogy">💡 Analogy</button>
          <button class="tab-persp px-2 py-0.5 rounded text-slate-400 hover:text-slate-200" data-style="walkthrough">🔍 Walkthrough</button>
          <button class="tab-persp px-2 py-0.5 rounded text-slate-400 hover:text-slate-200" data-style="socratic">🦉 Socratic</button>
          <button class="tab-persp px-2 py-0.5 rounded text-slate-400 hover:text-slate-200" data-style="seniordev">🛠️ Senior Dev</button>
        </div>
      `;
    }

    const initialBody = data.body || '';

    msg.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0 shadow-lg shadow-cyan-500/20">
        ${p.icon}
      </div>
      <div class="tutor-bubble max-w-2xl p-4 sm:p-5 rounded-2xl rounded-tl-none border border-dark-700/80 text-sm text-slate-200 shadow-xl space-y-2">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1.5 font-semibold text-cyan-300">
            <span>${p.name}</span>
            <span class="text-[10px] text-slate-400 font-normal">(${student.level})</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-dark-800 border border-dark-700 text-slate-400 font-mono">
            ${data.topicLabel || 'Pedagogical Analysis'}
          </span>
        </div>

        ${greetingHtml}

        <p class="text-xs text-slate-400 italic">${data.personaIntro || ''}</p>

        ${bugAlertHtml}

        ${perspectiveTabsHtml}

        <div class="code-explanation-block text-xs leading-relaxed space-y-2">
          ${formatMarkdownToHtml(initialBody)}
        </div>

        ${takeawaysHtml}

        <div class="pt-2 flex items-center justify-end">
          <button class="btn-focus-challenge text-[11px] px-3 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 flex items-center space-x-1 transition">
            <span>Solve Active Challenge</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Wire up perspective tabs inside this bubble
    if (data.perspectives) {
      const tabs = msg.querySelectorAll('.tab-persp');
      const bodyContainer = msg.querySelector('.code-explanation-block');

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => {
            t.className = 'tab-persp px-2 py-0.5 rounded text-slate-400 hover:text-slate-200';
          });
          tab.className = 'tab-persp px-2 py-0.5 rounded text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 font-medium';

          const styleKey = tab.getAttribute('data-style');
          const content = data.perspectives[styleKey];
          if (content) {
            bodyContainer.innerHTML = formatMarkdownToHtml(content);
            if (window.Prism) {
              bodyContainer.querySelectorAll('pre code').forEach((b) => window.Prism.highlightElement(b));
            }
          }
        });
      });
    }

    if (window.Prism) {
      msg.querySelectorAll('pre code').forEach((block) => {
        window.Prism.highlightElement(block);
      });
    }

    const btnFocus = msg.querySelector('.btn-focus-challenge');
    if (btnFocus) {
      btnFocus.addEventListener('click', () => {
        codeEditor.focus();
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Submit Handler
  async function handleSubmit() {
    const text = userInput.value.trim();
    if (!text) return;

    appendUserMessage(text);
    userInput.value = '';

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="typing-dot"></span><span class="ml-2">Analyzing...</span>`;

    const response = await window.tutorEngine.processUserInput(text, activeMode, currentLanguage);

    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `
      <span>Send to Mentor</span>
      <i data-lucide="send" class="w-3.5 h-3.5"></i>
    `;
    if (window.lucide) window.lucide.createIcons();

    appendTutorMessage(response.explanation);

    if (response.challenge) {
      loadChallengeIntoEditor(response.challenge);
    }

    renderStudentProfile();
  }

  btnSubmit.addEventListener('click', handleSubmit);
  btnClearInput.addEventListener('click', () => { userInput.value = ''; });

  userInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  });

  // -------------------------------------------------------------
  // Mode Switchers
  // -------------------------------------------------------------
  const modeExplain = document.getElementById('mode-explain');
  const modeQuestion = document.getElementById('mode-question');
  const modeChallenge = document.getElementById('mode-challenge');

  function setMode(mode) {
    activeMode = mode;
    [modeExplain, modeQuestion, modeChallenge].forEach(btn => {
      btn.className = 'px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200 transition flex items-center space-x-1';
    });
    if (mode === 'explain') {
      modeExplain.className = 'px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-medium transition flex items-center space-x-1';
      userInput.placeholder = "Paste your code snippet (e.g. recursive function, nested loop, async call)...";
    } else if (mode === 'question') {
      modeQuestion.className = 'px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-medium transition flex items-center space-x-1';
      userInput.placeholder = "Ask a question: 'Why does my recursive base case cause a stack overflow?' or 'How does hash map lookup work in O(1)?'";
    } else {
      modeChallenge.className = 'px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-medium transition flex items-center space-x-1';
      userInput.placeholder = "Request a specific concept challenge: 'Give me a challenge on 2D matrix traversal'...";
    }
  }

  modeExplain.addEventListener('click', () => setMode('explain'));
  modeQuestion.addEventListener('click', () => setMode('question'));
  modeChallenge.addEventListener('click', () => setMode('challenge'));

  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    const extensions = {
      javascript: 'solution.js',
      python: 'solution.py',
      typescript: 'solution.ts',
      cpp: 'solution.cpp',
      java: 'Solution.java',
      go: 'main.go',
      rust: 'main.rs'
    };
    editorFilename.textContent = extensions[currentLanguage] || 'solution.js';
  });

  // -------------------------------------------------------------
  // Feedback Buttons (Dynamic Difficulty Adjustment)
  // -------------------------------------------------------------
  document.querySelectorAll('.feedback-rate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rate = btn.getAttribute('data-rate');
      const responseMsg = window.tutorEngine.adjustDifficultyFeedback(rate);
      
      appendTutorMessage({
        personaIntro: '⚙️ **Pace & Difficulty Calibration**',
        body: responseMsg,
        takeaways: ['Dynamic Difficulty Adjustment curve calibrated.']
      });

      renderStudentProfile();
    });
  });

  // -------------------------------------------------------------
  // Scenario Simulator Presets
  // -------------------------------------------------------------
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if (preset === 'recursion_struggle') {
        userInput.value = `// Recursion bug: Missing base case causing stack overflow!
function countdown(n) {
  console.log(n);
  return countdown(n - 1); // No if (n <= 0) base condition guard!
}`;
        setMode('explain');
      } else if (preset === 'async_struggle') {
        userInput.value = `// Async struggle: Unawaited Promise returns pending object
async function getUser() {
  const res = fetch('/api/user'); // Forgot 'await'!
  console.log(res);
  return res.json();
}`;
        setMode('explain');
      } else if (preset === 'two_sum') {
        userInput.value = `// Two Sum question:
// How do we optimize nested loops from O(n^2) down to O(n) using a Hash Map?`;
        setMode('question');
      } else if (preset === 'off_by_one') {
        userInput.value = `// Off-by-one index error in array loop
function printAll(arr) {
  for (let i = 0; i <= arr.length; i++) { // <= length causes undefined!
    console.log(arr[i]);
  }
}`;
        setMode('explain');
      }
      handleSubmit();
    });
  });

  // -------------------------------------------------------------
  // 4-Session Adaptive Journey Stepper
  // -------------------------------------------------------------
  document.querySelectorAll('.journey-step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.getAttribute('data-step'), 10);

      // Update button styling
      document.querySelectorAll('.journey-step-btn').forEach(b => {
        b.className = 'journey-step-btn px-2.5 py-1 rounded-md bg-dark-800 border border-dark-700 text-slate-400 text-[11px] hover:text-slate-200 transition';
      });
      btn.className = 'journey-step-btn px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-medium text-[11px] hover:border-cyan-400 transition';

      // Apply persistent profile state for that session
      window.memorySystem.applySessionState(step);
      renderStudentProfile();

      if (step === 1) {
        // Session 1: Baseline Single Loop
        appendTutorMessage({
          greeting: '',
          personaIntro: `Session 1: Initial Baseline Assessment (Beginner)`,
          topicLabel: 'Loops & Iteration Fundamentals',
          body: `Welcome to your first session, Alex! Let's start with foundational iteration mechanics.
A loop repeats instructions while a condition is true. The key is understanding the three parts:
1. **Initialization:** Where does the counter start (\`let i = 1\`)?
2. **Termination Condition:** When does it stop (\`i <= target\`)?
3. **Step Increment:** Moving forward each turn (\`i++\`).

Try the **Single Loop Counter** challenge on the right to demonstrate your baseline!`,
          takeaways: [
            'Loop counters must strictly advance towards the termination condition.',
            'Watch out for zero-based vs one-based index counting.'
          ]
        });

        const ch = window.tutorEngine.generateTailoredChallenge({ topic: 'debugging_logic' }, 'Beginner', null);
        window.tutorEngine.activeChallenge = ch;
        loadChallengeIntoEditor(ch);

      } else if (step === 2) {
        // Session 2: Memory Recall -> Nested Loops
        appendTutorMessage({
          greeting: `> 🧠 **Memory Recall:** *In Session 1, you understood single loop mechanics cleanly and earned +30 ELO! Today, let's build on that with multi-dimensional coordinates.*`,
          personaIntro: `Session 2: Advancing Complexity (Loop Concepts Remembered)`,
          topicLabel: 'Nested Loops & Coordinate Boundaries',
          body: `Now that single loops are second nature, we encounter problems requiring **two dimensions**—such as searching a 2D matrix or grid.

When nesting loops:
- The **outer loop** typically controls the **row index** (\`r\`).
- The **inner loop** controls the **column index** (\`c\`).
- Every single time the outer loop ticks once, the inner loop runs to completion!

I've set up the **2D Matrix Coordinate Scanner** challenge on the right!`,
          takeaways: [
            'Separate row and column variable names clearly.',
            'Inner loops run completely for each step of the outer loop.'
          ]
        });

        const ch = window.tutorEngine.generateTailoredChallenge({ topic: 'debugging_logic' }, 'Intermediate', { type: 'session_callback', text: 'You understood single loop mechanics cleanly.' });
        ch.title = 'Session 2: 2D Matrix Coordinate Scanner';
        window.tutorEngine.activeChallenge = ch;
        loadChallengeIntoEditor(ch);

      } else if (step === 3) {
        // Session 3: User Struggles -> Tutor Adapts Strategy
        appendTutorMessage({
          greeting: `> ⚠️ **Adaptive Intervention:** *We noted that nested loop row/column variable mixing occurred in your recent attempt. Rather than lowering your level, let's switch to an intuitive visual grid walkthrough!*`,
          personaIntro: `Session 3: Cognitive Error Intervention (Application Gap Diagnosed)`,
          topicLabel: 'Coordinate Invariant Reinforcement',
          body: `### 🎨 Visual Matrix Grid Walkthrough

Imagine a 3x3 chessboard:
\`\`\`
Row 0: [ (0,0), (0,1), (0,2) ]
Row 1: [ (1,0), (1,1), (1,2) ]
Row 2: [ (2,0), (2,1), (2,2) ]
\`\`\`
Notice that \`matrix[r]\` gives the whole row, and \`matrix[r][c]\` gives the specific cell.
The common slip is writing \`matrix[c][r]\` or letting \`c\` loop using \`matrix.length\` rather than \`matrix[r].length\`.

Let's do a targeted challenge to lock in this coordinate mental model!`,
          takeaways: [
            'outer: for (let r = 0; r < matrix.length; r++)',
            'inner: for (let c = 0; c < matrix[r].length; c++)',
            'matrix[r][c] accesses row r, column c.'
          ]
        });

        const ch = window.tutorEngine.generateTailoredChallenge({ topic: 'debugging_logic' }, 'Intermediate', { type: 'struggle_callback', text: 'Nested loop index confusion' });
        window.tutorEngine.activeChallenge = ch;
        loadChallengeIntoEditor(ch);

      } else if (step === 4) {
        // Session 4: Breakthrough -> Advanced Concept
        appendTutorMessage({
          greeting: `> 🌟 **Breakthrough Achieved:** *You conquered nested coordinate boundaries! Your struggle has been marked Resolved in your memory bank (+45 ELO).*`,
          personaIntro: `Session 4: Algorithmic Upgrade (Introducing Hash Maps)`,
          topicLabel: 'Hash Tables & O(1) Lookups',
          body: `Now that you can navigate arrays and grids with ease, notice the major trade-off of nested loops: **Time Complexity $O(N^2)$**.

If an array has 100,000 numbers, nested loops perform 10 BILLION checks!
To optimize this, we introduce **Hash Maps** (\`new Map()\`), allowing us to solve **Two Sum** in a single linear pass ($O(N)$) with instant $O(1)$ lookups!

Check out the **Two Sum Target Finder** challenge loaded on the right!`,
          takeaways: [
            'Nested loops are quadratic O(N^2); Hash Maps achieve linear O(N).',
            'Complement formula: complement = target - nums[i].',
            'Mastery radar updated: ELO 1260.'
          ]
        });

        const ch = window.tutorEngine.generateTailoredChallenge({ topic: 'arrays_hashing' }, 'Intermediate', null);
        window.tutorEngine.activeChallenge = ch;
        loadChallengeIntoEditor(ch);
      }
    });
  });

  // -------------------------------------------------------------
  // Sidebar Tabs & Test Runner Tabs
  // -------------------------------------------------------------
  tabMasteryBtn.addEventListener('click', () => {
    tabMasteryBtn.className = 'flex-1 py-2.5 px-3 border-b-2 border-cyan-400 text-cyan-400 flex items-center justify-center space-x-1.5 transition';
    tabHistoryBtn.className = 'flex-1 py-2.5 px-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center justify-center space-x-1.5 transition';
    tabMastery.classList.remove('hidden');
    tabHistory.classList.add('hidden');
  });

  tabHistoryBtn.addEventListener('click', () => {
    tabHistoryBtn.className = 'flex-1 py-2.5 px-3 border-b-2 border-cyan-400 text-cyan-400 flex items-center justify-center space-x-1.5 transition';
    tabMasteryBtn.className = 'flex-1 py-2.5 px-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center justify-center space-x-1.5 transition';
    tabHistory.classList.remove('hidden');
    tabMastery.classList.add('hidden');
  });

  document.getElementById('btn-clear-history').addEventListener('click', () => {
    window.memorySystem.clearHistory();
    renderStudentProfile();
  });

  tabTestCasesBtn.addEventListener('click', () => {
    tabTestCasesBtn.className = 'text-cyan-400 font-medium flex items-center space-x-1';
    tabTracerBtn.className = 'text-slate-400 hover:text-slate-200 flex items-center space-x-1';
    tabConsoleBtn.className = 'text-slate-400 hover:text-slate-200 flex items-center space-x-1';
    testResultsView.classList.remove('hidden');
    stateTracerView.classList.add('hidden');
    consoleOutputView.classList.add('hidden');
  });

  tabTracerBtn.addEventListener('click', () => {
    tabTracerBtn.className = 'text-cyan-400 font-medium flex items-center space-x-1';
    tabTestCasesBtn.className = 'text-slate-400 hover:text-slate-200 flex items-center space-x-1';
    tabConsoleBtn.className = 'text-slate-400 hover:text-slate-200 flex items-center space-x-1';
    stateTracerView.classList.remove('hidden');
    testResultsView.classList.add('hidden');
    consoleOutputView.classList.add('hidden');
  });

  tabConsoleBtn.addEventListener('click', () => {
    tabConsoleBtn.className = 'text-cyan-400 font-medium flex items-center space-x-1';
    tabTestCasesBtn.className = 'text-slate-400 hover:text-slate-200 flex items-center space-x-1';
    tabTracerBtn.className = 'text-slate-400 hover:text-slate-200 flex items-center space-x-1';
    consoleOutputView.classList.remove('hidden');
    testResultsView.classList.add('hidden');
    stateTracerView.classList.add('hidden');
  });

  btnRunTests.addEventListener('click', runChallengeTests);

  // -------------------------------------------------------------
  // Modals (Memory Bank & Settings)
  // -------------------------------------------------------------
  btnMemoryToggle.addEventListener('click', () => {
    renderMemoryModal();
    modalMemory.classList.remove('hidden');
  });

  btnCloseMemory.addEventListener('click', () => {
    modalMemory.classList.add('hidden');
  });

  btnAddMemory.addEventListener('click', () => {
    const type = newMemoryType.value;
    const text = newMemoryText.value.trim();
    if (text) {
      window.memorySystem.addManualMemory(type, text, 'application_gap');
      newMemoryText.value = '';
      renderMemoryModal();
      renderStudentProfile();
    }
  });

  btnExportMemory.addEventListener('click', () => {
    const jsonStr = window.memorySystem.exportProfile();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse_student_memory_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImportMemory.addEventListener('click', () => {
    fileImportMemory.click();
  });

  fileImportMemory.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const ok = window.memorySystem.importProfile(event.target.result);
        if (ok) {
          renderMemoryModal();
          renderStudentProfile();
          alert('Profile & cognitive memory successfully imported!');
        } else {
          alert('Invalid profile JSON file format.');
        }
      };
      reader.readAsText(file);
    }
  });

  btnResetAllMemory.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all memory, struggles, and mastery to defaults?')) {
      window.memorySystem.resetAll();
      renderMemoryModal();
      renderStudentProfile();
    }
  });

  // Settings Modal
  function openSettings() {
    const student = window.memorySystem.getStudent();
    geminiApiKeyInput.value = student.geminiApiKey || '';

    document.querySelectorAll('.persona-card').forEach(card => {
      const p = card.getAttribute('data-persona');
      if (p === student.persona) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    document.querySelectorAll('.level-select-btn').forEach(btn => {
      const lvl = btn.getAttribute('data-level');
      if (lvl === student.level) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    modalSettings.classList.remove('hidden');
  }

  btnSettings.addEventListener('click', openSettings);
  personaBadge.addEventListener('click', openSettings);
  btnCloseSettings.addEventListener('click', () => modalSettings.classList.add('hidden'));

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

  btnSaveSettings.addEventListener('click', () => {
    const activePersonaCard = document.querySelector('.persona-card.active');
    const activeLevelBtn = document.querySelector('.level-select-btn.active');
    const persona = activePersonaCard ? activePersonaCard.getAttribute('data-persona') : 'socratic';
    const level = activeLevelBtn ? activeLevelBtn.getAttribute('data-level') : 'Intermediate';
    const key = geminiApiKeyInput.value.trim();

    window.memorySystem.updateStudent({
      persona,
      level,
      geminiApiKey: key
    });

    modalSettings.classList.add('hidden');
    renderStudentProfile();
  });

  // Sound Toggle
  btnSoundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundIcon.setAttribute('data-lucide', isSoundEnabled ? 'volume-2' : 'volume-x');
    btnSoundToggle.classList.toggle('text-cyan-400', isSoundEnabled);
    if (window.lucide) window.lucide.createIcons();
  });

  // Toggle Challenge Editor Panel
  const btnToggleEditor = document.getElementById('btn-toggle-editor');
  const challengePanel = document.getElementById('challenge-panel');
  let isPanelCollapsed = false;

  btnToggleEditor.addEventListener('click', () => {
    isPanelCollapsed = !isPanelCollapsed;
    if (isPanelCollapsed) {
      challengePanel.style.width = '0px';
      challengePanel.style.overflow = 'hidden';
      document.getElementById('panel-icon').setAttribute('data-lucide', 'panel-right-open');
    } else {
      challengePanel.style.width = '';
      challengePanel.style.overflow = '';
      document.getElementById('panel-icon').setAttribute('data-lucide', 'panel-right-close');
    }
    if (window.lucide) window.lucide.createIcons();
  });

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const cleanLang = lang || 'javascript';
      return `<pre class="my-2 p-3 rounded-xl bg-[#181818] border border-dark-700 overflow-x-auto"><code class="language-${cleanLang}">${escapeHtml(code.trim())}</code></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-dark-800 text-cyan-300 font-mono text-[11px] border border-dark-700">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-slate-300">$1</em>');
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
  }

  // -------------------------------------------------------------
  // Initial Welcome Launch
  // -------------------------------------------------------------
  renderStudentProfile();

  const student = window.memorySystem.getStudent();
  const struggles = window.memorySystem.getStruggles().filter(s => !s.resolved);
  const struggleRef = struggles.length > 0 ? struggles[0] : null;

  let welcomeGreeting = '';
  if (struggleRef) {
    welcomeGreeting = `> 🧠 **Memory Recall:** *In your previous session, we noted a struggle with ${struggleRef.tag.toLowerCase()} (${struggleRef.description.toLowerCase()}). I have kept this in mind for today's exercises!*`;
  }

  const initialAnalysis = { topic: 'recursion', topicLabel: 'Recursion & Call Stack Frames', language: 'javascript' };
  const initialPerspectives = window.tutorEngine.buildExplanationPerspectives('recursion', student.level, 'javascript');

  appendTutorMessage({
    greeting: welcomeGreeting,
    personaIntro: `Welcome back, ${student.name}! I am calibrated to your **${student.level}** level as a **Socratic Mentor**.`,
    topicLabel: 'Session Initialization',
    perspectives: initialPerspectives,
    body: `Paste any snippet of code you're working on, ask a conceptual question, or click the **Adaptive Journey** buttons above to experience how tutoring evolves across sessions!
    
I will:
1. Explain the underlying mechanics using your choice of **Analogy**, **Line Walkthrough**, **Socratic Discovery**, or **Senior Dev Invariants**.
2. Perform **Cognitive Error Diagnosis** to distinguish between *Careless Slips*, *Application Gaps*, and *Knowledge Gaps*.
3. Generate a tailored challenge right in the **Challenge Arena** on the right!
4. Remember your breakthroughs and struggles to adapt future sessions.

*Try clicking "Run Code" on the right or explore the **Adaptive Journey** steps at the top!*`,
    takeaways: [
      'Interactive sandbox with automated assertion testing and State Tracer.',
      'Cognitive memory bank continuously tracks struggles and milestones.',
      'Calibrate difficulty anytime using the feedback bar.'
    ]
  });

  const initialChallenge = window.tutorEngine.generateTailoredChallenge(
    { topic: 'recursion' },
    student.level,
    { type: 'struggle_callback', text: struggleRef ? struggleRef.description : 'Base condition checks' }
  );
  window.tutorEngine.activeChallenge = initialChallenge;
  loadChallengeIntoEditor(initialChallenge);
});
