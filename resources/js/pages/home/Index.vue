<template>
  <div class="home-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">TikTok Shop Automation</h1>
        <p class="page-subtitle">Minerar produtos, criar roteiro IA e renderizar vídeo em um fluxo guiado.</p>
      </div>
      <button class="tab-btn" :class="{ active: activeTab === 'settings' }" @click="activeTab = activeTab === 'settings' ? 'dashboard' : 'settings'">
        <Settings :size="16" />
        {{ activeTab === 'settings' ? 'Voltar ao Dashboard' : 'Configurações' }}
      </button>
    </header>

    <section v-if="activeTab === 'dashboard'" class="dashboard-view">
      <div class="summary-grid">
        <article class="summary-card">
          <div class="summary-icon"><Package :size="18" /></div>
          <div>
            <p class="summary-label">Total de Produtos Minerados</p>
            <strong class="summary-value">{{ summary.totalProducts }}</strong>
          </div>
        </article>
        <article class="summary-card">
          <div class="summary-icon"><Clapperboard :size="18" /></div>
          <div>
            <p class="summary-label">Vídeos Prontos</p>
            <strong class="summary-value">{{ summary.readyVideos }}</strong>
          </div>
        </article>
        <article class="summary-card">
          <div class="summary-icon"><Wallet :size="18" /></div>
          <div>
            <p class="summary-label">Créditos Disponíveis</p>
            <strong class="summary-value">{{ summary.creditsAvailable }}</strong>
          </div>
        </article>
      </div>

      <div class="actions-row">
        <button class="primary-btn" :disabled="isScraping" @click="handleScrape">
          <Loader2 v-if="isScraping" :size="16" class="spin" />
          <Search v-else :size="16" />
          {{ isScraping ? 'Buscando produtos...' : 'Atualizar Tendências' }}
        </button>
      </div>

      <section class="products-section">
        <p v-if="isLoadingProducts" class="products-empty">Carregando produtos...</p>
        <p v-else-if="products.length === 0" class="products-empty">Nenhum produto minerado ainda.</p>

        <div v-else class="products-grid">
          <article v-for="product in products" :key="product.id" class="product-card">
            <img :src="product.imageUrl" :alt="product.title" class="product-image" />
            <h3 class="product-title">{{ product.title }}</h3>
            <p class="product-meta">{{ product.price }} • {{ formatSales(product.salesCount) }} vendas</p>
            <p class="status-line"><strong>Status:</strong> {{ product.videoStatus }}</p>

            <button class="secondary-btn" :disabled="isGeneratingScript[product.id]" @click="handleGenerateScript(product.id)">
              <Loader2 v-if="isGeneratingScript[product.id]" :size="16" class="spin" />
              <Sparkles v-else :size="16" />
              {{ isGeneratingScript[product.id] ? 'Gerando roteiro...' : 'Gerar Roteiro IA' }}
            </button>

            <label class="field-label" :for="`script-${product.id}`">Roteiro (editável)</label>
            <textarea
              :id="`script-${product.id}`"
              v-model="editableScripts[product.id]"
              class="script-textarea"
              rows="6"
              placeholder="Gere o roteiro com IA e ajuste aqui antes do vídeo."
            />

            <button class="ghost-btn" :disabled="isSavingScript[product.id] || !canSaveScript(product.id)" @click="handleSaveScript(product.id)">
              <Loader2 v-if="isSavingScript[product.id]" :size="16" class="spin" />
              <Save v-else :size="16" />
              {{ isSavingScript[product.id] ? 'Salvando...' : 'Salvar Roteiro' }}
            </button>

            <label class="field-label" :for="`webhook-${product.id}`">Webhook de conclusão (opcional)</label>
            <input
              :id="`webhook-${product.id}`"
              v-model="editableWebhookUrls[product.id]"
              class="webhook-input"
              type="url"
              placeholder="https://seu-dominio.com/api/render-video/webhook"
            />

            <button class="primary-btn" :disabled="!canRenderVideo(product.id)" @click="handleRenderVideo(product.id)">
              <Loader2 v-if="isRenderingVideo[product.id]" :size="16" class="spin" />
              <Video v-else :size="16" />
              {{ isRenderingVideo[product.id] ? 'Renderizando vídeo...' : 'Gerar Vídeo' }}
            </button>

            <div class="progress-wrapper">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${Math.max(0, Math.min(100, product.videoProgress || 0))}%` }" />
              </div>
              <p class="progress-text">{{ product.videoProgress || 0 }}%</p>
            </div>

            <a v-if="product.videoUrl" class="download-link" :href="product.videoUrl" target="_blank" rel="noopener noreferrer">
              <Download :size="16" />
              Download Vídeo
            </a>
            <video v-if="product.videoUrl" class="video-preview" controls preload="metadata" :src="product.videoUrl" />
            <p v-if="product.videoError" class="error-text">{{ product.videoError }}</p>
          </article>
        </div>
      </section>
    </section>

    <section v-else class="settings-view">
      <h2 class="settings-title">Configurações de Integração</h2>
      <p class="settings-subtitle">Cole suas chaves aqui. Você não precisa editar arquivos de código.</p>

      <div class="settings-form">
        <label class="field-label">OpenAI API Key</label>
        <input v-model="settings.openaiApiKey" class="webhook-input" type="password" placeholder="sk-..." />

        <label class="field-label">Creatomate API Key</label>
        <input v-model="settings.creatomateApiKey" class="webhook-input" type="password" placeholder="creatomate key" />

        <label class="field-label">Creatomate Webhook Secret</label>
        <input v-model="settings.creatomateWebhookSecret" class="webhook-input" type="password" placeholder="webhook secret" />

        <label class="field-label">ElevenLabs Voice ID</label>
        <input v-model="settings.elevenlabsVoiceId" class="webhook-input" type="text" placeholder="ex: Rachel" />

        <label class="field-label">ElevenLabs Model ID</label>
        <input v-model="settings.elevenlabsModelId" class="webhook-input" type="text" placeholder="eleven_multilingual_v2" />

        <label class="field-label">Webhook URL padrão (opcional)</label>
        <input v-model="settings.renderWebhookUrl" class="webhook-input" type="url" placeholder="https://..." />

        <label class="field-label">Créditos disponíveis</label>
        <input v-model.number="settings.creditsAvailable" class="webhook-input" type="number" min="0" />

        <button class="primary-btn" :disabled="isSavingSettings" @click="handleSaveSettings">
          <Loader2 v-if="isSavingSettings" :size="16" class="spin" />
          <Save v-else :size="16" />
          {{ isSavingSettings ? 'Salvando...' : 'Salvar Configurações' }}
        </button>
      </div>
    </section>

    <transition name="fade">
      <div v-if="toast.visible" class="toast" :class="`toast-${toast.type}`">
        <component :is="toast.type === 'error' ? AlertTriangle : CheckCircle2" :size="16" />
        <span>{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import {
  AlertTriangle,
  CheckCircle2,
  Clapperboard,
  Download,
  Loader2,
  Package,
  Save,
  Search,
  Settings,
  Sparkles,
  Video,
  Wallet,
} from 'lucide-vue-next';

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

type ProductsResponse = { products: ProductItem[] };
type ScrapeResponse = { message: string; scanned: number; saved: number; updated: number; skippedBySales: number };
type GenerateScriptResponse = { message: string; productId: string; aiScript: string };
type RenderVideoResponse = { message: string; productId: string; status: 'GENERATING' | 'COMPLETED' | 'FAILED'; progress: number; videoUrl: string | null };
type SummaryResponse = { totalProducts: number; readyVideos: number; creditsAvailable: number };
type ConfigCheckResponse = { hasOpenAI: boolean; hasCreatomate: boolean; hasWebhookSecret: boolean };
type SettingsResponse = {
  openaiApiKey: string;
  creatomateApiKey: string;
  creatomateWebhookSecret: string;
  elevenlabsVoiceId: string;
  elevenlabsModelId: string;
  renderWebhookUrl: string;
  creditsAvailable: number;
};

const activeTab = ref<'dashboard' | 'settings'>('dashboard');
const isScraping = ref(false);
const isLoadingProducts = ref(false);
const isSavingSettings = ref(false);
const products = ref<ProductItem[]>([]);
const editableScripts = ref<Record<string, string>>({});
const editableWebhookUrls = ref<Record<string, string>>({});
const isGeneratingScript = ref<Record<string, boolean>>({});
const isSavingScript = ref<Record<string, boolean>>({});
const isRenderingVideo = ref<Record<string, boolean>>({});
const pollingIntervals = ref<Record<string, number>>({});
const summary = ref<SummaryResponse>({ totalProducts: 0, readyVideos: 0, creditsAvailable: 0 });
const configCheck = ref<ConfigCheckResponse>({ hasOpenAI: false, hasCreatomate: false, hasWebhookSecret: false });
const settings = ref<SettingsResponse>({
  openaiApiKey: '',
  creatomateApiKey: '',
  creatomateWebhookSecret: '',
  elevenlabsVoiceId: '',
  elevenlabsModelId: 'eleven_multilingual_v2',
  renderWebhookUrl: '',
  creditsAvailable: 0,
});

const toast = ref<{ visible: boolean; message: string; type: 'success' | 'error' }>({
  visible: false,
  message: '',
  type: 'success',
});
let toastTimeout: number | undefined;

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  toast.value = { visible: true, message, type };
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => (toast.value.visible = false), 3500);
}

function formatSales(salesCount: number): string {
  return new Intl.NumberFormat('pt-BR').format(salesCount);
}

function syncEditable(items: ProductItem[]): void {
  const scripts: Record<string, string> = {};
  const hooks: Record<string, string> = {};
  for (const item of items) {
    scripts[item.id] = item.aiScript ?? '';
    hooks[item.id] = item.webhookUrl ?? '';
  }
  editableScripts.value = scripts;
  editableWebhookUrls.value = hooks;
}

function hasScript(productId: string): boolean {
  return (editableScripts.value[productId] ?? '').trim().length > 0;
}

function canSaveScript(productId: string): boolean {
  return !isSavingScript.value[productId] && hasScript(productId);
}

function canRenderVideo(productId: string): boolean {
  if (isRenderingVideo.value[productId]) return false;
  const product = products.value.find((p) => p.id === productId);
  if (!product) return false;
  if (!configCheck.value.hasCreatomate) return false;
  if (!hasScript(productId)) return false;
  return product.videoStatus !== 'GENERATING';
}

async function loadSummary(): Promise<void> {
  const { data } = await axios.get<SummaryResponse>('/api/dashboard/summary');
  summary.value = data;
}

async function loadConfigCheck(): Promise<void> {
  const { data } = await axios.get<ConfigCheckResponse>('/api/config/check');
  configCheck.value = data;
}

async function loadSettings(): Promise<void> {
  const { data } = await axios.get<SettingsResponse>('/api/settings');
  settings.value = data;
}

async function loadProducts(): Promise<void> {
  isLoadingProducts.value = true;
  try {
    const { data } = await axios.get<ProductsResponse>('/api/products');
    products.value = data.products;
    syncEditable(data.products);
    for (const product of data.products) {
      if (product.videoStatus === 'GENERATING') startVideoPolling(product.id);
      else stopVideoPolling(product.id);
    }
  } catch {
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
  } finally {
    isLoadingProducts.value = false;
  }
}

async function refreshAll(): Promise<void> {
  await Promise.all([loadProducts(), loadSummary(), loadConfigCheck()]);
}

async function handleScrape(): Promise<void> {
  if (isScraping.value) return;
  isScraping.value = true;
  try {
    const { data } = await axios.post<ScrapeResponse>('/api/scrape', { command: 'best-sellers' });
    showToast(`${data.message} (${data.saved} novos)`, 'success');
    await refreshAll();
  } catch {
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
  } finally {
    isScraping.value = false;
  }
}

async function handleGenerateScript(productId: string): Promise<void> {
  if (isGeneratingScript.value[productId]) return;
  if (!configCheck.value.hasOpenAI) {
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
    activeTab.value = 'settings';
    return;
  }

  isGeneratingScript.value = { ...isGeneratingScript.value, [productId]: true };
  try {
    const { data } = await axios.post<GenerateScriptResponse>('/api/generate-script', { productId });
    editableScripts.value = { ...editableScripts.value, [productId]: data.aiScript };
    const product = products.value.find((p) => p.id === productId);
    if (product) product.aiScript = data.aiScript;
    showToast(data.message, 'success');
  } catch {
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
  } finally {
    isGeneratingScript.value = { ...isGeneratingScript.value, [productId]: false };
  }
}

async function handleSaveScript(productId: string): Promise<void> {
  if (!canSaveScript(productId)) return;
  isSavingScript.value = { ...isSavingScript.value, [productId]: true };
  try {
    await axios.patch('/api/products', { productId, aiScript: editableScripts.value[productId] ?? '' });
    const product = products.value.find((p) => p.id === productId);
    if (product) product.aiScript = editableScripts.value[productId] ?? '';
    showToast('Roteiro salvo com sucesso.', 'success');
  } catch {
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
  } finally {
    isSavingScript.value = { ...isSavingScript.value, [productId]: false };
  }
}

function stopVideoPolling(productId: string): void {
  const intervalId = pollingIntervals.value[productId];
  if (!intervalId) return;
  window.clearInterval(intervalId);
  const next = { ...pollingIntervals.value };
  delete next[productId];
  pollingIntervals.value = next;
}

function startVideoPolling(productId: string): void {
  stopVideoPolling(productId);
  const intervalId = window.setInterval(async () => {
    try {
      await refreshAll();
      const current = products.value.find((item) => item.id === productId);
      if (!current) return stopVideoPolling(productId);
      if (current.videoStatus === 'COMPLETED' || current.videoStatus === 'FAILED') {
        stopVideoPolling(productId);
        isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
        showToast(current.videoStatus === 'COMPLETED' ? 'Vídeo final renderizado com sucesso.' : 'Ops! Verifique sua conexão ou configuração de API', current.videoStatus === 'COMPLETED' ? 'success' : 'error');
      }
    } catch {
      showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
    }
  }, 4000);
  pollingIntervals.value = { ...pollingIntervals.value, [productId]: intervalId };
}

async function handleRenderVideo(productId: string): Promise<void> {
  if (!canRenderVideo(productId)) return;
  isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: true };
  try {
    const webhookUrl = editableWebhookUrls.value[productId]?.trim() || undefined;
    const { data } = await axios.post<RenderVideoResponse>('/api/render-video', { productId, webhookUrl });
    const product = products.value.find((p) => p.id === productId);
    if (product) {
      product.videoStatus = data.status;
      product.videoProgress = data.progress;
      product.videoUrl = data.videoUrl;
      if (webhookUrl) product.webhookUrl = webhookUrl;
    }
    showToast(data.message, 'success');
    if (data.status === 'GENERATING') startVideoPolling(productId);
    else isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
    await loadSummary();
  } catch {
    isRenderingVideo.value = { ...isRenderingVideo.value, [productId]: false };
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
  }
}

async function handleSaveSettings(): Promise<void> {
  if (isSavingSettings.value) return;
  isSavingSettings.value = true;
  try {
    await axios.patch('/api/settings', settings.value);
    await Promise.all([loadSettings(), loadConfigCheck(), loadSummary()]);
    showToast('Configurações salvas com sucesso.', 'success');
  } catch {
    showToast('Ops! Verifique sua conexão ou configuração de API', 'error');
  } finally {
    isSavingSettings.value = false;
  }
}

onMounted(async () => {
  await Promise.all([refreshAll(), loadSettings()]);
});

onBeforeUnmount(() => {
  Object.keys(pollingIntervals.value).forEach((key) => stopVideoPolling(key));
  if (toastTimeout) window.clearTimeout(toastTimeout);
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #0b1220;
  color: #e5e7eb;
  font-family: Inter, 'Poppins', sans-serif;
  padding: 1.25rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.page-title {
  margin: 0;
  font-size: 1.4rem;
}
.page-subtitle {
  margin: 0.35rem 0 0;
  color: #94a3b8;
  font-size: 0.92rem;
}
.dashboard-view,
.settings-view {
  width: min(1200px, 100%);
  margin: 0 auto;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.summary-card {
  background: #101a2c;
  border: 1px solid #1f2a44;
  border-radius: 12px;
  padding: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.summary-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #1b2944;
  color: #60a5fa;
}
.summary-label {
  margin: 0;
  color: #94a3b8;
  font-size: 0.8rem;
}
.summary-value {
  font-size: 1.2rem;
}
.actions-row {
  margin-bottom: 1rem;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 0.75rem;
}
.product-card {
  background: #101a2c;
  border: 1px solid #1f2a44;
  border-radius: 12px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px;
  background: #0f172a;
}
.product-title {
  margin: 0;
  font-size: 1rem;
}
.product-meta,
.status-line,
.products-empty,
.progress-text {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
}
.field-label {
  font-size: 0.78rem;
  color: #94a3b8;
}
.script-textarea,
.webhook-input {
  width: 100%;
  background: #0b1220;
  color: #e5e7eb;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 0.6rem;
  font-size: 0.85rem;
}
.script-textarea {
  resize: vertical;
}
.primary-btn,
.secondary-btn,
.ghost-btn,
.tab-btn,
.download-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.58rem 0.8rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
}
.primary-btn {
  background: #2563eb;
  color: #fff;
}
.secondary-btn {
  background: #0f172a;
  color: #e2e8f0;
  border-color: #334155;
}
.ghost-btn,
.tab-btn {
  background: transparent;
  color: #cbd5e1;
  border-color: #334155;
}
.tab-btn.active {
  background: #1e293b;
}
.primary-btn:disabled,
.secondary-btn:disabled,
.ghost-btn:disabled,
.tab-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
  background: #1f2937;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22d3ee);
  transition: width 0.2s ease;
}
.download-link {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}
.video-preview {
  width: 100%;
  border-radius: 10px;
  background: #000;
}
.error-text {
  margin: 0;
  color: #fca5a5;
  font-size: 0.82rem;
}
.settings-title {
  margin: 0;
}
.settings-subtitle {
  margin: 0.35rem 0 1rem;
  color: #94a3b8;
}
.settings-form {
  display: grid;
  gap: 0.5rem;
  max-width: 780px;
  background: #101a2c;
  border: 1px solid #1f2a44;
  border-radius: 12px;
  padding: 1rem;
}
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.72rem 0.9rem;
  border-radius: 10px;
  border: 1px solid;
  font-size: 0.88rem;
}
.toast-success {
  background: #052e16;
  border-color: #166534;
  color: #d1fae5;
}
.toast-error {
  background: #450a0a;
  border-color: #b91c1c;
  color: #fecaca;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
