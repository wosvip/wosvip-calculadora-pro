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

  function parseIntegerDivision(formula,result){
    const source=String(formula||"").trim().replace(/−/g,"-");
    const match=source.match(/^([+-]?\d+)\s*[÷/]\s*([+-]?\d+)$/);
    if(!match)return null;
    const dividend=Number(match[1]),divisor=Number(match[2]),answer=Number(result);
    if(!Number.isSafeInteger(dividend)||!Number.isSafeInteger(divisor)||divisor===0||!Number.isFinite(answer))return null;
    return {source,dividend,divisor,answer};
  }

  function greatestCommonDivisor(a,b){
    while(b){const remainder=a%b;a=b;b=remainder;}
    return a;
  }

  function decimalDivision(remainder,divisor,maxDigits=12){
    const rows=[],seen=new Map();let repeatStart=-1;
    for(let position=0;remainder!==0&&position<maxDigits;position++){
      if(seen.has(remainder)){repeatStart=seen.get(remainder);break;}
      seen.set(remainder,position);
      const broughtDown=remainder*10,digit=Math.floor(broughtDown/divisor),product=digit*divisor,nextRemainder=broughtDown-product;
      rows.push({position,broughtDown,digit,product,remainder:nextRemainder});
      remainder=nextRemainder;
    }
    return {rows,repeatStart,finished:remainder===0};
  }

  function divisionSteps(formula,result){
    const data=parseIntegerDivision(formula,result);if(!data)return null;
    const {source,dividend,divisor,answer}=data,absDividend=Math.abs(dividend),absDivisor=Math.abs(divisor);
    const integerPart=Math.floor(absDividend/absDivisor),initialProduct=integerPart*absDivisor,initialRemainder=absDividend-initialProduct;
    const gcd=initialRemainder?greatestCommonDivisor(initialRemainder,absDivisor):1;
    const simplifiedNumerator=initialRemainder/gcd,simplifiedDenominator=absDivisor/gcd;
    const decimal=decimalDivision(initialRemainder,absDivisor);
    const digits=decimal.rows.map(row=>row.digit).join("");
    const decimalPreview=digits?`${integerPart},${digits}${decimal.finished?"":"…"}`:String(integerPart);
    const rowsHtml=decimal.rows.length?decimal.rows.map((row,index)=>`<tr><td>${index+1}ª</td><td>${row.broughtDown}</td><td>${row.digit}</td><td>${row.digit} × ${absDivisor} = ${row.product}</td><td>${row.remainder}</td></tr>`).join(""):"";
    const signNegative=(dividend<0)!==(divisor<0);
    const steps=[
      {title:"Expressão original",html:stepMath(source)},
      {title:"Identifique o dividendo e o divisor",html:`<p><strong>Dividendo:</strong> ${absDividend}, o número que será dividido.</p><p><strong>Divisor:</strong> ${absDivisor}, o número pelo qual dividiremos.</p>`},
      {title:"Encontre a parte inteira do quociente",html:`<p>O ${absDivisor} cabe <strong>${integerPart} vez${integerPart===1?"":"es"}</strong> em ${absDividend}.</p><p>${absDivisor} × ${integerPart} = ${initialProduct}</p><p>${absDividend} − ${initialProduct} = <strong>${initialRemainder}</strong> de resto.</p><p>Assim: <strong>${absDividend} = ${absDivisor} × ${integerPart} + ${initialRemainder}</strong>.</p>`}
    ];
    if(initialRemainder){
      steps.push({title:"Escreva o restante como fração",html:`<p>${absDividend} ÷ ${absDivisor} = ${integerPart} + <span class="math-fraction"><span>${initialRemainder}</span><span>${absDivisor}</span></span>${gcd>1?` = ${integerPart} + <span class="math-fraction"><span>${simplifiedNumerator}</span><span>${simplifiedDenominator}</span></span>`:""}</p>`});
      steps.push({title:"Continue a divisão nas casas decimais",html:`<p>Acrescente um zero ao resto, divida novamente e repita o processo. Cada resultado forma uma nova casa decimal.</p><div style="max-width:100%;overflow:auto"><table style="border-collapse:collapse;min-width:480px"><thead><tr><th style="padding:6px;border-bottom:1px solid #555">Casa</th><th style="padding:6px;border-bottom:1px solid #555">Número</th><th style="padding:6px;border-bottom:1px solid #555">Algarismo</th><th style="padding:6px;border-bottom:1px solid #555">Produto</th><th style="padding:6px;border-bottom:1px solid #555">Novo resto</th></tr></thead><tbody>${rowsHtml}</tbody></table></div><p>As casas obtidas formam <strong>${decimalPreview}</strong>.</p>`});
      if(decimal.repeatStart>=0){
        const repeating=digits.slice(decimal.repeatStart);
        steps.push({title:"Identifique o período decimal",html:`<p>O resto voltou a um valor já encontrado. Portanto, os algarismos <strong>${repeating}</strong> passam a se repetir.</p><p>${integerPart},<span style="text-decoration:overline">${repeating}</span></p>`});
      }else if(!decimal.finished){
        steps.push({title:"Continue se precisar de mais casas",html:"<p>O resto ainda não chegou a zero. O mesmo procedimento pode continuar para obter outras casas decimais; a calculadora arredonda o resultado no limite do visor.</p>"});
      }
    }else{
      steps.push({title:"Observe que a divisão é exata",html:"<p>O resto é zero, portanto não é necessário continuar nas casas decimais.</p>"});
    }
    if(dividend<0||divisor<0)steps.push({title:"Aplique a regra de sinais",html:`<p>Dividendo e divisor têm sinais ${signNegative?"diferentes":"iguais"}; logo, o quociente é <strong>${signNegative?"negativo":"positivo"}</strong>.</p>`});
    steps.push({title:"Confira o resultado",html:`<p>${numberText(answer)} × (${divisor}) ≈ <strong>${numberText(answer*divisor)}</strong></p><p>O símbolo ≈ indica que o decimal mostrado pode estar arredondado.</p>`});
    steps.push({title:"Portanto, o resultado é",html:stepMath(`${source} = ${numberText(answer)}`)});
    return steps;
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
    const division=divisionSteps(formula,result);
    if(division)return division;
    return previousBuild(formula,result,symbolic);
  };
})();
