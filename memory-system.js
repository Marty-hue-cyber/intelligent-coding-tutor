/**
 * SynapseCode — Persistent Cognitive Memory System
 * Manages student cognitive state, past struggles, breakthrough successes,
 * skill mastery graphs, ELO rating, tri-partite error classification,
 * learning preferences, and cross-session continuity.
 */

class CognitiveMemorySystem {
  constructor() {
    this.STORAGE_KEY = 'synapse_cognitive_profile_v3';
    this.profile = this.loadProfile();
  }

  getDefaultProfile() {
    return {
      student: {
        id: 'student_alex',
        name: 'Alex Chen',
        avatar: '👩‍💻',
        title: 'Algorithmic Explorer',
        level: 'Intermediate', // Beginner, Intermediate, Advanced
        elo: 1240,
        streakDays: 4,
        lastActive: new Date().toISOString(),
        persona: 'socratic', // socratic, senior_dev, visual, speedrun
        preferredExplanationStyle: 'analogy_first', // analogy_first, walkthrough, socratic, first_principles
        soundEnabled: true,
        geminiApiKey: ''
      },
      mastery: {
        recursion: { score: 45, label: 'Recursion & Backtracking', confident: false, requiresReinforcement: true },
        arrays_hashing: { score: 82, label: 'Arrays & Hash Maps', confident: true, requiresReinforcement: false },
        async_promises: { score: 40, label: 'Async / Promises', confident: false, requiresReinforcement: true },
        trees_graphs: { score: 55, label: 'Trees & Linked Lists', confident: false, requiresReinforcement: false },
        debugging_logic: { score: 62, label: 'Boundary & Logic Debugging', confident: false, requiresReinforcement: true },
        clean_code: { score: 74, label: 'Idiomatic Style & Clean Code', confident: true, requiresReinforcement: false }
      },
      // Tri-partite error classification:
      // 'careless_mistake' | 'application_gap' | 'knowledge_gap'
      struggles: [
        {
          id: 'st_rec_base',
          topic: 'recursion',
          tag: 'Base Case Missing',
          category: 'application_gap',
          description: 'Understands recursive call structure, but omits base termination guard before recursive step, causing RangeError: Maximum call stack size exceeded.',
          count: 3,
          firstSeen: '2 days ago',
          lastSeen: 'Yesterday',
          resolved: false,
          pedagogicalNotes: 'Learner grasps recursive step conceptually, but struggles to decompose the problem into its smallest trivial boundary case.'
        },
        {
          id: 'st_array_bounds',
          topic: 'debugging_logic',
          tag: 'Off-By-One Index Boundary',
          category: 'careless_mistake',
          description: 'Loop termination condition accidentally uses <= array.length causing undefined index reads.',
          count: 2,
          firstSeen: '3 days ago',
          lastSeen: '2 days ago',
          resolved: false,
          pedagogicalNotes: 'Careless syntax slip rather than conceptual misunderstanding; learner quickly corrects once attentional nudge is provided.'
        },
        {
          id: 'st_async_await',
          topic: 'async_promises',
          tag: 'Unawaited Promises',
          category: 'knowledge_gap',
          description: 'Forgot `await` when invoking async functions, attempting to access fields directly on Promise objects before resolution.',
          count: 2,
          firstSeen: '4 days ago',
          lastSeen: '3 days ago',
          resolved: false,
          pedagogicalNotes: 'Underlying mental model gap regarding the JavaScript microtask queue and event-loop execution order.'
        }
      ],
      successes: [
        {
          id: 'sc_hash_twosum',
          topic: 'arrays_hashing',
          tag: 'Hash Map Lookup',
          description: 'Mastered O(1) complement lookups in Two Sum on first try without nested loops!',
          achievedAt: '2 days ago'
        },
        {
          id: 'sc_string_reverse',
          topic: 'arrays_hashing',
          tag: 'Two-Pointer Technique',
          description: 'Flawlessly implemented in-place two-pointer string reversal with clean swapping.',
          achievedAt: 'Yesterday'
        }
      ],
      preferences: [
        'Prefers interactive step-by-step visual explanations before code examples',
        'Appreciates practical real-world industry analogies',
        'Likes challenges with automated edge-case test suites',
        'Learns best when guided by Socratic questions rather than blunt code answers'
      ],
      sessionHistory: [
        {
          id: 'sess_101',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          sessionNumber: 1,
          topic: 'Loops & Iteration Fundamentals',
          summary: 'Learner was introduced to basic while and for-loops. Solved single-loop sum challenge cleanly.',
          challengeTitle: 'Single Loop Counter',
          result: 'passed_first_try',
          eloChange: +25,
          notes: 'Demonstrated solid grasp of basic iteration syntax.'
        },
        {
          id: 'sess_102',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          sessionNumber: 2,
          topic: 'Arrays & Two Sum Hash Table',
          summary: 'Recalled loops fluency. Advanced to 2D array coordinates & hash map complement caching.',
          challengeTitle: 'Two Sum Optimal Lookup',
          result: 'passed_first_try',
          eloChange: +30,
          notes: 'Learner recognized O(N^2) brute force bottleneck and adopted Map.'
        },
        {
          id: 'sess_103',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          sessionNumber: 3,
          topic: 'Recursion Stack Overflow & Base Guards',
          summary: 'User struggled with base condition in recursive countdown/factorial; hit RangeError.',
          challengeTitle: 'Recursive Fibonacci with Guard',
          result: 'needed_hints',
          eloChange: +10,
          notes: 'Application gap diagnosed: tutor shifted to cafeteria-tray stack visualization.'
        }
      ]
    };
  }

  loadProfile() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = this.getDefaultProfile();
        return {
          student: { ...defaults.student, ...parsed.student },
          mastery: { ...defaults.mastery, ...parsed.mastery },
          struggles: parsed.struggles || defaults.struggles,
          successes: parsed.successes || defaults.successes,
          preferences: parsed.preferences || defaults.preferences,
          sessionHistory: parsed.sessionHistory || defaults.sessionHistory
        };
      }
    } catch (e) {
      console.warn('Could not load profile from localStorage, using defaults.', e);
    }
    return this.getDefaultProfile();
  }

  saveProfile() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.error('Failed to save profile to localStorage', e);
    }
  }

  getStudent() {
    return this.profile.student;
  }

  updateStudent(fields) {
    this.profile.student = { ...this.profile.student, ...fields };
    this.saveProfile();
  }

  getMastery() {
    return this.profile.mastery;
  }

  updateMastery(topic, delta) {
    if (this.profile.mastery[topic]) {
      const current = this.profile.mastery[topic].score;
      const next = Math.max(5, Math.min(100, current + delta));
      this.profile.mastery[topic].score = next;
      this.profile.mastery[topic].confident = next >= 75;
      this.profile.mastery[topic].requiresReinforcement = next < 60;
      this.saveProfile();
      return next;
    }
    return null;
  }

  /**
   * Gradual, intelligent ELO adaptation
   * Mistakes do NOT cause sudden punitive drops.
   */
  updateElo(delta) {
    this.profile.student.elo = Math.max(100, this.profile.student.elo + delta);
    
    // Adapt level thresholds
    if (this.profile.student.elo < 1000) {
      this.profile.student.level = 'Beginner';
      this.profile.student.title = 'Syntax Apprentice';
    } else if (this.profile.student.elo < 1600) {
      this.profile.student.level = 'Intermediate';
      this.profile.student.title = 'Algorithmic Explorer';
    } else {
      this.profile.student.level = 'Advanced';
      this.profile.student.title = 'Code Architect';
    }
    this.saveProfile();
    return this.profile.student.elo;
  }

  getStruggles() {
    return this.profile.struggles;
  }

  getSuccesses() {
    return this.profile.successes;
  }

  /**
   * Records a struggle with explicit cognitive error classification:
   * @param {string} topic
   * @param {string} tag
   * @param {string} description
   * @param {'careless_mistake' | 'application_gap' | 'knowledge_gap'} category
   * @param {string} pedagogicalNotes
   */
  recordStruggle(topic, tag, description, category = 'application_gap', pedagogicalNotes = '') {
    const existing = this.profile.struggles.find(s => s.topic === topic && s.tag.toLowerCase() === tag.toLowerCase());
    if (existing) {
      existing.count += 1;
      existing.lastSeen = 'Just now';
      existing.resolved = false;
      if (category) existing.category = category;
      if (pedagogicalNotes) existing.pedagogicalNotes = pedagogicalNotes;
    } else {
      this.profile.struggles.unshift({
        id: 'st_' + Date.now(),
        topic: topic || 'debugging_logic',
        tag: tag || 'Logic Slip',
        category,
        description,
        count: 1,
        firstSeen: 'Just now',
        lastSeen: 'Just now',
        resolved: false,
        pedagogicalNotes: pedagogicalNotes || 'Identified during active coding evaluation.'
      });
    }
    this.saveProfile();
  }

  resolveStruggle(struggleId) {
    const struggle = this.profile.struggles.find(s => s.id === struggleId);
    if (struggle) {
      struggle.resolved = true;
      struggle.pedagogicalNotes += ' [Overcome and reinforced in active challenge!]';
      this.saveProfile();
    }
  }

  recordSuccess(topic, tag, description) {
    this.profile.successes.unshift({
      id: 'sc_' + Date.now(),
      topic: topic || 'general',
      tag: tag || 'Mastery Achieved',
      description,
      achievedAt: 'Just now'
    });
    if (this.profile.successes.length > 20) {
      this.profile.successes.pop();
    }
    this.saveProfile();
  }

  addManualMemory(type, text, category = 'application_gap') {
    if (type === 'struggle') {
      this.recordStruggle('general', 'User Goal / Struggle', text, category, 'Manually added by learner.');
    } else if (type === 'success') {
      this.recordSuccess('general', 'Personal Milestone', text);
    } else {
      this.profile.preferences.push(text);
      this.saveProfile();
    }
  }

  deleteMemory(id) {
    this.profile.struggles = this.profile.struggles.filter(s => s.id !== id);
    this.profile.successes = this.profile.successes.filter(s => s.id !== id);
    this.saveProfile();
  }

  recordSession(sessionData) {
    const nextSessionNum = this.profile.sessionHistory.length + 1;
    this.profile.sessionHistory.unshift({
      id: 'sess_' + Date.now(),
      sessionNumber: nextSessionNum,
      timestamp: new Date().toISOString(),
      ...sessionData
    });
    if (this.profile.sessionHistory.length > 25) {
      this.profile.sessionHistory.pop();
    }
    this.saveProfile();
  }

  getSessionHistory() {
    return this.profile.sessionHistory;
  }

  clearHistory() {
    this.profile.sessionHistory = [];
    this.saveProfile();
  }

  /**
   * Searches memory for past struggles or milestones relevant to the active input.
   * Enables the tutor to naturally say:
   * "Last time you understood loops well, but you were having trouble deciding when to use a loop versus a conditional..."
   */
  findRelevantMemories(textOrCode, detectedTopic) {
    const relevant = {
      struggles: [],
      successes: [],
      recentSession: this.profile.sessionHistory[0] || null
    };

    const lower = textOrCode.toLowerCase();

    for (const struggle of this.profile.struggles) {
      if (struggle.resolved) continue;

      const topicMatch = detectedTopic && struggle.topic.toLowerCase() === detectedTopic.toLowerCase();
      const keywordMatch = lower.includes(struggle.tag.toLowerCase()) || 
                           (struggle.topic === 'recursion' && (lower.includes('recur') || lower.includes('base case') || lower.includes('stack overflow') || lower.includes('depth'))) ||
                           (struggle.topic === 'async_promises' && (lower.includes('async') || lower.includes('await') || lower.includes('promise') || lower.includes('fetch'))) ||
                           (struggle.topic === 'debugging_logic' && (lower.includes('index') || lower.includes('length') || lower.includes('bounds') || lower.includes('while') || lower.includes('loop')));

      if (topicMatch || keywordMatch) {
        relevant.struggles.push(struggle);
      }
    }

    for (const success of this.profile.successes) {
      const topicMatch = detectedTopic && success.topic.toLowerCase() === detectedTopic.toLowerCase();
      const keywordMatch = lower.includes(success.tag.toLowerCase());
      if (topicMatch || keywordMatch) {
        relevant.successes.push(success);
      }
    }

    return relevant;
  }

  /**
   * Generates a pedagogical continuity preface connecting current work to past sessions
   */
  generateMemoryContinuityNote(relevantMemories) {
    if (relevantMemories.struggles.length > 0) {
      const st = relevantMemories.struggles[0];
      const categoryLabel = st.category === 'careless_mistake' 
        ? 'a small syntax/boundary slip' 
        : (st.category === 'knowledge_gap' ? 'a foundational concept gap' : 'an application nuance');

      return {
        type: 'struggle_callback',
        tag: st.tag,
        category: st.category,
        text: `In your previous session, we noted ${categoryLabel} regarding ${st.tag.toLowerCase()} (${st.description.toLowerCase()}). Today's challenge directly targets this invariant to build rock-solid mastery!`,
        struggleId: st.id
      };
    } else if (relevantMemories.recentSession) {
      const rs = relevantMemories.recentSession;
      return {
        type: 'session_callback',
        text: `Last time, you tackled ${rs.topic} and earned +${rs.eloChange} ELO. Building on that foundation, let's explore how this concept connects!`,
        sessionId: rs.id
      };
    } else if (relevantMemories.successes.length > 0) {
      const sc = relevantMemories.successes[0];
      return {
        type: 'success_callback',
        text: `You previously nailed ${sc.tag.toLowerCase()}! Let's level up those skills with this new challenge.`,
        successId: sc.id
      };
    }
    return null;
  }

  /**
   * Quick Preset Configuration for the 4-Session Pedagogical Journey Demonstration:
   * Session 1: Beginner explanation -> simple loop challenge
   * Session 2: Loop concepts remembered -> slightly harder nested-loop challenge
   * Session 3: User repeatedly struggles with nested loops -> tutor changes explanation strategy and provides smaller intermediate challenge
   * Session 4: User succeeds -> tutor increases difficulty and introduces related concept
   */
  applySessionState(sessionNumber) {
    if (sessionNumber === 1) {
      this.profile.student.level = 'Beginner';
      this.profile.student.elo = 850;
      this.profile.student.title = 'Syntax Explorer';
      this.profile.mastery.debugging_logic.score = 35;
      this.profile.struggles = [];
      this.profile.sessionHistory = [];
    } else if (sessionNumber === 2) {
      this.profile.student.level = 'Beginner';
      this.profile.student.elo = 980;
      this.profile.student.title = 'Loop Apprentice';
      this.profile.mastery.debugging_logic.score = 55;
      this.profile.sessionHistory = [
        {
          id: 'sess_1',
          sessionNumber: 1,
          timestamp: 'Yesterday',
          topic: 'Single Loop Counter & Basic Iteration',
          summary: 'Grasped single while and for-loops successfully on first try.',
          challengeTitle: 'Count Up to Target',
          result: 'passed_first_try',
          eloChange: +30
        }
      ];
    } else if (sessionNumber === 3) {
      this.profile.student.level = 'Intermediate';
      this.profile.student.elo = 1040;
      this.profile.student.title = 'Algorithmic Explorer';
      this.profile.mastery.debugging_logic.score = 50;
      this.profile.struggles = [
        {
          id: 'st_nested_loop',
          topic: 'debugging_logic',
          tag: 'Nested Loop Index Confusion',
          category: 'application_gap',
          description: 'Accidentally mixes up row variable i and column variable j inside inner loops, or resets inner indices incorrectly.',
          count: 2,
          firstSeen: 'Yesterday',
          lastSeen: 'Today',
          resolved: false,
          pedagogicalNotes: 'Understands single loops, but application gap occurs when nesting: coordinates matrix traversal state.'
        }
      ];
      this.profile.sessionHistory = [
        {
          id: 'sess_2',
          sessionNumber: 2,
          timestamp: 'Yesterday',
          topic: 'Nested Loops & Matrix Traversal',
          summary: 'User hit off-by-one and index coordinate swapping with nested loops.',
          challengeTitle: '2D Grid Coordinate Scanner',
          result: 'needed_hints',
          eloChange: -10
        },
        {
          id: 'sess_1',
          sessionNumber: 1,
          timestamp: '2 days ago',
          topic: 'Single Loops',
          summary: 'Mastered basic for-loop iteration.',
          challengeTitle: 'Count Up to Target',
          result: 'passed_first_try',
          eloChange: +30
        }
      ];
    } else if (sessionNumber === 4) {
      this.profile.student.level = 'Intermediate';
      this.profile.student.elo = 1260;
      this.profile.student.title = 'Code Architect in Training';
      this.profile.mastery.debugging_logic.score = 78;
      this.profile.mastery.arrays_hashing.score = 70;
      this.profile.struggles = [
        {
          id: 'st_nested_loop',
          topic: 'debugging_logic',
          tag: 'Nested Loop Index Confusion',
          category: 'application_gap',
          description: 'Accidentally mixes up row variable i and column variable j inside inner loops.',
          count: 2,
          firstSeen: 'Yesterday',
          lastSeen: 'Today',
          resolved: true,
          pedagogicalNotes: 'Overcame and reinforced with intermediate 2D grid walk challenge!'
        }
      ];
      this.profile.successes.unshift({
        id: 'sc_nested_matrix',
        topic: 'debugging_logic',
        tag: 'Clean 2D Grid Coordinate Walk',
        description: 'Successfully navigated nested loop row/column boundaries with zero index leaks!',
        achievedAt: 'Just now'
      });
      this.profile.sessionHistory.unshift({
        id: 'sess_3',
        sessionNumber: 3,
        timestamp: '1 hour ago',
        topic: 'Nested Loop Boundary Breakthrough',
        summary: 'Tutor adapted teaching style with visual grid coordinate breakdown. Learner solved intermediate challenge!',
        challengeTitle: 'Matrix Diagonal Collector',
        result: 'passed_first_try',
        eloChange: +45
      });
    }
    this.saveProfile();
    return this.profile;
  }

  exportProfile() {
    return JSON.stringify(this.profile, null, 2);
  }

  importProfile(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.student && parsed.mastery) {
        this.profile = parsed;
        this.saveProfile();
        return true;
      }
    } catch (e) {
      console.error('Invalid profile JSON', e);
    }
    return false;
  }

  resetAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.profile = this.getDefaultProfile();
    this.saveProfile();
  }
}

// Export singleton
window.memorySystem = new CognitiveMemorySystem();
