// ============ Application form ============

(function () {
  const form = document.getElementById('apply-form');
  const success = document.getElementById('apply-success');
  const resetBtn = document.getElementById('apply-reset');
  const submitBtn = document.getElementById('apply-submit');
  if (!form || !success) return;

  function markInvalid(el) {
    el.style.borderColor = '#b3341c';
    el.style.boxShadow = '0 0 0 3px rgba(179, 52, 28, 0.18)';
  }

  function clearInvalid(el) {
    el.style.borderColor = '';
    el.style.boxShadow = '';
  }

  form.addEventListener('input', (e) => {
    if (e.target && e.target.matches('input, select, textarea')) clearInvalid(e.target);
  });

  function showError(msg) {
    let err = document.getElementById('apply-error');
    if (!err) {
      err = document.createElement('p');
      err.id = 'apply-error';
      err.setAttribute('role', 'alert');
      err.style.cssText =
        'color:#b3341c;font-weight:500;margin-top:0.75rem;padding:0.6rem 0.85rem;background:rgba(179,52,28,0.08);border-radius:8px;';
      submitBtn.insertAdjacentElement('afterend', err);
    }
    err.textContent = msg;
  }

  function clearError() {
    const err = document.getElementById('apply-error');
    if (err) err.remove();
  }

  function isAustralianPhone(value) {
    const number = value.replace(/[\s().-]/g, '');
    return /^(?:0[2378]\d{8}|04\d{8}|\+61[2378]\d{8}|\+614\d{8})$/.test(number);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    // Manual validation for a clearer inline signal than the browser default.
    const required = form.querySelectorAll('[required]');
    let firstInvalid = null;
    required.forEach((el) => {
      const ok = el.type === 'checkbox' ? el.checked : el.value && el.value.trim().length > 0;
      if (!ok) {
        markInvalid(el);
        if (!firstInvalid) firstInvalid = el;
      }
    });

    // Simple email sanity check.
    const email = form.querySelector('#email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      markInvalid(email);
      if (!firstInvalid) firstInvalid = email;
    }

    // Accept Australian mobile and landline numbers in national or +61 format.
    const phone = form.querySelector('#phone');
    if (phone.value && !isAustralianPhone(phone.value.trim())) {
      markInvalid(phone);
      if (!firstInvalid) firstInvalid = phone;
    }

    // Australian postcode check.
    const postcode = form.querySelector('#postcode');
    if (postcode.value && !/^[0-9]{4}$/.test(postcode.value.trim())) {
      markInvalid(postcode);
      if (!firstInvalid) firstInvalid = postcode;
    }

    if (firstInvalid) {
      showError(firstInvalid === phone
        ? 'Enter an Australian phone number, such as 0412 345 678 or +61 412 345 678.'
        : 'Please complete the highlighted field and try again.');
      firstInvalid.focus({ preventScroll: false });
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending application…';
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      values.authz = form.querySelector('#authz').checked;
      values.consent = form.querySelector('#consent').checked;
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(result.error || 'Could not deliver your application. Please try again.');
      }
      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      showError(error.message && !/^(Failed to fetch|Unexpected token)/.test(error.message)
        ? error.message
        : 'Could not deliver your application. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit application';
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      success.hidden = true;
      clearError();
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
