(function () {
  const form = document.getElementById('calcForm');
  const resetBtn = document.getElementById('resetBtn');

  const input1 = document.getElementById('input1');
  const input2 = document.getElementById('input2');
  const input3 = document.getElementById('input3');

  const result1El = document.getElementById('result1');
  const result2El = document.getElementById('result2');

  function toNumber(val) {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : 0;
  }

  function format(val) {
    // Keep two decimals like your original
    return Number(val).toFixed(2);
  }

  function calculate() {
    const a = toNumber(input1.value);
    const b = toNumber(input2.value);
    const c = toNumber(input3.value);

    const sum = a + b + c;       // Result 1: Sum
    const formula = a * b - c;   // Result 2: (a * b) - c

    result1El.textContent = format(sum);
    result2El.textContent = format(formula);
  }

  function resetAll() {
    input1.value = '';
    input2.value = '';
    input3.value = '';
    result1El.textContent = '-';
    result2El.textContent = '-';
    input1.focus();
  }

  // Submit calculates (also works with Enter key)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  // Reset button
  resetBtn.addEventListener('click', resetAll);

  // Optional: Auto-calc on input changes (uncomment to enable)
  // [input1, input2, input3].forEach(inp =>
  //   inp.addEventListener('input', calculate)
  // );
})();
