console.log('auth.js is loading...');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM fully loaded.');
  
  let supabase;
  try {
    const module = await import('./supabaseClient.js');
    supabase = module.supabase;
    console.log('Supabase imported successfully');
  } catch (err) {
    console.error('CRITICAL ERROR: Failed to import Supabase:', err);
    return;
  }

  const { showMsg } = await import('./common.js');

  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const msgEl = document.getElementById('msg');

  console.log('Signup form found:', signupForm);
  console.log('Login form found:', loginForm);

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;

      if (password !== passwordConfirm) {
        showMsg(msgEl, 'Les mots de passe ne correspondent pas.', 'error');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/login.html' }
      });

      if (error) {
        showMsg(msgEl, error.message, 'error');
      } else {
        showMsg(msgEl, 'Compte créé ! Vérifiez votre e-mail pour confirmer.', 'ok');
        signupForm.reset();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        showMsg(msgEl, 'E-mail ou mot de passe incorrect.', 'error');
      } else {
        window.location.href = '/fiche.html';
      }
    });
  }
});
