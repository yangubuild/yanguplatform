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
export function buildCartBridgeCode(
  configuredCurrency: string = "USD",
  surfaceId: string = "",
  surfaceType: string = "",
): string {
  return `
(function() {
  var CONFIGURED_CURRENCY = ${JSON.stringify(configuredCurrency)};
  window.__YANGU_SURFACE_ID = ${JSON.stringify(surfaceId)};
  window.__YANGU_SURFACE_TYPE = ${JSON.stringify(surfaceType)};

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
    // Eshop family renders cards as <a> tags; emenu uses div/article/li.
    if (['DIV','ARTICLE','LI','A'].indexOf(el.tagName) === -1) return false;
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

      // ── Currency consistency: rewrite the visible price to match the configured shop currency ──
      // Template HTML may have hardcoded symbols like "$30" while the shop is configured for UGX.
      // Force a single source of truth so page cards and the cart always agree.
      if (priceEl && priceNum > 0) {
        try {
          var formatted;
          try {
            formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: CONFIGURED_CURRENCY,
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(priceNum);
          } catch (_e) {
            formatted = CONFIGURED_CURRENCY + ' ' + priceNum.toLocaleString('en-US');
          }
          if (normalizeText(priceEl.textContent) !== formatted) {
            priceEl.textContent = formatted;
          }
        } catch (_err) { /* non-fatal */ }
      }

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
      // Inline button — sits to the RIGHT of the price in the same flex row
      btn.style.cssText = 'padding:6px 14px;border-radius:' + style.radius + ';border:2px solid ' + style.color + ';background:transparent;color:' + style.color + ';font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;letter-spacing:0.02em;white-space:nowrap;flex-shrink:0;';
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

      // Place button inline to the RIGHT of the price.
      // Strategy: if the price element's parent is a flex container, append the button there.
      // Otherwise, wrap the price in a flex justify-between row and append the button.
      var inserted = false;
      if (priceEl) {
        var priceParent = priceEl.parentElement;
        if (priceParent && priceParent !== card) {
          var ps = window.getComputedStyle(priceParent);
          if (ps.display === 'flex' || ps.display === 'inline-flex') {
            // Ensure the row uses justify-between so price stays left, button right
            priceParent.style.justifyContent = 'space-between';
            priceParent.style.alignItems = 'center';
            priceParent.appendChild(btn);
            inserted = true;
          } else {
            // Wrap price in a new flex row
            var wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;';
            priceEl.parentNode.insertBefore(wrap, priceEl);
            wrap.appendChild(priceEl);
            wrap.appendChild(btn);
            inserted = true;
          }
        }
      }
      if (!inserted) {
        // Fallback: append below name/price
        var contentArea = null;
        if (nameEl && nameEl.parentElement && nameEl.parentElement !== card) {
          contentArea = nameEl.parentElement;
        }
        if (!contentArea) contentArea = card;
        btn.style.marginTop = '8px';
        btn.style.width = '100%';
        contentArea.appendChild(btn);
      }

      // ─── Delivery + "GET IT ..." strip (eshop / estore / esite product cards) ───
      // Reads data-product-meta JSON when present, otherwise applies surface defaults so
      // visitors immediately see the e-commerce signals (Free delivery + GET IT TOMORROW).
      var st = (window.__YANGU_SURFACE_TYPE || '').toLowerCase();
      var isShoppy = (st === 'eshop' || st === 'estore' || st === 'esite');
      if (isShoppy && !card.getAttribute('data-delivery-injected')) {
        card.setAttribute('data-delivery-injected', 'true');
        var meta = {};
        try {
          var rawMeta = card.getAttribute('data-product-meta');
          if (rawMeta) meta = JSON.parse(rawMeta) || {};
        } catch(_e) {}
        var deliveryType = meta.deliveryType || 'free';
        var deliveryFee = meta.deliveryFee || '';
        var getItUnit = meta.getItUnit || 'tomorrow';
        var getItValue = meta.getItValue || '1';
        var getItTodayUnit = meta.getItTodayUnit || 'hours';

        var deliveryLabel = (deliveryType === 'paid' && deliveryFee)
          ? ('Delivery: ' + deliveryFee)
          : (deliveryType === 'paid' ? 'Paid delivery' : 'Free delivery');

        var getItHighlight;
        if (getItUnit === 'today') {
          getItHighlight = 'TODAY ' + getItValue + ' ' + (getItTodayUnit === 'minutes' ? 'MIN' : 'HRS');
        } else if (getItUnit === 'days') {
          getItHighlight = (getItValue || '1') + ' ' + (String(getItValue) === '1' ? 'DAY' : 'DAYS');
        } else if (getItUnit === 'months') {
          getItHighlight = (getItValue || '1') + ' ' + (String(getItValue) === '1' ? 'MONTH' : 'MONTHS');
        } else {
          getItHighlight = 'TOMORROW';
        }

        var strip = document.createElement('div');
        strip.className = 'yangu-delivery-strip';
        strip.style.cssText = 'margin-top:8px;display:flex;flex-direction:column;gap:4px;font-family:inherit;';
        strip.innerHTML =
          '<div style="font-size:12px;color:#444;line-height:1.3;">' + deliveryLabel + '</div>' +
          '<div style="font-size:11px;font-weight:800;letter-spacing:0.04em;color:#111;line-height:1.3;">' +
            'GET IT <span style="background:#D6FF3D;color:#111;padding:1px 6px;border-radius:2px;font-style:italic;">' + getItHighlight + '</span>' +
          '</div>';

        var anchor = priceEl ? (priceEl.closest('.yangu-price-row') || priceEl.parentElement) : null;
        if (anchor && anchor.parentElement) {
          anchor.parentElement.insertBefore(strip, anchor.nextSibling);
        } else {
          card.appendChild(strip);
        }
      }
    });

    // ─── Love icon (wishlist toggle) on every product card ───
    // Selector includes any card the bridge already processed (heuristic match) so heart
    // appears on legacy templates that did not declare [data-product-card="true"].
    document.querySelectorAll('[data-product-card="true"], [data-cart-processed="true"]').forEach(function(card) {
      if (card.getAttribute('data-wishlist-injected')) return;
      var imgWrap = card.querySelector('img');
      if (!imgWrap) return;
      var imgParent = imgWrap.parentElement;
      if (!imgParent) return;
      // Walk up to the nearest reasonably-sized container so the heart sits over the photo,
      // not over a tiny inline-block.
      var ips = window.getComputedStyle(imgParent);
      if (ips.position === 'static') imgParent.style.position = 'relative';
      // Ensure container does not clip the heart
      if (ips.overflow === 'hidden') imgParent.style.overflow = 'visible';
      card.setAttribute('data-wishlist-injected', 'true');

      var heart = document.createElement('button');
      heart.type = 'button';
      heart.className = 'yangu-wishlist-heart';
      heart.setAttribute('aria-label', 'Add to wishlist');
      // White circle, dark stroke icon, strong shadow. Always visible on light or dark imagery.
      heart.style.cssText = 'position:absolute !important;top:10px !important;right:10px !important;width:36px !important;height:36px !important;border-radius:999px !important;border:1px solid rgba(0,0,0,0.08) !important;background:#ffffff !important;color:#111111 !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;cursor:pointer !important;box-shadow:0 2px 8px rgba(0,0,0,0.18) !important;z-index:50 !important;padding:0 !important;margin:0 !important;line-height:1 !important;';
      heart.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

      // Sync pressed state from localStorage
      var nameForId = normalizeText(card.querySelector('[data-product-role="title"], h1, h2, h3, h4, h5')?.textContent || '');
      var priceForId = (function() {
        var pe = card.querySelector('[data-product-role="price"]') || findPriceEl(card);
        return pe ? normalizeText(pe.textContent) : '';
      })();
      var pId = btoa(nameForId + '_' + priceForId).replace(/=/g, '');
      function isWished() {
        try {
          var raw = localStorage.getItem('yangu_wishlist_' + (window.__YANGU_SURFACE_ID || ''));
          if (!raw) return false;
          var arr = JSON.parse(raw);
          return Array.isArray(arr) && arr.some(function(i){ return i.id === pId; });
        } catch(_e) { return false; }
      }
      function paint() {
        var w = isWished();
        var svg = heart.querySelector('svg');
        heart.style.background = '#ffffff';
        heart.style.color = w ? '#e11d48' : '#111111';
        if (svg) {
          svg.setAttribute('stroke', w ? '#e11d48' : '#111111');
          svg.setAttribute('fill', w ? '#e11d48' : 'none');
        }
      }
      paint();

      heart.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var imgEl = card.querySelector('img');
        var priceEl2 = card.querySelector('[data-product-role="price"]') || findPriceEl(card);
        var pNum = priceEl2 ? parsePriceNum(priceEl2.textContent) : 0;
        if (isNaN(pNum)) pNum = 0;
        window.parent.postMessage({
          type: 'yangu_wishlist_toggle',
          item: {
            id: pId,
            name: nameForId,
            price_cents: Math.round(pNum * 100),
            currency: CONFIGURED_CURRENCY,
            image_url: imgEl ? imgEl.src : null
          }
        }, '*');
        // Optimistic local toggle
        try {
          var key = 'yangu_wishlist_' + (window.__YANGU_SURFACE_ID || '');
          var raw = localStorage.getItem(key);
          var arr = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(arr)) arr = [];
          var existingIdx = arr.findIndex(function(i){ return i.id === pId; });
          if (existingIdx >= 0) arr.splice(existingIdx, 1);
          else arr.push({ id: pId, name: nameForId, price_cents: Math.round(pNum * 100), currency: CONFIGURED_CURRENCY, image_url: imgEl ? imgEl.src : null });
          localStorage.setItem(key, JSON.stringify(arr));
        } catch(_e) {}
        paint();
      });
      imgParent.appendChild(heart);

      // ─── Image carousel arrows (only if multiple images) ───
      var allImgs = (card.getAttribute('data-product-images') || '').split('|').filter(Boolean);
      if (allImgs.length > 1) {
        var idx = 0;
        var mainImg = card.querySelector('img');
        var leftArrow = document.createElement('button');
        leftArrow.type = 'button';
        leftArrow.setAttribute('aria-label', 'Previous image');
        leftArrow.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:999px;border:0;background:rgba(255,255,255,0.85);color:#222;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;z-index:5;';
        leftArrow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        var rightArrow = leftArrow.cloneNode(true);
        rightArrow.style.cssText = leftArrow.style.cssText.replace('left:8px', 'right:8px');
        rightArrow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        leftArrow.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); idx = (idx - 1 + allImgs.length) % allImgs.length; if (mainImg) mainImg.src = allImgs[idx]; });
        rightArrow.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); idx = (idx + 1) % allImgs.length; if (mainImg) mainImg.src = allImgs[idx]; });
        imgParent.appendChild(leftArrow);
        imgParent.appendChild(rightArrow);
      }

      // ─── Card click → open product detail dialog (excludes button/heart/arrow) ───
      card.addEventListener('click', function(e) {
        var t = e.target;
        if (t.closest('button, a, .yangu-wishlist-heart, .yangu-live-cta')) return;
        e.preventDefault();
        var imgEl = card.querySelector('img');
        var priceEl3 = card.querySelector('[data-product-role="price"]') || findPriceEl(card);
        var nameEl3 = card.querySelector('[data-product-role="title"]') || findNameEl(card);
        var descEl3 = card.querySelector('[data-product-role="description"]');
        var pNum2 = priceEl3 ? parsePriceNum(priceEl3.textContent) : 0;
        if (isNaN(pNum2)) pNum2 = 0;
        var metaRaw = card.getAttribute('data-product-meta');
        var meta = {};
        try { meta = metaRaw ? JSON.parse(metaRaw) : {}; } catch(_e) {}
        var imgs = allImgs.length ? allImgs : (imgEl ? [imgEl.src] : []);
        window.parent.postMessage({
          type: 'yangu_open_product_detail',
          product: {
            id: pId,
            name: nameForId || (nameEl3 ? normalizeText(nameEl3.textContent) : ''),
            description: descEl3 ? normalizeText(descEl3.textContent) : '',
            brand: meta.brand || '',
            price_cents: Math.round(pNum2 * 100),
            currency: CONFIGURED_CURRENCY,
            image_urls: imgs,
            sizes: Array.isArray(meta.sizes) ? meta.sizes : [],
            colors: Array.isArray(meta.colors) ? meta.colors : [],
            button_text: card.getAttribute('data-product-button-text') || ''
          }
        }, '*');
      });
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
      btn.style.cssText = 'background:none;border:none;color:inherit;font-size:inherit;font-weight:600;cursor:pointer;padding:4px 8px !important;white-space:nowrap;opacity:0.85;transition:opacity 0.2s;width:auto !important;max-width:none !important;margin:0 !important;';
      btn.onmouseover = function() { btn.style.opacity = '1'; };
      btn.onmouseout = function() { btn.style.opacity = '0.85'; };
      navContainer.appendChild(btn);
    } else {
      // Fallback: fixed-position compact button at bottom-right
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initCartBridge();
      try { addCartButton(); } catch(e) { console.warn('[yangu] cart button error:', e); }
    });
  } else {
    initCartBridge();
    try { addCartButton(); } catch(e) { console.warn('[yangu] cart button error:', e); }
  }

  setTimeout(initCartBridge, 2000);
  setTimeout(initCartBridge, 5000);
})();
`;
}

export function buildCartBridgeScript(
  configuredCurrency: string = "USD",
  surfaceId: string = "",
  surfaceType: string = "",
): string {
  return `<script>${buildCartBridgeCode(configuredCurrency, surfaceId, surfaceType)}</script>`;
}

// Keep backward compat export for any non-currency-aware callers
export const EMENU_CART_BRIDGE_SCRIPT = buildCartBridgeScript("USD");
