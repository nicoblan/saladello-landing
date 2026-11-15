/* Saladello — landing
 * Editá CONFIG con los datos reales antes de publicar.
 */
const CONFIG = {
  accent: '#F0663A',            // opciones del diseño: #F0663A, #C9E14B, #7FA6FF, #F5B83D
  showSocialProof: true,        // ocultalo hasta tener testimonios/logos verificados
  contactEmail: 'contacto.saladello@gmail.com',
  whatsapp: '+54 9 11 3602-0311',
  responseTime: '24 hs',
  instagram: '@saladello',
  instagramUrl: '#',
  linkedin: 'linkedin/saladello',
  linkedinUrl: '#',
};

// Envío del formulario: cada consulta llega por mail a CONFIG.contactEmail usando FormSubmit (formsubmit.co).
// La primera vez, FormSubmit manda un mail de activación a esa casilla: hay que confirmarlo para que empiecen a llegar.
async function submitLead(data) {
  const res = await fetch('https://formsubmit.co/ajax/' + CONFIG.contactEmail, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: 'Nueva consulta desde la web — ' + data.nombre,
      _template: 'table',
      _replyto: data.email,
      Nombre: data.nombre,
      Email: data.email,
      'Teléfono / WhatsApp': data.telefono || '(no lo dejó)',
      'Tipo de trabajo': data.tipoTexto,
      Mensaje: data.mensaje,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || String(body.success) !== 'true') throw new Error(body.message || 'No se pudo enviar');
}

(function () {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Config / placeholders ---------- */
  root.style.setProperty('--accent', CONFIG.accent);
  $$('[data-ph]').forEach(el => { el.textContent = CONFIG[el.dataset.ph]; el.dataset.placeholder = el.dataset.ph; });
  $$('[data-ph-text]').forEach(el => { el.textContent = CONFIG[el.dataset.phText]; });
  const hrefs = {
    mail: 'mailto:' + CONFIG.contactEmail,
    whatsapp: 'https://wa.me/' + CONFIG.whatsapp.replace(/\D/g, ''),
    instagram: CONFIG.instagramUrl || '#',
    linkedin: CONFIG.linkedinUrl || '#',
  };
  $$('[data-href]').forEach(el => { el.href = hrefs[el.dataset.href]; });
  $('#social-proof').hidden = !CONFIG.showSocialProof;
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Theme ---------- */
  function paintTheme() {
    const dark = root.dataset.theme === 'dark';
    const label = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    $$('[data-theme-icon]').forEach(el => { el.textContent = dark ? 'light_mode' : 'dark_mode'; });
    $$('[data-theme-label]').forEach(el => { el.textContent = label; });
    $$('.icon-btn[data-theme-toggle]').forEach(el => { el.setAttribute('aria-label', label); el.title = label; });
  }
  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('saladello-theme', root.dataset.theme); } catch (e) {}
    paintTheme();
  }));
  paintTheme();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menu-btn');
  const menu = $('#menu-movil');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    $('.ms', menuBtn).textContent = open ? 'close' : 'menu';
  }
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 860px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- FAQ (una abierta a la vez) ---------- */
  const faqBtns = $$('#faq button');
  faqBtns.forEach(btn => btn.addEventListener('click', () => {
    const wasOpen = btn.getAttribute('aria-expanded') === 'true';
    faqBtns.forEach(b => {
      const open = b === btn && !wasOpen;
      b.setAttribute('aria-expanded', String(open));
      $('.faq-icon', b).textContent = open ? 'remove' : 'add';
      document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
    });
  }));

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('revealed');
      io.unobserve(e.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('reveal-init');
      el.style.transitionDelay = (Number(el.dataset.reveal) || 0) + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Contact form ---------- */
  const form = $('#contact-form');
  const FIELDS = { name: 'f-name', email: 'f-email', phone: 'f-phone', type: 'f-type', message: 'f-msg' };
  const touched = {};
  let tried = false;
  let sending = false;
  const live = $('#form-live');
  const fail = $('#form-fail');

  const values = () => Object.fromEntries(Object.entries(FIELDS).map(([k, id]) => [k, document.getElementById(id).value]));

  function validate(v) {
    const e = {};
    if (!v.name.trim()) e.name = 'Contanos cómo te llamás.';
    if (!v.email.trim()) e.email = 'Necesitamos un email para responderte.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Revisá el email, parece que le falta algo.';
    if (v.phone.trim() && !/^[+\d\s().-]{6,}$/.test(v.phone.trim())) e.phone = 'Usá solo números, espacios, guiones o +.';
    if (!v.type) e.type = 'Elegí una opción.';
    if (v.message.trim().length < 10) e.message = v.message.trim() ? 'Contanos un poco más (mínimo 10 caracteres).' : 'Escribinos qué necesitás.';
    return e;
  }

  function paintErrors() {
    const errs = validate(values());
    let count = 0;
    Object.entries(FIELDS).forEach(([k, id]) => {
      const show = (tried || touched[k]) && errs[k];
      const input = document.getElementById(id);
      const msg = document.getElementById('e-' + k);
      input.setAttribute('aria-invalid', show ? 'true' : 'false');
      msg.textContent = show || '';
      msg.hidden = !show;
      if (show) count++;
    });
    return { errs, count };
  }

  function setSending(on) {
    sending = on;
    $$('input, select, textarea, button[type="submit"]', form).forEach(el => { el.disabled = on; });
    $('#submit-btn').setAttribute('aria-busy', String(on));
    $('#submit-label').textContent = on ? 'Enviando…' : 'Quiero empezar';
    $('#submit-icon').textContent = on ? 'hourglass_top' : 'arrow_forward';
    if (on) live.textContent = 'Enviando tu mensaje…';
  }

  Object.entries(FIELDS).forEach(([k, id]) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { fail.hidden = true; paintErrors(); });
    el.addEventListener('change', () => paintErrors());
    el.addEventListener('blur', () => { touched[k] = true; paintErrors(); });
  });

  form.addEventListener('submit', async ev => {
    ev.preventDefault();
    if (sending) return;
    tried = true;
    const { errs, count } = paintErrors();
    const first = Object.keys(FIELDS).find(k => errs[k]);
    if (first) {
      live.textContent = `Revisá ${count} ${count === 1 ? 'campo' : 'campos'} del formulario.`;
      document.getElementById(FIELDS[first]).focus();
      return;
    }
    const v = values();
    fail.hidden = true;
    setSending(true);
    try {
      await submitLead({ nombre: v.name.trim(), email: v.email.trim(), telefono: v.phone.trim(), tipo: v.type, tipoTexto: $('#f-type').selectedOptions[0].text, mensaje: v.message.trim() });
      setSending(false);
      $('#sent-to').textContent = v.email.trim();
      form.hidden = true;
      $('#form-success').hidden = false;
      live.textContent = 'Mensaje enviado.';
      setTimeout(() => $('#ok-title').focus(), 30);
    } catch (err) {
      setSending(false);
      fail.hidden = false;
      live.textContent = '';
    }
  });

  $('#form-reset').addEventListener('click', () => {
    form.reset();
    Object.keys(touched).forEach(k => delete touched[k]);
    tried = false;
    paintErrors();
    live.textContent = '';
    $('#form-success').hidden = true;
    form.hidden = false;
    document.getElementById(FIELDS.name).focus();
  });
})();
