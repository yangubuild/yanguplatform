import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { Image, Trash2, Plus, Palette, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { EditorImagePickerDialog } from "./EditorImagePickerDialog";
import { EditorColorPickerDialog } from "./EditorColorPickerDialog";
import type { CanvasSelection, ProductCardData } from "@/lib/builder/selectionTypes";

interface EditablePreviewProps {
  html: string;
  onHtmlChange: (html: string) => void;
  onSelectionChange?: (selection: CanvasSelection) => void;
  onProductEditRequest?: (product: ProductCardData) => void;
  onProductDeleteRequest?: (product: ProductCardData) => void;
  showAddSectionControl?: boolean;
  viewportMode?: "desktop" | "mobile";
}

const EDIT_STYLES = `
  <style>
    * { box-sizing: border-box; }
    body { overflow-x: hidden; }
    section, header, nav, footer { overflow: visible !important; }
    [contenteditable]:focus { outline: 2px solid #22c55e; outline-offset: 2px; }
    .section-hover { position: relative; }
    .section-selected { outline: 2px solid #22c55e !important; outline-offset: -2px; border-radius: 8px; }
    .yangu-el-selected { outline: 2px solid #22c55e !important; outline-offset: 2px; }
    img.yangu-img-selected { outline: 2px solid #22c55e !important; }
    .yangu-card-selected { outline: 2px solid hsl(152 61% 40%) !important; outline-offset: 2px; }
    .yangu-product-card { position: relative !important; }
    .yangu-product-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 6px;
      z-index: 40;
    }
    .yangu-product-control {
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: hsl(154 30% 12% / 0.92);
      color: hsl(0 0% 100%);
      box-shadow: 0 4px 18px hsl(154 50% 5% / 0.28);
      cursor: pointer;
      backdrop-filter: blur(8px);
    }
    .yangu-product-control:hover { background: hsl(152 61% 35% / 0.96); }
    .yangu-product-control.delete:hover { background: hsl(0 72% 51% / 0.96); }
    .yangu-product-control svg {
      width: 14px;
      height: 14px;
      pointer-events: none;
      stroke: currentColor;
    }
  </style>
`;

const EDIT_SCRIPT = String.raw`
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var nodeIdCounter = 0;
      document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,button,img,section,footer,nav,header,div,article').forEach(function(el) {
        if (!el.getAttribute('data-yangu-node-id')) {
          el.setAttribute('data-yangu-node-id', 'yn-' + (++nodeIdCounter));
        }
      });

      function getSections() {
        return document.querySelectorAll('section, footer, nav, header');
      }

      function getNearestSection(el) {
        var node = el;
        while (node && node !== document.body) {
          if (['SECTION','FOOTER','NAV','HEADER'].indexOf(node.tagName) !== -1) return node;
          node = node.parentElement;
        }
        return null;
      }

      function classifyEl(el) {
        var t = el.tagName.toUpperCase();
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','LI','LABEL'].indexOf(t) !== -1) return 'text';
        if (['SECTION','FOOTER','NAV','HEADER'].indexOf(t) !== -1) return 'section';
        return 'page';
      }

      function isOverlayDiv(el) {
        if (el.tagName !== 'DIV') return false;
        var s = window.getComputedStyle(el);
        if (s.position !== 'absolute' && s.position !== 'fixed') return false;
        var bg = s.backgroundImage || '';
        var bgColor = s.backgroundColor || '';
        var hasGradient = bg.includes('gradient');
        var hasTransparentBg = bgColor.includes('rgba') || bgColor === 'transparent' || bgColor === '';
        var text = (el.textContent || '').trim();
        var hasInteractive = el.querySelector('a, button, input, img, h1, h2, h3, h4, h5, h6, p, span');
        if ((hasGradient || hasTransparentBg) && !text && !hasInteractive) return true;
        if (el.children.length === 0 && !text) return true;
        return false;
      }

      function findNearbyImage(overlayEl) {
        var parent = overlayEl.parentElement;
        if (!parent) return null;
        var siblings = parent.children;
        for (var i = 0; i < siblings.length; i++) {
          var sib = siblings[i];
          if (sib === overlayEl) continue;
          if (sib.tagName === 'IMG') return sib;
          var img = sib.querySelector('img');
          if (img) return img;
        }
        return null;
      }

      function isPriceText(text) {
        var compact = (text || '').replace(/\s+/g, ' ').trim();
        if (!compact || compact.length > 30) return false;
        var hasCurrency = /[$€£₦]/.test(compact) || /(?:UGX|USD|EUR|GBP|KES|TZS|AED|NGN|ZAR)/i.test(compact);
        return hasCurrency && /\d/.test(compact);
      }

      function getProductNameEl(card) {
        var candidates = card.querySelectorAll('h1,h2,h3,h4,h5,h6,strong');
        for (var i = 0; i < candidates.length; i++) {
          var text = (candidates[i].textContent || '').replace(/\s+/g, ' ').trim();
          if (text && text.length > 1 && !isPriceText(text)) return candidates[i];
        }
        var styled = card.querySelectorAll('span,div,p');
        for (var j = 0; j < styled.length; j++) {
          var el = styled[j];
          if (el.children.length > 2) continue;
          var cs = window.getComputedStyle(el);
          var fw = parseInt(cs.fontWeight, 10);
          if (fw < 600) continue;
          var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && t.length > 1 && t.length < 60 && !isPriceText(t)) return el;
        }
        return null;
      }

      function getProductPriceEl(card) {
        var candidates = card.querySelectorAll('span,p,div,strong,b');
        var best = null;
        for (var i = 0; i < candidates.length; i++) {
          var candidate = candidates[i];
          if (candidate.closest('.yangu-product-controls')) continue;
          if (candidate.querySelector('img')) continue;
          var text = (candidate.textContent || '').replace(/\s+/g, ' ').trim();
          if (!isPriceText(text)) continue;
          if (!best || text.length < (best.textContent || '').replace(/\s+/g, ' ').trim().length) {
            best = candidate;
          }
        }
        return best;
      }

      function getProductDescriptionEl(card, nameEl, priceEl) {
        var nameText = (nameEl && nameEl.textContent ? nameEl.textContent : '').replace(/\s+/g, ' ').trim();
        var candidates = card.querySelectorAll('p,span,div');
        for (var i = 0; i < candidates.length; i++) {
          var candidate = candidates[i];
          if (candidate === nameEl || candidate === priceEl) continue;
          if (candidate.closest('.yangu-product-controls')) continue;
          if (candidate.querySelector('button,a,h1,h2,h3,h4,h5,h6,img')) continue;
          var text = (candidate.textContent || '').replace(/\s+/g, ' ').trim();
          if (!text || text === nameText || isPriceText(text) || text.length > 220) continue;
          return candidate;
        }
        return null;
      }

      function isLikelyProductCard(el) {
        if (!window.__YANGU_ENABLE_PRODUCT_CONTROLS) return false;
        if (!el || ['DIV', 'ARTICLE', 'LI'].indexOf(el.tagName) === -1) return false;
        if (el.closest('nav,header,footer')) return false;
        if (el.querySelector('.yangu-product-controls')) return true;

        var imageEl = el.querySelector('img');
        var nameEl = getProductNameEl(el);
        var priceEl = getProductPriceEl(el);
        if (!imageEl || !nameEl || !priceEl) return false;

        var nestedMatches = 0;
        var descendants = el.querySelectorAll('div,article,li');
        for (var i = 0; i < descendants.length; i++) {
          var descendant = descendants[i];
          if (descendant === el) continue;
          if (descendant.querySelector('img') && getProductNameEl(descendant) && getProductPriceEl(descendant)) {
            nestedMatches++;
            if (nestedMatches > 1) return false;
          }
        }

        var rect = el.getBoundingClientRect();
        return rect.width >= 140 && rect.height >= 140;
      }

      function getProductPayload(card) {
        var nameEl = getProductNameEl(card);
        var priceEl = getProductPriceEl(card);
        var descEl = getProductDescriptionEl(card, nameEl, priceEl);
        var imageEl = card.querySelector('img');

        return {
          nodeId: card.getAttribute('data-yangu-node-id') || '',
          sectionIndex: findSectionIndex(card),
          name: nameEl ? (nameEl.textContent || '').replace(/\s+/g, ' ').trim() : '',
          description: descEl ? (descEl.textContent || '').replace(/\s+/g, ' ').trim() : '',
          price: priceEl ? (priceEl.textContent || '').replace(/\s+/g, ' ').trim() : '',
          imageSrc: imageEl ? imageEl.src : '',
        };
      }

      function injectProductControls() {
        if (!window.__YANGU_ENABLE_PRODUCT_CONTROLS) return;

        document.querySelectorAll('div,article,li').forEach(function(card) {
          if (!isLikelyProductCard(card)) return;

          card.classList.add('yangu-product-card');

          // Inject edit/delete controls (top-right)
          if (!card.querySelector('.yangu-product-controls')) {
            var controls = document.createElement('div');
            controls.className = 'yangu-product-controls yangu-editor-inject';

            var editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'yangu-product-control';
            editBtn.title = 'Edit product';
            editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
            editBtn.addEventListener('click', function(event) {
              event.preventDefault();
              event.stopPropagation();
              clearAllHighlights();
              card.classList.add('yangu-card-selected');
              window.parent.postMessage({ type: 'product-edit-request', product: getProductPayload(card) }, '*');
            });

            var deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'yangu-product-control delete';
            deleteBtn.title = 'Delete product';
            deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';
            deleteBtn.addEventListener('click', function(event) {
              event.preventDefault();
              event.stopPropagation();
              clearAllHighlights();
              card.classList.add('yangu-card-selected');
              window.parent.postMessage({ type: 'product-delete-request', product: getProductPayload(card) }, '*');
            });

            controls.appendChild(editBtn);
            controls.appendChild(deleteBtn);
            card.appendChild(controls);
          }

          // Inject CTA button (bottom of card) if not already present
          if (!card.querySelector('.yangu-product-cta')) {
            var priceEl = getProductPriceEl(card);
            var nameEl = getProductNameEl(card);
            if (!nameEl) return;

            var ctaBtn = document.createElement('button');
            ctaBtn.type = 'button';
            ctaBtn.className = 'yangu-product-cta yangu-editor-inject';
            ctaBtn.textContent = '+ Add';
            ctaBtn.style.cssText = 'margin-top:8px;padding:8px 0;border-radius:8px;border:2px solid #10b981;background:transparent;color:#10b981;font-size:13px;font-weight:700;cursor:pointer;width:100%;transition:all 0.2s;letter-spacing:0.02em;display:block;';
            ctaBtn.onmouseover = function() { ctaBtn.style.background = '#10b981'; ctaBtn.style.color = '#fff'; };
            ctaBtn.onmouseout = function() { ctaBtn.style.background = 'transparent'; ctaBtn.style.color = '#10b981'; };
            ctaBtn.onclick = function(e) {
              e.preventDefault();
              e.stopPropagation();
              ctaBtn.textContent = '\\u2713 Added';
              ctaBtn.style.background = '#059669';
              ctaBtn.style.color = '#fff';
              ctaBtn.style.borderColor = '#059669';
              setTimeout(function() {
                ctaBtn.textContent = '+ Add';
                ctaBtn.style.background = 'transparent';
                ctaBtn.style.color = '#10b981';
                ctaBtn.style.borderColor = '#10b981';
              }, 1200);
            };

            // Insert after price or at end of content container
            var insertTarget = priceEl ? (priceEl.parentElement || card) : (nameEl.parentElement || card);
            insertTarget.appendChild(ctaBtn);
          }
        });
      }

      function selectImage(el) {
        clearAllHighlights();
        el.classList.add('yangu-img-selected');
        var si = findSectionIndex(el);
        var imgRect = el.getBoundingClientRect();
        window.parent.postMessage({ type: 'canvas-select', kind: 'image', tag: 'IMG', preview: el.src || '', sectionIndex: si, nodeId: el.getAttribute('data-yangu-node-id') || '', elRect: { top: imgRect.top, left: imgRect.left, width: imgRect.width, height: imgRect.height } }, '*');
        window.parent.postMessage({ type: 'image-click', src: el.src }, '*');
      }

      function getPreview(el, kind) {
        if (kind === 'image') return el.src || '';
        if (kind === 'text') return (el.textContent || '').trim().substring(0, 60);
        if (kind === 'section') {
          var sec = ['SECTION','FOOTER','NAV','HEADER'].indexOf(el.tagName) !== -1 ? el : getNearestSection(el);
          return (sec && (sec.id || sec.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0,40))) || '';
        }
        return '';
      }

      function findSectionIndex(el) {
        var sections = getSections();
        var node = ['SECTION','FOOTER','NAV','HEADER'].indexOf(el.tagName) !== -1 ? el : getNearestSection(el);
        while (node && node !== document.body) {
          for (var i = 0; i < sections.length; i++) {
            if (sections[i] === node) return i;
          }
          node = node.parentElement;
        }
        return -1;
      }

      function clearAllHighlights() {
        document.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-card-selected').forEach(function(s) {
          s.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-card-selected');
        });
      }

      function notifyHtmlUpdate() {
        var clone = document.documentElement.cloneNode(true);
        clone.querySelectorAll('.yangu-editor-inject').forEach(function(el) { el.remove(); });
        clone.querySelectorAll('.yangu-product-cta').forEach(function(el) { el.remove(); });
        clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.section-hover,.yangu-card-selected,.yangu-product-card').forEach(function(el) {
          el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','section-hover','yangu-card-selected','yangu-product-card');
        });
        clone.querySelectorAll('[contenteditable]').forEach(function(el) {
          el.removeAttribute('contenteditable');
        });
        clone.querySelectorAll('[data-yangu-node-id]').forEach(function(el) {
          el.removeAttribute('data-yangu-node-id');
        });
        clone.querySelectorAll('[data-section-idx]').forEach(function(el) {
          el.removeAttribute('data-section-idx');
        });
        clone.querySelectorAll('*').forEach(function(el) {
          var ca = el.getAttribute('class');
          if (ca !== null && !ca.trim()) el.removeAttribute('class');
        });
        window.parent.postMessage({ type: 'html-update', html: clone.outerHTML }, '*');
      }

      document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,button').forEach(function(el) {
        if (el.children.length === 0 || el.tagName === 'A' || el.tagName === 'BUTTON') {
          el.setAttribute('contenteditable', 'true');
          el.addEventListener('blur', function() {
            notifyHtmlUpdate();
          });
        }
      });

      var sectionEls = getSections();
      sectionEls.forEach(function(el, idx) {
        el.classList.add('section-hover');
        el.dataset.sectionIdx = idx;
      });

      if (window.__YANGU_ENABLE_PRODUCT_CONTROLS) {
        injectProductControls();
        var productObserver = new MutationObserver(function() {
          injectProductControls();
        });
        productObserver.observe(document.body, { childList: true, subtree: true });

        // Remove legacy section-level CTA buttons (Order Now, Buy Now, etc.)
        var legacyLabels = ['order now','buy now','order','shop now','add to cart'];
        document.querySelectorAll('a, button').forEach(function(el) {
          if (el.closest('.yangu-product-controls') || el.classList.contains('yangu-product-cta')) return;
          var section = el.closest('section');
          if (!section) return;
          var text = (el.textContent || '').trim().toLowerCase();
          if (legacyLabels.indexOf(text) !== -1) {
            el.style.display = 'none';
            el.classList.add('yangu-legacy-cta-hidden');
          }
        });
      }

      // Hero image click — still allow image replacement via image-click message
      document.querySelectorAll('img').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          selectImage(el);
        });
      });

      function sendDeselect() {
        clearAllHighlights();
        window.parent.postMessage({ type: 'canvas-select', kind: 'page', tag: 'BODY', preview: '', sectionIndex: -1, nodeId: '' }, '*');
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { sendDeselect(); }
      });

      document.addEventListener('click', function(e) {
        var el = e.target;
        if (!el || el.tagName === 'HTML' || el.tagName === 'BODY') {
          sendDeselect();
          return;
        }

        if (window.__YANGU_ENABLE_PRODUCT_CONTROLS && el.closest) {
          if (el.closest('.yangu-product-control')) return;

          var productCard = el.closest('.yangu-product-card');
          if (productCard) {
            e.preventDefault();
            e.stopPropagation();
            clearAllHighlights();
            productCard.classList.add('yangu-card-selected');
            window.parent.postMessage({ type: 'canvas-select', kind: 'page', tag: productCard.tagName, preview: '', sectionIndex: -1, nodeId: '' }, '*');
            return;
          }
        }

        // Overlay div → find underlying image for replacement
        if (isOverlayDiv(el)) {
          var underlyingImg = findNearbyImage(el);
          if (underlyingImg) {
            e.preventDefault();
            e.stopPropagation();
            selectImage(underlyingImg);
            return;
          }
          var nearSec = getNearestSection(el);
          if (nearSec) {
            el = nearSec;
          } else {
            sendDeselect();
            return;
          }
        }

        // Direct section click
        if (['SECTION','FOOTER','NAV','HEADER'].indexOf(el.tagName) !== -1 && e.target === el) {
          var si = findSectionIndex(el);
          clearAllHighlights();
          el.classList.add('section-selected');
          var rect = el.getBoundingClientRect();
          window.parent.postMessage({
            type: 'canvas-select', kind: 'section', tag: el.tagName,
            preview: (el.id || el.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0,40)) || '',
            sectionIndex: si, nodeId: el.getAttribute('data-yangu-node-id') || '',
            sectionId: el.id || '', elRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          }, '*');
          if (si >= 0) window.parent.postMessage({ type: 'section-select', idx: si, tag: el.tagName }, '*');
          return;
        }
        if (el.tagName === 'IMG') return;

        var kind = classifyEl(el);
        // Non-text elements → walk up to section
        if (kind === 'page') {
          var nearSec = getNearestSection(el);
          if (nearSec) {
            kind = 'section';
            el = nearSec;
          } else {
            sendDeselect();
            return;
          }
        }
        var si = findSectionIndex(el);
        var sectionEl = si >= 0 ? getSections()[si] : null;
        clearAllHighlights();

        if (kind === 'section' && sectionEl) {
          sectionEl.classList.add('section-selected');
        } else if (kind === 'section') {
          el.classList.add('section-selected');
        } else if (kind === 'text') {
          el.classList.add('yangu-el-selected');
        }

        if (kind !== 'section' && sectionEl) {
          sectionEl.classList.add('section-selected');
        }

        var rectTarget = kind === 'section' && sectionEl ? sectionEl : el;
        var rect = rectTarget.getBoundingClientRect();
        var nodeTarget = kind === 'section' && sectionEl ? sectionEl : el;
        window.parent.postMessage({
          type: 'canvas-select',
          kind: kind,
          tag: (kind === 'section' && sectionEl ? sectionEl.tagName : el.tagName),
          preview: getPreview(kind === 'section' && sectionEl ? sectionEl : el, kind),
          sectionIndex: si,
          nodeId: nodeTarget.getAttribute('data-yangu-node-id') || '',
          sectionId: sectionEl ? (sectionEl.id || '') : '',
          elRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        }, '*');

        if (si >= 0) {
          window.parent.postMessage({ type: 'section-select', idx: si, tag: nodeTarget.tagName }, '*');
        }
      }, true);

      window.addEventListener('message', function(e) {
        if (!e.data || !e.data.type) return;

        if (e.data.type === 'clear-editor-selection') {
          clearAllHighlights();
          return;
        }

        if (e.data.type === 'apply-style') {
          var target = null;
          if (e.data.nodeId) {
            target = document.querySelector('[data-yangu-node-id="' + e.data.nodeId + '"]');
          }
          if (!target) {
            target = document.querySelector('.yangu-el-selected') || document.querySelector('.section-selected');
          }
          if (target && e.data.styles) {
            Object.keys(e.data.styles).forEach(function(k) {
              target.style[k] = e.data.styles[k];
            });
            notifyHtmlUpdate();
          }
        }

        if (e.data.type === 'apply-page-bg') {
          document.body.style.backgroundColor = e.data.color || '';
          notifyHtmlUpdate();
        }

        if (e.data.type === 'toolbar-action') {
          var action = e.data.action;
          var selSection = document.querySelector('.section-selected');

          if (action === 'remove_section' || action === 'delete_section') {
            if (selSection && ['SECTION','FOOTER','NAV','HEADER'].indexOf(selSection.tagName) !== -1) {
              if (selSection.tagName === 'NAV') return;
              selSection.remove();
              notifyHtmlUpdate();
            }
          }
          if (action === 'duplicate_section') {
            if (selSection && ['SECTION','FOOTER','NAV','HEADER'].indexOf(selSection.tagName) !== -1) {
              var clone = selSection.cloneNode(true);
              clone.removeAttribute('id');
              clone.classList.remove('section-selected');
              selSection.parentElement.insertBefore(clone, selSection.nextSibling);
              notifyHtmlUpdate();
            }
          }
        }
      });
    });
  </script>
`;

export function EditablePreview({ html, onHtmlChange, onSelectionChange, onProductEditRequest, onProductDeleteRequest, showAddSectionControl = true, viewportMode = "desktop" }: EditablePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | undefined>(undefined);
  const loadedHtmlRef = useRef<string | null>(null);

  const getEditableHtml = useCallback((baseHtml: string) => {
    const productControlsEnabled = Boolean(onProductEditRequest || onProductDeleteRequest);
    const inject = `<div class="yangu-editor-inject" style="display:none!important"></div>${EDIT_STYLES.replace('<style>', '<style class="yangu-editor-inject">')}${EDIT_SCRIPT.replace('<script>', `<script class="yangu-editor-inject">window.__YANGU_ENABLE_PRODUCT_CONTROLS = ${productControlsEnabled ? "true" : "false"};`)}`;
    return baseHtml.replace('</head>', inject + '</head>');
  }, [onProductDeleteRequest, onProductEditRequest]);

  const shouldReloadIframe = html !== loadedHtmlRef.current;

  useEffect(() => {
    if (shouldReloadIframe) {
      loadedHtmlRef.current = html;
    }
  }, [html, shouldReloadIframe]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'html-update') {
        loadedHtmlRef.current = e.data.html;
        onHtmlChange(e.data.html);
      }
      if (e.data?.type === 'section-select') {
        setSelectedSection(e.data.idx?.toString() || null);
      }
      if (e.data?.type === 'image-click') {
        setPendingImageSrc(e.data.src);
        setImagePickerOpen(true);
      }
      if (e.data?.type === 'canvas-select' && onSelectionChange) {
        onSelectionChange({
          kind: e.data.kind,
          tag: e.data.tag,
          preview: e.data.preview,
          sectionIndex: e.data.sectionIndex >= 0 ? e.data.sectionIndex : undefined,
          nodeId: e.data.nodeId || undefined,
          sectionId: e.data.sectionId || undefined,
          elRect: e.data.elRect || undefined,
        });
      }
      if (e.data?.type === 'product-edit-request' && onProductEditRequest) {
        onProductEditRequest(e.data.product as ProductCardData);
      }
      if (e.data?.type === 'product-delete-request' && onProductDeleteRequest) {
        onProductDeleteRequest(e.data.product as ProductCardData);
      }
      if (e.data?.type === 'add-section-at') {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;
        const sections = Array.from(doc.querySelectorAll('section, footer, nav, header'));
        const insertIdx = e.data.index ?? sections.length;
        const newSec = doc.createElement('section');
        newSec.style.cssText = 'padding:72px 24px;text-align:center;';
        newSec.innerHTML = '<div style="max-width:900px;margin:0 auto;"><h2 style="font-size:1.8rem;font-weight:700;margin-bottom:12px;" contenteditable="true">New Section</h2><p style="color:#666;" contenteditable="true">Click to edit this section content.</p></div>';
        newSec.classList.add('section-hover');
        if (insertIdx < sections.length && sections[insertIdx]) {
          sections[insertIdx].parentElement?.insertBefore(newSec, sections[insertIdx]);
        } else {
          const footer = doc.querySelector('footer');
          if (footer) footer.parentElement?.insertBefore(newSec, footer);
          else doc.body.appendChild(newSec);
        }
        const clone = doc.documentElement.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.yangu-editor-inject').forEach(el => el.remove());
        clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover,.yangu-card-selected,.yangu-product-card').forEach(el => {
          el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover','yangu-card-selected','yangu-product-card');
        });
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('[data-yangu-node-id]').forEach(el => el.removeAttribute('data-yangu-node-id'));
        clone.querySelectorAll('[data-section-idx]').forEach(el => el.removeAttribute('data-section-idx'));
        clone.querySelectorAll('*').forEach(el => {
          const ca = el.getAttribute('class');
          if (ca !== null && !ca.trim()) el.removeAttribute('class');
        });
        loadedHtmlRef.current = clone.outerHTML;
        onHtmlChange(clone.outerHTML);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHtmlChange, onProductDeleteRequest, onProductEditRequest, onSelectionChange]);

  const getDoc = useCallback(() => iframeRef.current?.contentDocument, []);

  const pushHtmlUpdate = useCallback(() => {
    const doc = getDoc();
    if (!doc) return;
    const clone = doc.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.yangu-editor-inject').forEach(el => el.remove());
    clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover,.yangu-card-selected,.yangu-product-card').forEach(el => {
      el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover','yangu-card-selected','yangu-product-card');
    });
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('[data-yangu-node-id]').forEach(el => el.removeAttribute('data-yangu-node-id'));
    clone.querySelectorAll('[data-section-idx]').forEach(el => el.removeAttribute('data-section-idx'));
    clone.querySelectorAll('*').forEach(el => {
      const ca = el.getAttribute('class');
      if (ca !== null && !ca.trim()) el.removeAttribute('class');
    });
    const cleanHtml = clone.outerHTML;
    loadedHtmlRef.current = cleanHtml;
    onHtmlChange(cleanHtml);
  }, [getDoc, onHtmlChange]);

  const handleImageSelected = useCallback((url: string) => {
    const doc = getDoc();
    if (!doc) return;
    if (pendingImageSrc) {
      const img = doc.querySelector(`img[src="${CSS.escape(pendingImageSrc)}"]`) as HTMLImageElement | null;
      if (img) { img.src = url; pushHtmlUpdate(); toast.success("Image replaced!"); return; }
    }
    const sel = doc.querySelector('.yangu-img-selected') as HTMLImageElement | null;
    if (sel) { sel.src = url; pushHtmlUpdate(); toast.success("Image replaced!"); } else { toast.info("Click an image first, then replace."); }
  }, [getDoc, pushHtmlUpdate, pendingImageSrc]);

  const handleAddSection = useCallback(() => {
    const doc = getDoc();
    if (!doc) return;
    const newSection = doc.createElement("section");
    newSection.style.cssText = "padding:72px 24px;text-align:center;";
    newSection.innerHTML = `<div style="max-width:900px;margin:0 auto;"><h2 style="font-size:1.8rem;font-weight:700;margin-bottom:12px;" contenteditable="true">New Section</h2><p style="color:#666;" contenteditable="true">Click to edit this section content.</p></div>`;
    newSection.classList.add('section-hover');
    const footer = doc.querySelector("footer");
    if (footer) { footer.parentElement?.insertBefore(newSection, footer); } else { doc.body.appendChild(newSection); }
    pushHtmlUpdate();
    toast.success("Section added!");
  }, [getDoc, pushHtmlUpdate]);

  const applyColorToPage = useCallback((color: string) => {
    const doc = getDoc();
    if (!doc) return;
    const allEls = doc.querySelectorAll("[style]");
    allEls.forEach(el => {
      const s = (el as HTMLElement).style;
      if (s.backgroundColor && (s.backgroundColor.includes("rgb") || s.backgroundColor.startsWith("#"))) {
        const tag = el.tagName;
        if (tag === "A" || tag === "BUTTON" || tag === "SPAN") {
          s.backgroundColor = color;
        }
      }
    });
    pushHtmlUpdate();
    toast.success("Style updated!");
  }, [getDoc, pushHtmlUpdate]);

  const handleMoveUp = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav, header"));
    const idx = parseInt(selectedSection);
    const el = allSections[idx];
    if (!el || !el.previousElementSibling || el.previousElementSibling.tagName === "NAV") { toast.info("Can't move further up."); return; }
    el.parentElement?.insertBefore(el, el.previousElementSibling);
    pushHtmlUpdate();
    toast.success("Section moved up!");
  }, [selectedSection, getDoc, pushHtmlUpdate]);

  const handleMoveDown = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav, header"));
    const idx = parseInt(selectedSection);
    const el = allSections[idx];
    if (!el || !el.nextElementSibling) { toast.info("Can't move further down."); return; }
    el.parentElement?.insertBefore(el.nextElementSibling, el);
    pushHtmlUpdate();
    toast.success("Section moved down!");
  }, [selectedSection, getDoc, pushHtmlUpdate]);

  const handleRemove = useCallback(() => {
    if (!selectedSection) { toast.info("Click a section first."); return; }
    const doc = getDoc();
    if (!doc) return;
    const allSections = Array.from(doc.querySelectorAll("section, footer, nav, header"));
    const idx = parseInt(selectedSection);
    const el = allSections[idx];
    if (!el || el.tagName === "NAV") { toast.info("Can't remove navigation."); return; }
    if (!confirm("Remove this section?")) return;
    el.remove();
    setSelectedSection(null);
    pushHtmlUpdate();
    toast.success("Section removed!");
  }, [selectedSection, getDoc, pushHtmlUpdate]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">Your Website Draft</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ToolButton icon={Image} label="Replace Image" onClick={() => { setPendingImageSrc(undefined); setImagePickerOpen(true); }} />
          {showAddSectionControl && <ToolButton icon={Plus} label="Add Section" onClick={handleAddSection} />}
          <ToolButton icon={Palette} label="Change Style" onClick={() => setColorPickerOpen(true)} />
          <ToolButton icon={ArrowUp} label="Move Up" onClick={handleMoveUp} />
          <ToolButton icon={ArrowDown} label="Move Down" onClick={handleMoveDown} />
          <ToolButton icon={Trash2} label="Remove" onClick={handleRemove} />
        </div>
      </div>

      <div className="flex-1 w-full flex items-start justify-center overflow-auto bg-muted/30">
        <iframe
          ref={iframeRef}
          srcDoc={getEditableHtml(html)}
          key="emenu-preview-stable"
          className={`border-0 transition-all duration-300 ${
            viewportMode === "mobile"
              ? "w-[390px] h-full shadow-2xl rounded-xl border border-border mx-auto"
              : "w-full h-full"
          }`}
          title="Editable Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <EditorImagePickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={handleImageSelected}
      />
      <EditorColorPickerDialog
        open={colorPickerOpen}
        onOpenChange={setColorPickerOpen}
        onSelect={applyColorToPage}
      />
    </div>
  );
}

function ToolButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
