<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

interface TikTokProductCard {
    id: string;
    product_id: string;
    name: string;
    category: string;
    description: string;
    image: string;
    images: string[];
    original_post_url: string;
    seller_link: string;
    metrics: {
        views: number;
        sales: number;
        likes: number;
    };
}

interface MinerPagination {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

interface ApiSettingsState {
    openaiConfigured: boolean;
    didConfigured: boolean;
}

interface AvatarModel {
    id: string;
    name: string;
    description: string;
    image: string;
}

const products = ref<TikTokProductCard[]>([]);
const minerPagination = ref<MinerPagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 1,
});
const loadingProducts = ref(false);
const productsError = ref('');

const selectedProductId = ref('');
const selectedAvatarId = ref('a1');
const uploadedFile = ref<File | null>(null);
const uploadedPreview = ref<string | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);

const settingsModalOpen = ref(false);
const settingsLoading = ref(false);
const settingsError = ref('');
const settingsMessage = ref('');
const apiSettingsState = ref<ApiSettingsState>({
    openaiConfigured: false,
    didConfigured: false,
});
const openaiApiKeyInput = ref('');
const didApiKeyInput = ref('');

const voiceGender = ref('Masculino');
const voiceTone = ref('Entusiasta');
const movementPose = ref('Em pe');
const formatType = ref('Vertical 9:16');
const scenario = ref('Cozinha');

const generatedPrompt = ref('');
const generatorError = ref('');
const uiMessage = ref('');
const loadingPrompt = ref(false);

const voiceGenderOptions = ['Masculino', 'Feminino'];
const voiceToneOptions = ['Entusiasta', 'Calmo', 'Premium', 'Urgente'];
const movementPoseOptions = ['Em pe', 'Sentado', 'Andando', 'Mostrando produto com as maos'];
const formatOptions = ['Vertical 9:16', 'Horizontal 16:9', 'Quadrado 1:1'];
const scenarioOptions = ['Cozinha', 'Escritorio', 'Sala moderna', 'Estudio minimalista'];

const avatars = ref<AvatarModel[]>([
    {
        id: 'a1',
        name: 'Ava Prime',
        description: 'Confident female creator with premium fashion visual identity.',
        image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'a2',
        name: 'Noah Vision',
        description: 'Modern male lifestyle model for clean UGC product narratives.',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'a3',
        name: 'Lia Flux',
        description: 'Beauty-focused model with soft light and cinematic expression.',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    },
]);

const selectedProduct = computed(() => products.value.find((product) => product.id === selectedProductId.value) ?? null);
const selectedAvatar = computed(() => avatars.value.find((avatar) => avatar.id === selectedAvatarId.value) ?? null);
const configMissing = computed(() => !apiSettingsState.value.openaiConfigured || !apiSettingsState.value.didConfigured);

const currentModelSummary = computed(() => {
    if (uploadedFile.value) {
        return {
            type: 'upload',
            name: uploadedFile.value.name,
            description: `Uploaded photo (${uploadedFile.value.type || 'image'}, ${Math.round(uploadedFile.value.size / 1024)}KB)`,
            imageUrl: uploadedPreview.value,
        };
    }

    return {
        type: 'avatar',
        name: selectedAvatar.value?.name ?? 'Default Avatar',
        description: selectedAvatar.value?.description ?? '',
        imageUrl: selectedAvatar.value?.image ?? '',
    };
});

const formatMetric = (value: number) =>
    new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);

const clearToast = () => {
    window.setTimeout(() => {
        uiMessage.value = '';
    }, 2200);
};

const fetchApiSettings = async () => {
    try {
        const response = await fetch('/api/settings', {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });
        const payload = await response.json();
        if (response.ok) {
            apiSettingsState.value = payload?.data ?? apiSettingsState.value;
        }
    } catch {
        // keep default false flags on connectivity errors
    }
};

const loadProducts = async (page = 1) => {
    loadingProducts.value = true;
    productsError.value = '';

    try {
        const response = await fetch(`/tiktok-shop/mined-ads?page=${page}&per_page=20`, {
            headers: {
                Accept: 'application/json',
            },
        });
        const payload = await response.json();

        if (!response.ok) {
            productsError.value = payload?.message ?? 'Failed to load TikTok Shop products.';
            return;
        }

        products.value = payload?.data?.items ?? [];
        minerPagination.value = payload?.data?.meta ?? minerPagination.value;
        if (!selectedProductId.value && products.value.length > 0) {
            selectedProductId.value = products.value[0].id;
        }
    } catch {
        productsError.value = 'Unable to fetch products from the TikTok Shop miner endpoint.';
    } finally {
        loadingProducts.value = false;
    }
};

const saveApiSettings = async () => {
    settingsLoading.value = true;
    settingsError.value = '';
    settingsMessage.value = '';

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                openaiApiKey: openaiApiKeyInput.value || undefined,
                didApiKey: didApiKeyInput.value || undefined,
            }),
        });
        const payload = await response.json();

        if (!response.ok) {
            settingsError.value = payload?.message ?? 'Unable to save API settings.';
            return;
        }

        apiSettingsState.value = {
            openaiConfigured: Boolean(payload?.data?.openaiConfigured),
            didConfigured: Boolean(payload?.data?.didConfigured),
        };
        settingsMessage.value = payload?.message ?? 'API keys saved securely.';
        openaiApiKeyInput.value = '';
        didApiKeyInput.value = '';
    } catch {
        settingsError.value = 'Connection error while saving API settings.';
    } finally {
        settingsLoading.value = false;
    }
};

const copyImages = async (product: TikTokProductCard) => {
    try {
        await navigator.clipboard.writeText(product.images.join('\n'));
        uiMessage.value = `Image links copied for ${product.name}.`;
        clearToast();
    } catch {
        uiMessage.value = 'Failed to copy images.';
        clearToast();
    }
};

const openFilePicker = () => {
    uploadInput.value?.click();
};

const onFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) {
        return;
    }

    if (uploadedPreview.value) {
        URL.revokeObjectURL(uploadedPreview.value);
    }

    uploadedFile.value = file;
    uploadedPreview.value = URL.createObjectURL(file);
};

const copyPrompt = async () => {
    if (!generatedPrompt.value) {
        return;
    }

    try {
        await navigator.clipboard.writeText(generatedPrompt.value);
        uiMessage.value = 'Prompt copied to clipboard.';
        clearToast();
    } catch {
        uiMessage.value = 'Failed to copy prompt.';
        clearToast();
    }
};

const generatePrompt = async () => {
    if (configMissing.value) {
        generatorError.value = 'Configuracao Necessaria: salve OpenAI e D-ID nas configuracoes (engrenagem).';
        return;
    }

    if (!selectedProduct.value) {
        generatorError.value = 'Select a mined TikTok Shop product before generating.';
        return;
    }

    loadingPrompt.value = true;
    generatorError.value = '';
    uiMessage.value = '';

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch('/prompt-generator/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                product: selectedProduct.value,
                model: currentModelSummary.value,
                settings: {
                    voiceGender: voiceGender.value,
                    voiceTone: voiceTone.value,
                    movementPose: movementPose.value,
                    formatType: formatType.value,
                    scenario: scenario.value,
                },
            }),
        });

        const payload = await response.json();
        if (!response.ok) {
            generatorError.value = payload?.message ?? 'Prompt generation failed.';
            return;
        }

        generatedPrompt.value = payload?.data?.prompt ?? '';
    } catch {
        generatorError.value = 'Unable to reach prompt generator endpoint.';
    } finally {
        loadingPrompt.value = false;
    }
};

onMounted(async () => {
    await Promise.all([fetchApiSettings(), loadProducts(1)]);
});

onBeforeUnmount(() => {
    if (uploadedPreview.value) {
        URL.revokeObjectURL(uploadedPreview.value);
    }
});
</script>

<template>
    <Head title="TikTok Shop Miner Dashboard" />

    <div class="min-h-screen bg-[#020202] text-zinc-100">
        <div class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <header class="rounded-3xl border border-[#183a1e] bg-[#0b0b0b] p-6 shadow-[0_0_30px_rgba(57,255,20,0.12)]">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="text-xs uppercase tracking-[0.25em] text-[#39ff14]">TikTok Shop Miner</p>
                        <h1 class="mt-2 text-2xl font-semibold sm:text-3xl">Dashboard Principal</h1>
                        <p class="mt-2 max-w-3xl text-sm text-zinc-400">
                            Mineracao assertiva: apenas produtos da TikTok Shop com Product ID real, seller link e base para Prompt de Ouro.
                        </p>
                    </div>

                    <button
                        class="rounded-2xl border border-zinc-700 bg-black/40 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#39ff14] hover:text-[#39ff14]"
                        @click="settingsModalOpen = true"
                    >
                        ⚙ Config API
                    </button>
                </div>

                <div
                    v-if="configMissing"
                    class="mt-4 rounded-2xl border border-yellow-600/60 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300"
                >
                    Configuracao Necessaria: salve OpenAI e D-ID na engrenagem para liberar o Gerador de Prompt.
                </div>
            </header>

            <section class="rounded-3xl border border-zinc-800 bg-[#090909] p-5">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-semibold">1. Minerador TikTok Shop (Grid Compacto)</h2>
                        <p class="text-xs text-zinc-400">
                            Exibindo {{ products.length }} de {{ minerPagination.total }} anuncios filtrados apenas da TikTok Shop.
                        </p>
                    </div>
                </div>

                <p v-if="productsError" class="mb-3 text-sm text-red-400">{{ productsError }}</p>
                <p v-if="loadingProducts" class="mb-3 text-sm text-zinc-400">Carregando anuncios reais...</p>

                <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                    <div
                        v-for="product in products"
                        :key="product.id"
                        class="overflow-hidden rounded-xl border bg-black/40 transition"
                        :class="
                            selectedProductId === product.id
                                ? 'border-[#39ff14] shadow-[0_0_14px_rgba(57,255,20,0.2)]'
                                : 'border-zinc-800 hover:border-zinc-700'
                        "
                    >
                        <button class="h-28 w-full" @click="selectedProductId = product.id">
                            <img :src="product.image" :alt="product.name" class="h-full w-full object-cover" />
                        </button>

                        <div class="space-y-2 p-3 text-xs">
                            <p class="line-clamp-1 font-semibold">{{ product.name }}</p>
                            <p class="text-zinc-400">Product ID: <span class="text-zinc-200">{{ product.product_id }}</span></p>
                            <p class="text-zinc-400">Sales: <span class="font-semibold text-[#39ff14]">{{ formatMetric(product.metrics.sales) }}</span></p>
                            <p class="text-zinc-500 line-clamp-1">{{ product.category }}</p>

                            <div class="grid grid-cols-1 gap-1">
                                <a
                                    :href="product.original_post_url"
                                    target="_blank"
                                    rel="noreferrer"
                                    class="rounded-lg border border-zinc-700 px-2 py-1 text-center hover:border-[#39ff14] hover:text-[#39ff14]"
                                >
                                    Viral Post
                                </a>
                                <a
                                    :href="product.seller_link"
                                    target="_blank"
                                    rel="noreferrer"
                                    class="rounded-lg border border-zinc-700 px-2 py-1 text-center hover:border-[#39ff14] hover:text-[#39ff14]"
                                >
                                    Seller Link
                                </a>
                                <button
                                    class="rounded-lg bg-[#39ff14] px-2 py-1 font-semibold text-black transition hover:bg-[#2fda10]"
                                    @click="copyImages(product)"
                                >
                                    Copy Images
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-5 flex items-center justify-end gap-2">
                    <button
                        class="rounded-xl border border-zinc-700 px-3 py-2 text-sm disabled:opacity-40"
                        :disabled="minerPagination.page <= 1 || loadingProducts"
                        @click="loadProducts(minerPagination.page - 1)"
                    >
                        Anterior
                    </button>
                    <span class="text-sm text-zinc-400">
                        Pagina {{ minerPagination.page }} / {{ minerPagination.total_pages }}
                    </span>
                    <button
                        class="rounded-xl border border-zinc-700 px-3 py-2 text-sm disabled:opacity-40"
                        :disabled="minerPagination.page >= minerPagination.total_pages || loadingProducts"
                        @click="loadProducts(minerPagination.page + 1)"
                    >
                        Proxima
                    </button>
                </div>
            </section>

            <section class="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
                <article class="rounded-3xl border border-zinc-800 bg-[#090909] p-5">
                    <h2 class="text-lg font-semibold">2. Seletor de Modelo (Content Studio)</h2>
                    <p class="mb-4 text-xs text-zinc-400">Model Selection + Clone from Photo</p>

                    <div class="mb-4 grid grid-cols-3 gap-3">
                        <button
                            v-for="avatar in avatars"
                            :key="avatar.id"
                            class="overflow-hidden rounded-2xl border text-left transition"
                            :class="
                                selectedAvatarId === avatar.id && !uploadedFile
                                    ? 'border-[#39ff14] shadow-[0_0_16px_rgba(57,255,20,0.2)]'
                                    : 'border-zinc-800 hover:border-zinc-700'
                            "
                            @click="
                                selectedAvatarId = avatar.id;
                                uploadedFile = null;
                                uploadedPreview = null;
                            "
                        >
                            <img :src="avatar.image" :alt="avatar.name" class="h-24 w-full object-cover" />
                            <p class="truncate px-2 py-2 text-xs font-medium">{{ avatar.name }}</p>
                        </button>
                    </div>

                    <button
                        class="flex h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition"
                        :class="uploadedFile ? 'border-[#39ff14]' : 'border-zinc-700 hover:border-[#39ff14]'"
                        @click="openFilePicker"
                    >
                        <template v-if="uploadedPreview">
                            <img :src="uploadedPreview" alt="Uploaded model" class="h-32 w-32 rounded-2xl object-cover" />
                            <p class="mt-3 text-sm font-medium text-[#39ff14]">{{ uploadedFile?.name }}</p>
                        </template>
                        <template v-else>
                            <div class="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-500 text-3xl text-[#39ff14]">+</div>
                            <p class="mt-3 text-sm font-medium">Clone from Photo</p>
                            <p class="text-xs text-zinc-400">Click to open file selector</p>
                        </template>
                    </button>
                    <input ref="uploadInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                </article>

                <article class="rounded-3xl border border-zinc-800 bg-[#090909] p-6">
                    <h2 class="text-xl font-semibold text-[#39ff14]">3. Prompt Generator for Flow/Krea/Flux</h2>

                    <div class="mt-5 grid gap-4 md:grid-cols-2">
                        <label class="space-y-2 text-sm">
                            <span class="text-zinc-300">Genero e Tom da Voz</span>
                            <div class="flex gap-2">
                                <select v-model="voiceGender" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                    <option v-for="option in voiceGenderOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                                <select v-model="voiceTone" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                    <option v-for="option in voiceToneOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                            </div>
                        </label>

                        <label class="space-y-2 text-sm">
                            <span class="text-zinc-300">Movimento e Pose</span>
                            <select v-model="movementPose" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                <option v-for="option in movementPoseOptions" :key="option" :value="option">{{ option }}</option>
                            </select>
                        </label>

                        <label class="space-y-2 text-sm">
                            <span class="text-zinc-300">Formato</span>
                            <select v-model="formatType" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                <option v-for="option in formatOptions" :key="option" :value="option">{{ option }}</option>
                            </select>
                        </label>

                        <label class="space-y-2 text-sm">
                            <span class="text-zinc-300">Cenario</span>
                            <select v-model="scenario" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                <option v-for="option in scenarioOptions" :key="option" :value="option">{{ option }}</option>
                            </select>
                        </label>
                    </div>

                    <div class="mt-5 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                        <p class="text-xs uppercase tracking-[0.2em] text-zinc-500">Contexto real selecionado</p>
                        <p class="mt-2 text-sm text-zinc-300">
                            Produto: <span class="text-[#39ff14]">{{ selectedProduct?.name || 'Nenhum' }}</span> |
                            Product ID: <span class="text-[#39ff14]">{{ selectedProduct?.product_id || 'N/A' }}</span> |
                            Modelo: <span class="text-[#39ff14]">{{ currentModelSummary.name }}</span>
                        </p>
                    </div>

                    <button
                        class="mt-5 w-full rounded-2xl bg-[#39ff14] px-6 py-4 text-base font-bold text-black transition hover:bg-[#2fda10] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="loadingPrompt"
                        @click="generatePrompt"
                    >
                        {{ loadingPrompt ? 'Gerando...' : 'Gerar Prompt de Ouro' }}
                    </button>

                    <p v-if="generatorError" class="mt-3 text-sm text-red-400">{{ generatorError }}</p>
                    <p v-if="uiMessage" class="mt-3 text-sm text-[#39ff14]">{{ uiMessage }}</p>

                    <div class="mt-5 space-y-3">
                        <textarea
                            v-model="generatedPrompt"
                            rows="10"
                            placeholder="Your generated prompt will appear here..."
                            class="w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-[#39ff14]"
                        />

                        <button
                            class="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium transition hover:border-[#39ff14] hover:text-[#39ff14]"
                            @click="copyPrompt"
                        >
                            Copiar Prompt
                        </button>
                    </div>
                </article>
            </section>
        </div>
    </div>

    <div
        v-if="settingsModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        @click.self="settingsModalOpen = false"
    >
        <div class="w-full max-w-xl rounded-2xl border border-zinc-700 bg-[#0b0b0b] p-6">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold">Configurar APIs (OpenAI + D-ID)</h3>
                <button class="text-zinc-400 hover:text-white" @click="settingsModalOpen = false">✕</button>
            </div>

            <p class="mb-4 text-sm text-zinc-400">
                As chaves sao salvas com criptografia no backend. Deixe em branco para manter valor atual.
            </p>

            <div class="space-y-3">
                <label class="block text-sm">
                    <span class="mb-1 block text-zinc-300">OpenAI API Key</span>
                    <input
                        v-model="openaiApiKeyInput"
                        type="password"
                        placeholder="sk-..."
                        class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2"
                    />
                </label>

                <label class="block text-sm">
                    <span class="mb-1 block text-zinc-300">D-ID API Key</span>
                    <input
                        v-model="didApiKeyInput"
                        type="password"
                        placeholder="did_..."
                        class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2"
                    />
                </label>
            </div>

            <div class="mt-3 text-xs text-zinc-500">
                Status atual:
                <span :class="apiSettingsState.openaiConfigured ? 'text-[#39ff14]' : 'text-yellow-300'">
                    OpenAI {{ apiSettingsState.openaiConfigured ? 'OK' : 'Pendente' }}
                </span>
                |
                <span :class="apiSettingsState.didConfigured ? 'text-[#39ff14]' : 'text-yellow-300'">
                    D-ID {{ apiSettingsState.didConfigured ? 'OK' : 'Pendente' }}
                </span>
            </div>

            <p v-if="settingsError" class="mt-3 text-sm text-red-400">{{ settingsError }}</p>
            <p v-if="settingsMessage" class="mt-3 text-sm text-[#39ff14]">{{ settingsMessage }}</p>

            <div class="mt-5 flex justify-end gap-2">
                <button
                    class="rounded-xl border border-zinc-700 px-4 py-2 text-sm"
                    @click="settingsModalOpen = false"
                >
                    Fechar
                </button>
                <button
                    class="rounded-xl bg-[#39ff14] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                    :disabled="settingsLoading"
                    @click="saveApiSettings"
                >
                    {{ settingsLoading ? 'Salvando...' : 'Salvar Chaves' }}
                </button>
            </div>
        </div>
    </div>
</template>
