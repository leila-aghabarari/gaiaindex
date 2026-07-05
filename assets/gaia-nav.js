/* Consolidated nav (Task 2): active-state highlighting, mobile dropdown toggle,
 * and ensuring License + Community links live in the footer. Shared across all
 * pages. Guarded; degrades to a plain (hover) dropdown if JS is unavailable. */
(function () {
  "use strict";
  var page = location.pathname.split("/").pop() || "index.html";

  // active state
  document.querySelectorAll(".nav-links a[data-nav]").forEach(function (a) {
    if (a.getAttribute("data-nav") === page) {
      a.classList.add("active");
      var dd = a.closest(".nav-dd");
      if (dd) { var b = dd.querySelector(".nav-dd-btn"); if (b) b.classList.add("active"); }
    }
  });

  // mobile: tap toggles the dropdown
  function closeAll(except) {
    document.querySelectorAll(".nav-dd.open").forEach(function (o) {
      if (o === except) return;
      o.classList.remove("open");
      var b = o.querySelector(".nav-dd-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  document.querySelectorAll(".nav-dd-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var dd = btn.closest(".nav-dd");
      var open = dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      closeAll(dd);
    });
  });
  document.addEventListener("click", function () { closeAll(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(null); });

  // ensure License + Community are reachable from the footer
  var footer = document.querySelector("footer");
  if (footer) {
    var html = footer.innerHTML;
    var missing = [];
    if (!/community\.html/.test(html)) missing.push('<a href="community.html">Community</a>');
    if (!/license\.html/.test(html)) missing.push('<a href="license.html">License</a>');
    if (missing.length) {
      var p = document.createElement("p");
      p.style.cssText = "font-size:.8rem;margin-top:.5rem";
      p.innerHTML = missing.join(" · ");
      footer.appendChild(p);
    }
  }
})();
