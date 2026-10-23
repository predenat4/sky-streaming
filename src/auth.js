alert('JS actif - étape 1');

function debugUi(text) {
  const msgEl = document.getElementById('msg');
  if (msgEl) {
    msgEl.innerHTML += `<br><small style="color:red;">[DEBUG]: ${text}</small>`;
    msgEl.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  alert('DOM LOADED');
  debugUi('DOM chargé');
  
  let supabase;
  try {
    const module = await import('./supabaseClient.js');
    supabase = module.supabase;
    debugUi('Supabase importé');
  } catch (err) {
    debugUi('ERREUR Supabase: ' + err.message);
    return;
  }

  const { showMsg } = await import('./common.js');

  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const msgEl = document.getElementById('msg');

  debugUi('Formulaire trouvé: ' + (loginForm ? 'OUI' : 'NON'));

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      debugUi('Soumission inscription...');
      // ... reste du code ...
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      debugUi('Soumission connexion...');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        debugUi('ERREUR Connexion: ' + error.message);
        showMsg(msgEl, 'E-mail ou mot de passe incorrect.', 'error');
      } else {
        debugUi('Connexion réussie ! Redirection...');
        window.location.href = '/fiche.html';
      }
    });
  }
});
