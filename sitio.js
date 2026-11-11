// MC Master Clean — interacciones del sitio
(function () {
  var WA_MAIN = "5493484687344";

  function track(location) {
    var payload = { location: location, page: window.location.pathname };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: "whatsapp_click" }, payload));
    if (window.gtag) window.gtag("event", "whatsapp_click", payload);
    if (window.fbq) window.fbq("track", "Contact", payload);
  }

  // Medición de clics en WhatsApp
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-track]");
    if (a) track(a.getAttribute("data-track"));
  });

  // Menú móvil
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
  }

  // Formularios de presupuesto → abren WhatsApp con los datos
  document.querySelectorAll("form.quote-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = [];
      form.querySelectorAll("label").forEach(function (label) {
        var field = label.querySelector("input, select, textarea");
        var name = label.querySelector("[data-label]");
        if (field && name && field.value.trim()) lines.push("• " + name.getAttribute("data-label") + ": " + field.value.trim());
      });
      var text = form.getAttribute("data-intro") + "\n\n" + lines.join("\n");
      track("form");
      window.open("https://wa.me/" + WA_MAIN + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    });
  });

  // Filtros de la galería de trabajos
  var gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    var buttons = gallery.querySelectorAll("[data-filter]");
    var items = gallery.querySelectorAll("[data-category]");
    var slots = gallery.querySelectorAll("[data-empty]");
    var empty = gallery.querySelector(".empty-msg");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        buttons.forEach(function (b) { b.setAttribute("aria-selected", b === btn ? "true" : "false"); });
        var shown = 0;
        items.forEach(function (it) {
          var show = cat === "Todos" || it.getAttribute("data-category") === cat;
          it.hidden = !show;
          if (show) shown++;
        });
        empty.hidden = shown > 0;
        slots.forEach(function (s) {
          s.hidden = shown > 0 || !(cat === "Todos" || s.getAttribute("data-empty") === cat);
        });
      });
    });
  }

  // Pestañas (sección de Instagram)
  document.querySelectorAll("[data-tabs]").forEach(function (box) {
    var tabs = box.querySelectorAll("[data-tab]");
    var panels = box.querySelectorAll("[data-panel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var id = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
        panels.forEach(function (p) {
          var show = p.getAttribute("data-panel") === id;
          p.hidden = !show;
          var cf = p.querySelector("[data-coverflow]");
          if (cf && cf._cf) cf._cf[show ? "show" : "hide"]();
        });
      });
    });
  });

  // Carrusel 3D de Instagram
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DELAY = 4500;
  document.querySelectorAll("[data-coverflow]").forEach(function (cf) {
    var stage = cf.querySelector(".cf-stage");
    var posts = Array.prototype.slice.call(cf.querySelectorAll(".post"));
    var dots = Array.prototype.slice.call(cf.querySelectorAll(".cf-dots button"));
    var n = posts.length, active = 0, timer = null, hover = false, visible = false, inView = false;
    cf.style.setProperty("--cf-delay", DELAY + "ms");

    function layout() {
      var wide = window.innerWidth >= 768;
      var gap = wide ? 0.62 : 0.5; // separación lateral, en anchos de tarjeta
      posts.forEach(function (p, i) {
        var d = i - active;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        var a = Math.abs(d);
        var x = d * gap * 100;
        var scale = a === 0 ? 1 : a === 1 ? 0.82 : 0.66;
        var rot = d === 0 ? 0 : d > 0 ? -18 : 18;
        p.style.transform = "translateX(calc(-50% + " + x + "%)) scale(" + scale + ") rotateY(" + rot + "deg)";
        p.style.zIndex = String(10 - a);
        p.style.opacity = a === 0 ? "1" : a === 1 ? (wide ? "0.7" : "0.45") : a === 2 && wide ? "0.3" : "0";
        p.style.filter = a === 0 ? "none" : "brightness(.75)";
        p.style.pointerEvents = a > (wide ? 2 : 1) ? "none" : "";
        p.setAttribute("data-pos", String(d));
        p.setAttribute("aria-hidden", a === 0 ? "false" : "true");
        p.tabIndex = a === 0 ? 0 : -1;
      });
      dots.forEach(function (b, i) {
        if (i === active) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      // reinicia la barrita de progreso del punto activo
      var cur = dots[active];
      if (cur) { cur.style.animation = "none"; void cur.offsetWidth; cur.style.animation = ""; }
    }
    function go(i) { active = (i + n) % n; layout(); restart(); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() {
      stop();
      if (reduce || n < 2 || hover || !visible || !inView) { cf.classList.add("paused"); return; }
      cf.classList.remove("paused");
      timer = setInterval(function () { active = (active + 1) % n; layout(); }, DELAY);
    }

    cf.querySelector(".prev").addEventListener("click", function () { go(active - 1); });
    cf.querySelector(".next").addEventListener("click", function () { go(active + 1); });
    dots.forEach(function (b, i) { b.addEventListener("click", function () { go(i); }); });
    posts.forEach(function (p, i) {
      p.addEventListener("click", function (e) {
        if (moved) { e.preventDefault(); return; }
        if (i !== active) { e.preventDefault(); go(i); }
      });
    });
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    });
    cf.addEventListener("mouseenter", function () { hover = true; restart(); });
    cf.addEventListener("mouseleave", function () { hover = false; restart(); });
    cf.addEventListener("focusin", function () { hover = true; restart(); });
    cf.addEventListener("focusout", function () { hover = false; restart(); });

    // deslizar con el dedo o el mouse
    var startX = null, moved = false;
    stage.addEventListener("pointerdown", function (e) { startX = e.clientX; moved = false; });
    stage.addEventListener("pointermove", function (e) { if (startX !== null && Math.abs(e.clientX - startX) > 10) moved = true; });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
      setTimeout(function () { moved = false; }, 0);
    });
    stage.addEventListener("pointercancel", function () { startX = null; moved = false; });
    stage.addEventListener("dragstart", function (e) { e.preventDefault(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(cf);
    } else { inView = true; }
    window.addEventListener("resize", layout);

    cf._cf = {
      show: function () { visible = true; active = 0; layout(); restart(); },
      hide: function () { visible = false; stop(); }
    };
    visible = !cf.closest("[hidden]");
    layout(); restart();
  });

  // Comparador antes / después
  document.querySelectorAll("[data-compare]").forEach(function (box) {
    var input = box.querySelector("input");
    function set(v) { box.style.setProperty("--pos", v + "%"); }
    input.addEventListener("input", function () { set(input.value); });
    input.addEventListener("pointerdown", function () { box.classList.add("dragging"); });
    window.addEventListener("pointerup", function () { box.classList.remove("dragging"); });
    // pequeña animación la primera vez que aparece, para mostrar que se puede mover
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var t0 = null, touched = false;
      input.addEventListener("pointerdown", function () { touched = true; }, { once: true });
      function frame(t) {
        if (touched) return;
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / 1800, 1);
        var v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p * 0.3);
        if (p >= 1) v = 50;
        set(v); input.value = v;
        if (p < 1) requestAnimationFrame(frame);
      }
      setTimeout(function () { requestAnimationFrame(frame); }, 400);
    }, { threshold: 0.6 });
    io.observe(box);
  });

  // Collage del inicio: leve movimiento con el mouse
  var collage = document.querySelector("[data-parallax]");
  if (collage && !reduce && window.matchMedia("(hover: hover)").matches) {
    var layers = collage.querySelectorAll("[data-depth]");
    var hero = collage.closest("section");
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach(function (l) {
        var d = Number(l.getAttribute("data-depth"));
        l.style.setProperty("--px", (-x * d).toFixed(1) + "px");
        l.style.setProperty("--py", (-y * d).toFixed(1) + "px");
      });
    });
    hero.addEventListener("mouseleave", function () {
      layers.forEach(function (l) { l.style.setProperty("--px", "0px"); l.style.setProperty("--py", "0px"); });
    });
  }

  // Fundido de las fotos que cargan al bajar
  document.querySelectorAll('img[loading="lazy"]').forEach(function (im) {
    function show() { im.classList.add("is-in"); }
    if (im.complete) show();
    else { im.addEventListener("load", show); im.addEventListener("error", show); }
  });

  // Año del pie
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
