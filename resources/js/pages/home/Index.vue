<template>
  <div class="home-page">
    <Header />

    <HeroBanner />

    <ServiceList />

    <RecentProjects />

    <section class="scrape-actions">
      <Button type="ai" :disabled="isScraping" @click="handleScrape">
        {{ isScraping ? 'Buscando produtos...' : 'Atualizar Tendências' }}
      </Button>
      <p v-if="toastMessage" class="scrape-toast">{{ toastMessage }}</p>
    </section>

    <!-- nova seção CTA -->
    <CallToAction href="/schedule" :showUrgency="true" />

    <main class="page-body"></main>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';
import Header from '@/Components/Header.vue';
import HeroBanner from '@/Components/HeroBanner.vue';
import ServiceList from '@/Components/ServiceList.vue';
import RecentProjects from '@/Components/RecentProjects.vue';
import CallToAction from '@/Components/CallToAction.vue';
import Button from '@/Components/Button.vue';

const isScraping = ref(false);
const toastMessage = ref('');

type ScrapeResponse = {
  message: string;
  scanned: number;
  saved: number;
  updated: number;
  skippedBySales: number;
};

async function handleScrape(): Promise<void> {
  if (isScraping.value) {
    return;
  }

  isScraping.value = true;
  toastMessage.value = 'Buscando produtos...';

  try {
    const { data } = await axios.post<ScrapeResponse>('/api/scrape', {
      command: 'best-sellers',
    });

    toastMessage.value = `${data.message} (${data.saved} novos, ${data.updated} atualizados, ${data.skippedBySales} filtrados)`;
  } catch (error) {
    toastMessage.value = 'Falha ao atualizar tendências. Tente novamente.';
    console.error('Erro ao executar scraping:', error);
  } finally {
    isScraping.value = false;
  }
}
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

.scrape-actions {
  margin: 1.5rem auto;
  width: min(1100px, calc(100% - 2rem));
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.scrape-toast {
  font-size: 0.95rem;
  color: #152A48;
  margin: 0;
}
</style>
