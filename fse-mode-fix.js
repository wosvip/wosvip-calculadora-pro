(() => {
  const key = document.querySelector('#scientificKeys button[data-primary-label="x↔E"]');
  const shiftKey = document.querySelector('.shift-key');
  const screen = document.querySelector('#screen');
  if (!key || !shiftKey || !screen) return;

  const originalClick = key.onclick;
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
    const exp = Number(exponent);
    return `${localizeDecimal(trimMantissa(mantissa))}E${exp >= 0 ? '+' : ''}${exp}`;
  }

  function formatEngineering(value) {
    if (value === 0) return '0E+0';
    const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
    const mantissa = value / (10 ** exponent);
    return `${localizeDecimal(trimMantissa(mantissa))}E${exponent >= 0 ? '+' : ''}${exponent}`;
  }

  function restoreNormalDisplay() {
    if (typeof window.updateDisplay === 'function') {
      window.updateDisplay();
    }
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

    if (fseMode === 'FIX') restoreNormalDisplay();
    else applyFseToScreen();
  }

  // Replace the original onclick only for this key. When SHIFT has changed the
  // visible face to FSE, consume that click here and never call the original
  // `sci` action. Therefore FSE changes presentation only; it cannot write
  // exponential notation into `expr` or move the edit caret.
  key.onclick = event => {
    if (key.textContent.trim() === 'FSE') {
      event.preventDefault();
      event.stopPropagation();
      shiftKey.click(); // disarm SHIFT and restore the primary key faces
      cycleFseMode();
      return false;
    }

    return typeof originalClick === 'function'
      ? originalClick.call(key, event)
      : undefined;
  };

  // Reapply the selected presentation after other calculator operations, but
  // never modify the expression itself.
  document.addEventListener('click', event => {
    if (event.target.closest('button') === key) return;
    setTimeout(applyFseToScreen, 0);
  });
  document.addEventListener('keydown', () => setTimeout(applyFseToScreen, 0));

  if (fseMode !== 'FIX') setTimeout(applyFseToScreen, 0);
})();