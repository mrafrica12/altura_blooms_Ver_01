import { buyerMessage, conversationUrl, createReference, CLICK_EVENT } from './whatsapp-core.mjs';
for (const block of document.querySelectorAll('[data-whatsapp]')) {
  const form = block.querySelector('form');
  const preview = block.querySelector('[data-whatsapp-preview]');
  const link = preview.querySelector('a');
  const status = block.querySelector('[data-whatsapp-status]');
  const config = { enabled: true, approved: true, number: block.dataset.number };
  let reference;
  form.hidden = false;
  block.querySelector('[data-whatsapp-fallback]').hidden = true;
  form.addEventListener('input', () => {
    preview.hidden = true;
    link.removeAttribute('href');
    status.textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      reference ||= createReference();
      const message = buyerMessage(Object.fromEntries(new FormData(form)), reference);
      preview.querySelector('pre').textContent = message;
      link.href = conversationUrl(config, message);
      preview.hidden = false;
      status.textContent = 'Message prepared. Review it below before continuing.';
      preview.querySelector('pre').focus();
    } catch {
      status.textContent = 'Your message could not be prepared. Please use the enquiry information link.';
    }
  });
  link.addEventListener('click', () => {
    // Local hook only. No listener, analytics transport, or personal data is installed.
    block.dispatchEvent(new CustomEvent(CLICK_EVENT, { bubbles: true, detail: { source: 'buyers', enquiry_reference: reference } }));
  });
}
