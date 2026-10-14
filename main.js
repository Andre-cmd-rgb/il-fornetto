// Opening status from the hours table (Italian time), the cake order form that
// writes the WhatsApp message, and gentle scroll reveals.
const WHATSAPP = 'https://wa.me/393792003616';
const dayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function romeNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), minutes: +parts.hour * 60 + +parts.minute };
}

const rows = [...document.querySelectorAll('[data-day]')];
// "7:15-13:00 16:30-19:30" → [[435, 780], [990, 1170]]
const slots = day => (rows.find(r => +r.dataset.day === day)?.dataset.hours || '').split(' ').filter(Boolean)
  .map(range => range.split('-').map(time => { const [h, m] = time.split(':'); return h * 60 + +m; }));
const clock = minutes => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;

function openingStatus({ day, minutes }) {
  const today = slots(day);
  const current = today.find(([from, to]) => minutes >= from && minutes < to);
  if (current) return { open: true, text: `Aperto ora · chiude alle ${clock(current[1])}` };
  const next = today.find(([from]) => from > minutes);
  if (next) return { open: false, text: `Chiuso ora · ${today[0][0] < minutes ? 'riapre' : 'apre'} alle ${clock(next[0])}` };
  for (let i = 1; i <= 7; i++) {
    const day2 = (day + i) % 7;
    const [first] = slots(day2);
    if (first) return { open: false, text: `Chiuso ora · apre ${i === 1 ? 'domani' : dayNames[day2]} alle ${clock(first[0])}` };
  }
  return { open: false, text: 'Chiuso ora' };
}

if (rows.length) {
  const now = romeNow();
  const status = openingStatus(now);
  rows.find(r => +r.dataset.day === now.day)?.classList.add('today');
  for (const el of document.querySelectorAll('[data-status]')) {
    el.dataset.open = status.open;
    el.querySelector('.status-text').textContent = status.text;
    el.hidden = false;
  }
}

const form = document.querySelector('#ordina-torta');
if (form) {
  const f = form.elements;
  const tomorrow = new Date(Date.now() + 864e5);
  f.data.min = [tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()].map(n => String(n).padStart(2, '0')).join('-');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const when = new Date(`${f.data.value}T12:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    const lines = [
      'Ciao! Vorrei ordinare una torta.',
      `Occasione: ${f.occasione.value}`,
      `Per: ${when}`,
      f.persone.value && `Persone: ${f.persone.value}`,
      f.scritta.value.trim() && `Scritta: ${f.scritta.value.trim()}`,
      f.idee.value.trim() && `Idee: ${f.idee.value.trim()}`,
      f.nome.value.trim() && `Nome: ${f.nome.value.trim()}`,
    ].filter(Boolean);
    const url = `${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
    const tab = window.open(url, '_blank');
    if (tab) tab.opener = null;
    else location.href = url;
  });
}

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => observer.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}
