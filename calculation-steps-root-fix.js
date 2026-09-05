"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;
  function num(v){const n=Number(v);return Number.isFinite(n)?String(+n.toPrecision(12)):String(v);}
  function math(s){return `<div style="font-size:clamp(1.08rem,4.2vw,1.4rem);line-height:1.65;margin:.35rem 0;overflow:visible">${s}</div>`;}
  function rootSteps(formula,result){
    const source=String(formula||"").trim();
    const m=source.match(/^√\s*\(\s*(-?\d+(?:[.,]\d+)?)\s*\)$/)||source.match(/^√\s*(-?\d+(?:[.,]\d+)?)$/);
    if(!m)return null;
    const radicand=Number(m[1].replace(",",".")),value=Number(result);
    if(!Number.isFinite(radicand)||!Number.isFinite(value)||radicand<0)return null;
    const r=num(radicand),v=num(value),integerRoot=Math.sqrt(radicand),exact=Number.isInteger(integerRoot);
    if(exact){const k=num(integerRoot);return [
      {title:"Expressão original",html:math(`√${r}`)},
      {title:"Interprete a raiz quadrada",html:`<p>A raiz quadrada de <strong>${r}</strong> é o número que, multiplicado por ele mesmo, resulta em <strong>${r}</strong>.</p>${math(`√${r} = ?`)}`},
      {title:"Encontre o número",html:math(`${k} × ${k} = ${r}`)},
      {title:"Verifique",html:math(`${k}<sup>2</sup> = ${r}`)},
      {title:"Portanto, o resultado é",html:math(`√${r} = ${k}`)}
    ];}
    const low=Math.floor(integerRoot),high=low+1;
    return [
      {title:"Expressão original",html:math(`√${r}`)},
      {title:"Interprete a raiz quadrada",html:`<p>Procuramos um número cujo quadrado seja <strong>${r}</strong>.</p>`},
      {title:"Localize a raiz entre dois quadrados",html:math(`${low}<sup>2</sup> = ${low*low} &lt; ${r} &lt; ${high*high} = ${high}<sup>2</sup>`)},
      {title:"A raiz não é inteira",html:`<p>Como <strong>${r}</strong> não é um quadrado perfeito, mantemos <strong>√${r}</strong> como forma exata e calculamos sua aproximação decimal.</p>`},
      {title:"Aproximação decimal",html:math(`√${r} ≈ ${v}`)},
      {title:"Portanto, o resultado é",html:math(`${v}`)}
    ];
  }
  window.buildCalculationSteps=function(formula,result,symbolic){const steps=rootSteps(formula,result);if(steps)return steps;return previousBuild(formula,result,symbolic);};
})();
