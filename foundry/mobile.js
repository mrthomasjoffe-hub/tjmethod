/* ---------------------------------------------------------------------------
   Phone behaviour for The Foundry.

   Everything here is additive and lives outside React's root, so the built
   bundle is never touched and re-renders cannot wipe it out.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var body = document.body;

  /* --- drawer navigation ------------------------------------------------ */

  var scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  scrim.setAttribute('aria-hidden', 'true');

  var toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<i></i><i></i><i></i>';

  body.appendChild(scrim);
  body.appendChild(toggle);

  function setNav(open) {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setNav(!body.classList.contains('nav-open'));
  });
  scrim.addEventListener('click', function () { setNav(false); });

  // Tapping anything in the drawer that navigates should close it. Delegated,
  // so it keeps working however often React redraws the sidebar.
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.sidebar a, .sidebar button') : null;
    if (el) setNav(false);
  });

  // The login screen has no sidebar — hide the button until one exists.
  function syncToggle() {
    toggle.style.display = document.querySelector('.sidebar') ? '' : 'none';
  }
  syncToggle();
  new MutationObserver(syncToggle).observe(document.getElementById('root'), {
    childList: true,
    subtree: true,
  });

  /* --- service worker --------------------------------------------------- */

  // Only registers in a secure context. Served over plain HTTP on the LAN the
  // app still runs and still installs to the home screen, just without the
  // offline cache — so a failure here is quiet on purpose.
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (reg) {
        reg.addEventListener('updatefound', function () {
          var next = reg.installing;
          if (!next) return;
          next.addEventListener('statechange', function () {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdate(reg);
            }
          });
        });
      }).catch(function () { /* offline support is a bonus, never a blocker */ });

      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    });
  }

  function showUpdate(reg) {
    if (document.querySelector('.sw-update')) return;
    var bar = document.createElement('div');
    bar.className = 'sw-update';
    bar.innerHTML = '<span>A new version of The Foundry is ready.</span>';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Reload';
    btn.addEventListener('click', function () {
      if (reg.waiting) reg.waiting.postMessage('skip-waiting');
      bar.remove();
    });
    bar.appendChild(btn);
    body.appendChild(bar);
  }
})();
