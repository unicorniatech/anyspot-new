import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "anyspot:language";
const SUPPORTED_LANGUAGES = ["cs-CZ", "en"];

const TRANSLATIONS = {
  "cs-CZ": {
    nav: {
      home: "Domů",
      howItWorks: "Jak to funguje",
      explore: "Objevovat",
      dashboard: "Nástěnka",
      partner: "Partner",
      credits: "Kredity",
      joinCustomer: "Začít",
      listStudio: "Spolupracujte s námi",
      myDashboard: "Moje nástěnka",
      partnerMode: "Partnerský režim",
      signOut: "Odhlásit se",
    },
    howItWorks: {
      pill: "Jak AnySpot funguje",
      title: "Jedno členství,",
      titleAccent: "všechna butiková studia",
      description: "AnySpot centralizuje nejlepší fitness studia a lekce do jedné jednoduché aplikace, abyste mohli cvičit bez složitostí.",
      oneMembershipTitle: "Jedno členství pro všechno",
      oneMembershipDesc: "Používejte kredity napříč různými studii, disciplínami a časy bez několika samostatných členství.",
      trackingTitle: "Přehled a sledování na jednom místě",
      trackingDesc: "Rezervace, kredity, historie a pokrok máte přehledně v dashboardu.",
      aiTitle: "Brzy: AI asistent",
      aiDesc: "Postupně přidáme AI doporučení pro lekce, rutiny a plánování podle vašich cílů.",
      cta: "Začít objevovat lekce",
    },
    language: {
      label: "Jazyk",
      czech: "Čeština",
      english: "English",
    },
    footer: {
      blurb: "Jeden pass do nejlepších boutique fitness studií ve vašem okolí. Cvičte s lehkostí, kdekoliv.",
      product: "Produkt",
      company: "Společnost",
      exploreStudios: "Objevit studia",
      classLibrary: "Knihovna lekcí",
      creditPacks: "Balíčky kreditů",
      giftCards: "Dárkové poukazy",
      about: "O nás",
      partnerWithUs: "Spolupracujte s námi",
      press: "Média",
      careers: "Kariéra",
      crafted: "Vytvořeno s důrazem.",
      moveAnywhere: "Cvičte kdekoliv.",
    },
    auth: {
      backHome: "Zpět na domovskou stránku",
      welcomeBack: "Vítejte zpět",
      customerLogin: "Přihlášení zákazníka",
      studioLogin: "Přihlášení studia",
      signInLead: "Přihlaste se a cvičte",
      anywhere: "kdekoliv",
      signInDescription: "Jeden pass do všech boutique studií. Přihlaste se e‑mailem nebo přes Google.",
      studioModeLogin: "Režim studia: budete přesměrováni do partnerského rozhraní.",
      signIn: "Přihlásit se",
      signingIn: "Přihlašování...",
      continueGoogle: "Pokračovat přes Google",
      newHere: "Jste tu poprvé?",
      createAccount: "Vytvořit účet",
      bySigningIn: "Přihlášením souhlasíte s podmínkami a ochranou soukromí. Noví členové získají 24 kreditů.",
      getStarted: "Začněte hned",
      iAmCustomer: "Jsem zákazník",
      iOwnStudio: "Vlastním studio",
      createAccountLead: "Vytvořte si",
      anyspotAccount: "AnySpot účet",
      signupDescription: "Přidejte se a získejte přístup ke lekcím napříč studii.",
      studioModeSignup: "Režim studia: po registraci vás přesměrujeme do partnerského onboardingu.",
      createAccountBtn: "Vytvořit účet",
      creatingAccount: "Vytváření účtu...",
      alreadyHaveAccount: "Už máte účet?",
      signInLink: "Přihlaste se",
    },
  },
  en: {
    nav: {
      home: "Home",
      howItWorks: "How it works",
      explore: "Explore",
      dashboard: "Dashboard",
      partner: "Partner",
      credits: "Credits",
      joinCustomer: "Get started",
      listStudio: "Work with us",
      myDashboard: "My dashboard",
      partnerMode: "Partner mode",
      signOut: "Sign out",
    },
    howItWorks: {
      pill: "How AnySpot works",
      title: "One membership,",
      titleAccent: "every boutique spot",
      description: "AnySpot centralizes classes and boutique studios into one easy experience so people can move without friction.",
      oneMembershipTitle: "One membership for all",
      oneMembershipDesc: "Use your credits across studios, disciplines, and schedules without juggling multiple memberships.",
      trackingTitle: "Tracking and dashboard included",
      trackingDesc: "Bookings, credits, history, and progress are all tracked in one dashboard.",
      aiTitle: "Soon: AI assistance",
      aiDesc: "We will progressively add AI-powered support for class recommendations, planning, and routine guidance.",
      cta: "Start exploring classes",
    },
    language: {
      label: "Language",
      czech: "Čeština",
      english: "English",
    },
    footer: {
      blurb: "One pass to the best boutique fitness studios near you. Move with intention, anywhere.",
      product: "Product",
      company: "Company",
      exploreStudios: "Explore Studios",
      classLibrary: "Class Library",
      creditPacks: "Credit Packs",
      giftCards: "Gift Cards",
      about: "About",
      partnerWithUs: "Partner With Us",
      press: "Press",
      careers: "Careers",
      crafted: "Crafted with intention.",
      moveAnywhere: "Move anywhere.",
    },
    auth: {
      backHome: "Back to home",
      welcomeBack: "Welcome back",
      customerLogin: "Customer login",
      studioLogin: "Studio login",
      signInLead: "Sign in to move",
      anywhere: "anywhere",
      signInDescription: "One pass to every boutique studio. Sign in with email or Google.",
      studioModeLogin: "Studio mode: you will be directed to the partner workspace.",
      signIn: "Sign in",
      signingIn: "Signing in...",
      continueGoogle: "Continue with Google",
      newHere: "New here?",
      createAccount: "Create an account",
      bySigningIn: "By signing in you agree to our Terms & Privacy. New members get 24 free credits.",
      getStarted: "Get started",
      iAmCustomer: "I am a customer",
      iOwnStudio: "I own a studio",
      createAccountLead: "Create your",
      anyspotAccount: "AnySpot account",
      signupDescription: "Join now and unlock access to classes across studios.",
      studioModeSignup: "Studio mode: we will route you to partner onboarding after sign up.",
      createAccountBtn: "Create account",
      creatingAccount: "Creating account...",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign in",
    },
  },
};

function normalizeLanguage(value) {
  const lower = String(value || "").toLowerCase();
  if (lower.startsWith("cs")) return "cs-CZ";
  return "en";
}

function detectInitialLanguage() {
  if (typeof window === "undefined") return "cs-CZ";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) return normalizeLanguage(saved);

  const browserPrefs = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];

  const preferred = browserPrefs.find((lang) => String(lang || "").toLowerCase().startsWith("cs"));
  return preferred ? "cs-CZ" : "en";
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = (nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    setLanguageState(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = useMemo(() => {
    const dictionary = TRANSLATIONS[language] || TRANSLATIONS.en;
    return {
      language,
      setLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (key) => getByPath(dictionary, key) ?? getByPath(TRANSLATIONS.en, key) ?? key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
