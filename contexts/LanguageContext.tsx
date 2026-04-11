"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "es";
type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  en: {
    "sidebar.dashboard": "Dashboard",
    "sidebar.catalog": "Catalog",
    "sidebar.albums": "Albums",
    "sidebar.songs": "Songs",
    "sidebar.campaigns": "Campaigns",
    "sidebar.posts": "Posts",
    "sidebar.queue": "Queue",
    "sidebar.assets": "Assets",
    "sidebar.settings": "Settings",
    "sidebar.import_pdf": "Import PDF",
    "sidebar.session_active": "Session Active",
    "topbar.current_campaign": "CURRENT CAMPAIGN",
    "topbar.no_active_campaign": "No active campaign",
    "topbar.day": "DAY",
    "topbar.narrative_pulse": "NARRATIVE PULSE",
    "topbar.idle": "IDLE",
    "topbar.search": "Search campaign intelligence...",
    "topbar.system_pause": "System Pause",
    "topbar.new_campaign": "New Campaign"
  },
  es: {
    "sidebar.dashboard": "Inicio",
    "sidebar.catalog": "Catálogo",
    "sidebar.albums": "Álbumes",
    "sidebar.songs": "Canciones",
    "sidebar.campaigns": "Campañas",
    "sidebar.posts": "Nuevos Posts",
    "sidebar.queue": "En Cola",
    "sidebar.assets": "Recursos",
    "sidebar.settings": "Ajustes",
    "sidebar.import_pdf": "Importar PDF",
    "sidebar.session_active": "Sesión Activa",
    "topbar.current_campaign": "CAMPAÑA ACTUAL",
    "topbar.no_active_campaign": "Sin campaña activa",
    "topbar.day": "DÍA",
    "topbar.narrative_pulse": "PULSO NARRATIVO",
    "topbar.idle": "INACTIVO",
    "topbar.search": "Buscar inteligencia en campañas...",
    "topbar.system_pause": "Pausar Sistema",
    "topbar.new_campaign": "Nueva Campaña"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("social-agent-lang") as Language;
    if (saved && (saved === "en" || saved === "es")) {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("social-agent-lang", lang);
  };

  const t = (key: string) => {
    if (!mounted) return dictionaries["en"][key] || key;
    return dictionaries[language][key] || dictionaries["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      <div style={{ visibility: mounted ? "visible" : "hidden", display: "contents" }}>
         {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
