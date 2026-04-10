import { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { Image, Trash2, Plus, Palette, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { EditorImagePickerDialog } from "./EditorImagePickerDialog";
import { EditorColorPickerDialog } from "./EditorColorPickerDialog";
import type { CanvasSelection } from "@/lib/builder/selectionTypes";

interface EditablePreviewProps {
  html: string;
  onHtmlChange: (html: string) => void;
  onSelectionChange?: (selection: CanvasSelection) => void;
  viewportMode?: "desktop" | "mobile";
}

const EDIT_STYLES = `
  <style>
    * { box-sizing: border-box; }
    body { overflow-x: hidden; }
    section, header, nav, footer { overflow: visible !important; }
    button, a[class*="btn"], a[class*="cta"], a[class*="order"], [class*="button"] {
      max-width: 100%;
      overflow: visible;
      white-space: normal;
      word-wrap: break-word;
    }
    [contenteditable]:hover { outline: 2px solid #22c55e44; outline-offset: 2px; cursor: text; }
    [contenteditable]:focus { outline: 2px solid #22c55e; outline-offset: 2px; }
    .section-hover { position: relative; }
    .section-hover:hover { outline: 2px dashed #22c55e44; outline-offset: -2px; border-radius: 8px; }
    .section-selected { outline: 2px solid #22c55e !important; outline-offset: -2px; border-radius: 8px; }
    img:hover { outline: 2px solid #22c55e44; cursor: pointer; }
    .yangu-img-selected { outline: 2px solid #22c55e !important; }
    .yangu-el-selected { outline: 2px solid #22c55e !important; outline-offset: 2px; }
    button:hover, a[class*="btn"]:hover, a[class*="cta"]:hover { outline: 2px solid #22c55e44; outline-offset: 2px; }
    .yangu-btn-selected { outline: 2px solid #22c55e !important; outline-offset: 2px; }
    .yangu-add-section-pill {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: -14px;
      z-index: 100;
      padding: 4px 14px;
      border-radius: 20px;
      background: hsl(217 91% 60% / 0.15);
      color: #3b82f6;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px dashed #3b82f6;
      white-space: nowrap;
      transition: all 0.2s;
      opacity: 0.5;
    }
    .yangu-add-section-pill:hover {
      opacity: 1;
      background: #3b82f6;
      color: #fff;
      border-style: solid;
      box-shadow: 0 2px 12px rgba(59,130,246,0.4);
    }
    .yangu-section-gap {
      position: relative;
      height: 24px;
      transition: height 0.15s;
    }
    .yangu-section-gap:hover {
      height: 36px;
    }
    .yangu-section-gap::before {
      content: '';
      position: absolute;
      left: 10%; right: 10%; top: 50%;
      height: 1px;
      background: hsl(217 91% 60% / 0.15);
      transition: background 0.15s;
    }
    .yangu-section-gap:hover::before {
      background: #3b82f6;
      left: 0; right: 0;
    }
  </style>
`;

const EDIT_SCRIPT = `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var nodeIdCounter = 0;
      document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,button,img,section,footer,nav,header,div').forEach(function(el) {
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
        var cl = Array.from(el.classList || []);
        if (t === 'BUTTON' || (t === 'A' && cl.some(function(c) { return c.includes('btn') || c.includes('button') || c.includes('cta') || c.includes('order'); }))) return 'button';
        if (t === 'IMG') return 'image';
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','LI','LABEL'].indexOf(t) !== -1) return 'text';
        if (t === 'A') return 'button';
        if (t === 'DIV' && cl.some(function(c) { return c.includes('btn') || c.includes('button') || c.includes('cta'); })) return 'button';
        if (['SECTION','FOOTER','NAV','HEADER'].indexOf(t) !== -1) return 'section';
        if (t === 'DIV') {
          if (cl.some(function(c) { return c.includes('card') || c.includes('item') || c.includes('product') || c.includes('menu-item'); })) return 'card';
          var parent = el.parentElement;
          if (parent) {
            var ps = window.getComputedStyle(parent);
            var isGrid = ps.display === 'grid' || ps.display === 'inline-grid' || ps.display === 'flex' || ps.display === 'inline-flex';
            if (isGrid && el.querySelector('img') && el.querySelector('h3,h4,p,span')) return 'card';
          }
        }
        return 'page';
      }

      /**
       * Detect if a div is a purely visual overlay (gradient, backdrop, etc.)
       * that should pass clicks through to the underlying image.
       */
      function isOverlayDiv(el) {
        if (el.tagName !== 'DIV') return false;
        var s = window.getComputedStyle(el);
        if (s.position !== 'absolute' && s.position !== 'fixed') return false;
        // Has a background gradient or semi-transparent bg but no meaningful content
        var bg = s.backgroundImage || '';
        var bgColor = s.backgroundColor || '';
        var hasGradient = bg.includes('gradient');
        var hasTransparentBg = bgColor.includes('rgba') || bgColor === 'transparent' || bgColor === '';
        // No text content and no interactive children
        var text = (el.textContent || '').trim();
        var hasInteractive = el.querySelector('a, button, input, img, h1, h2, h3, h4, h5, h6, p, span');
        if ((hasGradient || hasTransparentBg) && !text && !hasInteractive) return true;
        // Empty div used as overlay
        if (el.children.length === 0 && !text) return true;
        return false;
      }

      /**
       * Find the hero/section background image near an overlay div.
       * Looks in sibling divs and the parent section for an <img>.
       */
      function findNearbyImage(overlayEl) {
        var parent = overlayEl.parentElement;
        if (!parent) return null;
        // Check siblings
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
        if (kind === 'text' || kind === 'button') return (el.textContent || '').trim().substring(0, 60);
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
        document.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected').forEach(function(s) {
          s.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected');
        });
      }

      function notifyHtmlUpdate() {
        var clone = document.documentElement.cloneNode(true);
        clone.querySelectorAll('.yangu-editor-inject').forEach(function(el) { el.remove(); });
        clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover').forEach(function(el) {
          el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover');
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
      for (var gi = 0; gi <= sectionEls.length; gi++) {
        var gap = document.createElement('div');
        gap.className = 'yangu-section-gap yangu-editor-inject';
        var pill = document.createElement('button');
        pill.className = 'yangu-add-section-pill';
        pill.innerHTML = '+ Add Section';
        pill.dataset.insertIdx = String(gi);
        pill.addEventListener('click', function(ev) {
          ev.stopPropagation();
          window.parent.postMessage({ type: 'add-section-at', index: Number(ev.currentTarget.dataset.insertIdx) }, '*');
        });
        gap.appendChild(pill);
        if (gi < sectionEls.length) {
          sectionEls[gi].parentElement.insertBefore(gap, sectionEls[gi]);
        } else if (sectionEls.length > 0) {
          var lastSec = sectionEls[sectionEls.length - 1];
          if (lastSec.nextSibling) lastSec.parentElement.insertBefore(gap, lastSec.nextSibling);
          else lastSec.parentElement.appendChild(gap);
        }
      }

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

        // If clicking on an overlay div, find the underlying image
        if (isOverlayDiv(el)) {
          var underlyingImg = findNearbyImage(el);
          if (underlyingImg) {
            e.preventDefault();
            e.stopPropagation();
            selectImage(underlyingImg);
            return;
          }
          // No image found — treat as section click
          var nearSec = getNearestSection(el);
          if (nearSec) {
            el = nearSec;
            // fall through to section selection below
          } else {
            sendDeselect();
            return;
          }
        }

        // Clicking directly on a section/footer/nav/header = select that section
        if (['SECTION','FOOTER','NAV','HEADER'].indexOf(el.tagName) !== -1 && e.target === el) {
          var kind = 'section';
          var si = findSectionIndex(el);
          clearAllHighlights();
          el.classList.add('section-selected');
          var rect = el.getBoundingClientRect();
          window.parent.postMessage({
            type: 'canvas-select', kind: kind, tag: el.tagName,
            preview: (el.id || el.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0,40)) || '',
            sectionIndex: si, nodeId: el.getAttribute('data-yangu-node-id') || '',
            sectionId: el.id || '', elRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          }, '*');
          if (si >= 0) window.parent.postMessage({ type: 'section-select', idx: si, tag: el.tagName }, '*');
          return;
        }
        if (el.tagName === 'IMG') return;

        var kind = classifyEl(el);
        // Generic wrapper divs → walk up to nearest section instead of deselecting
        if (kind === 'page') {
          var nearSec = getNearestSection(el);
          if (nearSec) {
            // Treat as section selection
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
        } else if (kind === 'button') {
          el.classList.add('yangu-btn-selected');
        } else if (kind === 'text' || kind === 'card') {
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

        if (e.data.type === 'apply-style') {
          var target = null;
          if (e.data.nodeId) {
            target = document.querySelector('[data-yangu-node-id="' + e.data.nodeId + '"]');
          }
          if (!target) {
            target = document.querySelector('.yangu-el-selected') || document.querySelector('.yangu-btn-selected') || document.querySelector('.section-selected');
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

        // ── Toolbar actions: delete/duplicate for sections and cards ──
        if (e.data.type === 'toolbar-action') {
          var action = e.data.action;
          var sections = getSections();
          var selSection = document.querySelector('.section-selected');

          if (action === 'remove_section' || action === 'delete_section') {
            if (selSection && ['SECTION','FOOTER','NAV','HEADER'].indexOf(selSection.tagName) !== -1) {
              if (selSection.tagName === 'NAV') return; // protect nav
              // Also remove preceding gap pill if present
              var prev = selSection.previousElementSibling;
              if (prev && prev.classList.contains('yangu-section-gap')) prev.remove();
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
          if (action === 'delete_element') {
            var cardEl = document.querySelector('.yangu-el-selected');
            if (cardEl) {
              cardEl.remove();
              notifyHtmlUpdate();
            }
          }
          if (action === 'duplicate_element') {
            var cardEl2 = document.querySelector('.yangu-el-selected');
            if (cardEl2) {
              var dup = cardEl2.cloneNode(true);
              dup.classList.remove('yangu-el-selected');
              cardEl2.parentElement.insertBefore(dup, cardEl2.nextSibling);
              notifyHtmlUpdate();
            }
          }
        }
      });
    });
  </script>
`;

export function EditablePreview({ html, onHtmlChange, onSelectionChange, viewportMode = "desktop" }: EditablePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | undefined>(undefined);
  const loadedHtmlRef = useRef<string | null>(null);

  const getEditableHtml = useCallback((baseHtml: string) => {
    const inject = `<div class="yangu-editor-inject" style="display:none!important"></div>${EDIT_STYLES.replace('<style>', '<style class="yangu-editor-inject">')}${EDIT_SCRIPT.replace('<script>', '<script class="yangu-editor-inject">')}`;
    return baseHtml.replace('</head>', inject + '</head>');
  }, []);

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
        clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover').forEach(el => {
          el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover');
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
  }, [onHtmlChange, onSelectionChange]);

  const getDoc = useCallback(() => iframeRef.current?.contentDocument, []);

  const pushHtmlUpdate = useCallback(() => {
    const doc = getDoc();
    if (!doc) return;
    const clone = doc.documentElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.yangu-editor-inject').forEach(el => el.remove());
    clone.querySelectorAll('.section-selected,.yangu-img-selected,.yangu-el-selected,.yangu-btn-selected,.section-hover').forEach(el => {
      el.classList.remove('section-selected','yangu-img-selected','yangu-el-selected','yangu-btn-selected','section-hover');
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
          <ToolButton icon={Plus} label="Add Section" onClick={handleAddSection} />
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
