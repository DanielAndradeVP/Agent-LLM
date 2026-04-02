<template>
  <section class="hero-banner" role="region" aria-label="Hero section">
    <div class="hero-content">
      <h1 class="hero-title">Remodeling homes with quality craftsmanship</h1>

      <div class="hero-cta">
        <Button type="call" :href="telLink">📞 Call Now</Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Button from '@/Components/Button.vue';

const phone = '+1857287035';
const telLink = `tel:${phone}`;
</script>

<style scoped>
.home-page {
  background-color: #fff;
  min-height: 100vh;
  font-family: 'Poppins', 'Inter', sans-serif;
  color: #152A48;
}

/* HERO - ajustes de layout e imagem */
.hero-banner {
  width: 100%;
  min-height: 70vh;
  position: relative;
  background-color: #EAB54C;
  background-image: url('/images/deck.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
}

/* overlay branco suave */
.hero-banner::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.45);
  z-index: 1;
}

/* conteúdo (texto e botão) */
.hero-content {
  position: relative;
  z-index: 2;
  max-width: 720px;
  padding: 40px;
  margin-left: 6%;
}

/* título — aumentado e mais forte */
.hero-title {
  color: #152A48;
  font-size: clamp(2.5rem, 4.2vw, 4rem);
  line-height: 1.1;
  margin: 0 0 25px 0;
  font-weight: 900;
  letter-spacing: -1px;
}

/* botão */
.hero-cta .btn {
  font-size: 1.2rem;
  padding: 16px 36px;
  background-color: #EAB54C !important;
  color: #152A48 !important;
  border: none;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.hero-cta .btn:hover {
  background-color: #d49a3f !important;
  transform: translateY(-2px);
}

/* Services grid (4-column layout, responsive) */
.services-section {
  background: #fff;
  padding: 48px 4%;
}

.services-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 28px;
  grid-template-columns: repeat(4, 1fr); /* 4-column desktop */
}

/* If your Card.vue already defines its own styles (border, radius, hover),
   these container rules just control layout. If not, the Card.vue styling will apply. */

/* Responsiveness */
@media (max-width: 1100px) {
  .services-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on tablet */
  }
}

@media (max-width: 600px) {
  .services-grid {
    grid-template-columns: 1fr; /* 1 column on mobile */
  }

  .hero-content {
    margin-left: 4%;
    padding: 28px;
    max-width: 90%;
  }

  .hero-title {
    font-size: clamp(1.8rem, 5.2vw, 2.6rem);
  }

  .hero-cta .btn {
    font-size: 1rem;
    padding: 12px 22px;
  }
}

/* preserve page-body as blank white area (as requested earlier) */
.page-body {
  background: #fff;
  min-height: 40vh;
}
</style>
