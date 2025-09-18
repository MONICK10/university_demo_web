/* script.js
   Plain JavaScript + jQuery integration.
   - Plain JS handles: BMI calc, form validation hooks, progress updates, file restriction checks.
   - jQuery handles: currency converter UI interactions (keyup, change, click).
*/

/* ---------- Plain JS utilities ---------- */

document.addEventListener('DOMContentLoaded', function () {
    // update copyright year
    document.getElementById('year').textContent = new Date().getFullYear();
  
    const form = document.getElementById('registrationForm');
    const progress = document.getElementById('formProgress');
    const progressText = document.getElementById('progress-text');
  
    // LIST of fields considered for progress calculation (ids)
    const progressFields = [
      'fullname','regno','email','phone','password','dob','teamsize','department','photo','notes','height','weight'
    ];
  
    // compute progress: percent of required fields filled (simple heuristic)
    function computeProgress() {
      let filled = 0;
      for (const id of progressFields) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.type === 'file') {
          if (el.files && el.files.length > 0) filled++;
        } else if (el.type === 'checkbox' || el.type === 'radio') {
          // skip here
        } else {
          if (el.value && el.value.trim() !== '') filled++;
        }
      }
      // also consider at least one eventchoice (radio) and at least one preference (checkbox)
      const anyEvent = !!form.querySelector('input[name="eventchoice"]:checked');
      const anyPref = !!form.querySelector('input[name="prefs"]:checked');
      if (anyEvent) filled++;
      if (anyPref) filled++;
  
      const total = progressFields.length + 2; // two more components checked above
      const percent = Math.round((filled / total) * 100);
      progress.value = percent;
      progressText.textContent = `${percent}% completed`;
      return percent;
    }
  
    // listen for input changes across the form (one DOM event)
    form.addEventListener('input', function (e) {
      computeProgress();
    }, { passive: true });
  
    // on reset, reset progress
    form.addEventListener('reset', function () {
      setTimeout(() => computeProgress(), 50); // wait for reset to clear fields
      document.getElementById('bmi-result').textContent = '—';
      document.getElementById('currency-result').textContent = '—';
    });
  
    // File upload client-side check: reject executables by checking extension (extra safety)
    const photo = document.getElementById('photo');
    photo.addEventListener('change', function () {
      if (!photo.files || photo.files.length === 0) return;
      const fname = photo.files[0].name.toLowerCase();
      if (fname.endsWith('.exe') || fname.endsWith('.bat') || fname.endsWith('.sh')) {
        alert('Executable files are not allowed. Please upload an image file (png, jpg, jpeg).');
        photo.value = ''; // clear
        computeProgress();
      } else {
        // optionally preview (not required)
        computeProgress();
      }
    });
  
    // Plain JavaScript BMI calculator using onclick
    document.getElementById('bmi-calc').addEventListener('click', function () {
      const h = parseFloat(document.getElementById('height').value);
      const w = parseFloat(document.getElementById('weight').value);
      const out = document.getElementById('bmi-result');
      if (!h || !w || h <= 0 || w <= 0) {
        out.textContent = 'Please enter valid height and weight.';
        return;
      }
      // convert cm to m
      const m = h / 100;
      const bmi = w / (m * m);
      let category = 'Unknown';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';
      out.textContent = `BMI: ${bmi.toFixed(2)} — ${category}`;
    });
  
    // Form submit handler: block empty required fields, highlight invalid
    form.addEventListener('submit', function (e) {
      // Let browser check constraints first; we'll also run custom checks.
      if (!form.checkValidity()) {
        // show built-in validation messages; highlight invalid fields
        form.reportValidity();
        e.preventDefault();
        return;
      }
  
      // Custom: ensure at least 4 checkboxes may not be required by assignment, but ensure at least 1 pref
      const prefs = form.querySelectorAll('input[name="prefs"]:checked');
      if (!(prefs && prefs.length >= 1)) {
        alert('Please choose at least one preference.');
        e.preventDefault();
        return;
      }
  
      // custom phone pattern (we already have pattern attr) — demonstration
      const phone = document.getElementById('phone');
      const phoneRe = /^\d{10}$/;
      if (!phoneRe.test(phone.value.trim())) {
        alert('Phone must be a 10-digit number.');
        phone.focus();
        e.preventDefault();
        return;
      }
  
      // Everything ok: form will submit to /serverlogic (in this demo there's no real server)
      alert('Form submitted (demo). In real deployment, the form posts to /serverlogic.');
      // e.preventDefault(); // comment out to allow real submission
    });
  
    // initial progress
    computeProgress();
  });
  /* ---------- end plain JS ---------- */
  
  /* ---------- jQuery portion (currency converter) ---------- */
  $(function () {
    // Simple hard-coded conversion rates (for demo only).
    // NOTE: In real projects you'd fetch live rates from an API.
    const rates = {
      inr: { usd: 0.012, eur: 0.011, gbp: 0.0096, aed: 0.044, inr: 1 },
      usd: { inr: 82.5, eur: 0.92, gbp: 0.78, aed: 3.67, usd: 1 },
      eur: { inr: 90.0, usd: 1.08, gbp: 0.85, aed: 4.0, eur: 1 },
      gbp: { inr: 106.0, usd: 1.28, eur: 1.17, aed: 4.7, gbp: 1 },
      aed: { inr: 22.4, usd: 0.27, eur: 0.25, gbp: 0.21, aed: 1 }
    };
  
    const $amount = $('#amount');
    const $to = $('#to-currency');
    const $result = $('#currency-result');
  
    // helper to compute
    function computeCurrency() {
      const val = parseFloat($amount.val());
      if (isNaN(val)) {
        $result.text('Enter a valid amount (INR).');
        return;
      }
      const to = $to.val();
      // we treat input as INR base; convert INR -> to
      const rate = rates['inr'][to];
      if (!rate) {
        $result.text('Rate unavailable.');
        return;
      }
      const converted = val * rate;
      $result.text(`${val.toLocaleString()} INR → ${converted.toFixed(2)} ${to.toUpperCase()}`);
    }
  
    // jQuery actions required: keyup and change update result dynamically
    $amount.on('keyup', computeCurrency);
    $to.on('change', computeCurrency);
  
    // click action on convert button
    $('#convert-btn').on('click', function () {
      computeCurrency();
    });
  
    // another click action: swap button (simple demo: fill amount with previous conversion)
    $('#swap-btn').on('click', function () {
      const to = $to.val();
      // if to is same as inr, do nothing.
      if (to === 'inr') {
        alert('Already INR → INR (no swap needed).');
        return;
      }
      // compute current conversion and swap: take amount INR => value in target, then set that value as "INR" amount and set target to INR
      const val = parseFloat($amount.val());
      if (isNaN(val) || val <= 0) {
        alert('Enter a valid amount to swap.');
        return;
      }
      const rate = rates['inr'][to];
      if (!rate) return;
      const converted = val * rate;
      // Set the converted value as new amount, and set target currency to INR
      $amount.val(converted.toFixed(2));
      $to.val('inr');
      computeCurrency();
    });
  });
  /* ---------- end jQuery ---------- */