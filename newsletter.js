document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.newsletter-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailEl = form.querySelector('input[type="email"]');
      const nameEl = form.querySelector('input[name="name"]');
      const msg = form.querySelector('.newsletter-msg');
      const email = (emailEl?.value || '').trim();
      if (!email) return;

      if (msg) msg.textContent = 'Subscribing…';

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: nameEl?.value || '' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Subscription failed. Please try again.');
        if (msg) {
          msg.textContent = "You're subscribed! 🎉";
          msg.classList.remove('err');
          msg.classList.add('ok');
        }
        form.reset();
      } catch (err) {
        if (msg) {
          msg.textContent = err.message;
          msg.classList.remove('ok');
          msg.classList.add('err');
        }
      }
    });
  });
});
