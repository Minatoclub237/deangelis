// Demande de rendez-vous : pas d'agenda en ligne, la demande part par e-mail et le salon la confirme
import gsap from 'gsap'

const MAIL = 'deangeliscoiffure@gmail.com'
const FIRST = 9, LAST = 18 // premier et dernier créneau ; le salon ferme à 19 h
const AHEAD = 90, NOTICE = 2 // jours ouverts à la demande ; heures de préavis le jour même

const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const shift = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const parse = (k) => new Date(`${k}T12:00`)
const nowBxl = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Brussels' }))

// Pâques (algorithme de Meeus), pour les jours fériés mobiles
const easter = (y) => {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114
  return new Date(y, Math.floor(n / 31) - 1, n % 31 + 1)
}
const isHoliday = (d) => {
  const y = d.getFullYear(), e = easter(y)
  return [`${y}-01-01`, `${y}-05-01`, `${y}-07-21`, `${y}-08-15`, `${y}-11-01`, `${y}-11-11`, `${y}-12-25`, iso(shift(e, 1)), iso(shift(e, 39)), iso(shift(e, 50))].includes(iso(d))
}

export function initBooking({ EN, RM, lenis, closures }) {
  const t = (fr, en) => (EN ? en : fr), LOC = t('fr-BE', 'en-GB')
  const dlg = document.getElementById('rendez-vous'), $ = (s) => dlg.querySelector(s), $$ = (s) => [...dlg.querySelectorAll(s)]
  const form = $('.bk-m'), f = form.elements, steps = $$('.bk-st'), marks = $$('.bk-p li'), err = $('.bk-e'), root = document.documentElement
  const S = { step: 0, date: null, time: null, month: null, done: false, cursor: false }
  const fmt = (o, d) => new Intl.DateTimeFormat(LOC, o).format(d)
  const cap = (s) => s[0].toUpperCase() + s.slice(1)

  /* ---------- Prix : le panneau du salon compte vendredi, samedi et veille de jour férié au tarif haut ---------- */
  const upper = (d) => d.getDay() === 5 || d.getDay() === 6 || isHoliday(shift(d, 1))
  const range = (box) => {
    const { w, e, p } = box.dataset
    if (w) return S.date ? Array(2).fill(+(upper(parse(S.date)) ? e : w)) : [+w, +e]
    return p ? [+p.split('-')[0], +p.split('-').pop()] : null
  }
  const money = ([a, b]) => (a === b ? t(`${a} €`, `€${a}`) : t(`${a} à ${b} €`, `€${a}–${b}`))
  const picked = () => $$('input[name="svc"]:checked')
  const nameOf = (box) => box.parentElement.querySelector('span').textContent
  const priceOf = (box) => { const r = range(box); return r ? money(r) : t('Sur demande', 'On request') }
  const whoName = () => $('input[name="who"]:checked').parentElement.textContent.trim()

  /* ---------- Récapitulatif ---------- */
  const paint = () => {
    const list = picked(), rs = list.map(range).filter(Boolean), d = S.date && parse(S.date)
    const total = rs.length ? money(rs.reduce((s, r) => [s[0] + r[0], s[1] + r[1]], [0, 0])) + (list.length > rs.length ? ' +' : '') : '–'
    $$('input[data-w]').forEach((b) => { b.parentElement.querySelector('.pr').textContent = money(range(b)) })
    $$('.bk-tab').forEach((tab) => tab.classList.toggle('has', !!$(`ul[data-t="${tab.dataset.t}"] input:checked`)))
    $('.bk-sv').innerHTML = list.length ? list.map((b) => `<li><span>${nameOf(b)}</span><b>${priceOf(b)}</b></li>`).join('') : `<li>${t('À choisir', 'To choose')}</li>`
    $('.bk-who').textContent = whoName()
    $('.bk-dn').textContent = d ? d.getDate() : ''
    $('.bk-dl').textContent = d ? `${cap(fmt({ weekday: 'long' }, d))}\n${fmt({ month: 'long' }, d)}` : t('Jour à choisir', 'Day to choose')
    $('.bk-tm').textContent = S.time || ''
    $('.bk-tot b').textContent = total
    const n = list.length
    $('.bk-sum').textContent = [n ? `${n} ${t(n > 1 ? 'prestations' : 'prestation', n > 1 ? 'services' : 'service')}` : t('Votre rendez-vous', 'Your appointment'), d && fmt({ day: 'numeric', month: 'short' }, d), S.time, rs.length && total].filter(Boolean).join(' · ')
  }

  /* ---------- Calendrier et créneaux ---------- */
  const isOpen = (d) => {
    const now = nowBxl(), today = shift(now, 0), k = iso(d)
    if (d < today || d > shift(today, AHEAD) || d.getDay() < 2 /* dimanche, lundi */ || isHoliday(d) || closures.some((c) => k >= c.from && k <= c.to)) return false
    return k !== iso(now) || now.getHours() + NOTICE <= LAST
  }
  const paintCal = () => {
    const y = S.month.getFullYear(), m = S.month.getMonth(), now = nowBxl(), end = shift(now, AHEAD)
    $('.bk-mt').textContent = cap(fmt({ month: 'long', year: 'numeric' }, S.month))
    $('.bk-days').innerHTML = '<span></span>'.repeat((new Date(y, m, 1).getDay() + 6) % 7) + Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => {
      const d = new Date(y, m, i + 1), k = iso(d)
      return `<button type="button" data-d="${k}" aria-label="${fmt({ weekday: 'long', day: 'numeric', month: 'long' }, d)}" aria-pressed="${k === S.date}"${isOpen(d) ? '' : ' disabled'}>${i + 1}</button>`
    }).join('')
    $('.bk-mp').disabled = y === now.getFullYear() && m === now.getMonth()
    $('.bk-mn').disabled = y === end.getFullYear() && m === end.getMonth()
  }
  const paintSlots = () => {
    if (!S.date) { $('.bk-sl').innerHTML = `<p class="bk-hint">${t("Choisissez d'abord un jour.", 'Pick a day first.')}</p>`; return }
    const now = nowBxl(), min = S.date === iso(now) ? now.getHours() + now.getMinutes() / 60 + NOTICE : 0
    let h = ''
    for (let x = FIRST; x <= LAST; x += .5) {
      const lab = `${pad(Math.floor(x))}:${x % 1 ? '30' : '00'}`, off = x < min
      if (off && S.time === lab) S.time = null
      h += `<button type="button" data-h="${lab}" aria-pressed="${S.time === lab}"${off ? ' disabled' : ''}>${lab}</button>`
    }
    $('.bk-sl').innerHTML = h
  }
  const press = (sel, on) => $$(sel).forEach((b) => b.setAttribute('aria-pressed', on(b)))
  const setTab = (name) => {
    $$('.bk-tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.t === name))
    $$('.bk-ol').forEach((u) => { u.hidden = u.dataset.t !== name })
  }

  /* ---------- Étapes ---------- */
  const show = (i, dir = 1) => {
    S.step = i; err.textContent = ''
    steps.forEach((s) => { s.hidden = +s.dataset.s !== i })
    marks.forEach((m, k) => { m.classList.toggle('on', k === i); m.classList.toggle('ok', k < i) })
    $('.bk-f').hidden = i === 3
    $('.bk-back').hidden = !i
    $('.bk-next').textContent = i === 2 ? t('Envoyer ma demande', 'Send my request') : t('Continuer', 'Continue')
    $('.bk-b').scrollTop = 0
    steps[i].querySelector('h2').focus({ preventScroll: true })
    if (!RM) gsap.fromTo(steps[i].children, { autoAlpha: 0, y: dir * 26, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .6, stagger: .06, ease: 'power3.out', clearProps: 'all' })
  }
  const problem = () => {
    if (S.step === 0 && !picked().length) return t('Choisissez au moins une prestation.', 'Choose at least one service.')
    if (S.step === 1 && !(S.date && S.time)) return t('Choisissez un jour et une heure.', 'Choose a day and a time.')
    if (S.step !== 2) return ''
    if (!f.nom.value.trim()) { f.nom.focus(); return t('Indiquez votre nom.', 'Enter your name.') }
    if (f.tel.value.replace(/\D/g, '').length < 8) { f.tel.focus(); return t('Indiquez un numéro de téléphone complet.', 'Enter a full phone number.') }
    if (!f.email.checkValidity()) { f.email.focus(); return t('Cette adresse e-mail semble incomplète.', 'This email address looks incomplete.') }
    return ''
  }

  /* ---------- La demande : un e-mail déjà rédigé, jamais une réservation présentée comme confirmée ---------- */
  const request = () => {
    const row = (a, b) => `${a}${t(' : ', ': ')}${b}`, email = f.email.value.trim(), note = f.note.value.trim()
    return [t('Bonjour,', 'Hello,'), '', t('Je souhaite prendre rendez-vous :', 'I would like to book an appointment:'), '',
      ...picked().map((b) => `- ${nameOf(b)} (${priceOf(b)})`), '',
      row(t('Coiffeur', 'Stylist'), whoName()), row('Date', cap(fmt({ dateStyle: 'full' }, parse(S.date)))), row(t('Heure', 'Time'), S.time), '',
      row(t('Nom', 'Name'), f.nom.value.trim()), row(t('Téléphone', 'Phone'), f.tel.value.trim()),
      ...(email ? [row('E-mail', email)] : []), ...(note ? [row(t('Remarque', 'Note'), note)] : []), '',
      t('Merci de me confirmer ce rendez-vous.', 'Please confirm this appointment.')].join('\n')
  }
  const send = () => {
    const text = request(), subject = `${t('Demande de rendez-vous', 'Appointment request')}${t(' : ', ': ')}${fmt({ day: 'numeric', month: 'long' }, parse(S.date))}, ${S.time}`
    const href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.replace(/\n/g, '\r\n'))}`
    $('.bk-txt').textContent = text; $('.bk-again').href = href
    S.done = true; show(3); location.href = href
  }
  const reset = () => {
    form.reset(); Object.assign(S, { date: null, time: null, done: false, month: new Date(nowBxl().getFullYear(), nowBxl().getMonth(), 1) })
    $('.bk-copy').textContent = t('Copier ma demande', 'Copy my request')
    paintCal(); paintSlots(); paint(); setTab('elle'); S.step = 0
  }

  /* ---------- Ouverture : le panneau monte comme le pied de page ---------- */
  const open = (tab) => {
    if (S.done) reset()
    if (tab) setTab(tab)
    lenis?.stop()
    S.cursor = root.classList.contains('has-cursor'); root.classList.remove('has-cursor') // le curseur point resterait sous la modale
    dlg.showModal(); show(S.step)
    if (RM) return
    gsap.fromTo(dlg, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .75, ease: 'power4.inOut', clearProps: 'clipPath' })
    gsap.fromTo($$('.bk-l > *'), { autoAlpha: 0, y: 34, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .7, stagger: .07, delay: .3, ease: 'power3.out', clearProps: 'all' })
  }
  const close = () => {
    const end = () => { dlg.close(); lenis?.start(); if (S.cursor) root.classList.add('has-cursor') }
    if (RM) return end()
    gsap.fromTo(dlg, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: .55, ease: 'power3.in', clearProps: 'clipPath', onComplete: end })
  }

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })
  dlg.addEventListener('click', (e) => {
    const c = (s) => e.target.closest(s), tab = c('.bk-tab'), day = c('[data-d]'), slot = c('[data-h]')
    if (tab) setTab(tab.dataset.t)
    if (day) { S.date = day.dataset.d; press('[data-d]', (b) => b.dataset.d === S.date); paintSlots(); paint(); err.textContent = ''
      if (!RM) gsap.fromTo($('.bk-dn'), { yPercent: 40, autoAlpha: 0, filter: 'blur(8px)' }, { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', duration: .55, ease: 'power3.out', clearProps: 'all' }) }
    if (slot) { S.time = slot.dataset.h; press('[data-h]', (b) => b.dataset.h === S.time); paint(); err.textContent = '' }
    if (c('.bk-x')) close()
    if (c('.bk-back')) show(S.step - 1, -1)
    if (c('.bk-mp, .bk-mn')) { S.month = new Date(S.month.getFullYear(), S.month.getMonth() + (c('.bk-mn') ? 1 : -1), 1); paintCal() }
  })
  form.addEventListener('change', () => { paint(); err.textContent = '' })
  form.addEventListener('submit', (e) => {
    e.preventDefault(); const p = problem(); err.textContent = p
    if (!p) S.step < 2 ? show(S.step + 1) : send()
  })
  $('.bk-copy').addEventListener('click', async (e) => {
    const b = e.currentTarget
    try { await navigator.clipboard.writeText($('.bk-txt').textContent); b.textContent = t('Demande copiée', 'Request copied') } catch { b.textContent = t('Copie impossible', 'Could not copy') }
  })

  $('.bk-wk').innerHTML = Array.from({ length: 7 }, (_, i) => `<span>${fmt({ weekday: 'short' }, new Date(2026, 10, 2 + i))}</span>`).join('')
  reset()
  return open
}
