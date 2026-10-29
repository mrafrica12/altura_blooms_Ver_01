(() => {
/* Catalogue filters: a filter is offered only when the data holds 2+ distinct values for it. */
Altura.FILTERS = [
  ['collection', 'Collection'], ['type', 'Type'], ['colorFamily', 'Colour'], ['bloomForm', 'Bloom form'],
  ['bloomSize', 'Bloom size'], ['stemLength', 'Stem length'], ['fragrance', 'Fragrance'],
  ['availability', 'Availability'], ['breeder', 'Breeder'],
];
Altura.availableFilters = (records) => Altura.FILTERS
  .map(([key, label]) => ({ key, label, values: [...new Set(records.map((r) => r[key]).filter(Boolean))].sort() }))
  .filter((f) => f.values.length > 1);
Altura.applyFilters = (records, active) => records.filter((r) => Object.entries(active).every(([k, v]) => !v || r[k] === v));
/* Data-driven flower catalogue. Reads data/varieties.json (approved records only).
   Empty or unavailable data => component stays hidden; nothing is invented.
   Records are expected to follow docs/data-models/variety.md and carry verificationStatus. */
(() => {
  const root = Altura.qs('[data-catalogue]');
  if (!root) return;
  const track = Altura.qs('.catalogue__track', root);
  const filterBox = Altura.qs('.catalogue__filters', root);
  let records = [];

  const card = (r) => {
    const facts = [r.colorFamily || r.color, r.stemLength && `${r.stemLength} cm`].filter(Boolean).join(' · ');
    const media = Altura.el('div', { class: 'flower-card__media' });
    if (r.demo) { media.classList.add('demo-photo'); media.append(Altura.el('span', { class: 'eyebrow' }, 'Photography placeholder'), Altura.el('span', { class: 'display' }, r.name), Altura.el('p', {}, 'Template sample · not an Altura variety')); }
    if (r.heroImage) media.append(Altura.el('img', { src: r.heroImage, alt: r.altText || r.name, loading: 'lazy', decoding: 'async', width: 800, height: 1000 }));
    const body = Altura.el('div', { class: 'flower-card__body' }, [
      r.type || r.collection ? Altura.el('span', { class: 'flower-card__cat' }, r.type || r.collection) : '',
      Altura.el('h3', {}, r.name),
      facts ? Altura.el('span', { class: 'flower-card__facts' }, facts) : '',
      Altura.el('a', { class: 'link-arrow', href: `varieties/${encodeURIComponent(r.slug)}.html` }, `Explore ${r.name}`),
    ]);
    return Altura.el('article', { class: 'flower-card' }, [media, body]);
  };

  const render = () => {
    const active = {};
    Altura.qsa('select', filterBox).forEach((s) => { active[s.name] = s.value; });
    const shown = Altura.applyFilters(records, active);
    track.replaceChildren(...(shown.length ? shown.map(card) : [Altura.el('p', { role: 'status' }, 'No roses match these filters. Try another selection.')]));
  };

  const mount = (data) => {
    records = (Array.isArray(data) ? data : []).filter((r) => r && r.slug && r.name && ((root.hasAttribute('data-demo-catalogue') && document.documentElement.dataset.stage === 'development' && r.demo === true) || (r.approved === true && r.verificationStatus)));
    if (!records.length) return;
    filterBox.replaceChildren(...Altura.availableFilters(records).map((f) => {
      const select = Altura.el('select', { name: f.key, id: `f-${f.key}` }, [Altura.el('option', { value: '' }, 'All'), ...f.values.map((v) => Altura.el('option', { value: v }, v))]);
      select.addEventListener('change', render);
      return Altura.el('label', { for: `f-${f.key}` }, [f.label, select]);
    }));
    root.hidden = false;
    render();
  };

  Altura.mountCatalogue = mount; // allows local testing without publishing records
  fetch(root.dataset.catalogue).then((r) => (r.ok ? r.json() : [])).then(mount).catch(() => {});
})();
})();
