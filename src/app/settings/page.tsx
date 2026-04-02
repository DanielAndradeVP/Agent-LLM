"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";

type SettingsResponse = {
  openaiApiKey: string;
  creatomateApiKey: string;
  creatomateWebhookSecret: string;
  elevenlabsVoiceId: string;
  elevenlabsModelId: string;
  renderWebhookUrl: string;
  creditsAvailable: number;
};

type Toast = {
  visible: boolean;
  type: "success" | "error";
  message: string;
};

const EMPTY_SETTINGS: SettingsResponse = {
  openaiApiKey: "",
  creatomateApiKey: "",
  creatomateWebhookSecret: "",
  elevenlabsVoiceId: "",
  elevenlabsModelId: "eleven_multilingual_v2",
  renderWebhookUrl: "",
  creditsAvailable: 0,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message ?? "Erro ao carregar configurações");
      setSettings(data);
    } catch {
      showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleSaveSettings = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message ?? "Erro ao salvar configurações");
      showToast("Configurações salvas com sucesso.", "success");
    } catch {
      showToast("Ops! Verifique sua conexão ou configuração de API.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, settings, showToast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  return (
    <div className="home-page">
      <section className="settings-view">
        <div className="page-header">
          <div>
            <h1 className="page-title">Configurações de Integração</h1>
            <p className="page-subtitle">
              Cole suas chaves aqui. Você não precisa editar arquivos de código.
            </p>
          </div>
          <Link href="/" className="tab-btn">
            <ArrowLeft size={16} />
            Voltar ao Dashboard
          </Link>
        </div>

        {isLoading ? (
          <p className="products-empty">Carregando configurações...</p>
        ) : (
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

            <button className="primary-btn" disabled={isSaving} onClick={handleSaveSettings}>
              {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        )}
      </section>

      {toast.visible ? (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}
