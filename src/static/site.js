(function () {
  /* Mobile nav */
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* Early-access form. data-endpoint stays empty until an endpoint (e.g. Formspree) is chosen. */
  var form = document.getElementById('access-form');
  if (!form) return;
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var email = form.getAttribute('data-email') || '';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var endpoint = form.getAttribute('data-endpoint');
    if (!endpoint) {
      status.textContent = 'This is a preview, so the form is not connected yet. Nothing was sent.';
      return;
    }
    button.disabled = true;
    status.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        status.textContent = 'Thanks. We will be in touch to arrange a demo.';
      })
      .catch(function () {
        status.textContent = 'Something went wrong. Email ' + email + ' instead.';
      })
      .then(function () { button.disabled = false; });
  });
})();
