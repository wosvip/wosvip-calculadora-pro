(() => {
  'use strict';

  // O motor principal já consulta angleMode dentro de safeEval().
  // O problema era que trocar DEG/RAD não provocava nova avaliação
  // da expressão que já estava no visor. Este bridge força apenas a
  // atualização do preview depois que o handler original conclui a troca.
  function refreshAngleCalculation() {
    if (typeof window.press === 'function') {
      window.press('cursorRight');
    }
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element
      ? event.target.closest('[data-angle], #degBtn, #radBtn')
      : null;

    if (!target) return;

    // Espera o onclick original salvar angleMode/localStorage e atualizar
    // o indicador. Em seguida recalcula a mesma expressão no novo modo.
    setTimeout(refreshAngleCalculation, 0);
  });
})();
