"use strict";
(function(){
  const originalBuild = window.buildCalculationSteps;

  function numText(value){
    const n = Number(value);
    return Number.isFinite(n) ? String(+n.toPrecision(12)) : String(value);
  }
  function localizedNumText(value){
    const text=numText(value);
    const separator=typeof numberFormat!=="undefined"&&numberFormat==="BR"?",":".";
    return text.replace(".",separator);
  }
  function mathHtml(html){
    return `<div style="font-size:clamp(1.05rem,4.2vw,1.35rem);line-height:1.75;margin:.35rem 0;overflow:visible;white-space:normal">${html}</div>`;
  }
  function currentMode(){
    return typeof angleMode!=="undefined"?angleMode:(localStorage.getItem("wosvipAngleMode")||"DEG");
  }
  function notableAngle(degrees){
    const normalized=((degrees%360)+360)%360;
    const values={
      0:{reference:0,sin:"0",cos:"1",tan:"0",triangle:"No círculo trigonométrico, o ponto do ângulo 0° é (1, 0)."},
      30:{reference:30,sin:"1/2",cos:"√3/2",tan:"√3/3",triangle:"No triângulo 30°–60°–90°, os lados proporcionais são 1, √3 e 2."},
      45:{reference:45,sin:"√2/2",cos:"√2/2",tan:"1",triangle:"No triângulo retângulo de 45°, os dois catetos têm a mesma medida. Tomando ambos iguais a 1, a hipotenusa vale √2."},
      60:{reference:60,sin:"√3/2",cos:"1/2",tan:"√3",triangle:"No triângulo 30°–60°–90°, os lados proporcionais são 1, √3 e 2."},
      90:{reference:90,sin:"1",cos:"0",tan:null,triangle:"No círculo trigonométrico, o ponto do ângulo 90° é (0, 1)."}
    };
    const key=Object.keys(values).map(Number).find(value=>Math.abs(normalized-value)<1e-8);
    return key===undefined?null:values[key];
  }
  function directTrigSteps(formula,result){
    const source=String(formula||"").trim();
    const match=source.match(/^\s*(sin|cos|tan)\s*\(\s*([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*\)\s*$/i);
    if(!match)return null;
    const fn=match[1].toLowerCase(),input=Number(match[2].replace(",",".")),answer=Number(result),mode=currentMode();
    if(!Number.isFinite(input)||!Number.isFinite(answer))return null;
    const names={sin:"seno",cos:"cosseno",tan:"tangente"},symbols={sin:"sen",cos:"cos",tan:"tan"};
    const inputText=localizedNumText(input),answerText=localizedNumText(answer),suffix=mode==="RAD"?" rad":"°";
    const degrees=mode==="DEG"?input:input*180/Math.PI,notable=notableAngle(degrees);
    const steps=[
      {title:"Expressão original",html:mathHtml(`${symbols[fn]}(${inputText}${suffix})`)},
      {title:"Observe o modo angular",html:`<p>A calculadora está em <strong>${mode}</strong>. Portanto, ${inputText} representa <strong>${mode==="DEG"?"graus":"radianos"}</strong>.</p>${mode==="RAD"?mathHtml(`${inputText} rad × 180/π ≈ ${localizedNumText(degrees)}°`):""}`}
    ];
    if(fn==="tan"){
      steps.push({title:"Use a definição da tangente",html:`<p>A tangente é a razão entre o seno e o cosseno do mesmo ângulo:</p>${mathHtml("tan(θ) = sen(θ) / cos(θ)")}`});
    }else{
      const ratio=fn==="sin"?"cateto oposto / hipotenusa":"cateto adjacente / hipotenusa";
      steps.push({title:`Use a definição do ${names[fn]}`,html:`<p>Em um triângulo retângulo:</p>${mathHtml(`${symbols[fn]}(θ) = ${ratio}`)}`});
    }
    if(notable&&notable[fn]!==null){
      steps.push({title:"Reconheça o ângulo notável",html:`<p>${notable.triangle}</p>`});
      if(fn==="tan"){
        steps.push({title:"Substitua o seno e o cosseno",html:mathHtml(`tan(${inputText}${suffix}) = (${notable.sin}) / (${notable.cos})`)});
        steps.push({title:"Simplifique a razão",html:mathHtml(`(${notable.sin}) / (${notable.cos}) = ${notable.tan}`)});
      }else{
        const exact=notable[fn];
        steps.push({title:"Substitua as medidas na razão",html:mathHtml(`${symbols[fn]}(${inputText}${suffix}) = ${exact}`)});
      }
      steps.push({title:"Compare a forma exata e a decimal",html:mathHtml(`${notable[fn]} = ${answerText}`)});
    }else{
      steps.push({title:"Localize o ângulo no círculo trigonométrico",html:`<p>O ${names[fn]} é obtido pela posição do ângulo no círculo unitário${fn==="sin"?", usando a coordenada vertical.":fn==="cos"?", usando a coordenada horizontal.":" e pela razão entre as coordenadas vertical e horizontal."}</p>`});
      steps.push({title:"Calcule a aproximação decimal",html:mathHtml(`${symbols[fn]}(${inputText}${suffix}) ≈ ${answerText}`)});
    }
    steps.push({title:"Portanto, o resultado é",html:mathHtml(answerText)});
    return steps;
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
    const xText=localizedNumText(x), ansText=localizedNumText(answer);
    const mode=currentMode();
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
    const direct=directTrigSteps(formula,result);
    if(direct)return direct;
    const steps=inverseTrigSteps(formula,result);
    if(steps) return steps;
    return originalBuild(formula,result,symbolic);
  };
})();
