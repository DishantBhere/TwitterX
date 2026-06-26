export const supportedLanguages = ["en", "es", "hi", "pt", "zh", "fr"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<SupportedLanguage, string> = {
    en: "English",
    es: "Spanish",
    hi: "Hindi",
    pt: "Portuguese",
    zh: "Chinese",
    fr: "French",
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const isSupportedLanguage = (language: string): language is SupportedLanguage => {
    return supportedLanguages.includes(language as SupportedLanguage);
};
