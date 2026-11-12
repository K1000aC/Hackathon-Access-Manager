import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../src/model/automaton.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { HackathonAFD, processInput, transitions, alphabet, machine } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('δ total y lenguaje exacto {RMP} hasta longitud 6', () => {
  const afd = new HackathonAFD();
  for (const state of machine.Q) for (const symbol of alphabet) assert.ok(machine.Q.includes(transitions[state][symbol]));
  const visit = (input) => {
    const result = afd.evaluateString([...input]);
    assert.equal(result.accepted, input === 'RMP', input);
    assert.equal(result.path.length, input.length + 1);
    if (input.length < 6) for (const symbol of alphabet) visit(input + symbol);
  };
  visit('');
});
test('símbolos desconocidos y estado sumidero consumen la cadena completa', () => {
  const steps = processInput('RXMP');
  assert.deepEqual(steps.map(step => step.to), ['q1', 'qerr', 'qerr', 'qerr']);
  assert.equal(new HackathonAFD().evaluateString(['R', 'M', 'P', 'R']).accepted, false);
});
