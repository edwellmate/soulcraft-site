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

  /* ---- email form: #sc-signup (join); success goes to welcome.html (REQUIREMENTS §6) ---- */
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
        if (res.data.already) {
          setMsg(msg, MSG_ALREADY);
        } else {
          form.reset();
          window.location.href = "welcome.html";   // the thank-you page; the welcome email comes from Sender
        }
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

  /* ---- podcast embeds: load only when the section is near the viewport ----
     loading="lazy" on an iframe is distance-based and generous; after the AI learning
     section was removed (v1.2) the three players sat inside that distance on a phone
     and loaded before first paint: 22 requests to Spotify, 11 to Apple, Lighthouse 72.
     Observing #podcast with a 300px margin gives the same "appears as you scroll"
     behaviour without paying for three players on every visit. */
  var podcast = document.getElementById("podcast");
  if (podcast) {
    var frames = podcast.querySelectorAll("iframe[data-src]");
    var loadFrames = function () {
      for (var k = 0; k < frames.length; k++) {
        if (!frames[k].getAttribute("src")) frames[k].setAttribute("src", frames[k].getAttribute("data-src"));
      }
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          if (entries[e].isIntersecting) { loadFrames(); io.disconnect(); break; }
        }
      }, { rootMargin: "300px 0px" });
      io.observe(podcast);
    } else {
      loadFrames();
    }
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
