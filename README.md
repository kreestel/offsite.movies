# offsite.movies

Static portfolio for corporate offsite recap films.

Run `node serve.mjs` from this folder and open http://127.0.0.1:4173.

## Replacing placeholders

- Copy film files into `dist/assets/` and set the corresponding `video` values in `dist/films.js`. Native playback is already implemented.
- Add the email address and WhatsApp number (including country code) to `contact` in `dist/films.js`. Empty values show an honest placeholder message.
- Replace team role placeholders in `dist/index.html` with actual names, portraits, and roles.
- Update placeholder wording and film captions in `dist/index.html` when inserting final content.

## Temporary photography

Illustrative stock photos, not actual client projects or team members:

- Outdoor dinner: Askar Abayev, Pexels — https://www.pexels.com/photo/diverse-friends-toasting-at-table-with-candles-in-garden-5638816/
- Hiking: Vitaly Gariev, Unsplash — https://unsplash.com/photos/group-of-friends-hiking-on-a-forest-trail-pc8BUVAVXzo
- Conversation: Gary Barnes, Pexels — https://www.pexels.com/photo/diverse-friends-drinking-cups-of-tea-and-communicating-in-cafe-6248764/

Photos are used under the Pexels and Unsplash free licenses. Typography uses DM Sans through Google Fonts, with a system sans-serif fallback.
