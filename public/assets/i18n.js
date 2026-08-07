class I18n {
    constructor() {
        this.languages = ['en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja'];
        this.defaultLanguage = 'en';
        this.currentLanguage = this.detectLanguage();
        this.translations = {};
        
        // Apply basic HTML lang immediately
        this.updateHTMLLang();
    }

    detectLanguage() {
        // 1. Check URL parameters (?lang=es) - Highest priority
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = this.normalizeLanguage(urlParams.get('lang'));
        if (langParam) {
            localStorage.setItem('preferred_language', langParam);
            return langParam;
        }

        // 2. Check localStorage (explicit user preference from previous visits)
        const saved = this.normalizeLanguage(localStorage.getItem('preferred_language'));
        if (saved) return saved;

        // 3. Check System/Browser language preferences (Automatic preselection)
        // navigator.languages returns an array of preferred languages in order of preference
        const preferredLanguages = navigator.languages || [navigator.language || navigator.userLanguage];
        if (preferredLanguages) {
            for (const fullLang of preferredLanguages) {
                if (!fullLang) continue;
                const lang = this.normalizeLanguage(fullLang);
                if (lang) return lang;
            }
        }

        // 4. Default fallback
        return this.defaultLanguage;
    }

    async init() {
        await this.loadTranslations(this.currentLanguage);
        this.applyTranslations();
        this.updateHTMLLang();
        this.setupSwitcher();
    }

    async loadTranslations(lang) {
        if (this.translations[lang]) return;
        try {
            const response = await fetch(`./locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error(`Could not load translations for ${lang}:`, error);

            if (lang !== this.defaultLanguage) {
                await this.loadTranslations(this.defaultLanguage);
                this.translations[lang] = this.translations[this.defaultLanguage] || {};
            }
        }
    }

    async switchLanguage(lang) {
        const normalized = this.normalizeLanguage(lang);
        if (!normalized) return;
        this.currentLanguage = normalized;
        localStorage.setItem('preferred_language', normalized);
        
        // Remove the lang parameter from URL without reloading
        const url = new URL(window.location);
        url.searchParams.delete('lang');
        window.history.replaceState({}, '', url);

        await this.loadTranslations(normalized);
        this.applyTranslations();
        this.updateHTMLLang();
        this.updateActiveSwitcher(normalized);
        // Trigger a custom event for other components if needed
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: normalized } }));
    }

    updateHTMLLang() {
        document.documentElement.lang = this.currentLanguage;
    }

    updateActiveSwitcher(lang) {
        const switchers = document.querySelectorAll('[data-lang-switch]');
        switchers.forEach(btn => {
            if (btn.getAttribute('data-lang-switch') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const selects = document.querySelectorAll('[data-lang-select]');
        selects.forEach(select => {
            if (select.value !== lang) {
                select.value = lang;
            }
        });
    }

    normalizeLanguage(rawLang) {
        if (!rawLang || typeof rawLang !== 'string') return null;
        const cleaned = rawLang.trim().toLowerCase().replace('_', '-');
        if (!cleaned) return null;
        const base = cleaned.split('-')[0];
        if (this.languages.includes(base)) return base;
        return null;
    }

    applyTranslations() {
        const data = this.translations[this.currentLanguage];
        if (!data) return;

        const page = document.body?.getAttribute('data-page') || 'index';
        const pageData = (data.pages && data.pages[page]) || {};
        const pageMeta = pageData.meta || data.meta || null;

        // Meta tags
        if (pageMeta) {
            document.title = pageMeta.title;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && pageMeta.description) metaDesc.content = pageMeta.description;
            
            // Open Graph & Twitter
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle && pageMeta.title) ogTitle.content = pageMeta.title;
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc && pageMeta.description) ogDesc.content = pageMeta.description;
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (twitterTitle && pageMeta.title) twitterTitle.content = pageMeta.title;
            const twitterDesc = document.querySelector('meta[name="twitter:description"]');
            if (twitterDesc && pageMeta.description) twitterDesc.content = pageMeta.description;
        }

        // Search for all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.getNestedValue(data, key);
            if (translation) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else if (el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });

        // Search for all elements with data-i18n-attr attribute
        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(el => {
            const attrConfig = el.getAttribute('data-i18n-attr');
            // Format: "attr1:key1;attr2:key2"
            const pairs = attrConfig.split(';');
            pairs.forEach(pair => {
                const [attr, key] = pair.split(':');
                if (attr && key) {
                    const translation = this.getNestedValue(data, key.trim());
                    if (translation) {
                        el.setAttribute(attr.trim(), translation);
                    }
                }
            });
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }

    setupSwitcher() {
        const switchers = document.querySelectorAll('[data-lang-switch]');
        switchers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang-switch');
                this.switchLanguage(lang);
            });
        });

        const selects = document.querySelectorAll('[data-lang-select]');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                this.switchLanguage(select.value);
            });
        });
        
        // Initial active state
        this.updateActiveSwitcher(this.currentLanguage);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
    window.i18n.init();
});
