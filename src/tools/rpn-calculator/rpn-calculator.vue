<script setup lang="ts">
interface Step {
  token: string
  action: string
  stack: number[]
}

interface EvalSuccess {
  result: number
  steps: Step[]
}

interface EvalError {
  error: string
}

const BINARY_OPS = new Set(['+', '-', '*', '/', '^', '%']);
const UNARY_FUNCS = new Set(['sqrt', 'abs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'neg', 'ceil', 'floor', 'round']);
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

function applyBinary(op: string, a: number, b: number): number | null {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? null : a / b;
    case '^': return a ** b;
    case '%': return b === 0 ? null : a % b;
    default: return null;
  }
}

function applyUnary(fn: string, a: number): number | null {
  switch (fn) {
    case 'sqrt': return a < 0 ? null : Math.sqrt(a);
    case 'abs': return Math.abs(a);
    case 'sin': return Math.sin(a);
    case 'cos': return Math.cos(a);
    case 'tan': return Math.tan(a);
    case 'asin': return Math.asin(a);
    case 'acos': return Math.acos(a);
    case 'atan': return Math.atan(a);
    case 'log': return a <= 0 ? null : Math.log10(a);
    case 'ln': return a <= 0 ? null : Math.log(a);
    case 'exp': return Math.exp(a);
    case 'neg': return -a;
    case 'ceil': return Math.ceil(a);
    case 'floor': return Math.floor(a);
    case 'round': return Math.round(a);
    default: return null;
  }
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) {
    return String(n);
  }
  const s = n.toPrecision(12);
  return String(Number.parseFloat(s));
}

function evaluateRPN(expression: string): EvalSuccess | EvalError {
  const tokens = expression.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) {
    return { error: 'Enter an RPN expression above.' };
  }

  const stack: number[] = [];
  const steps: Step[] = [];

  for (const token of tokens) {
    const asNum = Number(token);
    if (!Number.isNaN(asNum) && token !== '') {
      stack.push(asNum);
      steps.push({ token, action: `Push ${fmt(asNum)}`, stack: [...stack] });
    }
    else if (token in CONSTANTS) {
      const val = CONSTANTS[token];
      stack.push(val);
      steps.push({ token, action: `Push ${fmt(val)}`, stack: [...stack] });
    }
    else if (BINARY_OPS.has(token)) {
      if (stack.length < 2) {
        return { error: `'${token}' needs 2 operands but stack has ${stack.length}.` };
      }
      const b = stack.pop()!;
      const a = stack.pop()!;
      const val = applyBinary(token, a, b);
      if (val === null) {
        return { error: token === '/' || token === '%' ? 'Division by zero.' : `Cannot apply '${token}'.` };
      }
      stack.push(val);
      steps.push({ token, action: `${fmt(a)} ${token} ${fmt(b)} = ${fmt(val)}`, stack: [...stack] });
    }
    else if (UNARY_FUNCS.has(token)) {
      if (stack.length < 1) {
        return { error: `'${token}' needs 1 operand but stack is empty.` };
      }
      const a = stack.pop()!;
      const val = applyUnary(token, a);
      if (val === null) {
        return { error: `Cannot apply '${token}' to ${fmt(a)} (domain error).` };
      }
      stack.push(val);
      steps.push({ token, action: `${token}(${fmt(a)}) = ${fmt(val)}`, stack: [...stack] });
    }
    else {
      return { error: `Unknown token: '${token}'` };
    }
  }

  if (stack.length !== 1) {
    return { error: `${stack.length} value(s) remain on stack — expression may be missing an operator.` };
  }

  return { result: stack[0], steps };
}

const expression = ref('');

const evalResult = computed<EvalSuccess | EvalError | null>(() => {
  if (!expression.value.trim()) {
    return null;
  }
  return evaluateRPN(expression.value);
});

const isError = computed(() => evalResult.value !== null && 'error' in evalResult.value);
const isSuccess = computed(() => evalResult.value !== null && 'result' in evalResult.value);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 700px">
      <c-card mb-3 title="Expression">
        <c-input-text
          v-model:value="expression"
          placeholder="e.g. 3 4 + 5 *"
          raw-text
          monospace
          autofocus
        />
        <n-text op-50 style="font-size: 0.8em; margin-top: 6px; display: block;">
          Tokens separated by spaces. Operators: + - * / ^ %. Functions: sqrt abs neg sin cos tan asin acos atan log ln exp ceil floor round. Constants: pi e.
        </n-text>
      </c-card>

      <c-card v-if="isError" mb-3>
        <n-text type="error">
          {{ (evalResult as any).error }}
        </n-text>
      </c-card>

      <template v-if="isSuccess">
        <c-card mb-3 title="Result">
          <input-copyable
            :value="fmt((evalResult as any).result)"
            readonly
            style="font-family: monospace; font-size: 1.1em;"
          />
        </c-card>

        <c-card title="Step-by-step">
          <n-table :bordered="false" size="small" striped>
            <thead>
              <tr>
                <th style="width: 90px;">
                  Token
                </th>
                <th>Action</th>
                <th>Stack (top →)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(step, i) in (evalResult as any).steps" :key="i">
                <td>
                  <n-tag size="small" type="info" style="font-family: monospace;">
                    {{ step.token }}
                  </n-tag>
                </td>
                <td style="font-family: monospace;">
                  {{ step.action }}
                </td>
                <td style="font-family: monospace;">
                  [ {{ step.stack.map(fmt).join(', ') }} ]
                </td>
              </tr>
            </tbody>
          </n-table>
        </c-card>
      </template>

      <c-card v-else-if="!expression.trim()">
        <n-text op-60>
          Enter a postfix (RPN) expression above. Numbers and tokens must be separated by spaces.
          <br><br>
          Examples:<br>
          <span style="font-family: monospace;">3 4 +</span> → 7<br>
          <span style="font-family: monospace;">3 4 + 5 *</span> → (3+4)×5 = 35<br>
          <span style="font-family: monospace;">2 sqrt</span> → √2 ≈ 1.41421<br>
          <span style="font-family: monospace;">pi 2 /</span> → π/2
        </n-text>
      </c-card>
    </div>
  </div>
</template>
