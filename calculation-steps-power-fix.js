"use strict";
(function(){
  const originalBuild = window.buildCalculationSteps;

  function numText(value){
    const n = Number(value);
    return Number.isFinite(n) ? String(+n.toPrecision(12)) : String(value);
  }
  function fracHtml(num,den){
    return `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;overflow:visible"><span style="padding:0 .18em .08em;border-bottom:1.5px solid currentColor">${num}</span><span style="padding:.08em .18em 0">${den}</span></span>`;
  }
  function mathHtml(html){
    return `<div style="font-size:clamp(1.05rem,4.2vw,1.35rem);line-height:1.75;margin:.35rem 0;overflow:visible;white-space:normal">${html}</div>`;
  }

  function powerSteps(formula, result){
    const source = String(formula || "").trim();
    const normalized = source.replace(/⁻/g,"-").replace(/¹/g,"1").replace(/²/g,"2").replace(/³/g,"3");
    const match = normalized.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*\)?\s*\^\s*\(?\s*([+-]?\d+)\s*\)?$/);
    if(!match) return null;

    const base = Number(match[1]);
    const exponent = Number(match[2]);
    if(!Number.isFinite(base) || !Number.isInteger(exponent)) return null;

    const finalValue = Number(result);
    if(!Number.isFinite(finalValue)) return null;

    if(exponent < 0){
      const positiveExponent = Math.abs(exponent);
      if(base === 0) return null;
      const denominator = Math.pow(base, positiveExponent);
      const baseText = numText(base), expText = numText(positiveExponent), denominatorText = numText(denominator);
      const originalHtml = `${baseText}<sup>−${expText}</sup>`;
      const reciprocalHtml = fracHtml("1",`${baseText}<sup>${expText}</sup>`);
      const evaluatedFraction = fracHtml("1",denominatorText);
      const steps = [
        {title:"Expressão original", html:mathHtml(originalHtml)},
        {title:"Use a propriedade do expoente negativo", html:`<p>Um expoente negativo indica o inverso da potência correspondente:</p>${mathHtml(`a<sup>−n</sup> = ${fracHtml("1","a<sup>n</sup>")}`)}`},
        {title:"Aplique a propriedade", html:mathHtml(`${originalHtml} = ${reciprocalHtml}`)}
      ];
      if(positiveExponent === 1){
        steps.push({title:"Calcule a potência do denominador", html:mathHtml(`${baseText}<sup>1</sup> = ${baseText}`)});
      }else if(positiveExponent <= 10){
        const factors = Array(positiveExponent).fill(baseText).join(" × ");
        steps.push({title:"Calcule a potência do denominador", html:mathHtml(`${baseText}<sup>${expText}</sup> = ${factors} = ${denominatorText}`)});
      }else{
        steps.push({title:"Calcule a potência do denominador", html:mathHtml(`${baseText}<sup>${expText}</sup> = ${denominatorText}`)});
      }
      steps.push({title:"Substitua no inverso", html:mathHtml(`${reciprocalHtml} = ${evaluatedFraction}`)});
      steps.push({title:"Efetue a divisão", html:mathHtml(`${evaluatedFraction} = ${numText(finalValue)}`)});
      steps.push({title:"Portanto, o resultado é", html:mathHtml(numText(finalValue))});
      return steps;
    }

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
