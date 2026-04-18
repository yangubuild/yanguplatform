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

  function findProductSections() {
    // Returns an array of container elements that hold product cards.
    // 1) Explicit markers (preferred): [data-section-type="products"], [data-products-grid].
    // 2) Heuristic: <section> containing an h1/h2/h3 whose text matches Products/Menu/Shop/Catalog/Items.
    var found = [];
    var explicit = document.querySelectorAll('[data-section-type="products"], [data-section-type="menu"], [data-products-grid="true"]');
    explicit.forEach(function(s){ found.push(s); });
    var sections = document.querySelectorAll('section, div[id], div[class*="product"], div[class*="menu"]');
    sections.forEach(function(s) {
      if (found.indexOf(s) !== -1) return;
      var heading = s.querySelector('h1, h2, h3');
      if (!heading) return;
      var t = normalizeText(heading.textContent).toLowerCase();
      if (/^(products?|menu|shop|catalog(ue)?|items|our (products|menu|shop)|featured)\\b/.test(t)) {
        // Avoid nested duplicates
        var alreadyAncestor = found.some(function(f){ return f.contains(s) || s.contains(f); });
        if (!alreadyAncestor) found.push(s);
      }
    });
    return found;
  }

  function isLikelyProductCard(el, section) {
    if (['DIV','ARTICLE','LI','A'].indexOf(el.tagName) === -1) return false;
    if (el === section) return false;
    if (el.querySelector('[data-cart-processed="true"]')) return false;
    var img = el.querySelector('img');
    if (!img) return false;
    // Need either a heading OR currency text in the card.
    var heading = el.querySelector('h1, h2, h3, h4, h5, h6, [data-product-role="title"]');
    var cardText = normalizeText(el.textContent || '');
    var hasCurrency = /[\\$€£₦]\\s*\\d|\\b(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR|KSh)\\s*\\d/i.test(cardText);
    if (!heading && !hasCurrency) return false;
    var name = heading ? normalizeText(heading.textContent) : '';
    // Reject obvious non-product names (collection tiles).
    if (name && /^(women|men|kids|sale|new|all|view all|shop all|see more|browse|category|categories|collection|collections)$/i.test(name)) return false;
    if (name && name.length > 200) return false;
    return true;
  }

  function isProductCard(el) {
    // Explicit marker still wins.
    if (el.getAttribute && el.getAttribute('data-product-card') === 'true') {
      var nested = el.querySelectorAll('[data-product-card="true"]');
      if (nested.length > 0) return false;
      return true;
    }
    // Otherwise rely on findCandidateProductCards() which scopes by section.
    return false;
  }

  function findCandidateProductCards() {
    var cards = [];
    // 1) Explicit cards anywhere.
    document.querySelectorAll('[data-product-card="true"]').forEach(function(c){
      var nested = c.querySelectorAll('[data-product-card="true"]');
      if (nested.length === 0) cards.push(c);
    });
    // 2) Heuristic cards inside detected product sections.
    var sections = findProductSections();
    sections.forEach(function(section) {
      // Walk descendants but only consider elements with an img + heading.
      var candidates = section.querySelectorAll('div, article, li, a');
      candidates.forEach(function(el) {
        if (cards.indexOf(el) !== -1) return;
        if (isLikelyProductCard(el, section)) {
          // Prefer the smallest valid container: skip if a descendant is also a candidate.
          var hasInnerCandidate = false;
          var inner = el.querySelectorAll('div, article, li, a');
          for (var i = 0; i < inner.length; i++) {
            if (isLikelyProductCard(inner[i], section)) { hasInnerCandidate = true; break; }
          }
          if (!hasInnerCandidate) cards.push(el);
        }
      });
    });
    return cards;
  }

  function getButtonStyle(card) {
    var color = card.getAttribute('data-product-button-color') || document.body.getAttribute('data-product-button-color') || '#10b981';
    var radius = card.getAttribute('data-product-button-radius') || document.body.getAttribute('data-product-button-radius') || '8px';
    var padding = card.getAttribute('data-product-button-padding') || document.body.getAttribute('data-product-button-padding') || '8px 0';
    var fontSize = card.getAttribute('data-product-button-font-size') || document.body.getAttribute('data-product-button-font-size') || '14px';
    return { color: color, radius: radius, padding: padding, fontSize: fontSize };
  }

  function normalizeMislabeledCards() {
    // Templates sometimes hoist data-product-card="true" onto outer wrappers
    // (e.g. .yangu-content-container or grid containers). When that happens,
    // the bridge mistakes the entire grid for a single card. Detect wrappers
    // whose descendants look like real cards (.aema-card or multiple imgs)
    // and demote them: strip data-product-card from the wrapper, promote it
    // to inner .aema-card children, copy product-button-* + product-meta down.
    document.querySelectorAll('[data-product-card="true"]').forEach(function(wrapper) {
      var inner = wrapper.querySelectorAll('.aema-card, [data-product-role="title"]');
      // Heuristic: if wrapper contains 2+ images AND inner card markers, it's a grid wrapper.
      var imgs = wrapper.querySelectorAll('img');
      var directCards = wrapper.querySelectorAll(':scope > .aema-card, :scope > a.aema-card, :scope > div.aema-card');
      var hasInnerCards = directCards.length >= 2 || (inner.length >= 2 && imgs.length >= 2);
      if (!hasInnerCards) return;

      // Collect transferable attributes (button styles, meta) so cards inherit them.
      var transferAttrs = ['data-product-button-color','data-product-button-radius','data-product-button-padding','data-product-button-font-size','data-product-cta','data-product-button-text','data-product-action-type','data-product-action-url','data-product-meta'];
      var transferMap = {};
      transferAttrs.forEach(function(a){
        var v = wrapper.getAttribute(a);
        if (v != null) transferMap[a] = v;
      });

      // Demote wrapper
      wrapper.removeAttribute('data-product-card');
      wrapper.removeAttribute('data-product-title');
      wrapper.removeAttribute('data-product-badge-enabled');
      wrapper.removeAttribute('data-product-badge-text');

      // Promote each .aema-card child
      var targets = directCards.length > 0 ? directCards : wrapper.querySelectorAll('.aema-card');
      targets.forEach(function(c) {
        if (c.getAttribute('data-product-card') !== 'true') c.setAttribute('data-product-card','true');
        Object.keys(transferMap).forEach(function(k){
          if (!c.getAttribute(k)) c.setAttribute(k, transferMap[k]);
        });
      });
    });
  }

  function getAllTextNodes(root) {
    var nodes = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (normalizeText(n.nodeValue)) nodes.push(n);
    }
    return nodes;
  }

  function detectNameAndPrice(card) {
    // Returns { name, price, nameEl, priceEl } using both data-product-role and heuristics.
    var nameEl = card.querySelector('[data-product-role="title"]');
    var priceEl = card.querySelector('[data-product-role="price"]');
    var name = nameEl ? normalizeText(nameEl.textContent) : '';
    var price = priceEl ? normalizeText(priceEl.textContent) : '';

    // Scan text nodes for price (currency token) and longest non-price string for name.
    var textNodes = getAllTextNodes(card);
    var bestNameNode = null, bestNameLen = 0;
    var firstPriceNode = null;
    textNodes.forEach(function(tn) {
      var t = normalizeText(tn.nodeValue);
      if (!t) return;
      if (isPriceText(t)) {
        if (!price) {
          var extracted = extractPrice(t) || t;
          price = extracted;
          if (!priceEl) {
            firstPriceNode = tn;
          }
        }
        return;
      }
      if (!name && t.length > bestNameLen && t.length < 120 && !/^(\\+\\s*add|add|buy|order|book|join|\\u2713|added|view)$/i.test(t)) {
        bestNameLen = t.length;
        bestNameNode = tn;
      }
    });
    if (!name && bestNameNode) name = normalizeText(bestNameNode.nodeValue);
    if (!nameEl && bestNameNode && bestNameNode.parentElement) nameEl = bestNameNode.parentElement;
    if (!priceEl && firstPriceNode && firstPriceNode.parentElement) priceEl = firstPriceNode.parentElement;

    // If name still contains price text, strip it.
    if (name && price && name.indexOf(price) !== -1) {
      name = normalizeText(name.replace(price, ''));
    }
    return { name: name, price: price, nameEl: nameEl, priceEl: priceEl };
  }

  function stripDuplicateText(card, name, price, keepNameEl, keepPriceEl) {
    // Remove any text nodes (other than the canonical name/price elements) whose
    // normalized text matches name, price, or "name + price" combinations.
    var combined1 = normalizeText(name + ' ' + price);
    var combined2 = normalizeText(price + ' ' + name);
    var textNodes = getAllTextNodes(card);
    textNodes.forEach(function(tn) {
      var parent = tn.parentElement;
      if (!parent) return;
      // Skip canonical elements (and their descendants).
      if (keepNameEl && (parent === keepNameEl || keepNameEl.contains(parent))) return;
      if (keepPriceEl && (parent === keepPriceEl || keepPriceEl.contains(parent))) return;
      var t = normalizeText(tn.nodeValue);
      if (!t) return;
      if (t === name || t === price || t === combined1 || t === combined2) {
        // Remove the text node; if its parent becomes empty, remove parent too.
        var p = parent;
        tn.parentNode.removeChild(tn);
        while (p && p !== card && !p.textContent.trim() && !p.querySelector('img, svg, button, a, input')) {
          var gp = p.parentElement;
          if (gp) gp.removeChild(p);
          p = gp;
        }
      }
    });
  }

  function buildFooter(card, info, btn) {
    // Replaces existing name/price containers below the image with a single
    // normalized footer: name on top; price LEFT, button RIGHT.
    var footer = document.createElement('div');
    footer.className = 'yangu-product-footer';
    footer.setAttribute('data-yangu-injected', 'true');
    footer.style.cssText = 'margin-top:10px;display:flex;flex-direction:column;gap:6px;align-items:stretch;';

    var nameLine = document.createElement('div');
    nameLine.className = 'yangu-product-name';
    nameLine.style.cssText = 'font-weight:700;font-size:15px;line-height:1.3;color:#111;';
    nameLine.textContent = info.name || '';

    var row = document.createElement('div');
    row.className = 'yangu-price-row';
    row.style.cssText = 'display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;';

    var priceSpan = document.createElement('span');
    priceSpan.className = 'yangu-product-price';
    priceSpan.setAttribute('data-product-role', 'price');
    priceSpan.style.cssText = 'font-weight:700;font-size:15px;color:#111;';
    priceSpan.textContent = info.price || '';

    row.appendChild(priceSpan);
    row.appendChild(btn);
    footer.appendChild(nameLine);
    footer.appendChild(row);
    card.appendChild(footer);
    return { footer: footer, priceEl: priceSpan, nameEl: nameLine };
  }

  function initCartBridge() {
    normalizeMislabeledCards();
    findCandidateProductCards().forEach(function(card) {
      // Idempotency: if we already injected a normalized footer here, skip.
      if (card.querySelector(':scope > .yangu-product-footer[data-yangu-injected="true"]')) return;
      if (card.getAttribute('data-cart-processed')) return;

      var info = detectNameAndPrice(card);
      if (!info.name) return;

      // Parse price number (defaults to 0 if missing).
      var priceNum = info.price ? parsePriceNum(info.price) : 0;
      if (isNaN(priceNum) || priceNum < 0) priceNum = 0;

      // Format price with configured currency (only if we have a number > 0).
      var displayPrice = info.price || '';
      if (priceNum > 0) {
        try {
          displayPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CONFIGURED_CURRENCY,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(priceNum);
        } catch (_e) {
          displayPrice = CONFIGURED_CURRENCY + ' ' + priceNum.toLocaleString('en-US');
        }
      }
      info.price = displayPrice;

      card.setAttribute('data-cart-processed', 'true');

      var priceCents = Math.round(priceNum * 100);
      var itemName = info.name;
      var imageEl = card.querySelector('img');
      var imageUrl = imageEl ? imageEl.src : null;
      var itemId = btoa(itemName + '_' + priceCents).replace(/=/g, '');

      // Determine button text and CTA action.
      var ctaAction = card.getAttribute('data-product-cta') || '';
      var buttonText = card.getAttribute('data-product-button-text') || '';
      if (ctaAction === 'none') {
        // Still strip duplicates and build footer (without button) for layout consistency.
      }
      if (!buttonText) {
        var ctaTextMap = {
          'add_to_cart': '+ Add', 'buy_now': 'Buy Now', 'order_now': 'Order Now',
          'book_now': 'Book Now', 'join_now': '+ Join', 'contact_seller': 'Contact',
          'reserve': 'Reserve', 'access': 'Access', 'download': 'Download', 'view': 'View'
        };
        buttonText = ctaTextMap[ctaAction] || '+ Add';
      }

      var style = getButtonStyle(card);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = buttonText;
      btn.className = 'yangu-live-cta';
      btn.style.cssText = 'padding:6px 14px;border-radius:' + style.radius + ';border:2px solid ' + style.color + ';background:transparent;color:' + style.color + ';font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;letter-spacing:0.02em;white-space:nowrap;flex-shrink:0;';
      btn.onmouseover = function() { btn.style.background = style.color; btn.style.color = '#fff'; };
      btn.onmouseout = function() { btn.style.background = 'transparent'; btn.style.color = style.color; };

      var actionType = card.getAttribute('data-product-action-type') || 'checkout';
      var actionUrl = card.getAttribute('data-product-action-url') || '';
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (actionType === 'external_url' && actionUrl) { window.open(actionUrl, '_blank'); return; }
        if (actionType === 'whatsapp') {
          window.open('https://wa.me/?text=' + encodeURIComponent('I would like to order: ' + itemName), '_blank');
          return;
        }
        window.parent.postMessage({
          type: 'yangu_add_to_cart',
          item: { id: itemId, name: itemName, price_cents: priceCents, currency: CONFIGURED_CURRENCY, image_url: imageUrl, variant: null }
        }, '*');
        var origText = btn.textContent;
        btn.textContent = '\\u2713 Added';
        btn.style.background = '#059669'; btn.style.color = '#fff'; btn.style.borderColor = '#059669';
        setTimeout(function() {
          btn.textContent = origText;
          btn.style.background = 'transparent'; btn.style.color = style.color; btn.style.borderColor = style.color;
        }, 1200);
      };

      // Strip duplicate name/price text nodes BEFORE building the new footer.
      stripDuplicateText(card, info.name, info.price, info.nameEl, info.priceEl);
      // Also remove the original name/price elements so they don't duplicate the new footer.
      try {
        if (info.nameEl && info.nameEl !== card && card.contains(info.nameEl)) {
          var npe = info.nameEl;
          npe.parentElement && npe.parentElement.removeChild(npe);
        }
        if (info.priceEl && info.priceEl !== card && card.contains(info.priceEl)) {
          var ppe = info.priceEl;
          ppe.parentElement && ppe.parentElement.removeChild(ppe);
        }
      } catch (_e) {}

      // Strip duplicates again after removing originals (catch sibling copies).
      stripDuplicateText(card, info.name, info.price, null, null);

      // Build the canonical footer.
      var built = buildFooter(card, info, ctaAction === 'none' ? document.createElement('span') : btn);

      // ─── Delivery + GET IT strip (eshop / estore / esite) ───
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
        built.footer.appendChild(strip);
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
