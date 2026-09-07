"use strict";
(function(){
  const originalBuild = window.buildCalculationSteps;

  function numText(value){
    const n = Number(value);
    return Number.isFinite(n) ? String(+n.toPrecision(12)) : String(value);
  }
  function mathHtml(html){
    return `<div style="font-size:clamp(1.05rem,4.2vw,1.35rem);line-height:1.75;margin:.35rem 0;overflow:visible;white-space:normal">${html}</div>`;
  }
  function inverseTrigSteps(formula,result){
    const source = String(formula || "").trim();
    const m = source.match(/^\s*(asin|acos|atan)\s*\(\s*([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*\)\s*$/i);
    if(!m) return null;
    const fn=m[1].toLowerCase();
    const x=Number(m[2].replace(",","."));
    const answer=Number(result);
    if(!Number.isFinite(x)||!Number.isFinite(answer)) return null;
    if((fn==="asin"||fn==="acos")&&(x < -1 || x > 1)) return null;

    const names={asin:"arco seno",acos:"arco cosseno",atan:"arco tangente"};
    const direct={asin:"sen",acos:"cos",atan:"tan"};
    const symbols={asin:"sin",acos:"cos",atan:"tan"};
    const xText=numText(x), ansText=numText(answer);
    const mode=(typeof angleMode!=="undefined"?angleMode:(localStorage.getItem("wosvipAngleMode")||"DEG"));
    const unit=mode==="RAD"?"radianos":"graus";
    const suffix=mode==="RAD"?" rad":"°";
    const theta=`θ`;
    return [
      {title:"Considere a expressão",html:mathHtml(`${symbols[fn]}<sup>−1</sup>(${xText})`)},
      {title:`Interprete a função inversa`,html:`<p><strong>${names[fn][0].toUpperCase()+names[fn].slice(1)}</strong> procura o ângulo cujo ${direct[fn]} é <strong>${xText}</strong>.</p>${mathHtml(`${direct[fn]}(${theta}) = ${xText}`)}`},
      {title:"Observe o modo angular",html:`<p>A calculadora está em <strong>${mode}</strong>. Portanto, o ângulo será apresentado em <strong>${unit}</strong>.</p>`},
      {title:`Aplique a função ${names[fn]}`,html:mathHtml(`${theta} = ${symbols[fn]}<sup>−1</sup>(${xText})`)},
      {title:"Calcule o ângulo",html:mathHtml(`${theta} ≈ ${ansText}${suffix}`)},
      {title:"Verificação",html:`<p>Aplicando a função trigonométrica direta ao ângulo encontrado, recuperamos aproximadamente o valor original:</p>${mathHtml(`${direct[fn]}(${ansText}${suffix}) ≈ ${xText}`)}`},
      {title:"Portanto, o resultado é",html:mathHtml(`${ansText}${suffix}`)}
    ];
  }

  window.buildCalculationSteps=function(formula,result,symbolic){
    const steps=inverseTrigSteps(formula,result);
    if(steps) return steps;
    return originalBuild(formula,result,symbolic);
  };
})();
