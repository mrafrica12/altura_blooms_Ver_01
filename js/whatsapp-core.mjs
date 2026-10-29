/* Pure helpers: no network, storage, credentials, or analytics. */
export const CLICK_EVENT = 'whatsapp_buyer_click';
export function isEnabled(config) {
  if (config?.enabled !== true) return false;
  if (config.approved !== true || (typeof config.number !== 'string' || !/^[1-9]\d{7,14}$/.test(config.number) || /\D/.test(config.number))) {
    throw new Error('WhatsApp requires an explicitly approved international commercial number (8–15 digits, no formatting).');
  }
  return true;
}
export function clean(value, max = 120) {
  return Array.from(String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/[\ud800-\udfff]/gu, '').replace(/\s+/g, ' ').trim()).slice(0, max).join('');
}
export function createReference(date = new Date(), random = globalThis.crypto) {
  const bytes = new Uint8Array(8);
  random.getRandomValues(bytes);
  const stamp = [date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear() % 100].map(n => String(n).padStart(2, '0')).join('');
  return `AB-${stamp}-${Array.from(bytes, n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('')}`;
}
export function buyerMessage(fields = {}, reference = '', flower = null) {
  const lines = ['Hello Altura Blooms,', '', "I'm contacting you through the Altura Blooms website and would like to start a commercial conversation.", ''];
  for (const [key, label] of Object.entries({ demoInterest: 'Demo flower (fictional sample)', company: 'Company', country: 'Country', buyerType: 'Buyer type', quantity: 'Quantity', requiredWeek: 'Required week', destination: 'Destination', stemPreference: 'Stem preference' })) {
    const value = clean(fields[key]);
    if (value) lines.push(`${label}: ${value}`);
  }
  // A future catalogue adapter must pass only records approved by Altura.
  if (flower?.approved === true && clean(flower.name)) {
    lines.push(`Rose: ${clean(flower.name)}`);
    if (clean(flower.collection)) lines.push(`Collection: ${clean(flower.collection)}`);
  }
  lines.push('', "I'm interested in discussing your developing rose assortment and future supply.");
  if (reference) lines.push('', `Reference: ${clean(reference, 40)}`);
  lines.push('', '[ALTURA-WEB · BUYER-ENQUIRY]');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
export function conversationUrl(config, message = buyerMessage()) {
  return isEnabled(config) ? `https://wa.me/${config.number}?text=${encodeURIComponent(message)}` : null;
}
