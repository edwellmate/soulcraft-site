/* soulcraft.me — no dependencies. Ed fills the three constants the morning after. */
var STRIPE_LINK   = "";   // Stripe Payment Link, $149 AUD, success URL = TIDYCAL_URL
var TIDYCAL_URL   = "";   // TidyCal booking page for the 60-min session
var FORM_ENDPOINT = "";   // Lambda Function URL for the email form

(function () {
  "use strict";

  /* ---- booking: Stripe → TidyCal → mailto (REQUIREMENTS §5) ---- */
  var MAILTO = "mailto:eduardo@wellmate.me";
  function bookingHref() {
    if (STRIPE_LINK) return STRIPE_LINK;
    if (TIDYCAL_URL) return TIDYCAL_URL;
    return MAILTO + "?subject=" + encodeURIComponent("Quick-Win Session") +
      "&body=" + encodeURIComponent("Hi Eduardo,\n\nI'd like to book a Quick-Win Session. Here's a little about how I run things:\n\n");
  }
  var bookers = document.querySelectorAll(".js-book");
  for (var i = 0; i < bookers.length; i++) {
    bookers[i].addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = bookingHref();
    });
  }

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
