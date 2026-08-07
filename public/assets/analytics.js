/**
 * HOPAXI Analytics Helper
 * Handles professional event tracking for Firebase Analytics
 */

const Analytics = {
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.detectAIAgent();
        this.logEvent('page_view_custom', {
            path: window.location.pathname,
            title: document.title,
            is_ai_agent: this.isAIAgent
        });

        this.setupClickTracking();
        this.setupScrollTracking();
        this.setupLanguageTracking();
        this.setupFAQTracking();
        this.setupExternalLinkTracking();
        this.setupSectionVisibilityTracking();
        this.setupCopyTracking();
        this.setupFormTracking();
    },

    detectAIAgent() {
        const ua = navigator.userAgent.toLowerCase();
        const aiStrings = [
            'gptbot', 'chatgpt-user', 'anthropic-ai', 'claude-web', 'googlebot', 
            'bingbot', 'perplexitybot', 'yandexbot', 'applebot', 'ia_archiver',
            'mediapartners-google', 'baiduspider', 'twitterbot', 'facebookexternalhit',
            'python-requests', 'node-fetch', 'axios', 'curl', 'wget'
        ];
        
        this.isAIAgent = aiStrings.some(str => ua.includes(str));
        
        // Detection via specific features (e.g. absence of human-like navigator properties)
        if (!this.isAIAgent && (navigator.webdriver || !navigator.languages || navigator.languages.length === 0)) {
            this.isAIAgent = true;
        }

        if (this.isAIAgent) {
            this.logEvent('ai_agent_detected', {
                user_agent: navigator.userAgent,
                detection_method: navigator.webdriver ? 'webdriver' : 'pattern_match'
            });
        }
    },

    logEvent(name, params = {}) {
        // Add default parameters to all events for better attribution
        const defaultParams = {
            page_location: window.location.href,
            page_referrer: document.referrer,
            language: document.documentElement.lang || 'en',
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            is_ai_agent: this.isAIAgent || false
        };
        
        const finalParams = { ...defaultParams, ...params };

        if (typeof firebase !== 'undefined' && firebase.analytics) {
            try {
                firebase.analytics().logEvent(name, finalParams);
            } catch (e) {
                console.error('[Analytics] Error logging to Firebase:', e);
            }
        } else {
            console.warn(`[Analytics] Firebase not found for event: ${name}`, finalParams);
        }
    },

    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-analytics-event]');
            const link = e.target.closest('a');

            if (el) {
                const eventName = el.getAttribute('data-analytics-event');
                const label = el.getAttribute('data-analytics-label') || el.innerText || el.getAttribute('aria-label');
                
                this.logEvent(eventName, {
                    element_label: label,
                    element_id: el.id,
                    url: el.href
                });
            } else if (link && !link.href.includes(window.location.hostname) && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:') && !link.href.startsWith('sms:') && !link.href.startsWith('#')) {
                // Tracking external clicks that aren't explicit conversion buttons
                this.logEvent('external_link_click', {
                    url: link.href,
                    link_text: link.innerText
                });
            }
        });
    },

    setupScrollTracking() {
        let reachedPercentages = { 25: false, 50: false, 75: false, 100: false };

        const scrollHandler = () => {
            const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);

            [25, 50, 75, 100].forEach(percent => {
                if (scrollPercent >= percent && !reachedPercentages[percent]) {
                    this.logEvent('scroll_depth', { percent: percent });
                    reachedPercentages[percent] = true;
                }
            });
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
    },

    setupSectionVisibilityTracking() {
        // Track when key sections actually enter the viewport (Proof of reading/exposure)
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.logEvent('section_view', {
                            section_id: entry.target.id || entry.target.getAttribute('aria-labelledby')
                        });
                        observer.unobserve(entry.target); // Track only once per session
                    }
                });
            }, { threshold: 0.5 }); // 50% visibility

            const sectionsToTrack = [
                'services',
                'industries',
                'why',
                'clients',
                'blog',
                'contact'
            ];

            sectionsToTrack.forEach(id => {
                const el = document.getElementById(id) || document.querySelector(`[aria-labelledby="${id}"]`);
                if (el) observer.observe(el);
            });
        }
    },

    setupExternalLinkTracking() {
        // Handled in setupClickTracking by exclusion
    },

    setupLanguageTracking() {
        window.addEventListener('languageChanged', (e) => {
            this.logEvent('language_change', {
                language: e.detail.lang
            });
        });
    },

    setupFAQTracking() {
        document.querySelectorAll('details').forEach(detail => {
            detail.addEventListener('toggle', () => {
                if (detail.open) {
                    const summary = detail.querySelector('summary');
                    this.logEvent('faq_expand', {
                        question: summary ? summary.innerText : 'Unknown'
                    });
                }
            });
        });
    },

    setupCopyTracking() {
        // AI Agents (and humans) often copy specific details like phone numbers or links
        document.addEventListener('copy', () => {
            const selection = window.getSelection().toString();
            if (selection.length > 0) {
                this.logEvent('content_copy', {
                    text_snippet: selection.substring(0, 50),
                    text_length: selection.length,
                    is_ai_candidate: selection.length > 500 // Long copies are often agents
                });
            }
        });
    },

    setupFormTracking() {
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('focus', () => {
                const form = field.closest('form');
                if (form) {
                    this.logEvent('form_field_focus', {
                        form_id: form.id,
                        field_name: field.id || field.name,
                        field_type: field.type
                    });
                }
            }, { once: true });
        });
    }
};

(function bootstrapAnalytics() {
    function startWhenReady() {
        var maxWaitMs = 10000;
        var pollEveryMs = 250;
        var elapsedMs = 0;

        function tryInit() {
            if (typeof firebase !== 'undefined' && typeof firebase.analytics === 'function') {
                Analytics.init();
                return;
            }

            elapsedMs += pollEveryMs;
            if (elapsedMs >= maxWaitMs) {
                console.warn('[Analytics] Firebase analytics was not available after waiting.');
                return;
            }

            setTimeout(tryInit, pollEveryMs);
        }

        tryInit();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
    } else {
        startWhenReady();
    }
})();
