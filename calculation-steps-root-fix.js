"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;
  function num(v){const n=Number(v);return Number.isFinite(n)?String(+n.toPrecision(12)):String(v);}
  function math(s){return `<div style="font-size:clamp(1.08rem,4.2vw,1.4rem);line-height:1.65;margin:.35rem 0;overflow:visible;max-height:none;white-space:normal">${s}</div>`;}
  function frac(a,b){return `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;overflow:visible;max-height:none"><span style="padding:0 .16em .07em;border-bottom:1.4px solid currentColor">${a}</span><span style="padding:.07em .16em 0">${b}</span></span>`;}
  function rootSymbol(index,radicand){return index===2?`√${radicand}`:`<span style="display:inline-flex;align-items:flex-start;overflow:visible;max-height:none"><sup style="font-size:.58em;line-height:1;margin-right:-.08em">${index}</sup><span>√${radicand}</span></span>`;}
  function parseRoot(source){
    const s=String(source||"").trim();
    let m=s.match(/^root\(\s*(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)\s*\)$/i);
    if(m)return {index:Number(m[1].replace(",",".")),radicand:Number(m[2].replace(",","."))};
    m=s.match(/^√\s*\(\s*(-?\d+(?:[.,]\d+)?)\s*\)$/)||s.match(/^√\s*(-?\d+(?:[.,]\d+)?)$/);
    if(m)return {index:2,radicand:Number(m[1].replace(",","."))};
    m=s.match(/^(\d+)\s*√\s*\(\s*(-?\d+(?:[.,]\d+)?)\s*\)$/)||s.match(/^(\d+)\s*√\s*(-?\d+(?:[.,]\d+)?)$/);
    if(m)return {index:Number(m[1]),radicand:Number(m[2].replace(",","."))};
    return null;
  }
  function rootSteps(formula,result){
    const parsed=parseRoot(formula);if(!parsed)return null;
    const index=parsed.index,radicand=parsed.radicand,value=Number(result);
    if(!Number.isInteger(index)||index<2||!Number.isFinite(radicand)||!Number.isFinite(value))return null;
    if(radicand<0&&index%2===0)return null;
    const r=num(radicand),v=num(value),root=rootSymbol(index,r);
    if(index===2){
      const integerRoot=Math.sqrt(radicand),exact=Number.isInteger(integerRoot);
      if(exact){const k=num(integerRoot);return [
        {title:"Expressão original",html:math(root)},
        {title:"Interprete a raiz quadrada",html:`<div style="line-height:1.6">A raiz quadrada de <strong>${r}</strong> é o número que, multiplicado por ele mesmo, resulta em <strong>${r}</strong>.</div>${math(`${root} = ?`)}`},
        {title:"Encontre o número",html:math(`${k} × ${k} = ${r}`)},
        {title:"Verifique",html:math(`${k}<sup>2</sup> = ${r}`)},
        {title:"Portanto, o resultado é",html:math(`${root} = ${k}`)}
      ];}
      const low=Math.floor(integerRoot),high=low+1;
      return [
        {title:"Expressão original",html:math(root)},
        {title:"Interprete a raiz quadrada",html:`<div style="line-height:1.6">Procuramos um número cujo quadrado seja <strong>${r}</strong>.</div>`},
        {title:"Localize a raiz entre dois quadrados",html:math(`${low}<sup>2</sup> = ${low*low} &lt; ${r} &lt; ${high*high} = ${high}<sup>2</sup>`)},
        {title:"A raiz não é inteira",html:`<div style="line-height:1.6">Como <strong>${r}</strong> não é um quadrado perfeito, mantemos <strong>√${r}</strong> como forma exata e calculamos sua aproximação decimal.</div>`},
        {title:"Aproximação decimal",html:math(`${root} ≈ ${v}`)},
        {title:"Portanto, o resultado é",html:math(v)}
      ];
    }
    const absRoot=Math.pow(Math.abs(radicand),1/index),signedRoot=radicand<0?-absRoot:absRoot;
    const rounded=Math.round(signedRoot),exact=Math.abs(Math.pow(rounded,index)-radicand)<1e-10;
    const baseLow=Math.floor(absRoot),baseHigh=baseLow+1;
    const low=radicand<0?-baseHigh:baseLow,high=radicand<0?-baseLow:baseHigh;
    const powerForm=`${r}<sup>${frac("1",index)}</sup>`;
    const steps=[
      {title:"Expressão original",html:math(root)},
      {title:"Use a propriedade da raiz n-ésima",html:math(`${rootSymbol("n","a")} = a<sup>${frac("1","n")}</sup>`)},
      {title:"Transforme a raiz em potência de expoente fracionário",html:math(`${root} = ${powerForm}`)}
    ];
    if(exact){
      const k=num(rounded);
      steps.push({title:"Reconheça a potência perfeita",html:math(`${k}<sup>${index}</sup> = ${r}`)});
      steps.push({title:"Portanto, o resultado é",html:math(`${root} = ${k}`)});
      return steps;
    }
    steps.push({title:`Compare com potências de ordem ${index}`,html:math(`${low}<sup>${index}</sup> = ${num(Math.pow(low,index))} &lt; ${r} &lt; ${num(Math.pow(high,index))} = ${high}<sup>${index}</sup>`)});
    steps.push({title:"Localize o resultado",html:math(`${low} &lt; ${root} &lt; ${high}`)});
    steps.push({title:"A raiz não é exata",html:`<div style="line-height:1.6">Como <strong>${r}</strong> não é uma potência ${index}-ésima perfeita, mantemos ${root} como forma exata e calculamos sua aproximação decimal.</div>`});
    steps.push({title:"Aproximação decimal",html:math(`${root} ≈ ${v}`)});
    steps.push({title:"Portanto, o resultado é",html:math(v)});
    return steps;
  }
  window.buildCalculationSteps=function(formula,result,symbolic){const steps=rootSteps(formula,result);if(steps)return steps;return previousBuild(formula,result,symbolic);};
})();
