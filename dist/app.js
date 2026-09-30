(() => {
  const config = window.OFFSITE;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  document.getElementById('year').textContent = new Date().getFullYear();

  const filmDialog = document.getElementById('film-dialog');
  const filmImage = document.getElementById('dialog-image');
  const filmVideo = document.getElementById('dialog-video');
  document.querySelectorAll('[data-film]').forEach(button => {
    const film = config.films[button.dataset.film];
    if (!film) return;
    const cardImage = button.querySelector('img');
    cardImage.src = film.poster;
    if (film.video) {
      button.querySelector('.film-preview').firstChild.textContent = 'Watch film ';
      button.setAttribute('aria-label', `Watch ${film.title}`);
    }
    button.addEventListener('click', () => {
      document.getElementById('dialog-title').textContent = film.title;
      filmImage.src = film.poster;
      filmImage.alt = film.alt;
      filmImage.hidden = Boolean(film.video);
      filmVideo.hidden = !film.video;
      document.querySelector('.dialog-caption .eyebrow').textContent = film.video ? 'OFFSITE.MOVIES / RECAP FILM' : 'ILLUSTRATIVE MOOD FRAME';
      document.getElementById('dialog-description').textContent = film.video ? 'A film by offsite.movies.' : 'A placeholder for an offsite film. The real recap will live here.';
      if (film.video) { filmVideo.src = film.video; filmVideo.poster = film.poster; }
      filmDialog.showModal();
      if (film.video) filmVideo.play().catch(() => {});
    });
  });
  filmDialog.addEventListener('close', () => { filmVideo.pause(); filmVideo.removeAttribute('src'); filmVideo.load(); });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
  const contactDialog = document.getElementById('contact-dialog');
  document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
    const channel = button.dataset.contact;
    if (channel === 'email' && config.contact.email) { location.href = `mailto:${encodeURIComponent(config.contact.email)}?subject=Let%E2%80%99s%20film%20our%20offsite`; return; }
    if (channel === 'whatsapp' && config.contact.whatsapp) {
      const digits = config.contact.whatsapp.replace(/\D/g, '');
      if (digits) { window.open(`https://wa.me/${digits}?text=Hi%21%20I%27d%20love%20to%20talk%20about%20an%20offsite%20film.`, '_blank', 'noopener,noreferrer'); return; }
    }
    document.getElementById('contact-message').textContent = channel === 'email'
      ? 'Our email address will be added here soon. This contact button is a placeholder for now.'
      : 'Our WhatsApp number will be added here soon. This contact button is a placeholder for now.';
    contactDialog.showModal();
  }));
  document.querySelector('[data-close-contact]').addEventListener('click', () => contactDialog.close());
  document.querySelectorAll('.capture-accordion details').forEach(detail => detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.capture-accordion details').forEach(other => { if (other !== detail) other.open = false; });
    const photo = document.getElementById('capture-photo');
    photo.src = detail.dataset.photo;
    photo.alt = detail.dataset.alt;
  }));
})();
