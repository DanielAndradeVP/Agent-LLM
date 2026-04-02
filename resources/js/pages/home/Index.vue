<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { computed, onBeforeUnmount, ref } from 'vue';

interface ProductCard {
    id: string;
    name: string;
    category: string;
    description: string;
    image: string;
    images: string[];
    originalPost: string;
    metrics: {
        views: number;
        sales: number;
        likes: number;
    };
}

interface AvatarModel {
    id: string;
    name: string;
    description: string;
    image: string;
}

const products = ref<ProductCard[]>([
    {
        id: 'p1',
        name: 'Mini Blender Portatil',
        category: 'Kitchen',
        description: 'Portable blender with USB charging and one-touch mixing.',
        image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=900&q=80',
        images: [
            'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80',
        ],
        originalPost: 'https://www.tiktok.com/@tiktokshop/video/7346209112345678901',
        metrics: { views: 1284300, sales: 8412, likes: 56300 },
    },
    {
        id: 'p2',
        name: 'Posture Corrector Pro',
        category: 'Wellness',
        description: 'Adjustable posture support designed for work-from-home routines.',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80',
        images: [
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80',
        ],
        originalPost: 'https://www.tiktok.com/@tiktokshop/video/7348890012345678901',
        metrics: { views: 982104, sales: 5324, likes: 41750 },
    },
    {
        id: 'p3',
        name: 'RGB Strip Light Kit',
        category: 'Home Decor',
        description: 'Smart RGB LED strips for bedrooms and content creator setups.',
        image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80',
        images: [
            'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=1200&q=80',
        ],
        originalPost: 'https://www.tiktok.com/@tiktokshop/video/7351200012345678901',
        metrics: { views: 1531200, sales: 11290, likes: 88410 },
    },
    {
        id: 'p4',
        name: 'Face Ice Roller',
        category: 'Beauty',
        description: 'Cooling facial roller used for skin prep and depuffing routines.',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
        images: [
            'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80',
        ],
        originalPost: 'https://www.tiktok.com/@tiktokshop/video/7354980012345678901',
        metrics: { views: 745230, sales: 3902, likes: 26880 },
    },
]);

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

const selectedProductId = ref(products.value[0]?.id ?? '');
const selectedAvatarId = ref(avatars.value[0]?.id ?? '');
const uploadedFile = ref<File | null>(null);
const uploadedPreview = ref<string | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);

const voiceGender = ref('Masculino');
const voiceTone = ref('Entusiasta');
const movementPose = ref('Em pe');
const formatType = ref('Vertical 9:16');
const scenario = ref('Cozinha');

const generatedPrompt = ref('');
const generatorError = ref('');
const uiMessage = ref('');
const loading = ref(false);

const voiceGenderOptions = ['Masculino', 'Feminino'];
const voiceToneOptions = ['Entusiasta', 'Calmo', 'Premium', 'Urgente'];
const movementPoseOptions = ['Em pe', 'Sentado', 'Andando', 'Mostrando produto com as maos'];
const formatOptions = ['Vertical 9:16', 'Horizontal 16:9', 'Quadrado 1:1'];
const scenarioOptions = ['Cozinha', 'Escritorio', 'Sala moderna', 'Estudio minimalista'];

const selectedProduct = computed(() => products.value.find((product) => product.id === selectedProductId.value) ?? null);
const selectedAvatar = computed(() => avatars.value.find((avatar) => avatar.id === selectedAvatarId.value) ?? null);

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

const copyImages = async (product: ProductCard) => {
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
    if (!selectedProduct.value) {
        generatorError.value = 'Select a product before generating.';
        return;
    }

    loading.value = true;
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
        generatorError.value = 'Unable to reach OpenAI endpoint. Check your configuration.';
    } finally {
        loading.value = false;
    }
};

onBeforeUnmount(() => {
    if (uploadedPreview.value) {
        URL.revokeObjectURL(uploadedPreview.value);
    }
});
</script>

<template>
    <Head title="Dark Dashboard" />

    <div class="min-h-screen bg-[#020202] text-zinc-100">
        <div class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <header class="rounded-3xl border border-[#183a1e] bg-[#0b0b0b] p-6 shadow-[0_0_30px_rgba(57,255,20,0.12)]">
                <p class="text-xs uppercase tracking-[0.25em] text-[#39ff14]">TikTok AI Command Center</p>
                <h1 class="mt-2 text-2xl font-semibold sm:text-3xl">Dashboard Principal</h1>
                <p class="mt-2 max-w-3xl text-sm text-zinc-400">
                    Capture product insights, choose your content model, and generate an English cinematic prompt optimized for Flow, Krea, and Flux.
                </p>
            </header>

            <section class="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
                <article class="rounded-3xl border border-zinc-800 bg-[#090909] p-5">
                    <div class="mb-4 flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-semibold">1. Captador de Anuncios</h2>
                            <p class="text-xs text-zinc-400">Grid de produtos minerados do TikTok Shop</p>
                        </div>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div
                            v-for="product in products"
                            :key="product.id"
                            class="overflow-hidden rounded-2xl border transition"
                            :class="
                                selectedProductId === product.id
                                    ? 'border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.2)]'
                                    : 'border-zinc-800 hover:border-zinc-700'
                            "
                        >
                            <button class="h-44 w-full" @click="selectedProductId = product.id">
                                <img :src="product.image" :alt="product.name" class="h-full w-full object-cover" />
                            </button>

                            <div class="space-y-3 p-4">
                                <div>
                                    <h3 class="font-medium">{{ product.name }}</h3>
                                    <p class="text-xs text-zinc-400">{{ product.category }}</p>
                                </div>

                                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div class="rounded-xl border border-zinc-700 px-2 py-2">
                                        <p class="text-zinc-400">Views</p>
                                        <p class="font-semibold text-[#39ff14]">{{ formatMetric(product.metrics.views) }}</p>
                                    </div>
                                    <div class="rounded-xl border border-zinc-700 px-2 py-2">
                                        <p class="text-zinc-400">Sales</p>
                                        <p class="font-semibold text-[#39ff14]">{{ formatMetric(product.metrics.sales) }}</p>
                                    </div>
                                    <div class="rounded-xl border border-zinc-700 px-2 py-2">
                                        <p class="text-zinc-400">Likes</p>
                                        <p class="font-semibold text-[#39ff14]">{{ formatMetric(product.metrics.likes) }}</p>
                                    </div>
                                </div>

                                <div class="flex gap-2">
                                    <a
                                        :href="product.originalPost"
                                        target="_blank"
                                        rel="noreferrer"
                                        class="flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-center text-xs font-medium hover:border-[#39ff14] hover:text-[#39ff14]"
                                    >
                                        Original Post
                                    </a>
                                    <button
                                        class="flex-1 rounded-xl bg-[#39ff14] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#2fda10]"
                                        @click="copyImages(product)"
                                    >
                                        Copy Images
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>

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
            </section>

            <section class="rounded-3xl border border-zinc-800 bg-[#090909] p-6">
                <h2 class="text-xl font-semibold text-[#39ff14]">3. Prompt Generator for Flow/Krea/Flux</h2>

                <div class="mt-5 grid gap-4 md:grid-cols-3">
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
                        <span class="text-zinc-300">Movimento e Pose do Modelo</span>
                        <select v-model="movementPose" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                            <option v-for="option in movementPoseOptions" :key="option" :value="option">{{ option }}</option>
                        </select>
                    </label>

                    <label class="space-y-2 text-sm">
                        <span class="text-zinc-300">Formato e Cenario</span>
                        <div class="flex gap-2">
                            <select v-model="formatType" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                <option v-for="option in formatOptions" :key="option" :value="option">{{ option }}</option>
                            </select>
                            <select v-model="scenario" class="w-full rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm">
                                <option v-for="option in scenarioOptions" :key="option" :value="option">{{ option }}</option>
                            </select>
                        </div>
                    </label>
                </div>

                <div class="mt-5 rounded-2xl border border-zinc-800 bg-black/40 p-4">
                    <p class="text-xs uppercase tracking-[0.2em] text-zinc-500">Current context</p>
                    <p class="mt-2 text-sm text-zinc-300">
                        Product: <span class="text-[#39ff14]">{{ selectedProduct?.name }}</span> | Model:
                        <span class="text-[#39ff14]">{{ currentModelSummary.name }}</span>
                    </p>
                </div>

                <button
                    class="mt-5 w-full rounded-2xl bg-[#39ff14] px-6 py-4 text-base font-bold text-black transition hover:bg-[#2fda10] disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="loading"
                    @click="generatePrompt"
                >
                    {{ loading ? 'Gerando...' : 'Gerar Prompt de Ouro' }}
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
            </section>
        </div>
    </div>
</template>
