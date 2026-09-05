"use strict";
(function(){
  const originalBuild = window.buildCalculationSteps;

  function numText(value){
    const n = Number(value);
    return Number.isFinite(n) ? String(+n.toPrecision(12)) : String(value);
  }

  function productSteps(formula, result){
    const source = String(formula || "").trim();
    const match = source.match(/^Π\s*X\s*=\s*(-?\d+)\s*\.\.\.\s*(-?\d+)\s*\((.*)\)$/i);
    if(!match) return null;

    const lower = Number(match[1]);
    const upper = Number(match[2]);
    const body = match[3].trim();
    if(!Number.isInteger(lower) || !Number.isInteger(upper) || upper < lower || upper - lower > 50) return null;

    const terms = [];
    for(let x = lower; x <= upper; x++){
      let value;
      try { value = safeEval(body, x); }
      catch { return null; }
      if(!Number.isFinite(value)) return null;
      terms.push({x, value});
    }

    const expanded = terms.map(t => numText(t.value)).join(" × ");
    const progressive = [];
    let acc = 1;
    for(const term of terms){
      acc *= term.value;
      progressive.push(numText(acc));
    }

    const substitutions = terms.map(t => `X = ${t.x} → ${body.replace(/\bX\b/gi, String(t.x))} = ${numText(t.value)}`).join("<br>");
    const progressiveText = terms.length > 1
      ? terms.slice(1).map((t, i) => `${progressive[i]} × ${numText(t.value)} = ${progressive[i+1]}`).join("<br>")
      : `Produto com um único termo = ${numText(terms[0].value)}`;

    return [
      {title:"Expressão original", html:stepMath(source)},
      {title:"Identifique os limites do produtório", html:`<p>O índice X varia de <strong>${lower}</strong> até <strong>${upper}</strong>.</p>`},
      {title:"Substitua X em cada termo", html:`<p>${substitutions}</p>`},
      {title:"Expanda o produtório", html:stepMath(expanded)},
      {title:"Multiplique os termos em sequência", html:`<p>${progressiveText}</p>`},
      {title:"Resultado final", html:stepMath(numText(result))}
    ];
  }

  window.buildCalculationSteps = function(formula, result, symbolic){
    const product = productSteps(formula, result);
    if(product) return product;
    return originalBuild(formula, result, symbolic);
  };
})();