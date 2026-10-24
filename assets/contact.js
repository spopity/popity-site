// Contact form: validates in the browser, then posts to /mail/send.php.
(function () {
  var form = document.getElementById("mailform");
  if (!form) return;
  var status = document.getElementById("status");
  var button = form.querySelector(".send");
  var opened = Date.now();
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function say(text, ok) {
    status.textContent = text;
    status.className = "status " + (ok ? "ok" : "err");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var from = form.from.value.trim();
    var subject = form.subject.value.trim();
    var message = form.message.value.trim();

    form.from.setAttribute("aria-invalid", !emailRe.test(from));
    if (!emailRe.test(from)) { say("mail: invalid address in From: please enter a valid email.", false); form.from.focus(); return; }
    if (!subject) { say("mail: Subject: is empty.", false); form.subject.focus(); return; }
    if (!message) { say("mail: message is empty.", false); form.message.focus(); return; }

    form.elapsed.value = Date.now() - opened;
    button.disabled = true;
    say("sending...", true);

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          opened = Date.now();
          say("Message sent. I'll get back to you soon.", true);
        } else {
          say("mail: " + (res.error || "could not send your message, please try again."), false);
        }
      })
      .catch(function () { say("mail: network error, please try again.", false); })
      .then(function () { button.disabled = false; });
  });

  form.from.addEventListener("input", function () { form.from.removeAttribute("aria-invalid"); });
})();
