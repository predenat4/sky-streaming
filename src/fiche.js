import { supabase } from './supabaseClient.js';
import { showMsg, PRIX, STATUTS, normPhone } from './common.js';

const contentEl = document.getElementById('content');
const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');
const userEmailEl = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

let formData = {};
let wizardStep = 1;
let isEditMode = false;
let subscription = null;

async function init() {
  isEditMode = false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  userEmailEl.textContent = user.email;

  // Cleanup existing subscription
  if (subscription) {
    supabase.removeChannel(subscription);
  }

    // Subscribe to changes
  subscription = supabase
    .channel('inscriptions_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inscriptions', filter: `user_id=eq.${user.id}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          renderWelcome();
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          renderStatusView(payload.new);
        }
      }
    )
    .subscribe();

  const { data: fiche, error } = await supabase
    .from('inscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fiche) {
    renderStatusView(fiche);
  } else {
    renderWelcome();
  }
}

userBtn.addEventListener('click', () => {
    userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
});

function renderWelcome() {
  contentEl.innerHTML = `
    <h2>Bienvenue</h2>
    <p>Vous n'avez pas encore de profil actif.</p>
    <button id="startWizardBtn" class="btn-glass-red">Créer mon profil</button>
  `;
  document.getElementById('startWizardBtn').addEventListener('click', async () => {
    wizardStep = 1;
    formData = {};
    await renderWizard();
  });
}

async function renderWizard() {
  const progressBar = `
    <div class="progress-bar">
      <div class="step-circle ${wizardStep >= 1 ? 'active' : ''}">1</div>
      <div class="line ${wizardStep >= 2 ? 'active' : ''}"></div>
      <div class="step-circle ${wizardStep >= 2 ? 'active' : ''}">2</div>
      <div class="line ${wizardStep >= 3 ? 'active' : ''}"></div>
      <div class="step-circle ${wizardStep >= 3 ? 'active' : ''}">3</div>
      <div class="line ${wizardStep >= 4 ? 'active' : ''}"></div>
      <div class="step-circle ${wizardStep >= 4 ? 'active' : ''}">4</div>
    </div>
  `;
  contentEl.innerHTML = `${progressBar}<div id="wizardContent" class="wizard-step wizard-enter"></div><div id="msg"></div>`;
  const wiz = document.getElementById('wizardContent');

  // Trigger animation
  setTimeout(() => wiz.classList.add('wizard-active'), 10);

  switch (wizardStep) {
    case 1:
      wiz.innerHTML = `
        <input type="text" id="nom" placeholder="Nom" value="${formData.nom || ''}">
        <input type="text" id="prenom" placeholder="Prénom" value="${formData.prenom || ''}">
        <button id="nextBtn" class="btn-glass-red">Suivant</button>
      `;
      break;
    case 2:
      wiz.innerHTML = `
        <select id="plan">
          <option value="">Choisir un plan</option>
          <option value="standard" ${formData.plan === 'standard' ? 'selected' : ''}>Standard: 500 gourdes</option>
          <option value="premium" ${formData.plan === 'premium' ? 'selected' : ''}>Premium: 650 gourdes</option>
        </select>
        <button id="nextBtn" class="btn-glass-red">Suivant</button>
      `;
      break;
    case 3:
      const { data: methods, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_enabled', true);
      
      console.log('Methods:', methods);
      console.log('Methods Error:', methodsError);

      // Helper to extract country code and number
      let initialCountry = '+509';
      let initialNumber = '';
      if (formData.whatsapp) {
          const matched = COUNTRY_CODES.find(c => formData.whatsapp.startsWith(c.code.replace('+', '')));
          if (matched) {
              initialCountry = matched.code;
              initialNumber = formData.whatsapp.substring(matched.code.replace('+', '').length);
          } else {
              initialNumber = formData.whatsapp;
          }
      }

      wiz.innerHTML = `
        <div class="glass" style="padding: 1rem; margin-bottom: 1rem; font-size: 0.9rem;">
            <p style="margin: 0;">Effectuez votre dépôt ici :</p>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                <img src="/natcash.jpeg" style="width:30px; height:30px; border-radius:50%;">
                <strong style="color: var(--accent-color); font-size: 1.1rem;">42543980 (NatCash)</strong>
            </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <select id="countryCode" style="width: 150px;">
                ${COUNTRY_CODES.map(c => `<option value="${c.code}" ${initialCountry === c.code ? 'selected' : ''}>${c.name} (${c.code})</option>`).join('')}
            </select>
            <input type="tel" id="whatsapp" placeholder="Numéro" value="${initialNumber}">
        </div>
        <div style="display: flex; gap: 1rem; margin-bottom: 10px;">
            ${(methods || []).map(m => `
              <label style="display:flex; align-items:center; gap:0.3rem;">
                  <img src="/${m.name}.jpeg" style="width:20px; height:20px; border-radius:50%;">
                  <input type="radio" name="op" value="${m.name}" ${formData.operateur_choisi === m.name ? 'checked' : ''}> ${m.name.charAt(0).toUpperCase() + m.name.slice(1)}
              </label>
            `).join('')}
        </div>
        <input type="text" id="transCode" placeholder="Code de transaction (8-15 chiffres)" value="${formData.transCode || ''}">
        <button id="nextBtn" class="btn-glass-red">Suivant</button>
      `;
      break;
    case 4:
      console.log('Wizard Step 4 formData:', formData); // Debugging
      wiz.innerHTML = `
        <input type="text" id="nomProfilFinal" placeholder="Nom du profil" value="${formData.nom_profil || ''}">
        <textarea id="codesProfil" placeholder="Codes du profil">${formData.codes_profil || ''}</textarea>
        <button id="nextBtn" class="btn-glass-red">Envoyer</button>
      `;
      break;
  }

  document.getElementById('nextBtn').addEventListener('click', handleNext);
}

async function handleNext() {
  if (wizardStep === 1) {
    formData.nom = document.getElementById('nom').value;
    formData.prenom = document.getElementById('prenom').value;
    if (!formData.nom || !formData.prenom) return showMsg(document.getElementById('msg'), 'Remplissez le nom et le prénom', 'error');
    formData.nom_complet = `${formData.nom} ${formData.prenom}`;
    wizardStep++;
    await renderWizard();
  } else if (wizardStep === 2) {
    formData.plan = document.getElementById('plan').value;
    if (!formData.plan) return showMsg(document.getElementById('msg'), 'Choisissez un plan', 'error');
    wizardStep++;
    await renderWizard();
  } else if (wizardStep === 3) {
    const countryCode = document.getElementById('countryCode').value;
    const number = normPhone(document.getElementById('whatsapp').value);
    formData.whatsapp = countryCode.replace('+', '') + number;
    formData.operateur_choisi = document.querySelector('input[name="op"]:checked')?.value;
    formData.transCode = document.getElementById('transCode').value.replace(/\D/g, '');
    
    if (!number || !formData.operateur_choisi || !formData.transCode) {
        return showMsg(document.getElementById('msg'), 'Remplissez tout', 'error');
    }
    
    if (formData.transCode.length < 8 || formData.transCode.length > 15) {
        return showMsg(document.getElementById('msg'), 'Le code de transaction doit contenir entre 8 et 15 chiffres', 'error');
    }
    
    wizardStep++;
    await renderWizard();
  } else {
    formData.nom_profil = document.getElementById('nomProfilFinal').value;
    formData.codes_profil = document.getElementById('codesProfil').value;
    if (!formData.nom_profil) return showMsg(document.getElementById('msg'), 'Remplissez le nom du profil', 'error');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showMsg(document.getElementById('msg'), 'Non connecté', 'error');
    formData.user_id = user.id;
    const transCodeValue = formData.transCode;
    formData.numero_paiement = transCodeValue;
    delete formData.nom;
    delete formData.prenom;
    delete formData.transCode;

    let error;
    if (isEditMode) {
      ({ error } = await supabase.from('inscriptions').update(formData).eq('user_id', user.id));
      isEditMode = false;
    } else {
      ({ error } = await supabase.from('inscriptions').insert([formData]));
    }
    
    if (error) showMsg(document.getElementById('msg'), 'Erreur: ' + error.message, 'error');
    else init();
  }
}

function renderStatusView(fiche) {
    const status = STATUTS[fiche.statut];
    const parts = fiche.nom_complet.split(' ');
    const nom = parts[0] || '';
    const prenom = parts.slice(1).join(' ') || '';

    contentEl.innerHTML = `
        <h2>Votre fiche</h2>
        <div class="glass" style="padding: 1.5rem;">
            <div class="details-grid">
                <p><strong>NOM :</strong></p><p>${nom}</p>
                <p><strong>Prenom :</strong></p><p>${prenom}</p>
                <p><strong>Plan :</strong></p><p>${fiche.plan}</p>
                <p><strong>WhatsApp :</strong></p><p>${fiche.whatsapp}</p>
                <p><strong>Opérateur :</strong></p><p>${fiche.operateur_choisi}</p>
                <p><strong>TransCode :</strong></p><p>${fiche.numero_paiement}</p>
                <p><strong>Profil :</strong></p><p>${fiche.nom_profil}</p>
                <p><strong>Codes :</strong></p><p>${fiche.codes_profil}</p>
            </div>
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                <strong>Statut : </strong> ${status.label}<br>
                <p style="margin-top: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">${status.msg}</p>
            </div>
            <div id="actions" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <button id="editBtn" class="btn-glass" style="flex: 1; padding: 10px;">Modifier</button>
                <button id="deleteBtn" class="btn-glass-red" style="flex: 1; padding: 10px;">Supprimer</button>
            </div>
        </div>
    `;

    document.getElementById('editBtn').addEventListener('click', () => {
        isEditMode = true;
        const parts = fiche.nom_complet.split(' ');
        formData = {
            nom: parts[0] || '',
            prenom: parts.slice(1).join(' ') || '',
            plan: fiche.plan,
            whatsapp: fiche.whatsapp,
            operateur_choisi: fiche.operateur_choisi,
            transCode: fiche.numero_paiement,
            nom_profil: fiche.nom_profil,
            codes_profil: fiche.codes_profil
        };
        wizardStep = 1;
        renderWizard();
    });

    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer votre fiche ?')) return;
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('inscriptions').delete().eq('user_id', user.id);
        if (error) return showMsg(document.getElementById('msg'), 'Erreur lors de la suppression: ' + error.message, 'error');
        // No need to call init() here as the subscription will handle it
    });
}

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
});

init();
