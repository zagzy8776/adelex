export type Locale = "en" | "fr";

export const locales: Locale[] = ["en", "fr"];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

const en = {
  // Nav
  "nav.services": "Our services",
  "nav.how": "How it works",
  "nav.track": "Track shipment",
  "nav.contact": "Contact us",
  "nav.ship": "Ship with us",
  "nav.open": "Open navigation",
  "nav.close": "Close navigation",

  // Tracking form
  "track.placeholder": "Enter your tracking number",
  "track.button": "Track shipment",
  "track.hint": "Have a tracking number? Follow your shipment’s journey.",
  "track.aria": "Tracking number",
  "track.section": "STAY IN THE KNOW",
  "track.title": "Where’s your shipment?",

  // Assurance
  "assure.care": "Handled with care",
  "assure.visibility": "Shipment visibility",
  "assure.pickup": "From pickup to delivery",

  // Footer
  "footer.tagline1": "Moving your business forward.",
  "footer.tagline2": "One shipment at a time.",
  "footer.explore": "Explore",
  "footer.services": "Shipping services",
  "footer.track": "Track your shipment",
  "footer.quote": "Request a quote",
  "footer.moving": "Let’s get it moving",
  "footer.talk": "Talk to our shipping team",
  "footer.rights": "All rights reserved.",
  "footer.privacy": "Privacy",

  // Hero
  "hero.eyebrow": "YOUR NEXT MOVE, DELIVERED.",
  "hero.title1": "Every shipment.",
  "hero.title2": "A promise",
  "hero.title3": "delivered.",
  "hero.body": "Your goods matter. Move them with clarity, care, and a shipping partner that keeps you informed.",
  "hero.cta": "Let’s get it moving",
  "hero.explore": "Explore our services",
  "hero.visual1": "CONNECTING PLACES.",
  "hero.visual2": "DELIVERING POSSIBILITIES.",
  "hero.cardTitle": "A clearer view of every journey",
  "hero.cardSub": "Track locations. Follow milestones.",
  "hero.built": "BUILT AROUND YOUR BUSINESS",
  "hero.modes": "BY ROAD · BY AIR · BY SEA",

  // Services
  "services.eyebrow": "01 / OUR SERVICES",
  "services.title1": "Whatever you’re moving.",
  "services.title2": "We’ll help you get it there.",
  "services.intro": "From business essentials to your next big shipment, find the right way forward.",
  "services.road": "Road freight",
  "services.roadText": "From a single parcel to larger loads. Plan your next delivery with a service built around your route.",
  "services.air": "Air freight",
  "services.airText": "For the shipments that cannot wait. Request an air freight option that fits your schedule.",
  "services.ocean": "Ocean freight",
  "services.oceanText": "Make room for bigger possibilities. Explore shipping options for commercial and bulk cargo.",
  "services.express": "Express delivery",
  "services.expressText": "Keep everyday business moving with pickup and delivery arrangements for time-sensitive parcels.",
  "services.explore": "Explore options",
  "services.note": "Routes, availability, transit times, and pricing are confirmed with your shipping quote.",

  // Stats
  "stats.years": "Years",
  "stats.yearsSub": "Of trusted logistics expertise",
  "stats.countries": "Countries",
  "stats.countriesSub": "Worldwide coverage",
  "stats.team": "Elite Team",
  "stats.teamSub": "Industry-leading professionals",
  "stats.ontime": "On-Time",
  "stats.ontimeSub": "Delivery success rate",

  // Visibility
  "vis.eyebrow": "02 / VISIBILITY, EVERY STEP",
  "vis.title1": "A little less wondering.",
  "vis.title2": "A lot more knowing.",
  "vis.body": "Enter one tracking number to see your shipment’s latest reported location, delivery estimate, and progress—all in one place.",
  "vis.li1": "An interactive map of your shipment’s journey",
  "vis.li2": "Clear updates from collection to delivery",
  "vis.li3": "A tracking link you can open on any device",
  "vis.demo": "Explore example tracking",
  "vis.tag": "SHIPMENT VISIBILITY",
  "vis.example": "EXAMPLE",
  "vis.inTransit": "In transit",
  "vis.milestone": "A new milestone. One step closer.",
  "vis.onMove": "On the move",

  // Steps
  "steps.eyebrow": "03 / SIMPLE FROM THE START",
  "steps.title1": "Your next delivery,",
  "steps.title2": "in three clear steps.",
  "steps.cta": "Start your shipment",
  "steps.1t": "Tell us what’s moving.",
  "steps.1b": "Share your pickup, destination, and cargo details. Our team reviews your request and confirms the options.",
  "steps.2t": "We plan the journey.",
  "steps.2b": "Once arrangements are confirmed, you receive a unique tracking number to follow your shipment.",
  "steps.3t": "Follow it to the finish.",
  "steps.3b": "Check your map and shipment timeline for location updates, progress, and delivery confirmation.",

  // FAQ
  "faq.eyebrow": "GOOD TO KNOW",
  "faq.title1": "A few things,",
  "faq.title2": "before we go.",
  "faq.more": "Have another question?",
  "faq.q1": "How do I track my shipment?",
  "faq.a1": "Open the tracking link shared by our team, or enter your tracking number in the tracking box. You’ll see the latest status, reported location, delivery estimate, and shipment history.",
  "faq.q2": "Does the map show live GPS?",
  "faq.a2": "The map shows the latest reported position and the time it was updated. When a driver shares an active GPS location, the map displays live GPS updates. Older readings are labelled as the last known position.",
  "faq.q3": "How much will shipping cost?",
  "faq.a3": "Pricing depends on your route, cargo size and weight, service, and delivery requirements. Submit a shipping request so the team can confirm an appropriate quote.",
  "faq.q4": "What happens after I request a quote?",
  "faq.a4": "Your request is reviewed by the shipping team. They will contact you using the details you provide. A request becomes a shipment only once arrangements are confirmed.",

  // CTA
  "cta.eyebrow": "READY WHEN YOU ARE.",
  "cta.title1": "Let’s move something",
  "cta.title2": "forward, together.",
  "cta.button": "Request a shipping quote",

  // Language
  "lang.label": "Language",
  "lang.en": "English",
  "lang.fr": "Français",
} as const;

export type MessageKey = keyof typeof en;

const fr: Record<MessageKey, string> = {
  "nav.services": "Nos services",
  "nav.how": "Comment ça marche",
  "nav.track": "Suivre un envoi",
  "nav.contact": "Nous contacter",
  "nav.ship": "Expédier avec nous",
  "nav.open": "Ouvrir le menu",
  "nav.close": "Fermer le menu",

  "track.placeholder": "Entrez votre numéro de suivi",
  "track.button": "Suivre l’envoi",
  "track.hint": "Vous avez un numéro de suivi ? Suivez le parcours de votre envoi.",
  "track.aria": "Numéro de suivi",
  "track.section": "RESTEZ INFORMÉ",
  "track.title": "Où est votre envoi ?",

  "assure.care": "Traité avec soin",
  "assure.visibility": "Visibilité de l’envoi",
  "assure.pickup": "De l’enlèvement à la livraison",

  "footer.tagline1": "Faire avancer votre activité.",
  "footer.tagline2": "Un envoi à la fois.",
  "footer.explore": "Explorer",
  "footer.services": "Services d’expédition",
  "footer.track": "Suivre votre envoi",
  "footer.quote": "Demander un devis",
  "footer.moving": "Passons à l’action",
  "footer.talk": "Parler à notre équipe",
  "footer.rights": "Tous droits réservés.",
  "footer.privacy": "Confidentialité",

  "hero.eyebrow": "VOTRE PROCHAIN ENVOI, LIVRÉ.",
  "hero.title1": "Chaque envoi.",
  "hero.title2": "Une promesse",
  "hero.title3": "tenue.",
  "hero.body": "Vos marchandises comptent. Déplacez-les avec clarté, soin, et un partenaire logistique qui vous tient informé.",
  "hero.cta": "Commençons",
  "hero.explore": "Découvrir nos services",
  "hero.visual1": "RELIER LES LIEUX.",
  "hero.visual2": "LIVRER DES POSSIBILITÉS.",
  "hero.cardTitle": "Une vision claire de chaque trajet",
  "hero.cardSub": "Suivez les positions. Suivez les étapes.",
  "hero.built": "CONÇU POUR VOTRE ACTIVITÉ",
  "hero.modes": "PAR ROUTE · PAR AIR · PAR MER",

  "services.eyebrow": "01 / NOS SERVICES",
  "services.title1": "Quoi que vous expédiiez.",
  "services.title2": "Nous vous aidons à y arriver.",
  "services.intro": "Des besoins quotidiens à votre prochain grand envoi, trouvez la bonne solution.",
  "services.road": "Fret routier",
  "services.roadText": "D’un colis unique aux charges plus importantes. Planifiez votre prochaine livraison selon votre itinéraire.",
  "services.air": "Fret aérien",
  "services.airText": "Pour les envois qui ne peuvent pas attendre. Demandez une option aérienne adaptée à votre planning.",
  "services.ocean": "Fret maritime",
  "services.oceanText": "Pour les volumes plus importants. Explorez les options d’expédition pour le cargo commercial et en vrac.",
  "services.express": "Livraison express",
  "services.expressText": "Faites avancer votre activité avec des enlèvements et livraisons pour les colis urgents.",
  "services.explore": "Voir les options",
  "services.note": "Itinéraires, disponibilité, délais et tarifs sont confirmés avec votre devis.",

  "stats.years": "Ans",
  "stats.yearsSub": "D’expertise logistique de confiance",
  "stats.countries": "Pays",
  "stats.countriesSub": "Couverture mondiale",
  "stats.team": "Équipe d’élite",
  "stats.teamSub": "Professionnels de premier plan",
  "stats.ontime": "À l’heure",
  "stats.ontimeSub": "Taux de réussite des livraisons",

  "vis.eyebrow": "02 / VISIBILITÉ, À CHAQUE ÉTAPE",
  "vis.title1": "Moins d’incertitude.",
  "vis.title2": "Plus de clarté.",
  "vis.body": "Entrez un numéro de suivi pour voir la dernière position signalée, l’estimation de livraison et la progression — le tout en un seul endroit.",
  "vis.li1": "Une carte interactive du parcours de votre envoi",
  "vis.li2": "Des mises à jour claires de l’enlèvement à la livraison",
  "vis.li3": "Un lien de suivi accessible sur tout appareil",
  "vis.demo": "Voir un exemple de suivi",
  "vis.tag": "VISIBILITÉ DE L’ENVOI",
  "vis.example": "EXEMPLE",
  "vis.inTransit": "En transit",
  "vis.milestone": "Une nouvelle étape. Un pas de plus.",
  "vis.onMove": "En mouvement",

  "steps.eyebrow": "03 / SIMPLE DÈS LE DÉPART",
  "steps.title1": "Votre prochaine livraison,",
  "steps.title2": "en trois étapes claires.",
  "steps.cta": "Démarrer un envoi",
  "steps.1t": "Dites-nous ce qui voyage.",
  "steps.1b": "Indiquez l’enlèvement, la destination et les détails du colis. Notre équipe examine votre demande et confirme les options.",
  "steps.2t": "Nous planifions le trajet.",
  "steps.2b": "Une fois les arrangements confirmés, vous recevez un numéro de suivi unique.",
  "steps.3t": "Suivez jusqu’à la fin.",
  "steps.3b": "Consultez la carte et l’historique pour les positions, la progression et la confirmation de livraison.",

  "faq.eyebrow": "BON À SAVOIR",
  "faq.title1": "Quelques précisions,",
  "faq.title2": "avant de commencer.",
  "faq.more": "Une autre question ?",
  "faq.q1": "Comment suivre mon envoi ?",
  "faq.a1": "Ouvrez le lien de suivi partagé par notre équipe, ou saisissez votre numéro dans la zone de suivi. Vous verrez le statut, la position signalée, l’estimation et l’historique.",
  "faq.q2": "La carte montre-t-elle un GPS en direct ?",
  "faq.a2": "La carte affiche la dernière position signalée et l’heure de mise à jour. Lorsqu’un chauffeur partage une position GPS active, la carte se met à jour en direct. Les lectures plus anciennes sont indiquées comme dernière position connue.",
  "faq.q3": "Combien coûte l’expédition ?",
  "faq.a3": "Le tarif dépend de l’itinéraire, du poids et volume, du service et des exigences de livraison. Envoyez une demande pour recevoir un devis adapté.",
  "faq.q4": "Que se passe-t-il après une demande de devis ?",
  "faq.a4": "Votre demande est examinée par l’équipe. Elle vous contacte avec les coordonnées fournies. Une demande ne devient un envoi qu’après confirmation des arrangements.",

  "cta.eyebrow": "PRÊT QUAND VOUS L’ÊTES.",
  "cta.title1": "Faisons avancer",
  "cta.title2": "quelque chose, ensemble.",
  "cta.button": "Demander un devis d’expédition",

  "lang.label": "Langue",
  "lang.en": "English",
  "lang.fr": "Français",
};

export const dictionaries: Record<Locale, Record<MessageKey, string>> = {
  en: en as Record<MessageKey, string>,
  fr,
};

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}
