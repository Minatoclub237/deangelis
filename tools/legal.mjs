// node tools/legal.mjs : génère mentions-legales/index.html et en/legal/index.html.
// À compléter avec le salon, puis relancer : tout ce qui reste à null s'affiche surligné sur la page.
import { mkdirSync, writeFileSync } from 'node:fs'

const FACTS = {
  denomination: null, // dénomination légale et forme juridique, ex. « De Angelis SRL »
  siege: null, // siège social, s'il diffère de l'adresse du salon
  bce: null, // numéro d'entreprise, ex. « 0123.456.789 »
  tva: null, // numéro de TVA, ex. « BE0123.456.789 », si le salon y est assujetti
  conservationMois: null, // durée de conservation des demandes reçues, en mois
}

const UPDATED = { fr: 'novembre 2026', en: 'November 2026' }
const missing = { fr: 'à compléter par le salon', en: 'to be completed by the salon' }
const val = (v, lang) => v ?? `<mark class="todo">${missing[lang]}</mark>`
const months = (lang) => (FACTS.conservationMois ? `${FACTS.conservationMois} ${lang === 'fr' ? 'mois' : 'months'}` : val(null, lang))

const TEXT = {
  fr: {
    path: '/mentions-legales/', home: '/', title: 'Mentions légales et confidentialité | De Angelis Coiffure &amp; Beauté', back: 'Retour au site', home_label: 'De Angelis Coiffure, accueil',
    h1: '<span class="ln">Mentions légales</span> <span class="ln">et <em>confidentialité</em></span>',
    body: () => `
  <section>
    <h2>Éditeur du site</h2>
    <dl>
      <dt>Nom commercial</dt><dd>De Angelis Coiffure &amp; Beauté</dd>
      <dt>Dénomination légale et forme juridique</dt><dd>${val(FACTS.denomination, 'fr')}</dd>
      <dt>Adresse du salon</dt><dd>Rue Franklin 22, 1000 Bruxelles</dd>
      <dt>Siège social</dt><dd>${val(FACTS.siege, 'fr')}</dd>
      <dt>Numéro d'entreprise (BCE)</dt><dd>${val(FACTS.bce, 'fr')}</dd>
      <dt>Numéro de TVA</dt><dd>${val(FACTS.tva, 'fr')}</dd>
      <dt>Téléphone</dt><dd><a href="tel:+3227323222">+32 2 732 32 22</a></dd>
      <dt>E-mail</dt><dd><a href="mailto:deangeliscoiffure@gmail.com">deangeliscoiffure@gmail.com</a></dd>
    </dl>
  </section>
  <section>
    <h2>Hébergement</h2>
    <p>Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a></p>
  </section>
  <section>
    <h2>Contenu du site</h2>
    <p>Les tarifs affichés sont repris du panneau du salon et donnés à titre indicatif. Seul le prix confirmé au salon fait foi.</p>
    <p>Les avis sont des extraits publiés en ligne par des clients. Certains sont raccourcis, ce que signale la mention […], ou traduits, ce qui est indiqué sur la carte.</p>
    <p>La vidéo d'accueil est une illustration créée par intelligence artificielle : elle ne montre ni une cliente ni une réalisation du salon.</p>
    <p>Les textes, photos et vidéos ne peuvent pas être réutilisés sans l'accord du salon ou de leurs auteurs.</p>
  </section>
  <section id="confidentialite">
    <h2>Confidentialité</h2>
    <h3>Qui est responsable de vos données ?</h3>
    <p>Le salon, aux coordonnées indiquées ci-dessus.</p>
    <h3>Ce que le site enregistre</h3>
    <p>Rien. Le site ne dépose aucun cookie, n'utilise ni mesure d'audience ni publicité, et ses polices et médias sont servis depuis son propre hébergement. Votre consentement n'est donc pas demandé à l'arrivée.</p>
    <h3>Demande de rendez-vous et formulaire de contact</h3>
    <p>Ces formulaires n'envoient rien au site : ils préparent un e-mail dans votre messagerie. Le salon ne reçoit vos informations que si vous envoyez cet e-mail : nom, téléphone, e-mail, prestations, date et heure souhaitées, message.</p>
    <p>Elles servent uniquement à répondre à votre demande et à organiser votre rendez-vous, à votre demande (article 6.1.b du RGPD). Elles sont lues par le salon et transitent par ses services de messagerie, dont Google pour l'adresse Gmail. Le salon les conserve au maximum ${months('fr')}.</p>
    <h3>Données techniques</h3>
    <p>Pour afficher le site, l'hébergeur traite des données techniques comme votre adresse IP, qui peuvent être traitées hors de l'Union européenne. Voir la <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener">politique de confidentialité de Vercel</a>.</p>
    <h3>Liens externes</h3>
    <p>Les liens vers Google Maps, Google, Instagram, Facebook et La Libre ouvrent ces services, dont les propres règles s'appliquent dès que vous cliquez.</p>
    <h3>Vos droits</h3>
    <p>Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la limitation de leur traitement ou leur portabilité, et vous opposer à leur traitement, en écrivant à <a href="mailto:deangeliscoiffure@gmail.com">deangeliscoiffure@gmail.com</a>.</p>
    <p>Vous pouvez aussi introduire une réclamation auprès de l'Autorité de protection des données, Rue de la Presse 35, 1000 Bruxelles. <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener">autoriteprotectiondonnees.be</a></p>
  </section>
  <p class="lg-u">Dernière mise à jour : ${UPDATED.fr}</p>`,
  },
  en: {
    path: '/en/legal/', home: '/en/', title: 'Legal notice and privacy | De Angelis Coiffure &amp; Beauté', back: 'Back to the site', home_label: 'De Angelis Coiffure, home',
    h1: '<span class="ln">Legal notice</span> <span class="ln">and <em>privacy</em></span>',
    body: () => `
  <section>
    <h2>Website publisher</h2>
    <dl>
      <dt>Trade name</dt><dd>De Angelis Coiffure &amp; Beauté</dd>
      <dt>Legal name and legal form</dt><dd>${val(FACTS.denomination, 'en')}</dd>
      <dt>Salon address</dt><dd>Rue Franklin 22, 1000 Brussels</dd>
      <dt>Registered office</dt><dd>${val(FACTS.siege, 'en')}</dd>
      <dt>Enterprise number (BCE/KBO)</dt><dd>${val(FACTS.bce, 'en')}</dd>
      <dt>VAT number</dt><dd>${val(FACTS.tva, 'en')}</dd>
      <dt>Phone</dt><dd><a href="tel:+3227323222">+32 2 732 32 22</a></dd>
      <dt>Email</dt><dd><a href="mailto:deangeliscoiffure@gmail.com">deangeliscoiffure@gmail.com</a></dd>
    </dl>
  </section>
  <section>
    <h2>Hosting</h2>
    <p>Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States. <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a></p>
  </section>
  <section>
    <h2>Website content</h2>
    <p>Prices are taken from the salon's price board and given for guidance only. Only the price confirmed at the salon applies.</p>
    <p>Reviews are excerpts published online by clients. Some are shortened, marked […], or translated, as stated on the card.</p>
    <p>The home page video is an illustration created with artificial intelligence: it shows neither a client nor work by the salon.</p>
    <p>Texts, photos and videos may not be reused without the agreement of the salon or their authors.</p>
  </section>
  <section id="confidentialite">
    <h2>Privacy</h2>
    <h3>Who is responsible for your data?</h3>
    <p>The salon, using the contact details above.</p>
    <h3>What the website stores</h3>
    <p>Nothing. The website sets no cookies and uses no analytics or advertising, and its fonts and media are served from its own hosting. That is why no consent is requested when you arrive.</p>
    <h3>Appointment requests and the contact form</h3>
    <p>These forms send nothing to the website: they prepare an email in your email app. The salon only receives your information if you send that email: name, phone, email, services, preferred date and time, message.</p>
    <p>It is used only to answer your request and organise your appointment, at your request (Article 6(1)(b) GDPR). It is read by the salon and passes through its email services, including Google for the Gmail address. The salon keeps it for at most ${months('en')}.</p>
    <h3>Technical data</h3>
    <p>To display the website, the host processes technical data such as your IP address, which may be processed outside the European Union. See <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener">Vercel's privacy notice</a>.</p>
    <h3>External links</h3>
    <p>Links to Google Maps, Google, Instagram, Facebook and La Libre open those services, whose own rules apply as soon as you click.</p>
    <h3>Your rights</h3>
    <p>You can ask to access, correct, erase or transfer your data, restrict its processing or object to it, by writing to <a href="mailto:deangeliscoiffure@gmail.com">deangeliscoiffure@gmail.com</a>.</p>
    <p>You can also complain to the Belgian Data Protection Authority, Rue de la Presse 35, 1000 Brussels. <a href="https://www.dataprotectionauthority.be" target="_blank" rel="noopener">dataprotectionauthority.be</a></p>
  </section>
  <p class="lg-u">Last updated: ${UPDATED.en}</p>`,
  },
}

const page = (lang) => {
  const t = TEXT[lang]
  const fr = lang === 'fr' ? ' aria-current="true"' : '', en = lang === 'en' ? ' aria-current="true"' : ''
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t.title}</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/src/style.css">
</head>
<body>
<header class="nav solid">
  <a class="logo" href="${t.home}" aria-label="${t.home_label}"><img src="/img/logo.webp" alt="" width="1169" height="253"></a>
  <div class="nav-r">
    <span class="nav-lang"><a href="/mentions-legales/"${fr} hreflang="fr">FR</a><a href="/en/legal/"${en} hreflang="en">EN</a></span>
    <a class="nav-call" href="${t.home}">${t.back}</a>
  </div>
</header>
<main class="lg">
  <h1 class="h-xl">${t.h1}</h1>${t.body()}
  <a class="btn btn-s" href="${t.home}">${t.back}</a>
</main>
</body>
</html>
`
}

mkdirSync('mentions-legales', { recursive: true }); mkdirSync('en/legal', { recursive: true })
writeFileSync('mentions-legales/index.html', page('fr')); writeFileSync('en/legal/index.html', page('en'))
const left = Object.entries(FACTS).filter(([, v]) => v === null).map(([k]) => k)
console.log('pages générées | reste à compléter :', left.length ? left.join(', ') : 'rien')
