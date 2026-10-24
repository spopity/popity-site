<?php
// /projects/<name>/: one project's README, generated from projects.php.
// .htaccess rewrites /projects/<name>/ to this file with ?name=<name>.
$projects = require __DIR__ . '/projects.php';
function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$name = (string)($_GET['name'] ?? '');
$p = null;
foreach ($projects as $candidate) {
    if ($candidate['name'] === $name) { $p = $candidate; break; }
}
if ($p === null) {
    http_response_code(404);
    readfile(dirname(__DIR__) . '/404.html');
    exit;
}
$source = preg_replace('#^https?://#', '', $p['link']);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($p['title']) ?> · popity.ro</title>
  <meta name="description" content="<?= e($p['description'][0]) ?>">
  <link rel="canonical" href="https://popity.ro/projects/<?= e($p['name']) ?>/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/roboto-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <main class="term">
    <nav aria-label="Main">
      <p class="cmd"><span class="ps1">seba@popity:~$</span>ls</p>
      <ul class="nav">
        <li><a href="/">home</a></li>
        <li><a href="/about/">about</a></li>
        <li><a href="/blog/">blog</a></li>
        <li><a href="/mail/">mail</a></li>
      </ul>
    </nav>

    <p class="cmd"><span class="ps1">seba@popity:~/projects$</span>cat <?= e($p['name']) ?>/README.md</p>
    <div class="out">
      <h1 class="bright" style="font-size:inherit;margin:0"><?= e($p['title']) ?></h1>
<?php foreach ($p['description'] as $para): ?>
      <p><?= e($para) ?></p>
<?php endforeach; ?>
      <dl class="kv">
        <dt>stack:</dt><dd><?= e(implode(' · ', $p['stack'])) ?></dd>
        <dt>status:</dt><dd><?= e($p['status']) ?></dd>
        <dt>source:</dt><dd><a href="<?= e($p['link']) ?>" target="_blank" rel="noopener"><?= e($source) ?></a></dd>
<?php if (!empty($p['demo'])): ?>
        <dt>demo:</dt><dd><a href="/projects/<?= e($p['name']) ?>/<?= e($p['demo']['url']) ?>">DEMO</a> <span class="dim">snapshot of the live dashboard from <?= e($p['demo']['date']) ?>; <?= e($p['demo']['note']) ?></span></dd>
<?php endif; ?>
      </dl>
    </div>

    <p class="cmd"><span class="ps1">seba@popity:~/projects$</span><a href="/projects/">cd ..</a> <span class="cursor" aria-hidden="true"></span></p>
  </main>

  <footer class="footer">&copy; 2026 popity.ro &middot; <a href="/privacy/">privacy</a></footer>
</body>
</html>
