"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { computeSimulation } = require("./simulation-calculator.cjs");

const DEFAULT_CASES_FILE = path.resolve(process.cwd(), "tests/simulation-cases.json");
const casesFile = path.resolve(process.cwd(), process.argv[2] || DEFAULT_CASES_FILE);

function readCases(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Cases file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("Cases file must contain a JSON array.");
  }
  return data;
}

function normalizeExpectedValue(value) {
  if (value === "Infinity") return Number.POSITIVE_INFINITY;
  if (value === "-Infinity") return Number.NEGATIVE_INFINITY;
  return value;
}

function isClose(actual, expected, tolerance) {
  if (typeof actual !== "number" || typeof expected !== "number") return actual === expected;
  if (Number.isNaN(actual) || Number.isNaN(expected)) return false;
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return actual === expected;
  return Math.abs(actual - expected) <= tolerance;
}

function resolveTolerance(toleranceConfig, key) {
  if (typeof toleranceConfig === "number") return toleranceConfig;
  if (toleranceConfig && typeof toleranceConfig === "object" && typeof toleranceConfig[key] === "number") {
    return toleranceConfig[key];
  }
  return 1e-6;
}

function runCase(testCase, index) {
  const input = testCase.input || {};
  const expected = testCase.expected || {};
  const tolerance = testCase.tolerance;
  const result = computeSimulation(input);
  const mismatches = [];

  for (const key of Object.keys(expected)) {
    const expectedValue = normalizeExpectedValue(expected[key]);
    const actualValue = result[key];
    const keyTolerance = resolveTolerance(tolerance, key);
    const pass = isClose(actualValue, expectedValue, keyTolerance);

    if (!pass) {
      mismatches.push({
        key,
        expected: expectedValue,
        actual: actualValue,
        tolerance: keyTolerance
      });
    }
  }

  return {
    name: testCase.name || `Case ${index + 1}`,
    checkedKeys: Object.keys(expected).length,
    mismatches
  };
}

function formatValue(value) {
  if (value === null) return "null";
  if (value === Number.POSITIVE_INFINITY) return "Infinity";
  if (value === Number.NEGATIVE_INFINITY) return "-Infinity";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(6);
  return JSON.stringify(value);
}

function main() {
  const allCases = readCases(casesFile);
  if (allCases.length === 0) {
    console.log(`No cases found in ${casesFile}`);
    return;
  }

  const results = allCases.map(runCase);
  let failed = 0;

  console.log(`Running ${results.length} simulation case(s) from ${casesFile}\n`);

  for (const caseResult of results) {
    const hasFailure = caseResult.mismatches.length > 0;
    if (hasFailure) failed += 1;

    const status = hasFailure ? "FAIL" : "PASS";
    console.log(`${status} - ${caseResult.name} (${caseResult.checkedKeys} check(s))`);

    if (hasFailure) {
      for (const mismatch of caseResult.mismatches) {
        console.log(
          `  ${mismatch.key}: expected=${formatValue(mismatch.expected)} actual=${formatValue(mismatch.actual)} tolerance=${mismatch.tolerance}`
        );
      }
    }
  }

  const passed = results.length - failed;
  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);

  if (failed > 0) process.exitCode = 1;
}

main();
