/**
 * emenuCartBridge — Generates a <script> snippet to inject into published emenu HTML.
 * Adds "Add to Cart" buttons to menu item cards and communicates with parent React shell
 * via postMessage.
 */

export const EMENU_CART_BRIDGE_SCRIPT = `
<script>
(function() {
  // Find menu item cards and add "Add to Cart" buttons
  function initCartBridge() {
    // Look for elements with price patterns like "UGX 15,000" or "$12.99"
    var allCards = document.querySelectorAll('[style*="border-radius"]');
    var pricePattern = /^([A-Z]{3}|\\$|€|£)\\s*[\\d,\\.]+$/;
    
    allCards.forEach(function(card) {
      // Skip if already processed
      if (card.getAttribute('data-cart-processed')) return;
      
      // Find price text within the card
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
      
      // Find item name (usually h3, h4, or first bold/semibold text)
      var headings = card.querySelectorAll('h3, h4, h5, [style*="font-weight:700"], [style*="font-weight:600"], [style*="font-weight: 700"], [style*="font-weight: 600"]');
      if (headings.length > 0) nameEl = headings[0];
      
      if (!priceEl || !nameEl) return;
      
      card.setAttribute('data-cart-processed', 'true');
      
      // Parse price
      var priceText = (priceEl.textContent || '').trim();
      var currencyMatch = priceText.match(/^([A-Z]{3}|\\$|€|£)/);
      var currency = currencyMatch ? currencyMatch[1] : 'USD';
      var numStr = priceText.replace(/^[A-Z]{3}|[\\$€£]/, '').replace(/,/g, '').trim();
      var priceNum = parseFloat(numStr);
      if (isNaN(priceNum)) return;
      
      // Convert to cents
      var priceCents = Math.round(priceNum * 100);
      var itemName = (nameEl.textContent || '').trim();
      var imageUrl = imageEl ? imageEl.src : null;
      var itemId = btoa(itemName + '_' + priceCents).replace(/=/g, '');
      
      // Create "Add to Cart" button
      var btn = document.createElement('button');
      btn.textContent = '+ Add';
      btn.style.cssText = 'margin-top:8px;padding:6px 16px;border-radius:20px;border:none;background:#10b981;color:white;font-size:13px;font-weight:600;cursor:pointer;width:100%;transition:opacity 0.2s;';
      btn.onmouseover = function() { btn.style.opacity = '0.85'; };
      btn.onmouseout = function() { btn.style.opacity = '1'; };
      
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Send to parent React shell
        window.parent.postMessage({
          type: 'yangu_add_to_cart',
          item: {
            id: itemId,
            name: itemName,
            price_cents: priceCents,
            currency: currency,
            image_url: imageUrl,
            variant: null
          }
        }, '*');
        
        // Visual feedback
        btn.textContent = '✓ Added';
        btn.style.background = '#059669';
        setTimeout(function() {
          btn.textContent = '+ Add';
          btn.style.background = '#10b981';
        }, 1200);
      };
      
      // Append button to the card
      var lastChild = priceEl.parentElement || card;
      lastChild.appendChild(btn);
    });
  }
  
  // Also add a floating "View Cart" button inside the iframe
  function addCartButton() {
    var existing = document.getElementById('yangu-cart-btn');
    if (existing) return;
    
    var btn = document.createElement('button');
    btn.id = 'yangu-cart-btn';
    btn.innerHTML = '🛒 Cart';
    btn.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;padding:12px 24px;border-radius:30px;border:none;background:#10b981;color:white;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:transform 0.2s;';
    btn.onmouseover = function() { btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout = function() { btn.style.transform = 'scale(1)'; };
    btn.onclick = function() {
      window.parent.postMessage({ type: 'yangu_open_cart' }, '*');
    };
    document.body.appendChild(btn);
  }
  
  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initCartBridge();
      addCartButton();
    });
  } else {
    initCartBridge();
    addCartButton();
  }
  
  // Re-scan periodically for dynamically loaded content
  setTimeout(initCartBridge, 2000);
  setTimeout(initCartBridge, 5000);
})();
</script>
`;
