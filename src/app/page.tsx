"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
} from "lucide-react";

type VideoStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

type ProductItem = {
  id: string;
  title: string;
  price: string;
  salesCount: number;
  productUrl: string;
  imageUrl: string;
  description: string;
  aiScript: string | null;
  videoStatus: VideoStatus;
  videoUrl: string | null;
  videoProgress: number;
  videoError: string | null;
  webhookUrl: string | null;
};

type SummaryResponse = {
  totalProducts: number;
  readyVideos: number;
  creditsAvailable: number;
};

type SettingsResponse = {
  openaiApiKey: string;
  creatomateApiKey: string;
  creatomateWebhookSecret: string;
  elevenlabsVoiceId: string;
  elevenlabsModelId: string;
  renderWebhookUrl: string;
  creditsAvailable: number;
};

type ConfigCheckResponse = {
  hasOpenAI: boolean;
  hasCreatomate: boolean;
  hasWebhookSecret: boolean;
};

type Toast = {
  visible: boolean;
  type: "success" | "error";
  message: string;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [summary, setSummary] = useState<SummaryResponse>({
    totalProducts: 0,
    readyVideos: 0,
    creditsAvailable: 0,
  });
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [configCheck, setConfigCheck] = useState<ConfigCheckResponse>({
    hasOpenAI: false,
    hasCreatomate: false,
    hasWebhookSecret: false,
  });
  const [settings, setSettings] = useState<SettingsResponse>({
    openaiApiKey: "",
    creatomateApiKey: "",
    creatomateWebhookSecret: "",
    elevenlabsVoiceId: "",
    elevenlabsModelId: "eleven_multilingual_v2",
    renderWebhookUrl: "",
    creditsAvailable: 0,
  });
  const [editableScripts, setEditableScripts] = useState<Record<string, string>>({});
  const [editableWebhookUrls, setEditableWebhookUrls] = useState<Record<string, string>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState<Record<string, boolean>>({});
  const [isSavingScript, setIsSavingScript] = useState<Record<string, boolean>>({});
  const [isRenderingVideo, setIsRenderingVideo] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<Toast>({
    visible: false,
    type: "success",
    message: "",
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, type, message });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }, []);

  const loadSummary = useCallback(async () => {
    const response = await fetch("/api/dashboard/summary");
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message ?? "Erro no resumo");
    setSummary(data);
  }, []);

  const loadConfigCheck = useCallback(async () => {
    const response = await fetch("/api/config/check");
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message ?? "Erro ao validar configurações");
    setConfigCheck(data);
  }, []);

  const loadSettings = useCallback(async () => {
    const response = await fetch("/api/settings");
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message ?? "Erro ao carregar configurações");
    setSettings(data);
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message ?? "Erro ao carregar produtos");
      setProducts(data.products);
      setEditableScripts(
        Object.fromEntries(
          data.products.map((product: ProductItem) => [product.id, product.aiScript ?? ""]),
        ),
      );
      setEditableWebhookUrls(
        Object.fromEntries(
          data.products.map((product: ProductItem) => [product.id, product.webhookUrl ?? ""]),
        ),
      );
    } catch {
      showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [showToast]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadConfigCheck(), loadProducts()]);
  }, [loadSummary, loadConfigCheck, loadProducts]);

  useEffect(() => {
    void Promise.all([refreshAll(), loadSettings()]);
  }, [refreshAll, loadSettings]);

  useEffect(() => {
    const generating = products.some((product) => product.videoStatus === "GENERATING");
    if (!generating) return;
    const interval = window.setInterval(() => {
      void refreshAll();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [products, refreshAll]);

  const canSaveScript = useCallback(
    (productId: string) =>
      !isSavingScript[productId] &&
      (editableScripts[productId] ?? "").trim().length > 0,
    [editableScripts, isSavingScript],
  );

  const canRenderVideo = useCallback(
    (productId: string) => {
      const product = products.find((item) => item.id === productId);
      if (!product) return false;
      if (!configCheck.hasCreatomate) return false;
      if ((editableScripts[productId] ?? "").trim().length === 0) return false;
      if (isRenderingVideo[productId]) return false;
      return product.videoStatus !== "GENERATING";
    },
    [configCheck.hasCreatomate, editableScripts, isRenderingVideo, products],
  );

  const handleScrape = useCallback(async () => {
    if (isScraping) return;
    setIsScraping(true);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "best-sellers" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message);
      showToast(`${data.message} (${data.saved} novos)`, "success");
      await refreshAll();
    } catch {
      showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
    } finally {
      setIsScraping(false);
    }
  }, [isScraping, refreshAll, showToast]);

  const handleGenerateScript = useCallback(
    async (productId: string) => {
      if (isGeneratingScript[productId]) return;
      if (!configCheck.hasOpenAI) {
        showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
        setActiveTab("settings");
        return;
      }
      setIsGeneratingScript((prev) => ({ ...prev, [productId]: true }));
      try {
        const response = await fetch("/api/generate-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message);
        setEditableScripts((prev) => ({ ...prev, [productId]: data.aiScript }));
        setProducts((prev) =>
          prev.map((item) =>
            item.id === productId ? { ...item, aiScript: data.aiScript } : item,
          ),
        );
        showToast(data.message, "success");
      } catch {
        showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
      } finally {
        setIsGeneratingScript((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [configCheck.hasOpenAI, isGeneratingScript, showToast],
  );

  const handleSaveScript = useCallback(
    async (productId: string) => {
      if (!canSaveScript(productId)) return;
      setIsSavingScript((prev) => ({ ...prev, [productId]: true }));
      try {
        const response = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            aiScript: editableScripts[productId] ?? "",
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message);
        showToast("Roteiro salvo com sucesso.", "success");
      } catch {
        showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
      } finally {
        setIsSavingScript((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [canSaveScript, editableScripts, showToast],
  );

  const handleRenderVideo = useCallback(
    async (productId: string) => {
      if (!canRenderVideo(productId)) return;
      setIsRenderingVideo((prev) => ({ ...prev, [productId]: true }));
      try {
        const webhookUrl = editableWebhookUrls[productId]?.trim() || undefined;
        const response = await fetch("/api/render-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, webhookUrl }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message);
        showToast(data.message, "success");
        await refreshAll();
      } catch {
        showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
      } finally {
        setIsRenderingVideo((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [canRenderVideo, editableWebhookUrls, refreshAll, showToast],
  );

  const handleSaveSettings = useCallback(async () => {
    if (isSavingSettings) return;
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message);
      showToast("Configurações salvas com sucesso.", "success");
      await Promise.all([loadSettings(), loadConfigCheck(), loadSummary()]);
    } catch {
      showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  }, [isSavingSettings, loadConfigCheck, loadSettings, loadSummary, settings, showToast]);

  const emptyState = useMemo(
    () => (
      <p className="products-empty">
        {isLoadingProducts ? "Carregando produtos..." : "Nenhum produto minerado ainda."}
      </p>
    ),
    [isLoadingProducts],
  );

  return (
    <div className="home-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">TikTok Shop Automation</h1>
          <p className="page-subtitle">
            Minerar produtos, criar roteiro IA e renderizar vídeo em um fluxo guiado.
          </p>
        </div>
        <button
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab((prev) => (prev === "settings" ? "dashboard" : "settings"))}
        >
          <Settings size={16} />
          {activeTab === "settings" ? "Voltar ao Dashboard" : "Configurações"}
        </button>
      </header>

      {activeTab === "dashboard" ? (
        <section className="dashboard-view">
          <div className="summary-grid">
            <article className="summary-card">
              <div className="summary-icon">
                <Package size={18} />
              </div>
              <div>
                <p className="summary-label">Total de Produtos Minerados</p>
                <strong className="summary-value">{summary.totalProducts}</strong>
              </div>
            </article>
            <article className="summary-card">
              <div className="summary-icon">
                <Clapperboard size={18} />
              </div>
              <div>
                <p className="summary-label">Vídeos Prontos</p>
                <strong className="summary-value">{summary.readyVideos}</strong>
              </div>
            </article>
            <article className="summary-card">
              <div className="summary-icon">
                <Wallet size={18} />
              </div>
              <div>
                <p className="summary-label">Créditos Disponíveis</p>
                <strong className="summary-value">{summary.creditsAvailable}</strong>
              </div>
            </article>
          </div>

          <div className="actions-row">
            <button className="primary-btn" disabled={isScraping} onClick={handleScrape}>
              {isScraping ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              {isScraping ? "Buscando produtos..." : "Atualizar Tendências"}
            </button>
          </div>

          {products.length === 0 ? (
            emptyState
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <article key={product.id} className="product-card">
                  <Image
                    src={product.imageUrl || "https://placehold.co/640x640?text=Produto"}
                    alt={product.title}
                    className="product-image"
                    width={640}
                    height={640}
                    unoptimized
                  />
                  <h3 className="product-title">{product.title}</h3>
                  <p className="product-meta">
                    {product.price} •{" "}
                    {new Intl.NumberFormat("pt-BR").format(product.salesCount)} vendas
                  </p>
                  <p className="status-line">
                    <strong>Status:</strong> {product.videoStatus}
                  </p>

                  <button
                    className="secondary-btn"
                    disabled={isGeneratingScript[product.id]}
                    onClick={() => handleGenerateScript(product.id)}
                  >
                    {isGeneratingScript[product.id] ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {isGeneratingScript[product.id]
                      ? "Gerando roteiro..."
                      : "Gerar Roteiro IA"}
                  </button>

                  <label className="field-label" htmlFor={`script-${product.id}`}>
                    Roteiro (editável)
                  </label>
                  <textarea
                    id={`script-${product.id}`}
                    className="script-textarea"
                    rows={6}
                    value={editableScripts[product.id] ?? ""}
                    onChange={(event) =>
                      setEditableScripts((prev) => ({
                        ...prev,
                        [product.id]: event.target.value,
                      }))
                    }
                  />

                  <button
                    className="ghost-btn"
                    disabled={!canSaveScript(product.id)}
                    onClick={() => handleSaveScript(product.id)}
                  >
                    {isSavingScript[product.id] ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isSavingScript[product.id] ? "Salvando..." : "Salvar Roteiro"}
                  </button>

                  <label className="field-label" htmlFor={`webhook-${product.id}`}>
                    Webhook de conclusão (opcional)
                  </label>
                  <input
                    id={`webhook-${product.id}`}
                    className="webhook-input"
                    type="url"
                    value={editableWebhookUrls[product.id] ?? ""}
                    onChange={(event) =>
                      setEditableWebhookUrls((prev) => ({
                        ...prev,
                        [product.id]: event.target.value,
                      }))
                    }
                  />

                  <button
                    className="primary-btn"
                    disabled={!canRenderVideo(product.id)}
                    onClick={() => handleRenderVideo(product.id)}
                  >
                    {isRenderingVideo[product.id] ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Video size={16} />
                    )}
                    {isRenderingVideo[product.id]
                      ? "Renderizando vídeo..."
                      : "Gerar Vídeo"}
                  </button>

                  <div className="progress-wrapper">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, product.videoProgress ?? 0),
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="progress-text">{product.videoProgress ?? 0}%</p>
                  </div>

                  {product.videoUrl ? (
                    <>
                      <a
                        className="download-link"
                        href={product.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download size={16} /> Download Vídeo
                      </a>
                      <video
                        className="video-preview"
                        controls
                        preload="metadata"
                        src={product.videoUrl}
                      />
                    </>
                  ) : null}

                  {product.videoError ? (
                    <p className="error-text">{product.videoError}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="settings-view">
          <h2 className="settings-title">Configurações de Integração</h2>
          <p className="settings-subtitle">
            Cole suas chaves aqui. Você não precisa editar arquivos de código.
          </p>

          <div className="settings-form">
            <label className="field-label">OpenAI API Key</label>
            <input
              className="webhook-input"
              type="password"
              value={settings.openaiApiKey}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, openaiApiKey: event.target.value }))
              }
            />

            <label className="field-label">Creatomate API Key</label>
            <input
              className="webhook-input"
              type="password"
              value={settings.creatomateApiKey}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, creatomateApiKey: event.target.value }))
              }
            />

            <label className="field-label">Creatomate Webhook Secret</label>
            <input
              className="webhook-input"
              type="password"
              value={settings.creatomateWebhookSecret}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  creatomateWebhookSecret: event.target.value,
                }))
              }
            />

            <label className="field-label">ElevenLabs Voice ID</label>
            <input
              className="webhook-input"
              type="text"
              value={settings.elevenlabsVoiceId}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, elevenlabsVoiceId: event.target.value }))
              }
            />

            <label className="field-label">ElevenLabs Model ID</label>
            <input
              className="webhook-input"
              type="text"
              value={settings.elevenlabsModelId}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, elevenlabsModelId: event.target.value }))
              }
            />

            <label className="field-label">Webhook URL padrão (opcional)</label>
            <input
              className="webhook-input"
              type="url"
              value={settings.renderWebhookUrl}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, renderWebhookUrl: event.target.value }))
              }
            />

            <label className="field-label">Créditos disponíveis</label>
            <input
              className="webhook-input"
              type="number"
              min={0}
              value={settings.creditsAvailable}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  creditsAvailable: Number(event.target.value || 0),
                }))
              }
            />

            <button
              className="primary-btn"
              disabled={isSavingSettings}
              onClick={handleSaveSettings}
            >
              {isSavingSettings ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Save size={16} />
              )}
              {isSavingSettings ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </section>
      )}

      {toast.visible ? (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}
