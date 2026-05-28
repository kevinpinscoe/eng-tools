<script setup lang="ts">
type SolveFor = 'V' | 'I' | 'R' | 'P';

const solveFor = ref<SolveFor>('V');
const input1 = ref<number | undefined>(undefined);
const input2 = ref<number | undefined>(undefined);

watch(solveFor, () => {
  input1.value = undefined;
  input2.value = undefined;
});

const config: Record<SolveFor, { label1: string; unit1: string; label2: string; unit2: string; formula: string }> = {
  V: { label1: 'Current (I)', unit1: 'A', label2: 'Resistance (R)', unit2: 'Ω', formula: 'V = I × R' },
  I: { label1: 'Voltage (V)', unit1: 'V', label2: 'Resistance (R)', unit2: 'Ω', formula: 'I = V ÷ R' },
  R: { label1: 'Voltage (V)', unit1: 'V', label2: 'Current (I)',    unit2: 'A', formula: 'R = V ÷ I' },
  P: { label1: 'Voltage (V)', unit1: 'V', label2: 'Current (I)',    unit2: 'A', formula: 'P = V × I' },
};

function fmt(val: number): string {
  if (!Number.isFinite(val) || Number.isNaN(val) || val < 0) return '—';
  return parseFloat(val.toPrecision(8)).toString();
}

const results = computed(() => {
  const a = input1.value;
  const b = input2.value;
  if (a === undefined || b === undefined) return null;

  let V: number, I: number, R: number, P: number;

  switch (solveFor.value) {
    case 'V': I = a; R = b; V = I * R;  P = V * I; break;
    case 'I': V = a; R = b; I = V / R;  P = V * I; break;
    case 'R': V = a; I = b; R = V / I;  P = V * I; break;
    case 'P': V = a; I = b; P = V * I;  R = V / I; break;
  }

  return { V: fmt(V!), I: fmt(I!), R: fmt(R!), P: fmt(P!) };
});

const current = computed(() => config[solveFor.value]);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 560px">

      <c-card mb-3 title="Solve For">
        <n-radio-group v-model:value="solveFor">
          <n-space>
            <n-radio value="V">Voltage (V)</n-radio>
            <n-radio value="I">Current (I)</n-radio>
            <n-radio value="R">Resistance (R)</n-radio>
            <n-radio value="P">Power (P)</n-radio>
          </n-space>
        </n-radio-group>
        <div mt-2 op-60 style="font-size: 0.85em; font-style: italic;">
          {{ current.formula }}
        </div>
      </c-card>

      <c-card mb-3 title="Inputs">
        <div flex gap-3 items-center mb-3>
          <span style="min-width: 140px;">{{ current.label1 }}</span>
          <n-input-number v-model:value="input1" :min="0" placeholder="Enter value" style="max-width: 180px;" />
          <span op-70>{{ current.unit1 }}</span>
        </div>
        <div flex gap-3 items-center>
          <span style="min-width: 140px;">{{ current.label2 }}</span>
          <n-input-number v-model:value="input2" :min="0" placeholder="Enter value" style="max-width: 180px;" />
          <span op-70>{{ current.unit2 }}</span>
        </div>
      </c-card>

      <c-card v-if="results" title="Results">
        <div flex gap-3 items-center mb-3>
          <span style="min-width: 140px;">Voltage (V)</span>
          <input-copyable :value="results.V" readonly style="max-width: 180px;" />
          <span op-70>V</span>
        </div>
        <div flex gap-3 items-center mb-3>
          <span style="min-width: 140px;">Current (I)</span>
          <input-copyable :value="results.I" readonly style="max-width: 180px;" />
          <span op-70>A</span>
        </div>
        <div flex gap-3 items-center mb-3>
          <span style="min-width: 140px;">Resistance (R)</span>
          <input-copyable :value="results.R" readonly style="max-width: 180px;" />
          <span op-70>Ω</span>
        </div>
        <div flex gap-3 items-center>
          <span style="min-width: 140px;">Power (P)</span>
          <input-copyable :value="results.P" readonly style="max-width: 180px;" />
          <span op-70>W</span>
        </div>
      </c-card>

      <c-card v-else>
        <n-text op-60>Enter both values above to calculate.</n-text>
      </c-card>

    </div>
  </div>
</template>
