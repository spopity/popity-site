// The email address is stored reversed in data-m and only assembled on click,
// so bots scraping the HTML never see it.
document.addEventListener("click", function (e) {
  var a = e.target.closest("[data-m]");
  if (!a) return;
  e.preventDefault();
  location.href = "mailto:" + a.getAttribute("data-m").split("").reverse().join("");
});
