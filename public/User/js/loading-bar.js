(function () {
    let container = null;
    let progressBar = null;
    let currentWidth = 0;
    let trickleInterval = null;
    let isNavigating = false;

    function initElements() {
        container = document.getElementById('page-loading-bar');
        if (container) {
            progressBar = container.querySelector('.page-loading-bar-progress');
        }
    }

    function setWidth(percentage) {
        if (!container || !progressBar) initElements();
        if (!container || !progressBar) return;

        currentWidth = percentage;
        progressBar.style.width = percentage + '%';
        container.setAttribute('aria-valuenow', Math.round(percentage));
    }

    function start() {
        if (!container || !progressBar) initElements();
        if (!container || !progressBar) return;

        isNavigating = true;
        clearInterval(trickleInterval);

        container.classList.add('is-loading');
        setWidth(15);

        trickleInterval = setInterval(() => {
            if (currentWidth < 90) {
                let increment = (92 - currentWidth) * 0.15;
                if (increment < 1) increment = 1;
                setWidth(currentWidth + increment);
            }
        }, 200);
    }

    function finish() {
        clearInterval(trickleInterval);
        if (!isNavigating && (!container || !container.classList.contains('is-loading'))) return;

        setWidth(100);

        setTimeout(() => {
            if (container) {
                container.classList.remove('is-loading');
            }
            setTimeout(() => {
                setWidth(0);
                isNavigating = false;
            }, 300);
        }, 200);
    }

    function reset() {
        clearInterval(trickleInterval);
        isNavigating = false;
        if (container) {
            container.classList.remove('is-loading');
        }
        setWidth(0);
    }

    // Intercept clicks on links for smooth navigation bar start
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // Skip modified clicks (Cmd/Ctrl/Shift/Alt + Click)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // Skip if event prevented
        if (e.defaultPrevented) return;

        // Skip target="_blank" etc.
        const target = link.getAttribute('target');
        if (target && target !== '_self') return;

        // Skip download links
        if (link.hasAttribute('download')) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Skip js links, mailto, tel, hashes
        if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') return;

        // Check if same-page anchor link or external site
        try {
            const url = new URL(link.href, window.location.href);
            if (url.origin === window.location.origin) {
                if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
                    return;
                }
            } else {
                return;
            }
        } catch (err) {
            return;
        }

        start();
    });

    // Fallback on page navigation unload
    window.addEventListener('beforeunload', () => {
        start();
    });

    // Reset when navigating back/forward from bfcache
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            reset();
        }
    });

    // Initialize on DOM Ready & handle page load completion
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initElements();
        });
    } else {
        initElements();
    }

    window.addEventListener('load', () => {
        finish();
    });
})();
