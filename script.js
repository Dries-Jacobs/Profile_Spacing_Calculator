(function () {
  const form = document.getElementById('calcForm');
  const resetBtn = document.getElementById('resetBtn');

  const inputTotWid = document.getElementById('inputTotWid');
  const inputProWid = document.getElementById('inputProWid');
  const inputDesSpa = document.getElementById('inputDesSpa');

  const result1El = document.getElementById('calcSpa');
  const result2El = document.getElementById('nPro');

  function toNumber(val) {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : 0;
  }

  function format(val) {
    // Keep two decimals like your original
    return Number(val).toFixed(2);
  }

  function calculate() {
    const a = toNumber(inputTotWid.value);
    const b = toNumber(inputProWid.value);
    const c = toNumber(inputDesSpa.value);

    const num = Math.round((a - b)/(b + c))  + 1;    // calculate number of profiles
    const calcSpa = (a - (num * b)) / (num - 1);   // spacing between profiles

    result1El.textContent = format(calcSpa);
    result2El.textContent = format(num);
  }

  function resetAll() {
    inputTotWid.value = '';
    inputProWid.value = '';
    inputDesSpa.value = '';
    result1El.textContent = '-';
    result2El.textContent = '-';
    inputTotWid.focus();
  }

  // Submit calculates (also works with Enter key)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  // Reset button
  resetBtn.addEventListener('click', resetAll);

  // Optional: Auto-calc on input changes (uncomment to enable)
   [inputTotWid, inputProWid, inputDesSpa].forEach(inp =>
     inp.addEventListener('input', calculate)
  );
})();
