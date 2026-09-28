/* ============================================================
   VICTOR RESORT & SPA — motion + interaction
   ============================================================ */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* brand logo slot */
  $$('.brand-img').forEach(img => {
    const box = img.closest('.hdr__logo, .ft__logo');
    const mark = () => { if (box && img.naturalWidth > 0) box.classList.add('has-logo'); };
    img.addEventListener('load', mark);
    if (img.complete) mark();
  });

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* header state (light over hero, cream when scrolled) */
  const hdr = $('#hdr');
  const onScroll = () => { hdr.classList.toggle('is-scrolled', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* Lenis */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !RM) {
    lenis = new window.Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (hasGSAP && window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
  }
  const scrollTo = el => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); };
  $$('a[href^="#"]').forEach(a => { const id = a.getAttribute('href'); if (id.length < 2) return; a.addEventListener('click', e => { const el = $(id); if (!el) return; e.preventDefault(); closeMenu(); scrollTo(el); }); });

  /* mobile menu */
  const burger = $('#burger');
  const openMenu = () => { document.body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); };
  function closeMenu() { document.body.classList.remove('menu-open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }
  if (burger) burger.addEventListener('click', () => document.body.classList.contains('menu-open') ? closeMenu() : openMenu());

  /* reusable auto-swipe carousel */
  function initCarousel(scrollEl, prevSel, nextSel) {
    if (!scrollEl) return;
    const track = scrollEl.firstElementChild;
    let half = 0;
    const setup = () => { if (track.dataset.cloned !== '1') { track.innerHTML += track.innerHTML; track.dataset.cloned = '1'; } half = track.scrollWidth / 2; };
    setup(); window.addEventListener('load', setup); window.addEventListener('resize', () => { half = track.scrollWidth / 2; });
    const step = () => Math.min(scrollEl.clientWidth * .85, 640);
    let paused = false, rt;
    const resumeSoon = () => { clearTimeout(rt); rt = setTimeout(() => paused = false, 2000); };
    const prev = prevSel && $(prevSel), next = nextSel && $(nextSel);
    if (prev) prev.addEventListener('click', () => { paused = true; scrollEl.scrollBy({ left: -step(), behavior: 'smooth' }); resumeSoon(); });
    if (next) next.addEventListener('click', () => { paused = true; scrollEl.scrollBy({ left: step(), behavior: 'smooth' }); resumeSoon(); });
    const wrap = () => { if (!half) return; if (scrollEl.scrollLeft >= half) scrollEl.scrollLeft -= half; else if (scrollEl.scrollLeft < 0) scrollEl.scrollLeft += half; };
    scrollEl.addEventListener('scroll', wrap, { passive: true });
    scrollEl.addEventListener('pointerenter', () => paused = true);
    scrollEl.addEventListener('pointerleave', () => { if (!down) paused = false; });
    if (!RM) { const tick = () => { if (!paused && half) { scrollEl.scrollLeft += 0.5; wrap(); } requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
    let down = false, sx = 0, sl = 0, moved = 0;
    scrollEl.addEventListener('pointerdown', e => { down = true; paused = true; moved = 0; sx = e.clientX; sl = scrollEl.scrollLeft; scrollEl.classList.add('is-drag'); });
    scrollEl.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved += Math.abs(dx); scrollEl.scrollLeft = sl - dx; });
    const end = () => { if (!down) return; down = false; scrollEl.classList.remove('is-drag'); resumeSoon(); };
    scrollEl.addEventListener('pointerup', end); scrollEl.addEventListener('pointercancel', end);
    scrollEl.addEventListener('click', e => { if (moved > 6) e.preventDefault(); }, true);
  }
  initCarousel($('#svcScroll'), '[data-svc-prev]', '[data-svc-next]');
  initCarousel($('#spaScroll'), '[data-spa-prev]', '[data-spa-next]');

  /* booking modal */
  const modal = $('#modal');
  const openModal = () => { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); };
  const closeModal = () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); };
  $$('[data-book]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); closeMenu(); openModal(); }));
  $$('[data-close]').forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeMenu(); } });

  const handleForm = (form, okId) => { if (!form) return; form.addEventListener('submit', e => { e.preventDefault(); console.log('[Victor] booking request:', Object.fromEntries(new FormData(form).entries())); const ok = $('#' + okId); if (ok) ok.hidden = false; form.querySelector('button[type=submit]').textContent = 'Відправлено ✓'; }); };
  handleForm($('#bform'), 'bformOk'); handleForm($('#bformModal'), 'bformModalOk');

  const map = $('.contacts__map iframe');
  if (map) { const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { map.src = map.dataset.src; io.disconnect(); } }), { rootMargin: '200px' }); io.observe(map); }

  /* ---- page reveal + motion ---- */
  const reveal = () => document.body.classList.add('ready');
  if (!hasGSAP || RM) { reveal(); return; }
  const { gsap } = window; gsap.registerPlugin(window.ScrollTrigger);

  // pre-hide hero pieces BEFORE first paint so the page fades in with no flash
  gsap.set('.hero__inner > *', { opacity: 0, y: 30 });
  gsap.set('.hero__media', { opacity: 0, y: 24 });

  requestAnimationFrame(() => {
    reveal();
    gsap.to('.hero__inner > *', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .09, delay: .12 });
    gsap.to('.hero__media', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: .18 });
    gsap.fromTo('.hero__media img', { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'power2.out' });
  });

  $$('.svc-head, .about__lead, .about__pillars li, .room, .svc-card, .stat, .band__head, .naftusya__title, .naftusya__lead, .naftusya__stats > div, .contacts__left, .bform').forEach(el => {
    gsap.from(el, { y: 44, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // band marquee
  const band = $('#bandTrack');
  if (band) { band.innerHTML += band.innerHTML; const half = band.scrollWidth / 2; const tw = gsap.to(band, { x: -half, duration: half / 42, ease: 'none', repeat: -1 }); band.parentElement.addEventListener('pointerenter', () => tw.pause()); band.parentElement.addEventListener('pointerleave', () => tw.resume()); }

  // stat count-up
  $$('.stat__num').forEach(el => { const t = parseFloat(el.dataset.count); if (isNaN(t)) return; const dec = t % 1 ? 1 : 0; const o = { v: 0 }; gsap.to(o, { v: t, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' }, onUpdate: () => { el.textContent = o.v.toFixed(dec); } }); });
})();
