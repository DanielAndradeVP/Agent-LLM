<template>
  <header class="site-header">
    <nav class="nav">
      <!-- Logo (extrema esquerda) -->
      <div class="logo">
        <img src="/images/logo.png" alt="2JJ Logo" />
      </div>

      <!-- Links + CTA à direita -->
      <ul class="menu">
        <li><a href="#">Services</a></li>
        <li><a href="#">Projects</a></li>
        <li><a href="#">Testimonials</a></li>
        <li>
          <Button type="cta" href="#estimate">AI Free Estimate</Button>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import Button from '@/Components/Button.vue';
</script>

<style scoped>
.site-header {
  background-color: #152A48; /* cor do header solicitada */
  color: white;
  padding: 16px 48px;
  font-family: 'Poppins', 'Inter', sans-serif;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

/* Logo na extrema esquerda */
.logo img {
  height: 52px;
  width: auto;
  object-fit: contain;
}

/* Menu à direita */
.menu {
  display: flex;
  align-items: center;
  gap: 28px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

@media (max-width: 880px) {
  .nav { gap: 12px; }
  .menu { gap: 14px; }
  .logo img { height: 44px; }
}
</style>
