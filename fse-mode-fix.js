(() => {
  const key = document.querySelector('#scientificKeys button[data-primary-label="x↔E"]');
  const shiftKey = document.querySelector('.shift-key');
  const screen = document.querySelector('#screen');
  if (!key || !shiftKey || !screen) return;

  const modes = ['FIX', 'SCI', 'ENG'];
  let fseMode = localStorage.getItem('wosvipFseMode') || 'FIX';
  if (!modes.includes(fseMode)) fseMode = 'FIX';

  key.dataset.secondaryLabel = 'FSE';
  key.title = `FSE • modo atual: ${fseMode}`;

  function parseDisplayedNumber(text) {
    let value = String(text || '').trim();
    if (!value) return NaN;

    value = value
      .replace(/R\$|US\$|€|£|\$/g, '')
      .replace(/\s+/g, '');

    const numericFormat = localStorage.getItem('wosvipNumberFormat') || 'BR';
    if (numericFormat === 'BR') {
      value = value.replace(/\./g, '').replace(',', '.');
    } else {
      value = value.replace(/,/g, '');
    }

    return Number(value);
  }

  function localizeDecimal(text) {
    return (localStorage.getItem('wosvipNumberFormat') || 'BR') === 'BR'
      ? String(text).replace('.', ',')
      : String(text);
  }

  function trimMantissa(text) {
    const n = Number(text);
    if (!Number.isFinite(n)) return text;
    return String(+n.toPrecision(12));
  }

  function formatScientific(value) {
    if (value === 0) return '0E+0';
    const [mantissa, exponent] = value.toExponential(10).split('e');
    return `${localizeDecimal(trimMantissa(mantissa))}E${Number(exponent) >= 0 ? '+' : ''}${Number(exponent)}`;
  }

  function formatEngineering(value) {
    if (value === 0) return '0E+0';
    const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
    const mantissa = value / (10 ** exponent);
    return `${localizeDecimal(trimMantissa(mantissa))}E${exponent >= 0 ? '+' : ''}${exponent}`;
  }

  function applyFseToScreen() {
    if (fseMode === 'FIX') return;
    const value = parseDisplayedNumber(screen.value);
    if (!Number.isFinite(value)) return;
    screen.value = fseMode === 'SCI'
      ? formatScientific(value)
      : formatEngineering(value);
  }

  function cycleFseMode() {
    const index = modes.indexOf(fseMode);
    fseMode = modes[(index + 1) % modes.length];
    localStorage.setItem('wosvipFseMode', fseMode);
    key.title = `FSE • modo atual: ${fseMode}`;

    // Rebuild the normal numeric display first when returning to FIX.
    if (fseMode === 'FIX' && typeof window.updateDisplay === 'function') {
      window.updateDisplay();
    } else {
      applyFseToScreen();
    }
  }

  // The current app maps x↔E and SHIFT+FSE to the same "sci" action.
  // Intercept only when the visible key face is FSE (SHIFT armed), disarm
  // SHIFT, and execute the independent display-mode cycle instead.
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button !== key || key.textContent.trim() !== 'FSE') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    shiftKey.click();
    cycleFseMode();
  }, true);

  // Preserve the chosen FSE presentation after normal calculator actions.
  document.addEventListener('click', () => setTimeout(applyFseToScreen, 0));
  document.addEventListener('keydown', () => setTimeout(applyFseToScreen, 0));

  applyFseToScreen();
})();