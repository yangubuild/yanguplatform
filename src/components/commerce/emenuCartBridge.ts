/**
 * emenuCartBridge — Generates a <script> snippet to inject into published emenu HTML.
 * Adds "Add to Cart" buttons to menu item cards and communicates with parent React shell
 * via postMessage.
 *
 * Uses data-product-role attributes when available, falls back to heuristics.
 * Reads per-card CTA config from data-product-cta / data-product-button-text attributes.
 * Reads global button styles from data-product-button-color etc.
 */

/** Returns the raw JavaScript code (no <script> wrapper) for the cart bridge */
export function buildCartBridgeCode(configuredCurrency: string = "USD"): string {
  return `
(function() {
  var CONFIGURED_CURRENCY = ${JSON.stringify(configuredCurrency)};

  function normalizeText(t) { return (t || '').replace(/\\s+/g, ' ').trim(); }

  function isPriceText(text) {
    var compact = normalizeText(text);
    if (!compact || compact.length > 30) return false;
    var hasCurrency = /[\\$€£₦]/.test(compact) || /(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR)/i.test(compact) || /^R\\s*\\d/.test(compact) || /\\d\\s*R$/.test(compact);
    return hasCurrency && /\\d/.test(compact);
  }

  function extractPrice(text) {
    var compact = normalizeText(text);
    if (!compact) return '';
    var matches = compact.match(/(?:[A-Z]{3}\\s*[\\d,]+(?:\\.\\d+)?|[\\$€£₦]\\s*[\\d,]+(?:\\.\\d+)?|R\\s*[\\d,]+(?:\\.\\d+)?)/ig);
    return matches && matches.length ? normalizeText(matches[matches.length - 1]) : '';
  }

  function parsePriceNum(text) {
    var numStr = normalizeText(text).replace(/^(?:[A-Z]{3}|R)\\s*/i, '').replace(/[\\$€£₦\\s]/g, '').replace(/,/g, '').trim();
    return parseFloat(numStr);
  }

  function findNameEl(card) {
    var el = card.querySelector('[data-product-role="title"]');
    if (el) return el;
    var headings = card.querySelectorAll('h1, h2, h3, h4, h5, [style*="font-weight:700"], [style*="font-weight:600"], [style*="font-weight: 700"], [style*="font-weight: 600"]');
    for (var i = 0; i < headings.length; i++) {
      var text = normalizeText(headings[i].textContent);
      if (text && !isPriceText(text)) return headings[i];
    }
    return null;
  }

  function findPriceEl(card) {
    var el = card.querySelector('[data-product-role="price"]');
    if (el) return el;
    var spans = card.querySelectorAll('span, p, div, strong');
    for (var i = 0; i < spans.length; i++) {
      var text = normalizeText(spans[i].textContent);
      if (isPriceText(text)) return spans[i];
    }
    return null;
  }

  function isProductCard(el) {
    if (['DIV','ARTICLE','LI'].indexOf(el.tagName) === -1) return false;
    var nested = el.querySelectorAll('[data-product-card="true"]');
    if (nested.length > 0) return false;
    if (el.getAttribute('data-product-card') === 'true') return true;
    // Allow cards even without a valid price element — price can be recovered later
    return Boolean(el.querySelector('img') && findNameEl(el));
  }

  function getButtonStyle(card) {
    var color = card.getAttribute('data-product-button-color') || document.body.getAttribute('data-product-button-color') || '#10b981';
    var radius = card.getAttribute('data-product-button-radius') || document.body.getAttribute('data-product-button-radius') || '8px';
    var padding = card.getAttribute('data-product-button-padding') || document.body.getAttribute('data-product-button-padding') || '8px 0';
    var fontSize = card.getAttribute('data-product-button-font-size') || document.body.getAttribute('data-product-button-font-size') || '14px';
    return { color: color, radius: radius, padding: padding, fontSize: fontSize };
  }

  function initCartBridge() {
    document.querySelectorAll('div, article, li').forEach(function(card) {
      if (card.getAttribute('data-cart-processed')) return;
      if (!isProductCard(card)) return;

      var nameEl = findNameEl(card);
      var priceEl = findPriceEl(card);
      var imageEl = card.querySelector('img');
      if (!nameEl) return;

      var priceText = priceEl ? normalizeText(priceEl.textContent) : '';
      var priceNum = NaN;
      if (priceText && isPriceText(priceText)) {
        priceNum = parsePriceNum(priceText);
      }
      if (isNaN(priceNum) && priceText) {
        var extracted = extractPrice(priceText);
        if (extracted) { priceText = extracted; priceNum = parsePriceNum(priceText); }
      }
      if (isNaN(priceNum)) {
        var descEl = card.querySelector('[data-product-role="description"]');
        if (descEl) {
          var descExtracted = extractPrice(descEl.textContent);
          if (descExtracted) { priceText = descExtracted; priceNum = parsePriceNum(priceText); }
        }
      }
      if (isNaN(priceNum)) {
        var cardExtracted = extractPrice(card.textContent);
        if (cardExtracted) { priceText = cardExtracted; priceNum = parsePriceNum(priceText); }
      }
      // Last resort: extract any digits from price element or full card
      if (isNaN(priceNum)) {
        var src = priceEl ? priceEl.textContent : card.textContent;
        var digits = normalizeText(src).replace(/[^\\d.]/g, '');
        if (digits) priceNum = parseFloat(digits);
      }
      if (isNaN(priceNum) || priceNum <= 0) priceNum = 0;

      // Only mark processed AFTER confirming valid price parse
      card.setAttribute('data-cart-processed', 'true');

      var priceCents = Math.round(priceNum * 100);
      var itemName = normalizeText(nameEl.textContent);
      var imageUrl = imageEl ? imageEl.src : null;
      var itemId = btoa(itemName + '_' + priceCents).replace(/=/g, '');

      // Determine button text from card metadata
      var ctaAction = card.getAttribute('data-product-cta') || '';
      var buttonText = card.getAttribute('data-product-button-text') || '';

      // If CTA is explicitly "none", skip button
      if (ctaAction === 'none') return;

      // Default button text if not set
      if (!buttonText) {
        var ctaTextMap = {
          'add_to_cart': '+ Add',
          'buy_now': 'Buy Now',
          'order_now': 'Order Now',
          'book_now': 'Book Now',
          'join_now': '+ Join',
          'contact_seller': 'Contact Seller',
          'reserve': 'Reserve',
          'access': 'Access',
          'download': 'Download',
          'view': 'View'
        };
        buttonText = ctaTextMap[ctaAction] || '+ Add';
      }

      var style = getButtonStyle(card);

      var btn = document.createElement('button');
      btn.textContent = buttonText;
      btn.className = 'yangu-live-cta';
      btn.style.cssText = 'margin-top:8px;padding:' + style.padding + ';border-radius:' + style.radius + ';border:2px solid ' + style.color + ';background:transparent;color:' + style.color + ';font-size:' + style.fontSize + ';font-weight:700;cursor:pointer;width:100%;transition:all 0.2s;letter-spacing:0.02em;';
      btn.onmouseover = function() { btn.style.background = style.color; btn.style.color = '#fff'; };
      btn.onmouseout = function() { btn.style.background = 'transparent'; btn.style.color = style.color; };

      var actionType = card.getAttribute('data-product-action-type') || 'checkout';
      var actionUrl = card.getAttribute('data-product-action-url') || '';

      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (actionType === 'external_url' && actionUrl) {
          window.open(actionUrl, '_blank');
          return;
        }
        if (actionType === 'whatsapp') {
          window.open('https://wa.me/?text=' + encodeURIComponent('I would like to order: ' + itemName), '_blank');
          return;
        }

        window.parent.postMessage({
          type: 'yangu_add_to_cart',
          item: {
            id: itemId,
            name: itemName,
            price_cents: priceCents,
            currency: CONFIGURED_CURRENCY,
            image_url: imageUrl,
            variant: null
          }
        }, '*');

        var origText = btn.textContent;
        btn.textContent = '\\u2713 Added';
        btn.style.background = '#059669';
        btn.style.color = '#fff';
        btn.style.borderColor = '#059669';
        setTimeout(function() {
          btn.textContent = origText;
          btn.style.background = 'transparent';
          btn.style.color = style.color;
          btn.style.borderColor = style.color;
        }, 1200);
      };

      // Insert button at the bottom of the card's content area
      // Try to find the text content container (parent of title/price), else use card itself
      var contentArea = null;
      if (nameEl && nameEl.parentElement && nameEl.parentElement !== card) {
        contentArea = nameEl.parentElement;
      } else if (priceEl && priceEl.parentElement && priceEl.parentElement !== card) {
        contentArea = priceEl.parentElement;
      }
      if (!contentArea) contentArea = card;
      contentArea.appendChild(btn);
    });

    // Also wire up any pre-existing order buttons added via the editor
    document.querySelectorAll('[data-yangu-order-btn]').forEach(function(btn) {
      if (btn.getAttribute('data-cart-wired')) return;
      btn.setAttribute('data-cart-wired', 'true');
      var card = btn.closest('[data-cart-processed], [data-product-card]') || btn.parentElement;
      if (!card) return;

      var nameEl = findNameEl(card);
      var priceEl2 = findPriceEl(card);
      if (!nameEl || !priceEl2) return;

      var pText = normalizeText(priceEl2.textContent);
      var pNum = parsePriceNum(pText);
      if (isNaN(pNum)) {
        var pExtracted = extractPrice(pText) || extractPrice(card.textContent);
        if (pExtracted) pNum = parsePriceNum(pExtracted);
      }
      if (isNaN(pNum)) return;
      var pCents = Math.round(pNum * 100);
      var iName = normalizeText(nameEl.textContent);
      var iImg = card.querySelector('img');
      var iId = btoa(iName + '_' + pCents).replace(/=/g, '');

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'yangu_add_to_cart',
          item: { id: iId, name: iName, price_cents: pCents, currency: CONFIGURED_CURRENCY, image_url: iImg ? iImg.src : null, variant: null }
        }, '*');
        btn.textContent = '\\u2713 Added';
        btn.style.background = '#059669';
        btn.style.color = '#fff';
        setTimeout(function() { btn.textContent = '+ Add'; btn.style.background = '#22c55e'; btn.style.color = '#fff'; }, 1200);
      });
    });
  }

  function addCartButton() {
    var existing = document.getElementById('yangu-cart-btn');
    if (existing) return;

    // Try to place cart inline in the header nav
    var header = document.querySelector('header') || document.querySelector('nav');
    var navContainer = null;
    if (header) {
      // Find the nav links container (flex/row with multiple links)
      var navLinks = header.querySelectorAll('a');
      if (navLinks.length > 0) {
        navContainer = navLinks[navLinks.length - 1].parentElement;
      }
    }

    var btn = document.createElement('button');
    btn.id = 'yangu-cart-btn';
    btn.innerHTML = '\\uD83D\\uDED2 Cart (0)';
    btn.onclick = function() {
      window.parent.postMessage({ type: 'yangu_open_cart' }, '*');
    };

    if (navContainer && header) {
      // Inline mode: place after the last nav link
      btn.style.cssText = 'background:none;border:none;color:inherit;font-size:inherit;font-weight:600;cursor:pointer;padding:4px 8px !important;white-space:nowrap;opacity:0.85;transition:opacity 0.2s;';
      btn.onmouseover = function() { btn.style.opacity = '1'; };
      btn.onmouseout = function() { btn.style.opacity = '0.85'; };
      navContainer.appendChild(btn);
    } else {
      // Fallback: fixed-position compact button at bottom-right
      btn.className = 'yangu-cart-fallback';
      btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:12px 24px;border-radius:30px;border:none;background:#10b981;color:white;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:transform 0.2s;width:auto !important;max-width:none !important;';
      btn.onmouseover = function() { btn.style.transform = 'scale(1.05)'; };
      btn.onmouseout = function() { btn.style.transform = 'scale(1)'; };
      document.body.appendChild(btn);
    }

    // Update cart count on messages from parent
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'yangu_cart_count') {
        var el = document.getElementById('yangu-cart-btn');
        if (el) el.innerHTML = '\\uD83D\\uDED2 Cart (' + (e.data.count || 0) + ')';
      }
    });
  }

  // Smooth scroll for anchor links
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) {
      var btn = e.target.closest('button, [role="button"]');
      if (btn) {
        var hrefAttr = btn.getAttribute('data-href') || btn.getAttribute('href') || '';
        if (hrefAttr.startsWith('#') && hrefAttr.length > 1) {
          e.preventDefault();
          var target = document.querySelector(hrefAttr) || document.getElementById(hrefAttr.slice(1));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      return;
    }
    var href = link.getAttribute('href');
    if (href && href.startsWith('#') && href.length > 1) {
      e.preventDefault();
      var target = document.querySelector(href) || document.getElementById(href.slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  function safeAddCartButton() {
    try { addCartButton(); } catch(e) { console.warn('[CartBridge] addCartButton error:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initCartBridge();
      safeAddCartButton();
    });
  } else {
    initCartBridge();
    safeAddCartButton();
  }

  setTimeout(initCartBridge, 2000);
  setTimeout(initCartBridge, 5000);
})();
`;
}

export function buildCartBridgeScript(configuredCurrency: string = "USD"): string {
  return `<script>${buildCartBridgeCode(configuredCurrency)}</script>`;
}

// Keep backward compat export for any non-currency-aware callers
export const EMENU_CART_BRIDGE_SCRIPT = buildCartBridgeScript("USD");
