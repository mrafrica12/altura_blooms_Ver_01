(() => {
/* Shared helpers. Bundled as one scope by tools/build/build.mjs; exposes window.Altura. */
window.Altura = window.Altura || {};
Altura.qs = (sel, root = document) => root.querySelector(sel);
Altura.qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
Altura.reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
Altura.el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) node.setAttribute(k, v);
  for (const c of [].concat(children)) node.append(c);
  return node;
};
/* Focus trap for the full-screen menu. */
Altura.trapFocus = (container, event) => {
  if (event.key !== 'Tab') return;
  const items = Altura.qsa('a[href], button:not([disabled])', container).filter((n) => n.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
  else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
};
/* Editorial header and modal-style navigation. No dependencies or scroll interception. */
(() => {
  const header = Altura.qs('.site-header');
  const toggle = Altura.qs('.menu-toggle');
  const panel = Altura.qs('#menu-panel');
  if (!header || !toggle || !panel) return;
  const logo = header.querySelector('.wordmark');
  const background = [...document.body.children].filter((n) => n !== header && n.tagName !== 'SCRIPT');
  const desktop = matchMedia('(min-width: 1024px)');
  let opened = false, scrollPosition = 0, previousTop = '', previousPadding = '';
  const inertStates = new Map();
  const onScroll = () => { if (!opened) header.classList.toggle('is-scrolled', window.scrollY > 32); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const setOpen = (open, restoreFocus = true) => {
    if (open === opened || (open && desktop.matches)) return;
    opened = open;
    if (open) {
      scrollPosition = window.scrollY;
      previousTop = document.body.style.top;
      previousPadding = document.body.style.paddingRight;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
      document.body.style.top = `-${scrollPosition}px`;
      document.body.classList.add('menu-locked');
      for (const node of background) { inertStates.set(node, node.inert); node.inert = true; }
      logo.inert = true;
      panel.scrollTop = 0;
    }
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));
    panel.classList.toggle('is-open', open);
    header.classList.toggle('is-menu-open', open);
    if (open) panel.querySelector('ul a').focus({ preventScroll: true });
    else {
      document.body.classList.remove('menu-locked');
      document.body.style.top = previousTop;
      document.body.style.paddingRight = previousPadding;
      for (const [node, inert] of inertStates) node.inert = inert;
      inertStates.clear();
      logo.inert = false;
      const scrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, scrollPosition);
      document.documentElement.style.scrollBehavior = scrollBehavior;
      onScroll();
      if (restoreFocus) (desktop.matches ? logo : toggle).focus({ preventScroll: true });
    }
  };
  toggle.addEventListener('click', () => setOpen(!opened));
  document.addEventListener('keydown', (event) => {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    else if (event.key === 'Tab') {
      const items = [toggle, ...panel.querySelectorAll('a[href]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  panel.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false, false); });
  desktop.addEventListener('change', (event) => { if (event.matches) setOpen(false); });
  window.addEventListener('pagehide', () => setOpen(false, false));
  window.addEventListener('pageshow', onScroll);
})();
/* Gentle reveal via IntersectionObserver. No libraries. */
(() => {
  const nodes = Altura.qsa('[data-reveal]');
  if (!nodes.length) return;
  if (!('IntersectionObserver' in window) || Altura.reducedMotion()) { nodes.forEach((n) => n.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.documentElement.classList.add('reveal-ready');
  nodes.forEach((n) => io.observe(n));
})();
/* Shared form niceties: opens optional <details> when a field inside is invalid. */
document.addEventListener('invalid', (e) => {
  const d = e.target.closest && e.target.closest('details');
  if (d) d.open = true;
}, true);
/* Dated events: once an event's end date has passed, wording switches from scheduled to concluded.
   Post-event content must still be replaced with verified recap information. */
(() => {
  Altura.qsa('[data-event-end]').forEach((node) => {
    const end = new Date(`${node.dataset.eventEnd}T23:59:59`);
    if (Date.now() > end) node.textContent = 'Concluded';
  });
})();
/* Buyer enquiry — front-end only. No endpoint exists, nothing is transmitted or stored.
   When config enables enquiries, a server-side handler (integrations/buyers) must receive the POST. */
(() => {
  const form = Altura.qs('[data-enquiry]');
  if (!form) return;
  const status = Altura.qs('[data-enquiry-status]', form);
  const endpoint = form.dataset.endpoint; // intentionally absent in development
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!endpoint) return;
    if (!form.reportValidity()) return;
    status.textContent = 'Sending…';
    // Submission wiring is deferred until a private endpoint, consent text and CRM routing are approved.
  });
})();
})();
