<script setup lang="ts">
import { onMounted } from 'vue';

const url = 'https://www.digikey.com/en/resources/conversion-calculators/conversion-calculator-ohms';

onMounted(() => {
  window.location.href = url;
});
</script>

<template>
  <c-card>
    <n-space vertical align="center" :size="16">
      <n-text>Redirecting to Ohm's Law Calculator…</n-text>
      <n-a :href="url">Click here if not redirected automatically</n-a>
    </n-space>
  </c-card>
</template>
