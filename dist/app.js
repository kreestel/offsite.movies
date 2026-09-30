(() => {
  const config = window.OFFSITE;
  const header = document.querySelector('.site-header');
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const heroVideo = document.getElementById('hero-video');
  const pauseButton = document.getElementById('hero-pause');
  const soundButton = document.getElementById('hero-sound');
  let userPaused = false;
  const syncPlayback = () => {
    pauseButton.textContent = heroVideo.paused ? 'Play film' : 'Pause film';
    pauseButton.setAttribute('aria-label', heroVideo.paused ? 'Play opening film' : 'Pause opening film');
  };
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.play().catch(syncPlayback);
  heroVideo.addEventListener('play', syncPlayback);
  heroVideo.addEventListener('pause', syncPlayback);
  heroVideo.addEventListener('error', () => {
    pauseButton.textContent = 'Film unavailable';
    pauseButton.disabled = true;
    soundButton.disabled = true;
  });
  pauseButton.addEventListener('click', () => {
    userPaused = !heroVideo.paused;
    if (userPaused) heroVideo.pause();
    else heroVideo.play().catch(syncPlayback);
  });
  soundButton.addEventListener('click', () => {
    heroVideo.muted = !heroVideo.muted;
    soundButton.textContent = heroVideo.muted ? 'Sound off' : 'Sound on';
    soundButton.setAttribute('aria-pressed', String(!heroVideo.muted));
    soundButton.setAttribute('aria-label', heroVideo.muted ? 'Turn on film sound' : 'Mute film sound');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) heroVideo.pause();
    else if (!userPaused && !document.querySelector('dialog[open]')) heroVideo.play().catch(syncPlayback);
  });
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
  const stopPreviews = new Set();
  const hoverAvailable = window.matchMedia('(hover: hover) and (pointer: fine)');
  const stopAllPreviews = () => stopPreviews.forEach(stop => stop());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAllPreviews(); });
  window.addEventListener('blur', stopAllPreviews);
  document.querySelectorAll('[data-film]').forEach(button => {
    const film = config.films[button.dataset.film];
    if (!film) return;
    const cardImage = button.querySelector('img');
    cardImage.src = film.poster;
    cardImage.alt = film.alt;
    button.closest('.film-card').querySelector('h3').textContent = film.title;
    if (film.video) {
      const preview = document.createElement('video');
      preview.className = 'film-hover-video';
      preview.muted = true;
      preview.defaultMuted = true;
      preview.loop = true;
      preview.playsInline = true;
      preview.preload = 'none';
      preview.setAttribute('aria-hidden', 'true');
      button.append(preview);
      let hovered = false;
      const stopPreview = () => {
        hovered = false;
        preview.pause();
        if (preview.readyState > 0) preview.currentTime = 0;
        button.classList.remove('is-previewing');
      };
      stopPreviews.add(stopPreview);
      button.addEventListener('pointerenter', event => {
        if (!hoverAvailable.matches || event.pointerType !== 'mouse') return;
        stopAllPreviews();
        hovered = true;
        if (!preview.getAttribute('src')) preview.src = film.preview || film.video;
        preview.play().then(() => {
          if (!hovered || document.hidden || filmDialog.open) { stopPreview(); return; }
          button.classList.add('is-previewing');
        }).catch(stopPreview);
      });
      button.addEventListener('pointerleave', stopPreview);
      button.addEventListener('pointercancel', stopPreview);
      preview.addEventListener('error', stopPreview);
      button.querySelector('.film-badge').textContent = film.badge || 'SELECTED FILM';
      button.closest('.film-card').querySelector('.film-caption > span').textContent = film.caption || 'Selected film';
      button.querySelector('.film-preview').firstChild.textContent = hoverAvailable.matches ? 'Hover to play ' : 'Open film ';
      button.setAttribute('aria-label', `Open ${film.title}`);
    }
    button.addEventListener('click', () => {
      stopAllPreviews();
      document.getElementById('dialog-title').textContent = film.title;
      filmImage.src = film.poster;
      filmImage.alt = film.alt;
      filmImage.hidden = Boolean(film.video);
      filmVideo.hidden = !film.video;
      document.querySelector('.dialog-caption .eyebrow').textContent = film.video ? 'OFFSITE.MOVIES / SELECTED FILM' : 'ILLUSTRATIVE MOOD FRAME';
      document.getElementById('dialog-description').textContent = film.video ? 'A film by offsite.movies.' : 'A placeholder for an offsite film. The real recap will live here.';
      if (film.video) { filmVideo.src = film.video; filmVideo.poster = film.poster; }
      heroVideo.pause();
      filmDialog.showModal();
    });
  });
  filmDialog.addEventListener('close', () => { filmVideo.pause(); filmVideo.removeAttribute('src'); filmVideo.load(); if (!userPaused && !document.hidden) heroVideo.play().catch(syncPlayback); });
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
