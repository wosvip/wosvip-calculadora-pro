"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;

  function numberText(value){
    return String(+Number(value).toPrecision(12));
  }

  function parseIntegerMultiplication(formula,result){
    const source=String(formula||"").trim().replace(/−/g,"-");
    const match=source.match(/^([+-]?\d+)\s*[×*]\s*([+-]?\d+)$/);
    if(!match)return null;
    const left=Number(match[1]),right=Number(match[2]),answer=Number(result);
    if(!Number.isSafeInteger(left)||!Number.isSafeInteger(right)||!Number.isSafeInteger(answer)||left*right!==answer)return null;
    return {source,left,right,answer};
  }

  function placeName(position){
    return ["unidades","dezenas","centenas","unidades de milhar","dezenas de milhar","centenas de milhar"][position]||`posição 10<sup>${position}</sup>`;
  }

  function multiplicationSteps(formula,result){
    const data=parseIntegerMultiplication(formula,result);if(!data)return null;
    const {source,left,right,answer}=data;
    const absLeft=Math.abs(left),absRight=Math.abs(right);
    const digits=String(absRight).split("").reverse().map(Number);
    const parts=digits.map((digit,position)=>({digit,position,placeValue:digit*10**position,partial:absLeft*digit*10**position})).filter(part=>part.digit!==0);
    if(!parts.length)parts.push({digit:0,position:0,placeValue:0,partial:0});
    const decomposition=[...parts].reverse().map(part=>numberText(part.placeValue)).join(" + ");
    const partialLines=parts.map(part=>`<p><strong>${placeName(part.position)}:</strong> ${numberText(absLeft)} × ${part.digit}${part.position?` × ${numberText(10**part.position)}`:""} = <strong>${numberText(part.partial)}</strong></p>`).join("");
    const sum=parts.map(part=>numberText(part.partial)).join(" + ");
    const signNegative=(left<0)!==(right<0);
    const signStep=(left<0||right<0)?{title:"Determine o sinal do resultado",html:`<p>Os fatores têm sinais ${signNegative?"diferentes":"iguais"}. Portanto, o resultado é <strong>${signNegative?"negativo":"positivo"}</strong>.</p>`}:null;
    const width=Math.max(String(absLeft).length+2,String(absRight).length+2,String(Math.abs(answer)).length,...parts.map(part=>String(part.partial).length))+2;
    const vertical=[String(absLeft).padStart(width),(`× ${absRight}`).padStart(width),"─".repeat(width),...parts.map(part=>String(part.partial).padStart(width)),"─".repeat(width),String(Math.abs(answer)).padStart(width)].join("\n");
    const steps=[
      {title:"Expressão original",html:stepMath(source)},
      {title:"Separe o segundo fator por valor posicional",html:`<p>${numberText(absRight)} = <strong>${decomposition}</strong></p><p>Agora multiplicaremos ${numberText(absLeft)} por cada parte separadamente.</p>`},
      {title:"Calcule os produtos parciais",html:partialLines},
      {title:"Some os produtos parciais",html:`<p>${sum} = <strong>${numberText(Math.abs(answer))}</strong></p>`},
      {title:"Confira pela conta armada",html:`<pre style="display:block;max-width:100%;overflow:auto;padding:12px 16px;border:1px solid #343941;border-radius:8px;background:#090b0e;color:#fff;font:600 1.15rem/1.45 monospace;text-align:right;width:max-content">${vertical}</pre>`}
    ];
    if(signStep)steps.splice(1,0,signStep);
    steps.push({title:"Portanto, o resultado é",html:stepMath(`${source} = ${numberText(answer)}`)});
    return steps;
  }

  window.buildCalculationSteps=function(formula,result,symbolic){
    const multiplication=multiplicationSteps(formula,result);
    if(multiplication)return multiplication;
    return previousBuild(formula,result,symbolic);
  };
})();
