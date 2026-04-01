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

    <section class="products-section">
      <h2 class="products-title">Produtos Minerados</h2>
      <p v-if="isLoadingProducts" class="products-empty">Carregando produtos...</p>
      <p v-else-if="products.length === 0" class="products-empty">Nenhum produto minerado ainda.</p>

      <div v-else class="products-grid">
        <article v-for="product in products" :key="product.id" class="product-card">
          <img :src="product.imageUrl" :alt="product.title" class="product-image" />
          <h3 class="product-title">{{ product.title }}</h3>
          <p class="product-meta">{{ product.price }} • {{ formatSales(product.salesCount) }} vendas</p>

          <Button
            type="call"
            :disabled="isGeneratingScript[product.id] || isSavingScript[product.id]"
            @click="handleGenerateVideoAI(product.id)"
          >
            {{ isGeneratingScript[product.id] ? 'Gerando roteiro...' : 'Gerar Vídeo IA' }}
          </Button>

          <label class="script-label" :for="`script-${product.id}`">Roteiro IA (editável)</label>
          <textarea
            :id="`script-${product.id}`"
            v-model="editableScripts[product.id]"
            class="script-textarea"
            placeholder="O roteiro gerado pela IA aparecerá aqui."
            rows="6"
          />

          <Button
            type="secondary"
            :disabled="isSavingScript[product.id]"
            @click="handleSaveScript(product.id)"
          >
            {{ isSavingScript[product.id] ? 'Salvando...' : 'Salvar Roteiro' }}
          </Button>
        </article>
      </div>
    </section>

    <CallToAction href="/schedule" :showUrgency="true" />

    <main class="page-body"></main>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { onMounted, ref } from 'vue';
import Header from '@/Components/Header.vue';
import HeroBanner from '@/Components/HeroBanner.vue';
import ServiceList from '@/Components/ServiceList.vue';
import RecentProjects from '@/Components/RecentProjects.vue';
import CallToAction from '@/Components/CallToAction.vue';
import Button from '@/Components/Button.vue';

type ProductItem = {
  id: string;
  title: string;
  price: string;
  salesCount: number;
  productUrl: string;
  imageUrl: string;
  description: string;
  aiScript: string | null;
};

type ProductsResponse = {
  products: ProductItem[];
};

type ScrapeResponse = {
  message: string;
  scanned: number;
  saved: number;
  updated: number;
  skippedBySales: number;
};

type GenerateScriptResponse = {
  message: string;
  productId: string;
  aiScript: string;
};

const isScraping = ref(false);
const isLoadingProducts = ref(false);
const toastMessage = ref('');
const products = ref<ProductItem[]>([]);
const editableScripts = ref<Record<string, string>>({});
const isGeneratingScript = ref<Record<string, boolean>>({});
const isSavingScript = ref<Record<string, boolean>>({});

function formatSales(salesCount: number): string {
  return new Intl.NumberFormat('pt-BR').format(salesCount);
}

function syncEditableScripts(items: ProductItem[]): void {
  const next: Record<string, string> = {};
  for (const item of items) {
    next[item.id] = item.aiScript ?? '';
  }
  editableScripts.value = next;
}

async function loadProducts(): Promise<void> {
  isLoadingProducts.value = true;
  try {
    const { data } = await axios.get<ProductsResponse>('/api/products');
    products.value = data.products;
    syncEditableScripts(data.products);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    toastMessage.value = 'Não foi possível carregar os produtos.';
  } finally {
    isLoadingProducts.value = false;
  }
}

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
    await loadProducts();
  } catch (error) {
    toastMessage.value = 'Falha ao atualizar tendências. Tente novamente.';
    console.error('Erro ao executar scraping:', error);
  } finally {
    isScraping.value = false;
  }
}

async function handleGenerateVideoAI(productId: string): Promise<void> {
  if (isGeneratingScript.value[productId]) {
    return;
  }

  isGeneratingScript.value = { ...isGeneratingScript.value, [productId]: true };
  toastMessage.value = 'Gerando roteiro com IA...';

  try {
    const { data } = await axios.post<GenerateScriptResponse>('/api/generate-script', { productId });
    editableScripts.value = { ...editableScripts.value, [productId]: data.aiScript };
    const product = products.value.find((item) => item.id === productId);
    if (product) {
      product.aiScript = data.aiScript;
    }
    toastMessage.value = data.message;
  } catch (error) {
    toastMessage.value = 'Falha ao gerar roteiro com IA.';
    console.error('Erro ao gerar roteiro:', error);
  } finally {
    isGeneratingScript.value = { ...isGeneratingScript.value, [productId]: false };
  }
}

async function handleSaveScript(productId: string): Promise<void> {
  if (isSavingScript.value[productId]) {
    return;
  }

  isSavingScript.value = { ...isSavingScript.value, [productId]: true };
  const aiScript = editableScripts.value[productId] ?? '';

  try {
    await axios.patch('/api/products', { productId, aiScript });
    const product = products.value.find((item) => item.id === productId);
    if (product) {
      product.aiScript = aiScript;
    }
    toastMessage.value = 'Roteiro salvo com sucesso.';
  } catch (error) {
    toastMessage.value = 'Falha ao salvar roteiro.';
    console.error('Erro ao salvar roteiro:', error);
  } finally {
    isSavingScript.value = { ...isSavingScript.value, [productId]: false };
  }
}

onMounted(async () => {
  await loadProducts();
});
</script>

<style scoped>
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

.products-section {
  width: min(1100px, calc(100% - 2rem));
  margin: 2rem auto;
}

.products-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.products-empty {
  margin: 0;
  color: #5a5a5a;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
}

.product-title {
  margin: 0;
  font-size: 1rem;
}

.product-meta {
  margin: 0;
  color: #4b5563;
  font-size: 0.9rem;
}

.script-label {
  font-size: 0.85rem;
  color: #374151;
  font-weight: 600;
}

.script-textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.65rem;
  font-size: 0.9rem;
  font-family: inherit;
}
</style>
