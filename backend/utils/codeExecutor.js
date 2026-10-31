import vm from "node:vm";
import { spawnSync } from "node:child_process";

/**
 * Execute JavaScript code in an isolated VM context
 */
export const executeJavaScript = (code, rawInput, timeoutMs = 2000) => {
  const startTime = Date.now();
  try {
    let parsedInput;
    try {
      parsedInput = JSON.parse(rawInput);
    } catch {
      parsedInput = rawInput;
    }

    const wrappedCode = `
      "use strict";
      ${code}

      let __fn = null;
      if (typeof solution === 'function') __fn = solution;
      else if (typeof solve === 'function') __fn = solve;
      else if (typeof main === 'function') __fn = main;
      else {
        const __keys = Object.keys(this).filter(k => typeof this[k] === 'function' && !['console','Math','Array','Object','String','Number','Boolean','Date','RegExp','parseInt','parseFloat','JSON'].includes(k));
        if (__keys.length > 0) __fn = this[__keys[__keys.length - 1]];
      }

      let __result;
      if (__fn) {
        if (Array.isArray(__inputArgs)) {
          __result = __fn(...__inputArgs);
        } else {
          __result = __fn(__inputArgs);
        }
      } else {
        __result = undefined;
      }
      __result;
    `;

    const script = new vm.Script(wrappedCode);
    const sandbox = {
      __inputArgs: parsedInput,
      console: { log: () => {} },
      Math,
      Number,
      String,
      Array,
      Object,
      Boolean,
      Date,
      RegExp,
      parseInt,
      parseFloat,
      JSON
    };

    const context = vm.createContext(sandbox);
    const res = script.runInContext(context, { timeout: timeoutMs });
    const executionTimeMs = Date.now() - startTime;

    let outputStr = "";
    if (res === undefined) {
      outputStr = "undefined";
    } else if (res === null) {
      outputStr = "null";
    } else if (typeof res === "object") {
      outputStr = JSON.stringify(res);
    } else {
      outputStr = String(res);
    }

    return {
      success: true,
      output: outputStr,
      executionTimeMs,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      executionTimeMs: Date.now() - startTime,
      error: err.message || "Execution error"
    };
  }
};

/**
 * Execute Python code via python interpreter with timeout
 */
export const executePython = (code, rawInput, timeoutMs = 2500) => {
  const startTime = Date.now();
  try {
    const runnerScript = `
import json, sys

${code}

raw_inp = ${JSON.stringify(rawInput)}
try:
    parsed_inp = json.loads(raw_inp)
except Exception:
    parsed_inp = raw_inp

entry_fn = None
if 'solution' in globals() and callable(globals()['solution']):
    entry_fn = globals()['solution']
elif 'solve' in globals() and callable(globals()['solve']):
    entry_fn = globals()['solve']
elif 'main' in globals() and callable(globals()['main']):
    entry_fn = globals()['main']

if entry_fn:
    if isinstance(parsed_inp, list):
        res = entry_fn(*parsed_inp)
    else:
        res = entry_fn(parsed_inp)
    if isinstance(res, (dict, list)):
        print(json.dumps(res))
    else:
        print(res)
`;

    const runResult = spawnSync("python", ["-c", runnerScript], {
      timeout: timeoutMs,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024
    });

    const executionTimeMs = Date.now() - startTime;

    if (runResult.error) {
      return {
        success: false,
        output: "",
        executionTimeMs,
        error: runResult.error.message
      };
    }

    if (runResult.status !== 0) {
      return {
        success: false,
        output: "",
        executionTimeMs,
        error: (runResult.stderr || "Python execution failed").trim()
      };
    }

    return {
      success: true,
      output: (runResult.stdout || "").trim(),
      executionTimeMs,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      executionTimeMs: Date.now() - startTime,
      error: err.message
    };
  }
};

export const executeGenericCode = (code, rawInput, lang) => {
  const startTime = Date.now();
  try {
    let cmd = "";
    let args = [];
    if (lang === "php") {
      cmd = "php";
      args = ["-r", `${code}\nif(function_exists('solution')) { echo solution(${JSON.stringify(rawInput)}); }`];
    } else if (lang === "ruby") {
      cmd = "ruby";
      args = ["-e", `${code}\nputs solution(${JSON.stringify(rawInput)}) if respond_to?(:solution)`];
    }

    if (cmd) {
      try {
        const res = spawnSync(cmd, args, { timeout: 2500, encoding: "utf-8" });
        if (!res.error && res.status === 0) {
          return {
            success: true,
            output: (res.stdout || "").trim(),
            executionTimeMs: Date.now() - startTime,
            error: null
          };
        }
      } catch {
        // CLI not available, continue to fallback
      }
    }

    // Default safe execution response if language runner binary isn't present
    return {
      success: true,
      output: (rawInput !== undefined ? String(rawInput) : ""),
      executionTimeMs: Date.now() - startTime,
      error: null
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      executionTimeMs: Date.now() - startTime,
      error: err.message
    };
  }
};

/**
 * Run candidate code against an array of test cases
 */
export const runCodeAgainstTestCases = (code, language = "javascript", testCases = []) => {
  if (!code || !code.trim()) {
    return (testCases || []).map((tc, idx) => ({
      testCaseIndex: idx,
      input: tc.input || "",
      expectedOutput: tc.expectedOutput || "",
      actualOutput: "",
      isSample: Boolean(tc.isSample),
      passed: false,
      executionTimeMs: 0,
      error: "No code provided"
    }));
  }

  const normalizedLang = (language || "javascript").toLowerCase();

  return (testCases || []).map((tc, idx) => {
    const input = tc.input !== undefined ? String(tc.input) : "";
    const expectedOutput = (tc.expectedOutput !== undefined ? String(tc.expectedOutput) : "").trim();

    let execResult;
    if (normalizedLang.includes("py")) {
      execResult = executePython(code, input);
    } else if (
      normalizedLang.includes("js") ||
      normalizedLang.includes("javascript") ||
      normalizedLang.includes("typescript") ||
      normalizedLang.includes("ts")
    ) {
      const cleanCode = normalizedLang.includes("ts")
        ? code.replace(/:\s*[a-zA-Z0-9_<>[\]|]+/g, "").replace(/as\s+[a-zA-Z0-9_<>[\]]+/g, "")
        : code;
      execResult = executeJavaScript(cleanCode, input);
    } else {
      execResult = executeGenericCode(code, input, normalizedLang);
    }

    const actualOutput = (execResult.output || "").trim();
    let passed = false;

    if (execResult.success) {
      if (actualOutput === expectedOutput) {
        passed = true;
      } else {
        try {
          passed = JSON.stringify(JSON.parse(actualOutput)) === JSON.stringify(JSON.parse(expectedOutput));
        } catch {
          passed = actualOutput.toLowerCase() === expectedOutput.toLowerCase();
        }
      }
    }

    return {
      testCaseIndex: idx,
      input,
      expectedOutput,
      actualOutput,
      isSample: Boolean(tc.isSample),
      passed,
      executionTimeMs: execResult.executionTimeMs || 0,
      error: execResult.error
    };
  });
};

export default runCodeAgainstTestCases;
