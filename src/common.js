export const PRIX = {
  standard: 500,
  premium: 650
};

export const COUNTRY_CODES = [
  { name: 'Haïti', code: '+509' },
  { name: 'France', code: '+33' },
  { name: 'USA/Canada', code: '+1' },
  { name: 'Belgique', code: '+32' },
  { name: 'Suisse', code: '+41' },
  { name: 'Allemagne', code: '+49' },
  { name: 'Espagne', code: '+34' },
  { name: 'Italie', code: '+39' },
  { name: 'Portugal', code: '+351' },
  { name: 'République Dominicaine', code: '+1809' },
  { name: 'Brésil', code: '+55' },
  { name: 'Chili', code: '+56' },
  { name: 'Colombie', code: '+57' },
  { name: 'Mexique', code: '+52' },
  { name: 'Argentine', code: '+54' },
  { name: 'Sénégal', code: '+221' },
  { name: 'Togo', code: '+228' }
];

export const STATUTS = {
  nouvelle: { label: 'Fiche reçue', msg: 'Votre fiche a bien été reçue. L\'administrateur va vous contacter sur WhatsApp.' },
  en_discussion: { label: 'En discussion', msg: 'L\'administrateur est en contact avec vous. Suivez la conversation sur WhatsApp.' },
  paye: { label: 'Paiement validé', msg: 'Votre paiement a été validé. Vous allez recevoir vos accès par WhatsApp.' },
  livre: { label: 'Accès envoyés', msg: 'Vos accès ont été envoyés par WhatsApp. Merci !' },
  annule: { label: 'Annulée', msg: 'Votre fiche a été annulée. Contactez l\'aide si vous pensez qu\'il s\'agit d\'une erreur.' }
};

export function normPhone(val) {
  return val.replace(/\D/g, '');
}

export function showMsg(el, text, type) {
  el.textContent = text;
  el.className = `msg ${type}`; // Assumes CSS class
  el.style.display = 'block';
}
