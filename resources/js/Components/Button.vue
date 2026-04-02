<template>
  <component
    :is="tag"
    :href="href"
    :class="['btn', `btn-${type}`]"
    :target="target"
    :disabled="disabled"
    v-bind="attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

const props = defineProps({
  href: { type: String, default: null },
  type: {
    type: String,
    default: 'primary',
    validator: (val: unknown) => ['primary', 'secondary', 'ai', 'cta', 'call'].includes(String(val)),
  },
  target: { type: String, default: '_self' },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md', validator: (v: unknown) => ['sm', 'md', 'lg'].includes(String(v)) }
});

const attrs = useAttrs();

const tag = computed(() => (props.href ? 'a' : 'button'));
</script>

<style scoped>
/* Base */
.btn {
  --bg: #e67e22;
  --color: #fff;
  --shadow: 0 4px 10px rgba(0,0,0,0.08);
  padding: 12px 22px;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: transform .18s ease, box-shadow .18s ease, opacity .12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  user-select: none;
  outline: none;
  background: var(--bg);
  color: var(--color);
  box-shadow: var(--shadow);
  font-family: 'Poppins', 'Inter', sans-serif;
}

/* Sizes */
.btn-sm { padding: 8px 14px; font-size: 0.85rem; border-radius: 8px; }
.btn-md { padding: 12px 22px; font-size: 0.95rem; }
.btn-lg { padding: 14px 26px; font-size: 1.05rem; }

/* Active/hover */
.btn:not(:disabled):hover { transform: translateY(-3px); opacity: 0.98; }
.btn:active:not(:disabled) { transform: translateY(0); }

/* Disabled */
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}

/* --- Variants --- */
/* Primary (fallback) */
.btn-primary {
  --bg: #e67e22;
  --color: #fff;
  --shadow: 0 6px 18px rgba(230,126,34,0.18);
}

/* Secondary (outline) */
.btn-secondary {
  --bg: transparent;
  --color: #152A48;
  border: 2px solid rgba(21,42,72,0.12);
  box-shadow: none;
}

/* AI (green) */
.btn-ai {
  --bg: #2ecc71;
  --color: #fff;
  --shadow: 0 6px 18px rgba(46,204,113,0.18);
}

/* CTA (header: amarelo #F0A742 com texto #152A48) */
.btn-cta {
  --bg: #F0A742;
  --color: #152A48;
  --shadow: 0 6px 18px rgba(240,167,66,0.15);
}

/* CALL (hero button): fundo escuro #152A48, texto branco) */
.btn-call {
  --bg: #152A48;
  --color: #ffffff;
  --shadow: 0 6px 18px rgba(21,42,72,0.18);
}

/* Allow inline CSS variables override:
   Example: <Button style="--bg: #fff; --color: #111;"> */
</style>
