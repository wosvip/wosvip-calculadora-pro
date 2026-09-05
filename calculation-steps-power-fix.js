"use strict";
(function(){
  const originalBuild = window.buildCalculationSteps;

  function numText(value){
    const n = Number(value);
    return Number.isFinite(n) ? String(+n.toPrecision(12)) : String(value);
  }

  function powerSteps(formula, result){
    const source = String(formula || "").trim();
    const match = source.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*\)?\s*\^\s*(\d+)$/);
    if(!match) return null;

    const base = Number(match[1]);
    const exponent = Number(match[2]);
    if(!Number.isFinite(base) || !Number.isInteger(exponent) || exponent < 0) return null;

    const finalValue = Number(result);
    if(!Number.isFinite(finalValue)) return null;

    if(exponent === 0){
      return [
        {title:"Expressão original", html:stepMath(source)},
        {title:"Use a propriedade do expoente zero", html:`<p>Todo número diferente de zero elevado a 0 é igual a 1.</p>${stepMath(source + " = 1")}`},
        {title:"Resultado final", html:stepMath("1")}
      ];
    }

    if(exponent === 1){
      return [
        {title:"Expressão original", html:stepMath(source)},
        {title:"Use a propriedade do expoente 1", html:stepMath(source + " = " + numText(base))},
        {title:"Resultado final", html:stepMath(numText(finalValue))}
      ];
    }

    if(exponent <= 10){
      const factors = Array(exponent).fill(numText(base)).join(" × ");
      return [
        {title:"Expressão original", html:stepMath(source)},
        {title:"Expanda a potência como multiplicação repetida", html:stepMath(factors)},
        {title:"Efetue a multiplicação", html:stepMath(factors + " = " + numText(finalValue))},
        {title:"Resultado final", html:stepMath(numText(finalValue))}
      ];
    }

    return [
      {title:"Expressão original", html:stepMath(source)},
      {title:"Interprete a potência", html:`<p>O número <strong>${numText(base)}</strong> deve ser multiplicado por ele mesmo <strong>${exponent}</strong> vezes.</p>`},
      {title:"Calcule a potência", html:stepMath(source + " = " + numText(finalValue))},
      {title:"Resultado final", html:stepMath(numText(finalValue))}
    ];
  }

  window.buildCalculationSteps = function(formula, result, symbolic){
    const power = powerSteps(formula, result);
    if(power) return power;
    return originalBuild(formula, result, symbolic);
  };
})();
