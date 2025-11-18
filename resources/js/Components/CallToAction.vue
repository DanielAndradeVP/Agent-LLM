<template>
  <section class="cta-section" role="region" aria-label="Ready to Begin Your Project?">
    <div class="cta-inner container">
      <!-- ícone -->
      <div class="cta-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="none" fill="#EAB54C"/>
          <path d="M7 2v4M17 2v4" stroke="#0D2B4A" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="8.5" cy="11.5" r="0.9" fill="#0D2B4A"/>
          <circle cx="12" cy="11.5" r="0.9" fill="#0D2B4A"/>
          <circle cx="15.5" cy="11.5" r="0.9" fill="#0D2B4A"/>
          <path d="M7 15h10" stroke="#0D2B4A" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- texto -->
      <h2 class="cta-title">Ready to Begin Your Project?</h2>
      <p class="cta-subtitle">
        Schedule a personalized consultation with our experts to discuss your vision and bring it to life.
      </p>

      <!-- CTA: usa Inertia Link para SPA navigation -->
      <div class="cta-actions">
        <Link :href="href" class="cta-btn" @click="onClick">
          {{ buttonText }}
        </Link>
      </div>

      <!-- opcional: micro-copy para urgência (marketing) -->
      <p v-if="showUrgency" class="cta-urgency">Limited slots available — book your consultation this week.</p>
    </div>
  </section>
</template>

<script setup>
import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';

const props = defineProps({
  href: { type: String, default: '/schedule' },       // rota padrão
  buttonText: { type: String, default: 'Schedule a Consultation' },
  showUrgency: { type: Boolean, default: true },     // ativa micro-copy de urgência
});

const onClick = (e) => {
  // Evento simples para analytics ou debug — você pode trocar por integração real
  try { console.log('CTA clicked — navigating to', props.href); } catch (err) {}
};
</script>

<style scoped>
/* container */
.cta-section {
  padding: 56px 20px;
  display: flex;
  justify-content: center;
  background: transparent;
}

.cta-inner {
  background: #0D2B4A; /* tom escuro parecido com a imagem */
  color: #ffffff;
  border-radius: 18px;
  padding: 48px 32px;
  max-width: 1200px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(13,43,74,0.15);
  text-align: center;
  position: relative;
}

/* ícone */
.cta-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
}

/* título e subtítulo */
.cta-title {
  font-size: clamp(1.6rem, 2.8vw, 2.6rem);
  margin: 6px 0 12px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}

.cta-subtitle {
  max-width: 820px;
  margin: 0 auto 26px;
  color: rgba(255,255,255,0.9);
  font-size: 1.05rem;
  line-height: 1.6;
}

/* botão principal */
.cta-actions {
  margin-bottom: 10px;
}

.cta-btn {
  display: inline-block;
  background: #EAB54C; /* amarelo */
  color: #0D2B4A;
  font-weight: 700;
  padding: 14px 30px;
  border-radius: 999px;
  text-decoration: none;
  box-shadow: 0 6px 18px rgba(234,181,76,0.22);
  transition: transform .12s ease, box-shadow .12s ease;
  font-size: 1.05rem;
}

.cta-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(234,181,76,0.28);
}

/* micro-copy de urgência */
.cta-urgency {
  margin-top: 12px;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.8);
}

/* responsividade */
@media (max-width: 880px) {
  .cta-inner { padding: 34px 20px; border-radius: 14px; }
  .cta-title { font-size: 1.6rem; }
  .cta-subtitle { font-size: 0.98rem; padding: 0 6px; }
}

@media (max-width: 420px) {
  .cta-title { font-size: 1.4rem; }
  .cta-btn { padding: 12px 22px; font-size: 0.95rem; }
}
</style>
