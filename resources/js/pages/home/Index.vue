<template>
  <div class="home-page">
    <Header />

    <HeroBanner />

    <ServiceList />

    <RecentProjects />

    <!-- nova seção CTA -->
    <CallToAction href="/schedule" :showUrgency="true" />

    <main class="page-body"></main>
  </div>
</template>

<script setup>
import Header from '@/Components/Header.vue';
import HeroBanner from '@/Components/HeroBanner.vue';
import ServiceList from '@/Components/ServiceList.vue';
import RecentProjects from '@/Components/RecentProjects.vue';
import CallToAction from '@/Components/CallToAction.vue';
</script>

<style scoped>
/* mantive só o essencial aqui — estilos da seção estão no componente */
.home-page {
  background-color: #fff;
  min-height: 100vh;
  font-family: 'Poppins', 'Inter', sans-serif;
  color: #152A48;
}

.page-body {
  background: #fff;
  min-height: 40vh;
}
</style>
