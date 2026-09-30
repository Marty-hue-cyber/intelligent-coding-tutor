# 🧠 SynapseCode — Intelligent Adaptive Coding Tutor

**SynapseCode** is an intelligent, full-featured web application that acts as a personal coding mentor. It helps users learn programming through a closed-loop pedagogical cycle:

$$\text{Ask} \longrightarrow \text{Explain} \longrightarrow \text{Practice} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt} \longrightarrow \text{Remember} \longrightarrow \text{Improve}$$

The tutor analyzes user code and questions, identifies what they are attempting to accomplish, explains concepts at their calibrated skill level, distinguishes between careless slips and knowledge gaps, generates tailored interactive challenges with automated test suites, and remembers progress across sessions.

---

## ✨ Core Pillars & Capabilities

### 1. 🔄 The 7-Phase Pedagogical Cycle
1. **💬 Ask / Input**: Submit code, ask a conceptual question, or request targeted concept practice.
2. **📖 Explain**: Multi-perspective explanations calibrated to the student's level (Beginner, Intermediate, Advanced) across 4 human mentor personas.
3. **⚡ Practice**: Targeted interactive challenge loaded in the integrated code workspace.
4. **🧪 Evaluate**: In-browser automated assertion test runner with millisecond latency tracking, console logs, and step-by-step state tracing.
5. **⚙️ Adapt**: Tri-partite cognitive error diagnosis and gradual Bayesian/Elo rating adjustment.
6. **🧠 Remember**: Persistent cognitive memory bank tracking struggles, breakthrough successes, and previous sessions.
7. **🚀 Improve**: Continuity references in future sessions bridging old concepts with new challenges.

### 2. 🔍 Tri-Partite Cognitive Error Diagnosis
Rather than penalizing all errors equally, the tutor classifies mistakes into three distinct categories:
- **Careless Mistake (Syntax/Boundary Slip)**:
  * *Pattern*: Off-by-one (`<= length`), typos in variables, missing `return` statement.
  * *Pedagogical Action*: An attentional nudge highlighting the line or invariant without lecturing basic theory.
  * *ELO Impact*: Negligible or zero adjustment (-2 ELO).
- **Application Gap (Decomposition/Invariant Slip)**:
  * *Pattern*: Understands concepts in isolation, but struggles to coordinate state across multi-step edge cases (e.g., mixing row $r$ and col $c$ in nested loops).
  * *Pedagogical Action*: A decomposition scaffold breaking the problem into visual intermediate steps.
  * *ELO Impact*: Modest adjustment (-8 ELO).
- **Knowledge Gap (Concept Foundation Missing)**:
  * *Pattern*: Unfamiliar with language constructs (e.g., unawaited Promises, infinite recursion without base cases, linear scans instead of Hash Maps).
  * *Pedagogical Action*: Re-anchors to fundamental physical analogies and first-principles mental models.
  * *ELO Impact*: Smooth re-calibration (-12 ELO) followed by foundational reinforcement.

### 3. 🎭 5 Alternate Explanation Perspectives (One-Click Toggles)
For any submitted code or topic, learners can switch between 5 perspectives:
- 💡 **Intuitive Analogy**: Real-world metaphors (Russian dolls for recursion, coat-check tickets for hash maps, restaurant buzzers for promises).
- 🔍 **Line Walkthrough**: Detailed execution trace showing call stack frames, variable state, and unwinding.
- 🦉 **Socratic Discovery**: Guiding questions prompting self-reasoning and invariant discovery.
- 🛠️ **Senior Engineer**: Production best practices, defensive coding, edge guards, and test-driven invariants.
- ⚡ **Complexity & Trade-offs**: Big-O time and space complexity analysis and alternative algorithmic approaches.

### 4. 🔀 4-Session Adaptive Journey Stepper
Experience the tutor's evolving intelligence across consecutive sessions with the interactive top journey bar:
- **Session 1 (Baseline Loop)**: Beginner explanation $\rightarrow$ single loop counter challenge.
- **Session 2 (Memory Recall)**: Tutor references Session 1 success $\rightarrow$ introduces nested 2D matrix traversal.
- **Session 3 (Struggle & Intervention)**: Learner struggles with nested indices; tutor diagnoses an Application Gap, switches to a visual grid walkthrough, and issues an intermediate boundary challenge.
- **Session 4 (Breakthrough & Advance)**: Learner overcomes struggle; tutor marks struggle Resolved in memory, increases ELO, and introduces Hash Map $O(N)$ lookups!

### 5. 🎯 Challenge Arena, State Tracer & Sandbox
- **Embedded Monaco-style Code Editor**: Auto-indenting tab, line numbering, syntax highlighting, and keyboard shortcuts (`Ctrl+Enter` to run).
- **3-Tier Progressive Hint Ladder**:
  * *Tier 1*: Conceptual nudge without giving away code.
  * *Tier 2*: Structural pseudocode and invariant clue.
  * *Tier 3*: Near-solution walkthrough.
- **State Tracer**: Step-by-step inspection of test calls, expected vs actual values, and execution duration.
- **Multi-Language Architecture**: JavaScript, Python, TypeScript, C++, Java, Go, and Rust.

### 6. 🧠 Transparent Cognitive Memory Bank
- **Inspectable & Manageable**: View all active and resolved struggles, milestones, and session records.
- **JSON Profile Export & Import**: Backup or restore learning profiles across machines.
- **Learner Agency**: Reset memory, inject personal goals, or adjust difficulty pacing anytime.

---

## 🚀 How to Run

### Option 1: Instant Local Server (PowerShell)
Open PowerShell in this directory and execute:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```
This starts an HTTP server at `http://localhost:8080` and opens your default browser!

### Option 2: Direct File Launch
Simply double-click [`index.html`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/index.html) or run in PowerShell:
```powershell
Start-Process msedge (Resolve-Path .\index.html)
```

---

## 📂 File Architecture

| File | Purpose |
|------|---------|
| [`index.html`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/index.html) | HTML5 structure with 3-panel layout, session journey bar, modals, and CDN dependencies |
| [`styles.css`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/styles.css) | Custom animations, glassmorphism, glowing memory indicators, and custom scrollbars |
| [`memory-system.js`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/memory-system.js) | Cognitive state, struggle logger, ELO calculator, session historian, and JSON persistence |
| [`tutor-engine.js`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/tutor-engine.js) | Core intelligence, concept classification, tri-partite error diagnosis, and challenge generator |
| [`sandbox-runner.js`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/sandbox-runner.js) | Safe execution sandbox for JavaScript & Python with test assertion and state tracer |
| [`app.js`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/app.js) | UI orchestration, Web Audio synthesizer, confetti effects, and event listeners |
| [`server.ps1`](file:///C:/Users/DELL/.gemini/antigravity/scratch/intelligent-coding-tutor/server.ps1) | Lightweight Windows PowerShell HTTP server |
