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
          <p class="status-line">
            Status do vídeo:
            <strong>{{ product.videoStatus }}</strong>
          </p>

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

          <label class="script-label" :for="`webhook-${product.id}`">Webhook de conclusão (opcional)</label>
          <input
            :id="`webhook-${product.id}`"
            v-model="editableWebhookUrls[product.id]"
            class="webhook-input"
            type="url"
            placeholder="https://seu-dominio.com/api/render-video/webhook"
          />

          <Button
            type="primary"
            :disabled="
              isRenderingVideo[product.id] ||
              !editableScripts[product.id] ||
              editableScripts[product.id].trim().length === 0
            "
            @click="handleRenderVideo(product.id)"
          >
            {{ isRenderingVideo[product.id] ? 'Renderizando vídeo...' : 'Gerar Vídeo' }}
          </Button>

          <div class="progress-wrapper">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${Math.max(0, Math.min(100, product.videoProgress || 0))}%` }" />
            </div>
            <p class="progress-text">{{ product.videoProgress || 0 }}%</p>
          </div>

          <a
            v-if="product.videoUrl"
            class="download-link"
            :href="product.videoUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Vídeo
          </a>

          <video
            v-if="product.videoUrl"
            class="video-preview"
            controls
            preload="metadata"
            :src="product.videoUrl"
          />
          <p v-if="product.videoError" class="error-text">{{ product.videoError }}</p>
        </article>
      </div>
    </section>

    <CallToAction href="/schedule" :showUrgency="true" />

    <main class="page-body"></main>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { onBeforeUnmount, onMounted, ref } from 'vue';
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
  videoStatus: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  videoUrl: string | null;
  videoProgress: number;
  videoError: string | null;
  webhookUrl: string | null;
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

type RenderVideoResponse = {
  message: string;
  productId: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: number;
  videoUrl: string | null;
};

const isScraping = ref(false);
const isLoadingProducts = ref(false);
const toastMessage = ref('');
const products = ref<ProductItem[]>([]);
const editableScripts = ref<Record<string, string>>({});
const editableWebhookUrls = ref<Record<string, string>>({});
const isGeneratingScript = ref<Record<string, boolean>>({});
const isSavingScript = ref<Record<string, boolean>>({});
const isRenderingVideo = ref<Record<string, boolean>>({});
const pollingIntervals = ref<Record<string, number>>({});

function formatSales(salesCount: number): string {
  return new Intl.NumberFormat('pt-BR').format(salesCount);
}

function syncEditableScripts(items: ProductItem[]): void {
  const nextScripts: Record<string, string> = {};
  const nextWebhooks: Record<string, string> = {};
  for (const item of items) {
    nextScripts[item.id] = item.aiScript ?? '';
    nextWebhooks[item.id] = item.webhookUrl ?? '';
  }
  editableScripts.value = nextScripts;
  editableWebhookUrls.value = nextWebhooks;
}

async function loadProducts(): Promise<void> {
  isLoadingProducts.value = true;
  try {
    const { data } = await axios.get<ProductsResponse>('/api/products');
    products.value = data.products;
    syncEditableScripts(data.products);
    for (const product of data.products) {
      if (product.videoStatus === 'GENERATING') {
        startVideoPolling(product.id);
      } else {
        stopVideoPolling(product.id);
      }
    }
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

function stopVideoPolling(productId: string): void {
  const intervalId = pollingIntervals.value[productId];
  if (intervalId) {
    window.clearInterval(intervalId);
    const next = { ...pollingIntervals.value };
    delete next[productId];
    pollingIntervals.value = next;
  }
}

function startVideoPolling(productId: string): void {
  stopVideoPolling(productId);

  const intervalId = window.setInterval(async () => {
    try {
      const { data } = await axios.get<ProductsResponse>('/api/products');
      products.value = data.products;
      syncEditableScripts(data.products);

      const current = data.products.find((item) => item.id === productId);
      if (!current) {
        stopVideoPolling(productId);
        isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
        return;
      }

      if (current.videoStatus === 'COMPLETED' || current.videoStatus === 'FAILED') {
        stopVideoPolling(productId);
        isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
        toastMessage.value =
          current.videoStatus === 'COMPLETED'
            ? 'Vídeo final renderizado com sucesso.'
            : current.videoError ?? 'A renderização do vídeo falhou.';
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso do vídeo:', error);
    }
  }, 4000);

  pollingIntervals.value = { ...pollingIntervals.value, [productId]: intervalId };
}

async function handleRenderVideo(productId: string): Promise<void> {
  if (isRenderingVideo.value[productId]) {
    return;
  }

  isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: true };
  toastMessage.value = 'Iniciando renderização do vídeo...';

  try {
    const webhookUrl = editableWebhookUrls.value[productId]?.trim() || undefined;
    const { data } = await axios.post<RenderVideoResponse>('/api/render-video', { productId, webhookUrl });
    const product = products.value.find((item) => item.id === productId);
    if (product) {
      product.videoStatus = data.status;
      product.videoProgress = data.progress;
      product.videoUrl = data.videoUrl;
      if (webhookUrl) {
        product.webhookUrl = webhookUrl;
      }
    }
    toastMessage.value = data.message;

    if (data.status === 'GENERATING') {
      startVideoPolling(productId);
    } else if (data.status === 'COMPLETED') {
      isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
    } else {
      isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
      toastMessage.value = 'Falha ao renderizar vídeo.';
    }
  } catch (error) {
    isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
    toastMessage.value = 'Falha ao iniciar renderização do vídeo.';
    console.error('Erro ao renderizar vídeo:', error);
  }
}

onMounted(async () => {
  await loadProducts();
});

onBeforeUnmount(() => {
  for (const key of Object.keys(pollingIntervals.value)) {
    stopVideoPolling(key);
  }
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

.status-line {
  margin: 0;
  font-size: 0.85rem;
  color: #374151;
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

.webhook-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 0.65rem;
  font-size: 0.85rem;
}

.progress-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.progress-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e67e22, #f0a742);
  transition: width 0.25s ease;
}

.progress-text {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

.download-link {
  display: inline-block;
  font-weight: 600;
  color: #152a48;
  text-decoration: underline;
}

.video-preview {
  width: 100%;
  border-radius: 8px;
  background: #000;
}

.error-text {
  margin: 0;
  color: #b91c1c;
  font-size: 0.85rem;
}
</style>
