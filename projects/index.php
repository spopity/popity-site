<?php
// /projects/: the `ls -l` listing, generated from projects.php.
$projects = require __DIR__ . '/projects.php';
function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Projects · popity.ro</title>
  <meta name="description" content="Home lab projects by Sebastian Popity: automations and AI agents.">
  <link rel="canonical" href="https://popity.ro/projects/">
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

    <p class="cmd"><span class="ps1">seba@popity:~$</span>cd projects &amp;&amp; cat README.md</p>
    <div class="out">
      <h1 class="bright" style="font-size:inherit;margin:0">Projects</h1>
      <p>Automations and AI agents built in my home lab. Some useful, some just for fun, all of them broken at least once before they worked.</p>
    </div>

    <p class="cmd"><span class="ps1">seba@popity:~/projects$</span>ls -l</p>
<?php if (!$projects): ?>
    <dl class="out list">
      <dt class="dim">total 0</dt><dd class="dim">first projects are still compiling. Check back soon.</dd>
    </dl>
<?php else: ?>
    <p class="out">total <?= count($projects) ?></p>
    <ul class="out lsl">
<?php foreach ($projects as $p): ?>
      <li><span>drwxr-xr-x</span><span>seba</span><span><?= e($p['date']) ?></span><span><a class="name" href="/projects/<?= e($p['name']) ?>/"><?= e($p['name']) ?>/</a></span><span class="dim"># <?= e($p['comment']) ?></span></li>
<?php endforeach; ?>
    </ul>
<?php endif; ?>

    <p class="cmd"><span class="ps1">seba@popity:~/projects$</span><a href="/">cd ..</a> <span class="cursor" aria-hidden="true"></span></p>
  </main>

  <footer class="footer">&copy; 2026 popity.ro &middot; <a href="/privacy/">privacy</a></footer>
</body>
</html>
