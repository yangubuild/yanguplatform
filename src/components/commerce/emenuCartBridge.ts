/**
 * emenuCartBridge — Generates a <script> snippet to inject into published emenu HTML.
 * Adds "Add to Cart" buttons to menu item cards and communicates with parent React shell
 * via postMessage.
 *
 * Accepts a configured currency so prices are always interpreted correctly.
 */

export function buildCartBridgeScript(configuredCurrency: string = "USD"): string {
  return `
<script>
(function() {
  var CONFIGURED_CURRENCY = ${JSON.stringify(configuredCurrency)};

  function initCartBridge() {
    var allCards = document.querySelectorAll('[style*="border-radius"]');
    var pricePattern = /^([A-Z]{3}|\\$|€|£)\\s*[\\d,\\.]+$/;

    allCards.forEach(function(card) {
      if (card.getAttribute('data-cart-processed')) return;

      var priceEl = null;
      var nameEl = null;
      var imageEl = card.querySelector('img');

      var spans = card.querySelectorAll('span, p, div');
      for (var i = 0; i < spans.length; i++) {
        var text = (spans[i].textContent || '').trim();
        if (pricePattern.test(text) && !priceEl) {
          priceEl = spans[i];
        }
      }

      var headings = card.querySelectorAll('h3, h4, h5, [style*="font-weight:700"], [style*="font-weight:600"], [style*="font-weight: 700"], [style*="font-weight: 600"]');
      if (headings.length > 0) nameEl = headings[0];

      if (!priceEl || !nameEl) return;

      card.setAttribute('data-cart-processed', 'true');

      var priceText = (priceEl.textContent || '').trim();
      var numStr = priceText.replace(/^[A-Z]{3}|[\\$€£\\s]/g, '').replace(/,/g, '').trim();
      var priceNum = parseFloat(numStr);
      if (isNaN(priceNum)) return;

      // Always use the configured currency, not what's parsed from text
      var priceCents = Math.round(priceNum * 100);
      var itemName = (nameEl.textContent || '').trim();
      var imageUrl = imageEl ? imageEl.src : null;
      var itemId = btoa(itemName + '_' + priceCents).replace(/=/g, '');

      // Create visible "+ Add" button
      var btn = document.createElement('button');
      btn.textContent = '+ Add';
      btn.style.cssText = 'margin-top:8px;padding:8px 0;border-radius:8px;border:2px solid #10b981;background:transparent;color:#10b981;font-size:14px;font-weight:700;cursor:pointer;width:100%;transition:all 0.2s;letter-spacing:0.02em;';
      btn.onmouseover = function() { btn.style.background = '#10b981'; btn.style.color = '#fff'; };
      btn.onmouseout = function() { btn.style.background = 'transparent'; btn.style.color = '#10b981'; };

      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

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

        btn.textContent = '\\u2713 Added';
        btn.style.background = '#059669';
        btn.style.color = '#fff';
        btn.style.borderColor = '#059669';
        setTimeout(function() {
          btn.textContent = '+ Add';
          btn.style.background = 'transparent';
          btn.style.color = '#10b981';
          btn.style.borderColor = '#10b981';
        }, 1200);
      };

      var lastChild = priceEl.parentElement || card;
      lastChild.appendChild(btn);
    });

    // Also wire up any pre-existing order buttons added via the editor
    document.querySelectorAll('[data-yangu-order-btn]').forEach(function(btn) {
      if (btn.getAttribute('data-cart-wired')) return;
      btn.setAttribute('data-cart-wired', 'true');
      var card = btn.closest('[data-cart-processed], [class*="card"], [class*="item"], [class*="product"], [class*="menu-item"]') || btn.parentElement;
      if (!card) return;

      var nameEl = card.querySelector('h3, h4, h5, [style*="font-weight:700"], [style*="font-weight:600"]');
      var priceEl2 = null;
      var spans2 = card.querySelectorAll('span, p');
      for (var j = 0; j < spans2.length; j++) {
        var txt = (spans2[j].textContent || '').trim();
        if (pricePattern.test(txt)) { priceEl2 = spans2[j]; break; }
      }
      if (!nameEl || !priceEl2) return;

      var pText = (priceEl2.textContent || '').trim();
      var nStr = pText.replace(/^[A-Z]{3}|[\\$€£\\s]/g, '').replace(/,/g, '').trim();
      var pNum = parseFloat(nStr);
      if (isNaN(pNum)) return;
      var pCents = Math.round(pNum * 100);
      var iName = (nameEl.textContent || '').trim();
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

    var btn = document.createElement('button');
    btn.id = 'yangu-cart-btn';
    btn.innerHTML = '\\uD83D\\uDED2 Cart';
    btn.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;padding:12px 24px;border-radius:30px;border:none;background:#10b981;color:white;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:transform 0.2s;';
    btn.onmouseover = function() { btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout = function() { btn.style.transform = 'scale(1)'; };
    btn.onclick = function() {
      window.parent.postMessage({ type: 'yangu_open_cart' }, '*');
    };
    document.body.appendChild(btn);
  }

  // Smooth scroll for anchor links (View Menu -> #menu, etc.)
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) {
      var btn = e.target.closest('button, [role="button"]');
      if (btn) {
        var onclick = btn.getAttribute('onclick') || '';
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
      addCartButton();
    });
  } else {
    initCartBridge();
    addCartButton();
  }

  setTimeout(initCartBridge, 2000);
  setTimeout(initCartBridge, 5000);
})();
</script>
`;
}

// Keep backward compat export for any non-currency-aware callers
export const EMENU_CART_BRIDGE_SCRIPT = buildCartBridgeScript("USD");
