/* soulcraft.me, no dependencies. Ed fills the three constants. */
var STRIPE_LINK   = "https://buy.stripe.com/8x28wO0I7bZg5i48ujbZe00";   // Stripe Payment Link, $149 AUD, success URL = BOOKING_URL
var BOOKING_URL   = "https://bookings.cloud.microsoft/bookwithme/user/f4adebbd04204d74a595f0ab930befec@wellmate.me/meetingtype/SVRwCe7HMUGxuT6WGxi68g2?anonymous&ismsaljsauthenabled";   // Microsoft Bookings public page for the 60-min session
var FORM_ENDPOINT = "https://opa4vcnq7gnw4dudy2lbhn6rf40tfdfr.lambda-url.ap-southeast-2.on.aws/";   // Lambda Function URL for the email form

(function () {
  "use strict";

  /* ---- booking: Stripe, then Bookings, then mailto (REQUIREMENTS §5) ---- */
  var MAILTO = "mailto:eduardo@soulcraft.me";
  function bookingHref() {
    if (STRIPE_LINK) return STRIPE_LINK;
    if (BOOKING_URL) return BOOKING_URL;
    return MAILTO + "?subject=" + encodeURIComponent("Quick-Win Session") +
      "&body=" + encodeURIComponent("Hi Eduardo,\n\nI'd like to book a Quick-Win Session. Here's a little about how I run things:\n\n");
  }
  var bookers = document.querySelectorAll(".js-book");
  for (var i = 0; i < bookers.length; i++) {
    bookers[i].addEventListener("click", function () {
      // Rewrite the href at click time so the browser does the navigation
      // (no-JS fallback stays #quick-win).
      this.setAttribute("href", bookingHref());
    });
  }

  /* ---- email forms: #sc-signup (join) + #sc-signup-ai (ai-learning) (REQUIREMENTS §6) ---- */
  var MSG_OK = "You\u2019re in. Talk soon.";
  var MSG_ALREADY = "You\u2019re already on the list.";
  var MSG_ERR = "That didn\u2019t go through. Email me instead at ";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setMsg(el, text, isErr) {
    if (!el) return;
    el.textContent = text;
    if (isErr) {
      var a = document.createElement("a");
      a.href = MAILTO;
      a.textContent = "eduardo@soulcraft.me";
      el.appendChild(a);
      el.appendChild(document.createTextNode("."));
    }
  }

  function handleSignup(form) {
    var input = form.querySelector("input[type=email]");
    var button = form.querySelector("button");
    var msg = document.getElementById(form.id + "-msg");
    var source = form.getAttribute("data-source") || "join";
    var email = (input.value || "").trim();

    if (!EMAIL_RE.test(email)) {
      setMsg(msg, "Please enter a valid email address.");
      input.focus();
      return;
    }
    var consent = form.querySelector("input[name=consent]");
    if (consent && !consent.checked) {
      setMsg(msg, "Please tick the box so I\u2019m allowed to email you.");
      consent.focus();
      return;
    }
    if (!FORM_ENDPOINT) {
      window.location.href = MAILTO + "?subject=" + encodeURIComponent("Keep me posted") +
        "&body=" + encodeURIComponent("Please add " + email + " to the list (" + source + ").");
      return;
    }
    button.disabled = true;
    setMsg(msg, "");
    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, source: source })
    }).then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    }).then(function (res) {
      if (res.ok && res.data && res.data.ok) {
        setMsg(msg, res.data.already ? MSG_ALREADY : MSG_OK);
        if (!res.data.already) form.reset();
      } else {
        setMsg(msg, MSG_ERR, true);
      }
    }).catch(function () {
      setMsg(msg, MSG_ERR, true);
    }).then(function () {
      button.disabled = false;
    });
  }

  var forms = document.querySelectorAll(".js-signup");
  for (var f = 0; f < forms.length; f++) {
    forms[f].addEventListener("submit", function (e) {
      e.preventDefault();
      handleSignup(this);
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
