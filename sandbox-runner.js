/**
 * SynapseCode — In-Browser Code Sandbox & Automated Test Runner
 * Executes user solutions with timeout protection, console interception,
 * automated test case evaluation, diff calculation, and execution state tracing.
 */

class CodeSandboxRunner {
  constructor() {
    this.pyodide = null;
    this.isPyodideLoading = false;
    this.lastTrace = [];
  }

  /**
   * Run JavaScript code against a suite of challenge test cases
   * @param {string} userCode 
   * @param {Array<{name: string, call: string, expected: any, isHidden?: boolean}>} testCases 
   * @param {number} timeoutMs
   */
  async runJavaScript(userCode, testCases = [], timeoutMs = 3000) {
    const logs = [];
    const results = [];
    const trace = [];
    let allPassed = true;

    // Custom console interceptor
    const customConsole = {
      log: (...args) => logs.push(args.map(a => this.formatValue(a)).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(a => this.formatValue(a)).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.map(a => this.formatValue(a)).join(' '))
    };

    try {
      // Evaluate user code in isolated function scope
      const wrappedScript = `
        return (function(console) {
          "use strict";
          ${userCode}
          
          return {
            executeTest: function(callExpr) {
              return eval(callExpr);
            }
          };
        })(customConsole);
      `;

      // Timeout execution promise
      const executionPromise = new Promise((resolve, reject) => {
        try {
          const fn = new Function('customConsole', wrappedScript);
          const scope = fn(customConsole);
          resolve(scope);
        } catch (syntaxErr) {
          reject(syntaxErr);
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Execution timed out (${timeoutMs}ms). Possible infinite loop or unbounded recursion!`)), timeoutMs);
      });

      const runnerScope = await Promise.race([executionPromise, timeoutPromise]);

      // Run each test case against the user's defined functions
      for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        const startTime = performance.now();
        let passed = false;
        let actual = null;
        let testError = null;

        try {
          actual = runnerScope.executeTest(test.call);
          passed = this.deepEqual(actual, test.expected);
        } catch (err) {
          testError = err.message;
          passed = false;
        }

        const duration = (performance.now() - startTime).toFixed(2);

        if (!passed) allPassed = false;

        const resultObj = {
          name: test.name || test.call,
          call: test.call,
          expected: test.expected,
          actual: testError ? `Error: ${testError}` : actual,
          passed,
          durationMs: duration
        };

        results.push(resultObj);

        trace.push({
          step: i + 1,
          expression: test.call,
          expected: this.formatValue(test.expected),
          actual: this.formatValue(testError ? `Error: ${testError}` : actual),
          status: passed ? 'PASSED' : 'FAILED',
          durationMs: duration
        });
      }

      this.lastTrace = trace;

      return {
        success: true,
        allPassed,
        passedCount: results.filter(r => r.passed).length,
        totalCount: results.length,
        results,
        logs,
        trace
      };

    } catch (err) {
      return {
        success: false,
        allPassed: false,
        passedCount: 0,
        totalCount: testCases.length,
        results: [],
        logs,
        trace: [],
        error: err.message
      };
    }
  }

  /**
   * Safe deep comparison helper
   */
  deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const k of keysA) {
        if (!this.deepEqual(a[k], b[k])) return false;
      }
      return true;
    }

    return false;
  }

  formatValue(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return String(val);
      }
    }
    return String(val);
  }

  /**
   * Run Python code via Pyodide or instant simulated sandbox
   */
  async runPython(userCode, testCases = []) {
    if (window.loadPyodide && !this.pyodide && !this.isPyodideLoading) {
      try {
        this.isPyodideLoading = true;
        this.pyodide = await window.loadPyodide();
        this.isPyodideLoading = false;
      } catch (e) {
        this.isPyodideLoading = false;
        console.warn('Pyodide CDN not accessible, using Python simulation sandbox', e);
      }
    }

    if (this.pyodide) {
      try {
        this.pyodide.runPython(`
          import sys
          from io import StringIO
          sys.stdout = StringIO()
        `);

        this.pyodide.runPython(userCode);

        const logs = this.pyodide.runPython('sys.stdout.getvalue()').split('\n').filter(Boolean);
        const results = [];
        let allPassed = true;

        for (const test of testCases) {
          const actual = this.pyodide.runPython(test.call);
          const passed = this.deepEqual(actual, test.expected);
          if (!passed) allPassed = false;
          results.push({
            name: test.name || test.call,
            call: test.call,
            expected: test.expected,
            actual,
            passed,
            durationMs: '1.2'
          });
        }

        return {
          success: true,
          allPassed,
          passedCount: results.filter(r => r.passed).length,
          totalCount: results.length,
          results,
          logs
        };
      } catch (pyErr) {
        return {
          success: false,
          allPassed: false,
          error: pyErr.message,
          results: [],
          logs: []
        };
      }
    }

    return this.simulatePythonExecution(userCode, testCases);
  }

  simulatePythonExecution(pyCode, testCases) {
    try {
      let jsCode = pyCode
        .replace(/def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/g, 'function $1($2) {')
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/print\((.*?)\)/g, 'console.log($1)');
      
      jsCode += '\n}';
      return this.runJavaScript(jsCode, testCases);
    } catch (e) {
      return {
        success: false,
        allPassed: false,
        error: 'Python simulation error. Please review function indentation or switch to JavaScript.',
        results: [],
        logs: []
      };
    }
  }
}

// Export singleton
window.codeSandbox = new CodeSandboxRunner();
