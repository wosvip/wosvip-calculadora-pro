(() => {
  const equalKey = document.querySelector('#numberKeys button[data-action="equal"]');
  if (!equalKey) return;

  let reuseConfirmedResult = false;

  const unaryBuilders = {
    sin: value => `sin(${value})`,
    cos: value => `cos(${value})`,
    tan: value => `tan(${value})`,
    asin: value => `asin(${value})`,
    acos: value => `acos(${value})`,
    atan: value => `atan(${value})`,
    sqrt: value => `√(${value})`,
    cbrt: value => `∛(${value})`,
    inv: value => `1/(${value})`,
    sq: value => `(${value})^2`,
    cube: value => `(${value})^3`,
    ln: value => `ln(${value})`,
    log: value => `log(${value})`,
    pow10: value => `10^(${value})`,
    powE: value => `e^(${value})`,
    absolute: value => `abs(${value})`,
    factorial: value => `(${value})!`
  };

  function currentAction(button) {
    return shiftActive && button.dataset.secondaryAction
      ? button.dataset.secondaryAction
      : button.dataset.action;
  }

  function reuseValueWith(action) {
    const build = unaryBuilders[action];
    if (!build) return false;

    const value = String(expr || '').trim();
    if (!value) return false;

    expr = build(value);
    cursorPosition = expr.length;
    lastFormula = '';
    resultShown = false;
    reuseConfirmedResult = false;

    if (shiftActive) setShift(false);
    updateDisplay();
    return true;
  }

  // Preserve the existing first '=' behavior. A second '=' pressed while a
  // result is already shown arms that value as the operand of the next unary
  // scientific function.
  const originalEqualClick = equalKey.onclick;
  equalKey.onclick = event => {
    const wasResultShown = resultShown;
    const response = typeof originalEqualClick === 'function'
      ? originalEqualClick.call(equalKey, event)
      : undefined;
    reuseConfirmedResult = wasResultShown && resultShown && !!String(expr || '').trim();
    return response;
  };

  document.querySelectorAll('#scientificKeys button, #numberKeys button').forEach(button => {
    if (button === equalKey) return;
    const originalClick = button.onclick;
    if (typeof originalClick !== 'function') return;

    button.onclick = event => {
      const action = currentAction(button);
      if (reuseConfirmedResult && unaryBuilders[action]) {
        event.preventDefault();
        event.stopPropagation();
        reuseValueWith(action);
        return false;
      }

      const response = originalClick.call(button, event);

      // SHIFT may be used between the confirmation and an inverse/secondary
      // unary function. Any other action means the confirmed reuse was abandoned.
      if (action !== 'shift') reuseConfirmedResult = false;
      return response;
    };
  });
})();
