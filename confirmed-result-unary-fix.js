(() => {
  const equalKey = document.querySelector('#numberKeys button[data-action="equal"]');
  const expressionEl = document.querySelector('#expression');
  if (!equalKey || !expressionEl) return;

  let armedValue = null;

  const unaryBuilders = {
    sin: v => `sin(${v})`, cos: v => `cos(${v})`, tan: v => `tan(${v})`,
    asin: v => `asin(${v})`, acos: v => `acos(${v})`, atan: v => `atan(${v})`,
    sqrt: v => `√(${v})`, cbrt: v => `∛(${v})`, inv: v => `1/(${v})`,
    sq: v => `(${v})^2`, cube: v => `(${v})^3`, ln: v => `ln(${v})`,
    log: v => `log(${v})`, pow10: v => `10^(${v})`, powE: v => `e^(${v})`,
    absolute: v => `abs(${v})`, factorial: v => `(${v})!`
  };

  function actionOf(button) {
    return shiftActive && button.dataset.secondaryAction
      ? button.dataset.secondaryAction
      : button.dataset.action;
  }

  function plainExpression() {
    return String(expressionEl.textContent || '')
      .replace(/\|/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function armFromCurrentExpression() {
    const value = plainExpression();
    if (!value || value === 'Pronto') return false;
    armedValue = value;
    return true;
  }

  const originalEqualClick = equalKey.onclick;
  equalKey.onclick = event => {
    // The app already uses '=' to place/confirm the current result in expr.
    // If the visible expression is already just that confirmed value, arm it
    // BEFORE the original handler can change any internal result flag.
    const before = plainExpression();
    const shouldArm = !!before && before !== 'Pronto' && !/[+*/^()]|(?<!^)-/.test(before);
    const response = typeof originalEqualClick === 'function'
      ? originalEqualClick.call(equalKey, event)
      : undefined;
    if (shouldArm) armFromCurrentExpression();
    return response;
  };

  document.querySelectorAll('#scientificKeys button, #numberKeys button').forEach(button => {
    if (button === equalKey) return;
    const originalClick = button.onclick;
    if (typeof originalClick !== 'function') return;

    button.onclick = event => {
      const action = actionOf(button);
      const build = unaryBuilders[action];

      if (armedValue !== null && build) {
        event.preventDefault();
        event.stopPropagation();
        const value = armedValue;
        armedValue = null;

        expr = build(value);
        cursorPosition = expr.length;
        lastFormula = '';
        resultShown = false;
        structuredEntry = null;
        if (shiftActive) setShift(false);
        updateDisplay();
        return false;
      }

      const response = originalClick.call(button, event);
      if (action !== 'shift') armedValue = null;
      return response;
    };
  });
})();
