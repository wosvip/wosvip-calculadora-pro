(() => {
  if (typeof press !== 'function') return;

  const originalPress = press;
  const unaryBuilders = {
    sin: v => `sin(${v})`,
    cos: v => `cos(${v})`,
    tan: v => `tan(${v})`,
    asin: v => `asin(${v})`,
    acos: v => `acos(${v})`,
    atan: v => `atan(${v})`,
    sqrt: v => `√(${v})`,
    cbrt: v => `∛(${v})`,
    inv: v => `1/(${v})`,
    sq: v => `(${v})^2`,
    cube: v => `(${v})^3`,
    ln: v => `ln(${v})`,
    log: v => `log(${v})`,
    pow10: v => `10^(${v})`,
    powE: v => `e^(${v})`,
    absolute: v => `abs(${v})`,
    factorial: v => `(${v})!`
  };

  press = function(action) {
    const build = unaryBuilders[action];

    if (resultShown && build && !structuredEntry) {
      const value = String(expr || '').trim();
      if (value) {
        expr = build(value);
        cursorPosition = expr.length;
        lastFormula = '';
        resultShown = false;
        pendingPercentage = null;
        updateDisplay();
        return;
      }
    }

    return originalPress(action);
  };
})();
