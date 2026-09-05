(() => {
  const key = document.querySelector('#scientificKeys button[data-primary-label="x↔E"]');
  const shiftKey = document.querySelector('.shift-key');
  const screen = document.querySelector('#screen');
  if (!key || !shiftKey || !screen) return;

  const modes = ['FIX', 'SCI', 'ENG'];
  let fseMode = localStorage.getItem('wosvipFseMode') || 'FIX';
  let xeScientific = false;
  if (!modes.includes(fseMode)) fseMode = 'FIX';

  key.dataset.secondaryLabel = 'FSE';
  key.title = `x↔E • FSE atual: ${fseMode}`;

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
    if (typeof window.updateDisplay === 'function') window.updateDisplay();
  }

  function applyChosenPresentation() {
    const value = parseDisplayedNumber(screen.value);
    if (!Number.isFinite(value)) return;

    if (xeScientific) {
      screen.value = formatScientific(value);
      return;
    }

    if (fseMode === 'SCI') screen.value = formatScientific(value);
    else if (fseMode === 'ENG') screen.value = formatEngineering(value);
  }

  function cycleFseMode() {
    xeScientific = false;
    const index = modes.indexOf(fseMode);
    fseMode = modes[(index + 1) % modes.length];
    localStorage.setItem('wosvipFseMode', fseMode);
    key.title = `x↔E • FSE atual: ${fseMode}`;

    restoreNormalDisplay();
    if (fseMode !== 'FIX') applyChosenPresentation();
  }

  function toggleXeScientific() {
    xeScientific = !xeScientific;
    restoreNormalDisplay();
    if (xeScientific) applyChosenPresentation();
    else if (fseMode !== 'FIX') applyChosenPresentation();
  }

  // This key is fully routed here so neither primary x↔E nor SHIFT+FSE can
  // execute the legacy `sci` action, which rewrote the internal expression.
  key.onclick = event => {
    event.preventDefault();
    event.stopPropagation();

    if (key.textContent.trim() === 'FSE') {
      shiftKey.click();
      cycleFseMode();
      return false;
    }

    toggleXeScientific();
    return false;
  };

  // Any normal calculator edit leaves x↔E one-shot presentation and preserves
  // the persistent FSE mode. Only the screen is formatted; `expr` is untouched.
  document.addEventListener('click', event => {
    if (event.target.closest('button') === key) return;
    xeScientific = false;
    setTimeout(() => {
      if (fseMode !== 'FIX') applyChosenPresentation();
    }, 0);
  });

  document.addEventListener('keydown', () => {
    xeScientific = false;
    setTimeout(() => {
      if (fseMode !== 'FIX') applyChosenPresentation();
    }, 0);
  });

  if (fseMode !== 'FIX') setTimeout(applyChosenPresentation, 0);
})();