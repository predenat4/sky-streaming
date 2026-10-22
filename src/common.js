export const PRIX = {
  standard: 500,
  premium: 650
};

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
