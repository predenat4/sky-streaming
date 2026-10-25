import { supabase } from '../src/supabaseClient.js';

const inscriptionsBody = document.getElementById('inscriptionsBody');
const logoutBtn = document.getElementById('logoutBtn');
const adminContent = document.getElementById('adminContent');
const detailsModal = document.getElementById('detailsModal');
const detailsContent = document.getElementById('detailsContent');
const paymentMethodsSettings = document.getElementById('paymentMethodsSettings');

async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Check if admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    
    if (adminError || !isAdmin) {
        alert("Accès refusé. Vous n'êtes pas administrateur.");
        window.location.href = '/';
        return;
    }

    loadPaymentMethods();
    loadInscriptions();
}

async function loadPaymentMethods() {
    const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    paymentMethodsSettings.innerHTML = methods.map(method => `
        <label class="switch-container">
            <img src="/${method.name}.jpeg" style="width:25px; height:25px; border-radius:50%;">
            <span class="switch">
                <input type="checkbox" ${method.is_enabled ? 'checked' : ''} onchange="togglePaymentMethod('${method.name}', this.checked)">
                <span class="slider"></span>
            </span>
            ${method.name.charAt(0).toUpperCase() + method.name.slice(1)}
        </label>
    `).join('');
}

window.togglePaymentMethod = async (name, enabled) => {
    const { error } = await supabase
        .from('payment_methods')
        .update({ is_enabled: enabled })
        .eq('name', name);
    if (error) alert('Erreur: ' + error.message);
};

async function loadInscriptions() {
    const { data: inscriptions, error } = await supabase
        .from('inscriptions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        alert('Erreur lors du chargement des inscriptions');
        return;
    }

    inscriptionsBody.innerHTML = inscriptions.map(ins => `
        <tr>
            <td>${ins.nom_complet}</td>
            <td>${ins.plan}</td>
            <td>${ins.whatsapp}</td>
            <td>${ins.statut}</td>
            <td>
                <button class="btn-small" onclick="viewDetails('${ins.id}')">Détails</button>
            </td>
        </tr>
    `).join('');
}

window.viewDetails = async (id) => {
    const { data: ins, error } = await supabase
        .from('inscriptions')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        alert('Erreur lors du chargement des détails');
        return;
    }

    const parts = ins.nom_complet.split(' ');
    const nom = parts[0] || '';
    const prenom = parts.slice(1).join(' ') || '';

    detailsContent.innerHTML = `
        <div class="details-grid">
            <p><strong>NOM :</strong></p><p>${nom}</p>
            <p><strong>Prenom :</strong></p><p>${prenom}</p>
            <p><strong>Plan :</strong></p><p>${ins.plan}</p>
            <p><strong>WhatsApp :</strong></p><p>${ins.whatsapp}</p>
            <p><strong>Opérateur :</strong></p><p>${ins.operateur_choisi}</p>
            <p><strong>TransCode :</strong></p><p>${ins.numero_paiement}</p>
            <p><strong>Profil :</strong></p><p>${ins.nom_profil}</p>
            <p><strong>Codes :</strong></p><p>${ins.codes_profil}</p>
        </div>
        <div class="action-btns">
            <button class="btn-green" onclick="handleAction('${ins.id}', 'paye')">Valider</button>
            <button class="btn-red" onclick="handleAction('${ins.id}', 'annule')">Refuser</button>
        </div>
    `;
    adminContent.style.display = 'none';
    detailsModal.style.display = 'block';
};

window.closeDetails = () => {
    adminContent.style.display = 'block';
    detailsModal.style.display = 'none';
};

window.handleAction = async (id, action) => {
    // First fetch to get the phone number
    const { data: ins, error: fetchError } = await supabase
        .from('inscriptions')
        .select('whatsapp')
        .eq('id', id)
        .single();

    if (fetchError) {
        alert('Erreur lors de la récupération du numéro: ' + fetchError.message);
        return;
    }

    const { error } = await supabase
        .from('inscriptions')
        .update({ statut: action })
        .eq('id', id);
        
    if (error) {
        alert('Erreur: ' + error.message);
    } else {
        if (action === 'paye') {
            // Message for WhatsApp
            const message = "Bienvenue chez Sky Streaming !%0D%0A%0D%0ANous avons le plaisir de vous confirmer que votre inscription a été validée avec succès. Toute notre équipe est ravie de vous compter parmi nos nouveaux membres premium, et nous mettons tout en œuvre pour vous garantir une expérience de divertissement exceptionnelle, riche en émotions et en qualité.%0D%0A%0D%0AVotre accès à l'intégralité de notre catalogue est désormais opérationnel. Vous pouvez dès maintenant explorer nos nouveautés et profiter de vos contenus favoris en toute fluidité. N'hésitez pas à nous contacter via cette discussion pour toute assistance technique. Excellente séance de visionnage !";
            // Redirect to WhatsApp with message
            window.open('https://wa.me/' + ins.whatsapp + '?text=' + message, '_blank');
        }
        closeDetails();
        loadInscriptions();
    }
};

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
});

init();
