/**
 * SynapseCode — Intelligent Pedagogical Tutor Engine
 * Features:
 *  - Deep semantic code analysis & multi-language topic detection
 *  - Tri-partite cognitive error diagnosis (Careless Mistake vs Application Gap vs Knowledge Gap)
 *  - Multi-perspective explanations (Analogy, Code Walkthrough, Socratic, Senior Dev, Big-O)
 *  - Persona styling (Socratic, Senior Dev, Visual Intuitive, Speed-Run Coach)
 *  - Memory continuity: References past struggles, triumphs, and previous sessions
 *  - Procedural & Multi-Tier Challenge Catalog with automated test suites
 *  - Dynamic Difficulty Adjustment (DDA) with gradual Bayesian/Elo calibration
 *  - 4-Session Pedagogical Journey Progression Engine
 *  - Optional Gemini 2.0 API integration with autonomous offline brain fallback
 */

class IntelligentTutorEngine {
  constructor() {
    this.activeChallenge = null;
    this.revealedHintsCount = 0;
    this.currentAttemptCount = 0;
    this.lastEvaluationOutcome = null;
  }

  /**
   * Main entry point when user submits code, asks a question, or requests a challenge
   */
  async processUserInput(userInput, mode = 'explain', language = 'javascript') {
    const student = window.memorySystem.getStudent();
    const studentLevel = student.level || 'Intermediate';
    const persona = student.persona || 'socratic';

    // 1. Analyze code/question structure and detect topic & anti-patterns
    const analysis = this.analyzeCodeOrQuestion(userInput, language);

    // 2. Query cognitive memory for continuity (past struggles, triumphs, previous sessions)
    const relevantMemories = window.memorySystem.findRelevantMemories(userInput, analysis.topic);
    const continuityNote = window.memorySystem.generateMemoryContinuityNote(relevantMemories);

    // 3. Generate tailored multi-perspective explanation
    let explanation;
    if (student.geminiApiKey) {
      try {
        explanation = await this.queryGeminiAI(userInput, analysis, student, persona, continuityNote, mode);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to offline autonomous brain:', err);
        explanation = this.generateAutonomousExplanation(userInput, analysis, studentLevel, persona, continuityNote, mode);
      }
    } else {
      explanation = this.generateAutonomousExplanation(userInput, analysis, studentLevel, persona, continuityNote, mode);
    }

    // 4. Generate or select tailored challenge matching topic, level, and past struggles
    const challenge = this.generateTailoredChallenge(analysis, studentLevel, continuityNote, language);
    this.activeChallenge = challenge;
    this.revealedHintsCount = 0;
    this.currentAttemptCount = 0;
    this.lastEvaluationOutcome = null;

    return {
      analysis,
      continuityNote,
      explanation,
      challenge
    };
  }

  /**
   * Semantic code/question parsing and topic detection
   */
  analyzeCodeOrQuestion(input, defaultLang = 'javascript') {
    const lower = input.toLowerCase();

    let topic = 'debugging_logic';
    let topicLabel = 'Boundary & Logic Debugging';
    let detectedBug = null;
    let potentialCognitiveGap = 'careless_mistake';

    // 1. Recursion detection
    if (lower.includes('recur') || lower.includes('fibonacci') || lower.includes('factorial') || /function\s+([a-zA-Z0-9_]+)\b.*?\1\s*\(/.test(input) || /def\s+([a-zA-Z0-9_]+)\b.*?\1\s*\(/.test(input)) {
      topic = 'recursion';
      topicLabel = 'Recursion & Call Stack Frames';
      if (!lower.includes('if') || (!lower.includes('return') && !lower.includes('base'))) {
        detectedBug = {
          type: 'missing_base_case',
          title: 'Missing or Incomplete Base Case',
          detail: 'No termination guard detected. The function will recurse infinitely until the execution call stack overflows (RangeError).'
        };
        potentialCognitiveGap = 'application_gap';
      }
    } 
    // 2. Async / Promises
    else if (lower.includes('async') || lower.includes('await') || lower.includes('promise') || lower.includes('.then(') || lower.includes('fetch(')) {
      topic = 'async_promises';
      topicLabel = 'Asynchronous Concurrency & Promises';
      if (lower.includes('async') && !lower.includes('await') && !lower.includes('.then')) {
        detectedBug = {
          type: 'unawaited_call',
          title: 'Unawaited Asynchronous Operation',
          detail: 'Invoking an async function without `await` immediately returns a pending Promise reference instead of the resolved data.'
        };
        potentialCognitiveGap = 'knowledge_gap';
      }
    } 
    // 3. Hash Maps & Arrays
    else if (lower.includes('two sum') || lower.includes('hash') || lower.includes('map') || lower.includes('dict') || lower.includes('set(') || lower.includes('frequency') || lower.includes('lookup')) {
      topic = 'arrays_hashing';
      topicLabel = 'Arrays & Hash Maps (O(1) Lookups)';
    } 
    // 4. Nested loops
    else if ((lower.match(/for\b/g) || []).length >= 2 || (lower.match(/while\b/g) || []).length >= 2 || lower.includes('nested') || lower.includes('matrix') || lower.includes('grid')) {
      topic = 'debugging_logic';
      topicLabel = 'Nested Loops & Coordinate Boundaries';
      potentialCognitiveGap = 'application_gap';
    }
    // 5. Off-by-one array bounds
    else if ((lower.includes('<=') && (lower.includes('.length') || lower.includes('len('))) || lower.includes('off-by-one') || lower.includes('indexerror') || lower.includes('undefined')) {
      topic = 'debugging_logic';
      topicLabel = 'Array Index Boundary Invariants';
      detectedBug = {
        type: 'off_by_one_bound',
        title: 'Off-By-One Index Violation',
        detail: 'Using `<= array.length` accesses index array.length, which is out of bounds for 0-indexed sequences.'
      };
      potentialCognitiveGap = 'careless_mistake';
    } 
    // 6. Generic loops & iteration
    else if (lower.includes('for') || lower.includes('while') || lower.includes('loop') || lower.includes('iterate')) {
      topic = 'debugging_logic';
      topicLabel = 'Loop Mechanics & Termination Invariants';
    }

    // Determine language
    let lang = defaultLang;
    if (input.includes('def ') || input.includes('elif ') || input.includes('print(') || input.includes('None') || input.includes('import sys')) {
      lang = 'python';
    } else if (input.includes('#include') || input.includes('std::') || input.includes('cout <<') || input.includes('vector<')) {
      lang = 'cpp';
    } else if (input.includes('public class') || input.includes('System.out.println') || input.includes('public static void')) {
      lang = 'java';
    } else if (input.includes('interface ') || input.includes(': string') || input.includes(': number')) {
      lang = 'typescript';
    } else if (input.includes('const ') || input.includes('let ') || input.includes('console.log') || input.includes('===') || input.includes('=>')) {
      lang = 'javascript';
    }

    return {
      topic,
      topicLabel,
      detectedBug,
      potentialCognitiveGap,
      language: lang,
      isCode: input.includes('(') || input.includes('{') || input.includes('def ') || input.includes('function') || input.includes('for ')
    };
  }

  /**
   * Generates a rich, multi-perspective pedagogical explanation
   */
  generateAutonomousExplanation(input, analysis, level, persona, continuityNote, mode) {
    let greeting = '';

    if (continuityNote) {
      if (continuityNote.type === 'struggle_callback') {
        greeting = `> 🧠 **Memory Recall:** *${continuityNote.text}*\n\n`;
      } else if (continuityNote.type === 'session_callback') {
        greeting = `> 🔁 **Session Continuity:** *${continuityNote.text}*\n\n`;
      } else {
        greeting = `> 🌟 **Milestone Recall:** *${continuityNote.text}*\n\n`;
      }
    }

    // Persona-specific tone prefixes
    const personaIntros = {
      socratic: "Let's unpack this from first principles. Before tweaking syntax, let's ask: *what is the core invariant here?*",
      senior_dev: "In production engineering, this pattern is a classic trap. Here is how we break it down defensively with test coverage in mind.",
      visual: "Imagine physical gears moving in memory. Let's trace how the state changes step-by-step.",
      speedrun: "Direct breakdown: Pattern identification, complexity bottlenecks, and the optimal interview-grade strategy."
    };

    const personaIntro = personaIntros[persona] || personaIntros.socratic;

    // Build the 5 alternate explanation perspectives
    const perspectives = this.buildExplanationPerspectives(analysis.topic, level, analysis.language);

    return {
      greeting,
      personaIntro,
      topicLabel: analysis.topicLabel,
      body: perspectives.analogy, // default active view
      perspectives,
      takeaways: perspectives.takeaways,
      detectedBug: analysis.detectedBug,
      complexity: perspectives.complexity
    };
  }

  /**
   * Constructs 5 comprehensive pedagogical perspectives for each core topic:
   * 1. Analogy (Intuitive Physical Metaphor)
   * 2. Walkthrough (Line-by-line state trace)
   * 3. Socratic (Guiding discovery questions)
   * 4. Senior Dev (Production best practices & edge cases)
   * 5. Complexity (Big-O analysis & alternatives)
   */
  buildExplanationPerspectives(topic, level, lang) {
    switch (topic) {
      case 'recursion':
        return {
          analogy: `
### 💡 The Russian Nesting Dolls Metaphor

Recursion is simply a function delegating a smaller version of the exact same problem to a twin of itself.

Think of it like nested Russian nesting dolls:
1. **The Base Case (The Smallest Solid Doll):** The innermost doll that does not open. This is where the function stops. Without this, the computer keeps opening dolls forever until it crashes with **RangeError: Maximum call stack size exceeded**.
2. **The Recursive Step (Opening One Shell):** Taking off one layer and running the exact same operation on the smaller doll inside.

\`\`\`${lang}
function countdown(n) {
  // 1. BASE CASE GUARD: Where do we stop?
  if (n <= 0) {
    console.log("Liftoff! 🚀");
    return;
  }

  // 2. WORK: Current step
  console.log(n);

  // 3. RECURSIVE STEP: Move strictly closer to the base case!
  countdown(n - 1);
}
\`\`\`
Notice how \`n - 1\` guarantees we converge strictly toward \`n <= 0\`. That is your mathematical tether!
`,
          walkthrough: `
### 🔍 Line-by-Line Execution Trace: \`factorial(3)\`

Let's inspect what happens to the Call Stack in memory as \`factorial(3)\` runs:

1. **Call Frame 1**: \`factorial(3)\` arrives on top of the stack.
   - Guard check: Is $3 \le 1$? No.
   - Evaluates: $3 \times \text{factorial}(2)$. It **pauses** waiting for the return value.
2. **Call Frame 2**: \`factorial(2)\` is pushed on top.
   - Guard check: Is $2 \le 1$? No.
   - Evaluates: $2 \times \text{factorial}(1)$. It **pauses** waiting for the return value.
3. **Call Frame 3**: \`factorial(1)\` is pushed on top.
   - Guard check: Is $1 \le 1$? **YES (Base Case Reached!)**.
   - Returns **\`1\`** immediately and pops off the stack.
4. **Unwinding Frame 2**: Frame 2 receives \`1\`, calculates $2 \times 1 = \mathbf{2}$, and pops off.
5. **Unwinding Frame 1**: Frame 1 receives \`2\`, calculates $3 \times 2 = \mathbf{6}$, and pops off.

Final result returned to caller: **\`6\`**. Notice the distinct *winding* and *unwinding* phases!
`,
          socratic: `
### 🦉 Socratic Discovery Inquiries

To reason about any recursive problem, ask yourself these 3 grounding questions before writing code:

1. **What is the simplest possible input where the answer is completely obvious without any math?**
   *(For strings, it is an empty string. For numbers, it is $0$ or $1$. That is your Base Case!)*
2. **How does calling the function on a smaller input help build the answer for the current input?**
   *(e.g., if you already knew $(n-1)!$, how do you get $n!$? Multiply by $n$.)*
3. **Does every single execution branch strictly guarantee convergence toward the base case?**
   *(If $n$ is negative, will \`n - 1\` ever reach 0? No! That is why we guard \`n <= 1\` rather than just \`n === 1\`.)*
`,
          seniordev: `
### 🛠️ Senior Engineer: Production Invariants & Stack Safety

In mission-critical production systems:
- **Call Stack Space Risk:** Every recursive invocation consumes a stack frame ($O(D)$ space). If recursion depth exceeds $\sim 10,000$ in Node.js or Python, a fatal stack overflow crash occurs.
- **Defensive Boundary Guards:** Always validate input bounds at the threshold. Guard against \`n < 0\` or \`null\` pointers as the very first line before recursing.
- **Iteration Transformation:** When recursion depth is unbounded ($O(N)$ on user input), refactor into an iterative loop with an explicit array stack, or verify whether Tail Call Optimization (TCO) is supported by your target engine.
`,
          complexity: {
            time: 'O(N) for linear recursion; O(2^N) for unmemoized branching (like naive Fibonacci)',
            space: 'O(N) auxiliary memory consumed by execution call stack frames',
            tradeoff: 'Elegant mathematical brevity vs risk of stack overflow on large inputs.'
          },
          takeaways: [
            'Every recursive call must move strictly closer to the base case.',
            'Always state the base termination condition as the very first line.',
            'Think of the call stack as cafeteria trays: Last In, First Out (LIFO).'
          ]
        };

      case 'arrays_hashing':
        return {
          analogy: `
### 💡 The Coat Check Ticket Metaphor

Imagine a cloakroom with 10,000 coats:
- **Brute Force Nested Loop ($O(N^2)$):** You inspect every single coat, one by one, comparing every pair until you find a match. This takes forever as the coat rack grows.
- **Hash Map ($O(1)$ lookup):** You get a numbered coat ticket. You hand over ticket #42, and the attendant walks directly to cubby #42 in a split second.

In **Two Sum**:
For every number \`num\`, we calculate its partner: \`complement = target - num\`.
If the complement is already in our coat check (the Hash Map), we have our answer immediately in **a single pass**!
`,
          walkthrough: `
### 🔍 Line-by-Line State Walkthrough: Two Sum with Hash Map

Given \`nums = [2, 7, 11, 15]\`, \`target = 9\`:

1. **Initialize Map**: \`seen = new Map()\` (Empty).
2. **Iteration $i = 0$**, \`num = 2\`:
   - \`complement = 9 - 2 = 7\`.
   - Is \`7\` in \`seen\`? No.
   - Record current: \`seen.set(2, 0)\`. State: \`{ 2 => 0 }\`.
3. **Iteration $i = 1$**, \`num = 7\`:
   - \`complement = 9 - 7 = 2\`.
   - Is \`2\` in \`seen\`? **YES! Index is 0!**
   - We immediately return \`[0, 1]\`! Loop terminates in just 2 steps!
`,
          socratic: `
### 🦉 Socratic Guiding Questions

1. **Why do nested loops become unacceptable for arrays of 100,000 elements?**
   *(Because $100,000^2 = 10,000,000,000$ operations—freezing the browser for seconds!)*
2. **When inspecting number $x$, what exact value are we looking for to reach $T$?**
   *(The complement $T - x$.)*
3. **Can we store numbers we have already passed so future numbers can find them in $O(1)$ time?**
   *(Yes! That is the core superpower of Hash Tables.)*
`,
          seniordev: `
### 🛠️ Senior Engineer: Production Considerations

- **Collision Resolution & Average vs Worst Case:** Hash maps provide $O(1)$ average time, but malicious or degenerate inputs can trigger hash collisions degrading to $O(N)$ bucket traversal.
- **Memory Footprint:** In JavaScript, \`new Map()\` has substantial memory overhead compared to typed arrays. For memory-constrained embedded systems, sorting the array first and using two-pointers ($O(N \log N)$ time, $O(1)$ space) may be preferred.
`,
          complexity: {
            time: 'O(N) single linear pass',
            space: 'O(N) to store up to N elements in the Hash Map',
            tradeoff: 'Trading space for astronomical speed gains over O(N^2) brute force.'
          },
          takeaways: [
            'Hash tables trade space (O(N)) for instantaneous O(1) average lookups.',
            'Complement formula: complement = target - currentNumber.',
            'Single-pass map construction eliminates quadratic nested loops.'
          ]
        };

      case 'async_promises':
        return {
          analogy: `
### 💡 The Restaurant Buzzer Metaphor

Imagine placing an order at a busy burger restaurant:
- The cashier takes your payment and hands you a **plastic buzzer token** (a **Promise**).
- You do NOT have the burger yet, but you have a guarantee that the buzzer will vibrate when the food is ready.
- **\`await\`** is you waiting comfortably until the buzzer buzzes, then retrieving the warm tray.
- If you forget to **\`await\`**, it's like trying to eat the hard plastic buzzer token!
`,
          walkthrough: `
### 🔍 Line-by-Line Async Flow

\`\`\`javascript
async function fetchUserDashboard(userId) {
  try {
    // 1. await pauses this local function and yields thread to Event Loop
    const res = await fetch('/api/user/' + userId);
    
    // 2. Resumes when response headers arrive, pauses again for JSON stream
    const data = await res.json();
    
    return { ok: true, profile: data };
  } catch (err) {
    // 3. Network crashes or invalid JSON jump cleanly here!
    return { ok: false, error: err.message };
  }
}
\`\`\`
`,
          socratic: `
### 🦉 Socratic Discovery Inquiries

1. **What does calling an \`async\` function *always* return immediately?**
   *(A Promise object!)*
2. **If you assign \`const x = fetchUser()\`, what is the type of \`x\`?**
   *(It is \`Promise { <pending> }\`, not the user data!)*
3. **How does the JavaScript runtime keep the UI responsive while waiting for network requests?**
   *(By parking the paused task on the Microtask Queue and letting the Event Loop render frames!)*
`,
          seniordev: `
### 🛠️ Senior Engineer: Error Handling & Concurrency

- **Always Wrap in \`try/catch\`**: Unhandled promise rejections crash Node processes in modern versions.
- **Avoid Waterfall Bottlenecks**: If fetching multiple independent resources, do NOT do \`await a(); await b();\`. Use \`await Promise.all([a(), b()])\` to fire them concurrently!
`,
          complexity: {
            time: 'Bound by I/O and network latency',
            space: 'O(1) active execution state allocated on microtask queue',
            tradeoff: 'Non-blocking concurrency without multi-threaded lock contention.'
          },
          takeaways: [
            'A Promise represents a future value ticket, not the value itself.',
            'Use await to pause local execution until the asynchronous ticket resolves.',
            'Use Promise.all() for independent concurrent requests to avoid waterfalls.'
          ]
        };

      default: // debugging_logic & loops
        return {
          analogy: `
### 💡 The Hotel Room Keycard Invariant

Think of an array of 5 elements like a hotel corridor with 5 rooms:
- In computer science, we start counting at room **0**.
- So the rooms are numbered: **0, 1, 2, 3, 4**.
- Notice room **5 does NOT exist**!
- If your loop condition is \`i <= array.length\`, you are trying to swipe your keycard on room 5. The hotel manager throws an error (**undefined** or **IndexOutOfBounds**)!
`,
          walkthrough: `
### 🔍 Line-by-Line Boundary Walkthrough

\`\`\`javascript
function safeFindMax(numbers) {
  // 1. DEFENSIVE GUARD: Handle empty or null inputs
  if (!numbers || numbers.length === 0) return null;

  // 2. INITIALIZE INVARIANT: Best candidate so far
  let max = numbers[0];

  // 3. STRICT BOUND: Note i < numbers.length (NOT <=)
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
      max = numbers[i];
    }
  }

  return max;
}
\`\`\`
`,
          socratic: `
### 🦉 Socratic Guiding Questions

1. **What is the index of the very last element in an array of length $N$?**
   *(It is always $N - 1$, because indices are 0-based.)*
2. **What should your function return if someone passes \`null\` or an empty array \`[]\`?**
   *(A defensive fallback like \`null\` or throw a descriptive error, rather than crashing on \`arr[0]\`!)*
3. **In nested loops \`for (let i ...)\` and \`for (let j ...)\`, what happens if you accidentally reuse \`i\` inside the inner loop?**
   *(The inner loop overwrites the outer loop counter, causing an infinite loop or skipped rows!)*
`,
          seniordev: `
### 🛠️ Senior Engineer: Boundary Invariants

- **Loop Invariant Verification**: Before every iteration, what condition must hold true? (e.g. \`max\` contains the largest element seen in \`arr[0...i-1]\`).
- **Defensive Guard Clauses**: Fail fast at the top of the function to keep the happy path unindented and readable.
`,
          complexity: {
            time: 'O(N) linear single-pass',
            space: 'O(1) constant auxiliary space',
            tradeoff: 'Zero memory overhead with optimal linear scanning.'
          },
          takeaways: [
            'Zero-based indexing means valid indices run strictly from 0 to length - 1.',
            'Always check if input is null or empty before reading index 0.',
            'In nested loops, rigorously separate outer index (i) and inner index (j).'
          ]
        };
    }
  }

  /**
   * Tri-Partite Cognitive Error Diagnosis
   * Analyzes student code and test results to distinguish:
   * 1. Careless Mistake (syntax slip, off-by-one, inverted comparison)
   * 2. Application Gap (understands concepts, but struggles to coordinate state/invariants)
   * 3. Knowledge Gap (lacks the foundational concept entirely)
   */
  classifyMistake(userCode, testResults, challenge) {
    const code = (userCode || '').toLowerCase();
    const failingTests = (testResults || []).filter(r => !r.passed);

    // Default attribution
    let category = 'application_gap';
    let title = 'Application Nuance Identified';
    let explanation = 'Your code shows familiarity with the required syntax, but coordinating state across boundary test cases needs refinement.';
    let suggestedAction = 'Review the edge cases in failing tests (e.g. negative numbers, 0, or empty arrays).';
    let eloAdjustment = -8;

    // Check for Careless Mistakes
    const hasOffByOne = code.includes('<=') && (code.includes('.length') || code.includes('len('));
    const missingReturn = !code.includes('return');
    const invertedComp = code.includes(' > ') && challenge?.topic === 'recursion' && code.includes('n <');

    if (hasOffByOne || (missingReturn && code.includes('function'))) {
      category = 'careless_mistake';
      title = 'Careless Slip (Syntax/Boundary Guard)';
      explanation = hasOffByOne 
        ? 'The underlying algorithmic concept is solid, but you have an off-by-one `<=` boundary slip accessing past array length.'
        : 'You implemented the logic cleanly, but forgot the `return` statement to send the computed value back!';
      suggestedAction = 'Check line-by-line syntax and boundary operators. No major conceptual rework needed!';
      eloAdjustment = -2; // Minimal penalty for careless slips!
    }
    // Check for Knowledge Gaps
    else if (challenge?.topic === 'recursion' && !code.includes(challenge.starterCode.split('(')[0].split('function ')[1]?.trim())) {
      category = 'knowledge_gap';
      title = 'Knowledge Gap (Recursion Foundation)';
      explanation = 'The solution does not call itself recursively. You may be unfamiliar with how recursive call stacks work.';
      suggestedAction = 'Switch to the "Analogy" tab in the tutor explanation to build the Russian nesting doll mental model first.';
      eloAdjustment = -12;
    } else if (challenge?.topic === 'arrays_hashing' && !code.includes('map') && !code.includes('set') && !code.includes('{}') && !code.includes('dict')) {
      category = 'knowledge_gap';
      title = 'Knowledge Gap (Hash Map Lookup)';
      explanation = 'The solution appears to use nested loops or linear scanning rather than a Hash Map/Set for O(1) lookups.';
      suggestedAction = 'Review how `new Map()` or `{}` stores key-value pairs for instantaneous lookup.';
      eloAdjustment = -12;
    } else if (challenge?.topic === 'async_promises' && !code.includes('await') && !code.includes('.then')) {
      category = 'knowledge_gap';
      title = 'Knowledge Gap (Asynchronous Execution)';
      explanation = 'The code does not await asynchronous execution, which causes promises to remain unsettled.';
      suggestedAction = 'Remember that async operations require `await` to pause execution until data resolves.';
      eloAdjustment = -12;
    }

    return {
      category,
      title,
      explanation,
      suggestedAction,
      eloAdjustment,
      failingTestsCount: failingTests.length,
      totalTestsCount: testResults.length
    };
  }

  /**
   * Evaluates challenge solution and executes Dynamic Difficulty Adjustment
   */
  evaluateChallengeSolution(sandboxResult, userCode) {
    this.currentAttemptCount++;
    const student = window.memorySystem.getStudent();
    const challenge = this.activeChallenge;

    if (!challenge) {
      return { status: 'no_active_challenge' };
    }

    if (sandboxResult.allPassed) {
      // SUCCESS!
      const firstTry = this.currentAttemptCount === 1 && this.revealedHintsCount === 0;
      const eloGain = firstTry 
        ? challenge.xp + 10 
        : Math.max(8, challenge.xp - (this.revealedHintsCount * 4));

      // 1. Update ELO & Mastery
      window.memorySystem.updateElo(eloGain);
      window.memorySystem.updateMastery(challenge.topic, 10);

      // 2. Resolve active struggle if applicable
      const struggles = window.memorySystem.getStruggles();
      const matchedStruggle = struggles.find(s => s.topic === challenge.topic && !s.resolved);
      if (matchedStruggle) {
        window.memorySystem.resolveStruggle(matchedStruggle.id);
      }

      // 3. Record success in memory
      window.memorySystem.recordSuccess(
        challenge.topic,
        challenge.title,
        `Solved "${challenge.title}" (${challenge.difficulty}) on attempt #${this.currentAttemptCount} with ${this.revealedHintsCount} hints.`
      );

      // 4. Record session history
      window.memorySystem.recordSession({
        topic: challenge.topic,
        summary: `Mastered challenge "${challenge.title}" cleanly.`,
        challengeTitle: challenge.title,
        result: firstTry ? 'passed_first_try' : 'passed_with_scaffolding',
        eloChange: eloGain,
        attempts: this.currentAttemptCount,
        hintsUsed: this.revealedHintsCount
      });

      this.lastEvaluationOutcome = {
        status: 'passed',
        firstTry,
        eloGain,
        newElo: student.elo
      };

      return {
        status: 'passed',
        firstTry,
        eloGain,
        newElo: student.elo,
        message: firstTry 
          ? `🎉 Outstanding, ${student.name}! You solved this on the very first try without any hints! Your mastery has leveled up.` 
          : `👏 Well done! You worked through the edge cases and all ${sandboxResult.passedCount} test cases are passing!`
      };
    } else {
      // Test Failures: Execute Tri-Partite Diagnosis
      const diagnosis = this.classifyMistake(userCode, sandboxResult.results, challenge);

      // Only update struggle in memory if attempted more than once to prevent transient noise
      if (this.currentAttemptCount >= 2) {
        window.memorySystem.recordStruggle(
          challenge.topic,
          challenge.title,
          `Encountered difficulties with ${challenge.title}: ${diagnosis.explanation}`,
          diagnosis.category,
          diagnosis.suggestedAction
        );
      }

      // Gradual ELO update (does not punish mistakes drastically)
      window.memorySystem.updateElo(diagnosis.eloAdjustment);

      this.lastEvaluationOutcome = {
        status: 'failed',
        diagnosis
      };

      return {
        status: 'failed',
        attemptCount: this.currentAttemptCount,
        diagnosis,
        hintsAvailable: challenge.hints.length - this.revealedHintsCount,
        message: `Some test cases didn't pass yet. Take a look at the diagnostic card below.`
      };
    }
  }

  /**
   * Unlock next progressive hint from the 3-Tier Ladder
   */
  getNextHint() {
    if (!this.activeChallenge || !this.activeChallenge.hints) return null;
    if (this.revealedHintsCount >= this.activeChallenge.hints.length) {
      return { hint: 'All hints for this challenge have been unlocked!', isLast: true, index: this.revealedHintsCount };
    }
    const hint = this.activeChallenge.hints[this.revealedHintsCount];
    this.revealedHintsCount++;
    return {
      hint,
      index: this.revealedHintsCount,
      total: this.activeChallenge.hints.length,
      isLast: this.revealedHintsCount >= this.activeChallenge.hints.length
    };
  }

  /**
   * Manual difficulty adjustment feedback
   */
  adjustDifficultyFeedback(feedbackType) {
    if (feedbackType === 'too_easy') {
      window.memorySystem.updateElo(+30);
      return 'Pace calibrated! Ramping up algorithmic depth and introducing complex data structure constraints.';
    } else if (feedbackType === 'too_hard') {
      window.memorySystem.updateElo(-15);
      return 'Pace calibrated! Providing more granular mental models and smaller step-by-step challenges.';
    } else {
      return 'Calibrated to your optimal cognitive flow zone!';
    }
  }

  /**
   * Comprehensive Multi-Tier Challenge Catalog
   */
  generateTailoredChallenge(analysis, level, continuityNote, language = 'javascript') {
    const topic = analysis.topic;

    const challengePool = {
      // RECURSION CHALLENGES
      recursion: [
        {
          id: 'rec_factorial_guard',
          title: 'Guarded Recursive Factorial',
          topic: 'recursion',
          difficulty: 'Beginner',
          xp: 25,
          levelRequired: 'Beginner',
          description: `Write a recursive function \`factorial(n)\` that computes $n!$.
**Crucial Invariant Requirements:**
- Handle the base cases: \`factorial(0)\` and \`factorial(1)\` must return \`1\`.
- For negative numbers (\`n < 0\`), return \`null\`.
- Strictly converge \`n\` towards the base condition so the call stack never overflows!`,
          memoryNote: continuityNote?.type === 'struggle_callback' 
            ? 'Tailored to reinforce base condition guards so your recursion terminates cleanly without exceeding call stack limits!'
            : 'Focuses on base case invariants and input boundaries.',
          starterCode: `function factorial(n) {
  // 1. Guard check against negative numbers:
  if (n < 0) return null;

  // 2. Base case: where do we stop?
  if (n <= 1) return 1;

  // 3. Recursive step:
  return n * factorial(n - 1);
}
`,
          testCases: [
            { name: 'Factorial of 0 is 1', call: 'factorial(0)', expected: 1 },
            { name: 'Factorial of 1 is 1', call: 'factorial(1)', expected: 1 },
            { name: 'Factorial of 5 is 120', call: 'factorial(5)', expected: 120 },
            { name: 'Factorial of negative returns null', call: 'factorial(-4)', expected: null }
          ],
          hints: [
            'Tier 1 (Nudge): Always check `if (n < 0) return null;` as a defensive boundary check.',
            'Tier 2 (Structural): What is the base case? When `n === 0` or `n === 1`, the answer is 1.',
            'Tier 3 (Walkthrough): For the recursive step, return `n * factorial(n - 1)`. Notice how `n - 1` gets strictly closer to 1!'
          ]
        },
        {
          id: 'rec_palindrome',
          title: 'Recursive Palindrome Check',
          topic: 'recursion',
          difficulty: 'Intermediate',
          xp: 35,
          levelRequired: 'Intermediate',
          description: `Write a recursive function \`isPalindrome(str)\` that returns \`true\` if a string reads the same forwards and backwards, and \`false\` otherwise.
**Requirements:**
- Base case: If string length is 0 or 1, return \`true\`.
- If first and last characters mismatch, return \`false\`.
- Otherwise, recurse on the inner substring: \`str.slice(1, -1)\`.`,
          memoryNote: 'Focuses on string slice reduction and symmetrical termination.',
          starterCode: `function isPalindrome(str) {
  // 1. Base case: strings of length 0 or 1 are palindromes
  if (str.length <= 1) return true;

  // 2. Character mismatch check
  if (str[0] !== str[str.length - 1]) return false;

  // 3. Recurse on inner substring
  return isPalindrome(str.slice(1, -1));
}
`,
          testCases: [
            { name: 'racecar is a palindrome', call: 'isPalindrome("racecar")', expected: true },
            { name: 'hello is not a palindrome', call: 'isPalindrome("hello")', expected: false },
            { name: 'empty string is a palindrome', call: 'isPalindrome("")', expected: true },
            { name: 'single letter "x" is a palindrome', call: 'isPalindrome("x")', expected: true }
          ],
          hints: [
            'Tier 1 (Nudge): If the string has 0 or 1 letters, it is trivially a palindrome!',
            'Tier 2 (Structural): Compare `str[0]` with `str[str.length - 1]`. If unequal, return false.',
            'Tier 3 (Walkthrough): Return `isPalindrome(str.slice(1, -1))` to check the remaining inner substring.'
          ]
        }
      ],

      // ARRAYS & HASHING CHALLENGES
      arrays_hashing: [
        {
          id: 'hash_twosum_challenge',
          title: 'O(N) Two Sum Target Finder',
          topic: 'arrays_hashing',
          difficulty: 'Intermediate',
          xp: 40,
          levelRequired: 'Intermediate',
          description: `Given an array of integers \`nums\` and an integer \`target\`, return the pair of indices \`[index1, index2]\` whose numbers add up to \`target\`.
**Performance Challenge:** Must achieve linear $O(N)$ time complexity using a Hash Map (\`new Map()\`), without nested loops!`,
          memoryNote: 'Practices instant dictionary key lookups to avoid $O(N^2)$ quadratic slowdowns.',
          starterCode: `function twoSum(nums, target) {
  const map = new Map(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`,
          testCases: [
            { name: 'Finds pair [2, 7] for target 9', call: 'twoSum([2, 7, 11, 15], 9)', expected: [0, 1] },
            { name: 'Finds pair [3, 2, 4] for target 6', call: 'twoSum([3, 2, 4], 6)', expected: [1, 2] },
            { name: 'Finds duplicate pair [3, 3] for target 6', call: 'twoSum([3, 3], 6)', expected: [0, 1] }
          ],
          hints: [
            'Tier 1 (Nudge): Inside the single loop, compute `complement = target - nums[i]`.',
            'Tier 2 (Structural): Check if `map.has(complement)`. If yes, return `[map.get(complement), i]`.',
            'Tier 3 (Walkthrough): If not found, store `map.set(nums[i], i)` so future numbers can find this one.'
          ]
        },
        {
          id: 'array_filter_unique',
          title: 'De-duplicate Array Preserving Order',
          topic: 'arrays_hashing',
          difficulty: 'Beginner',
          xp: 20,
          levelRequired: 'Beginner',
          description: `Write a function \`removeDuplicates(arr)\` that returns a new array with all duplicates removed, strictly preserving the original appearance order.`,
          memoryNote: 'Reinforces Set / Map containment checks.',
          starterCode: `function removeDuplicates(arr) {
  const seen = new Set();
  const result = [];

  for (const item of arr) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}
`,
          testCases: [
            { name: 'Removes duplicates from numbers', call: 'removeDuplicates([1, 2, 2, 3, 4, 4, 5])', expected: [1, 2, 3, 4, 5] },
            { name: 'Handles strings', call: 'removeDuplicates(["a", "b", "a", "c"])', expected: ['a', 'b', 'c'] },
            { name: 'Handles empty array', call: 'removeDuplicates([])', expected: [] }
          ],
          hints: [
            'Tier 1 (Nudge): A JavaScript `Set` provides $O(1)$ fast containment checks with `.has()`.',
            'Tier 2 (Structural): Alternatively, `return [...new Set(arr)];` accomplishes this in one line in modern JS!'
          ]
        }
      ],

      // LOOPS & BOUNDARY LOGIC CHALLENGES
      debugging_logic: [
        {
          id: 'loop_counter_basic',
          title: 'Session 1: Single Loop Counter',
          topic: 'debugging_logic',
          difficulty: 'Beginner',
          xp: 20,
          levelRequired: 'Beginner',
          description: `Write a function \`countUp(target)\` that returns an array of numbers from \`1\` up to \`target\` inclusive.
- If \`target <= 0\`, return an empty array \`[]\`.
- Keep the loop counter bounded strictly!`,
          memoryNote: 'Establishes initial baseline understanding of iteration bounds.',
          starterCode: `function countUp(target) {
  if (target <= 0) return [];
  const result = [];
  for (let i = 1; i <= target; i++) {
    result.push(i);
  }
  return result;
}
`,
          testCases: [
            { name: 'Counts up to 5', call: 'countUp(5)', expected: [1, 2, 3, 4, 5] },
            { name: 'Handles target 1', call: 'countUp(1)', expected: [1] },
            { name: 'Handles target 0', call: 'countUp(0)', expected: [] },
            { name: 'Handles negative target', call: 'countUp(-3)', expected: [] }
          ],
          hints: [
            'Tier 1 (Nudge): Check `if (target <= 0) return [];` first.',
            'Tier 2 (Structural): Loop from `let i = 1; i <= target; i++` and push into an array.'
          ]
        },
        {
          id: 'matrix_grid_nested',
          title: 'Session 2/3: 2D Matrix Coordinate Scanner',
          topic: 'debugging_logic',
          difficulty: 'Intermediate',
          xp: 35,
          levelRequired: 'Intermediate',
          description: `Given an $M \\times N$ 2D matrix (array of arrays), write \`findCoordinate(matrix, target)\` that searches for \`target\` and returns its coordinates \`[row, col]\`.
- If \`target\` is not found, return \`null\`.
- **Warning:** Carefully keep outer row index \`r\` and inner column index \`c\` cleanly segregated!`,
          memoryNote: 'Tests nested loop row/column boundary invariants.',
          starterCode: `function findCoordinate(matrix, target) {
  if (!matrix || matrix.length === 0) return null;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === target) {
        return [r, c];
      }
    }
  }
  return null;
}
`,
          testCases: [
            { name: 'Finds 5 in 3x3 matrix', call: 'findCoordinate([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 5)', expected: [1, 1] },
            { name: 'Finds top-left item', call: 'findCoordinate([[42, 10], [99, 88]], 42)', expected: [0, 0] },
            { name: 'Returns null if not found', call: 'findCoordinate([[1, 2], [3, 4]], 999)', expected: null }
          ],
          hints: [
            'Tier 1 (Nudge): Use `matrix.length` for the outer rows, and `matrix[r].length` for the columns.',
            'Tier 2 (Structural): Compare `matrix[r][c] === target`. If matched, immediately return `[r, c]`.',
            'Tier 3 (Walkthrough): Do NOT mix up variables `r` and `c`!'
          ]
        },
        {
          id: 'bound_safe_max',
          title: 'Boundary Guard: Safe Maximum',
          topic: 'debugging_logic',
          difficulty: 'Beginner',
          xp: 25,
          levelRequired: 'Beginner',
          description: `Write \`safeMax(arr)\` which returns the largest number in an array.
**Crucial Invariant Guards:**
- Return \`null\` if the array is empty or \`null\`.
- Ensure your loop condition terminates strictly within array bounds (\`i < arr.length\`).`,
          memoryNote: continuityNote?.type === 'struggle_callback' 
            ? 'In your previous session, you had an off-by-one `<=` index error. This challenge directly tests strict loop bounds!'
            : 'Focuses on 0-based boundary termination.',
          starterCode: `function safeMax(arr) {
  // 1. Guard against empty or falsy arrays
  if (!arr || arr.length === 0) return null;

  let max = arr[0];
  // 2. Loop strictly within bounds
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}
`,
          testCases: [
            { name: 'Finds max in positive array', call: 'safeMax([1, 9, 3, 7])', expected: 9 },
            { name: 'Finds max with negative numbers', call: 'safeMax([-10, -3, -25])', expected: -3 },
            { name: 'Handles empty array gracefully', call: 'safeMax([])', expected: null },
            { name: 'Handles single element', call: 'safeMax([42])', expected: 42 }
          ],
          hints: [
            'Tier 1 (Nudge): Check `if (!arr || arr.length === 0) return null;` right at the start.',
            'Tier 2 (Structural): Initialize `let max = arr[0];` and loop from `let i = 1; i < arr.length; i++`.',
            'Tier 3 (Walkthrough): Never write `i <= arr.length`! That would inspect one element beyond the array.'
          ]
        }
      ],

      // ASYNC & PROMISES CHALLENGES
      async_promises: [
        {
          id: 'async_safe_wrapper',
          title: 'Asynchronous Guarded Executor',
          topic: 'async_promises',
          difficulty: 'Intermediate',
          xp: 35,
          levelRequired: 'Intermediate',
          description: `Write an async function \`safeExecute(asyncAction)\` that runs the provided asynchronous function.
- If it resolves, return an object \`{ success: true, value: result }\`.
- If it throws or rejects, catch it and return \`{ success: false, error: err.message }\`.`,
          memoryNote: 'Reinforces async/await execution and defensive try/catch wrapping.',
          starterCode: `async function safeExecute(asyncAction) {
  try {
    const val = await asyncAction();
    return { success: true, value: val };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
`,
          testCases: [
            { name: 'Resolves successful value', call: 'await safeExecute(async () => 100)', expected: { success: true, value: 100 } },
            { name: 'Catches thrown rejection safely', call: 'await safeExecute(async () => { throw new Error("Network timeout"); })', expected: { success: false, error: "Network timeout" } }
          ],
          hints: [
            'Tier 1 (Nudge): Use `const val = await asyncAction();` inside the try block.',
            'Tier 2 (Structural): In the catch block, return `{ success: false, error: err.message }`.'
          ]
        }
      ]
    };

    const topicChallenges = challengePool[topic] || challengePool.debugging_logic;
    const matched = topicChallenges.find(c => c.levelRequired === level) || topicChallenges[0];
    return matched;
  }

  /**
   * Real-time Gemini 2.0 API integration (when user provides an API key)
   */
  async queryGeminiAI(userInput, analysis, student, persona, continuityNote, mode) {
    const apiKey = student.geminiApiKey;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are SynapseCode, an intelligent, empathetic, adaptive coding tutor.
Student Profile:
- Name: ${student.name}
- Level: ${student.level} (ELO: ${student.elo})
- Persona: ${persona}
- Past struggles: ${JSON.stringify(window.memorySystem.getStruggles().filter(s => !s.resolved).slice(0, 3))}
- Memory continuity note: ${continuityNote ? continuityNote.text : 'None'}

Pedagogical rules:
1. Reference past struggles/successes naturally if relevant to demonstrate session continuity.
2. Teach at the student's exact skill level (${student.level}).
3. Distinguish between careless mistakes, application gaps, and knowledge gaps.
4. Structure explanation with code examples and key takeaways.
5. Embody the requested persona (${persona}).`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Input (${mode}):\n${userInput}` }]
        }
      ]
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const perspectives = this.buildExplanationPerspectives(analysis.topic, student.level, analysis.language);
    perspectives.analogy = candidateText; // Inject AI response

    return {
      greeting: continuityNote ? `> 🧠 **Memory Recall:** *${continuityNote.text}*\n\n` : '',
      personaIntro: `*Teaching via Gemini 2.0 Cloud AI as ${persona} (${student.level} level)*`,
      topicLabel: analysis.topicLabel,
      body: candidateText,
      perspectives,
      takeaways: ['Reflect on the underlying invariants', 'Verify edge cases before submitting code'],
      detectedBug: analysis.detectedBug
    };
  }
}

// Export singleton
window.tutorEngine = new IntelligentTutorEngine();
