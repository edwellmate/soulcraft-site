/* soulcraft.me — no dependencies. Ed fills the three constants the morning after. */
var STRIPE_LINK   = "";   // Stripe Payment Link, $149 AUD, success URL = TIDYCAL_URL
var TIDYCAL_URL   = "";   // TidyCal booking page for the 60-min session
var FORM_ENDPOINT = "";   // Lambda Function URL for the email form

(function () {
  "use strict";

  /* ---- mobile nav ---- */
  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a && nav.classList.contains("nav-open")) {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("nav-open")) {
        nav.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }
})();
