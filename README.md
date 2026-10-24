# popity.ro

Source of [popity.ro](https://popity.ro): a small terminal-style personal site.
It's plain HTML/CSS, with a little PHP for the project pages and the contact form.

- `index.html`, `about/`, `privacy/`, `404.html`: static pages
- `projects/`: project list and pages, rendered from `projects/projects.php`.
  Each `demo/` folder is a static snapshot of the real app, fed from recorded,
  anonymized JSON by `demo-api.js`.
- `mail/`: contact form. `send.php` reads its SMTP login from `popity-smtp.php`,
  which lives outside the web root and isn't in this repo.
- `.htaccess`: HTTPS, pretty URLs for `/projects/<name>/`, redirects for old blog
  links, and security/cache headers (Apache, cPanel).

The blog at `/blog/` is a separate WordPress install and isn't included here.
