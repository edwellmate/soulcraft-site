/* thanks.html: show the booking button once BOOKING_URL is set in main.js. */
(function () {
  "use strict";
  if (typeof BOOKING_URL === "undefined" || !BOOKING_URL) return;
  var link = document.getElementById("thanks-book-link");
  var book = document.getElementById("thanks-book");
  var mail = document.getElementById("thanks-email");
  if (!link || !book || !mail) return;
  link.href = BOOKING_URL;
  book.hidden = false;
  mail.hidden = true;
})();
