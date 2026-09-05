"use strict";
(function(){
  const originalBuild = window.buildCalculationSteps;

  function numText(value){
    const n = Number(value);
    return Number.isFinite(n) ? String(+n.toPrecision(12)) : String(value);
  }

  function seriesMatch(source, symbol){
    const escaped = symbol === "Σ" ? "Σ" : "Π";
    return source.match(new RegExp("^"+escaped+"\\s*X\\s*=\\s*(-?\\d+)\\s*(?:\\.\\.\\.|…)\\s*(-?\\d+)\\s*\\((.*)\\)$","i"));
  }

  function evaluateTerms(lower, upper, body){
    if(!Number.isInteger(lower) || !Number.isInteger(upper) || upper < lower || upper-lower > 50) return null;
    const terms=[];
    for(let x=lower;x<=upper;x++){
      let value;
      try{ value=safeEval(body,x); }catch{ return null; }
      if(!Number.isFinite(value)) return null;
      terms.push({x,value});
    }
    return terms;
  }

  function productSteps(formula,result){
    const source=String(formula||"").trim();
    const match=seriesMatch(source,"Π");
    if(!match)return null;
    const lower=Number(match[1]), upper=Number(match[2]), body=match[3].trim();
    const terms=evaluateTerms(lower,upper,body); if(!terms)return null;
    const expanded=terms.map(t=>numText(t.value)).join(" × ");
    const progressive=[]; let acc=1;
    for(const term of terms){acc*=term.value; progressive.push(numText(acc));}
    const substitutions=terms.map(t=>`X = ${t.x} → ${body.replace(/\bX\b/gi,String(t.x))} = ${numText(t.value)}`).join("<br>");
    const progressiveText=terms.length>1?terms.slice(1).map((t,i)=>`${progressive[i]} × ${numText(t.value)} = ${progressive[i+1]}`).join("<br>"):`Produto com um único termo = ${numText(terms[0].value)}`;
    return [
      {title:"Expressão original",html:stepMath(source)},
      {title:"Identifique os limites do produtório",html:`<p>Valor inicial: <strong>X = ${lower}</strong><br>Valor final: <strong>X = ${upper}</strong><br>Incremento: <strong>1</strong></p>`},
      {title:"Substitua X pelos valores do intervalo",html:`<p>${substitutions}</p>`},
      {title:"Expanda o produtório",html:stepMath(expanded)},
      {title:"Multiplique os termos em sequência",html:`<p>${progressiveText}</p>`},
      {title:"Portanto, o resultado é",html:stepMath(`${source} = ${numText(result)}`)}
    ];
  }

  function summationSteps(formula,result){
    const source=String(formula||"").trim();
    const match=seriesMatch(source,"Σ");
    if(!match)return null;
    const lower=Number(match[1]), upper=Number(match[2]), body=match[3].trim();
    const terms=evaluateTerms(lower,upper,body); if(!terms)return null;
    const expanded=terms.map(t=>numText(t.value)).join(" + ");
    const substitutions=terms.map(t=>`Para X = ${t.x} → ${body.replace(/\bX\b/gi,String(t.x))} = ${numText(t.value)}`).join("<br>");
    const progressive=[]; let acc=0;
    for(const term of terms){acc+=term.value; progressive.push(numText(acc));}
    const progressiveText=terms.length>1?terms.slice(1).map((t,i)=>`${progressive[i]} + ${numText(t.value)} = ${progressive[i+1]}`).join("<br>"):`Somatório com um único termo = ${numText(terms[0].value)}`;
    return [
      {title:"Expressão original",html:stepMath(source)},
      {title:"Identifique os limites do somatório",html:`<p>Valor inicial: <strong>X = ${lower}</strong><br>Valor final: <strong>X = ${upper}</strong><br>Incremento: <strong>1</strong></p>`},
      {title:"Substitua X pelos valores do intervalo",html:`<p>${substitutions}</p>`},
      {title:"Expanda o somatório",html:stepMath(`${source} = ${expanded}`)},
      {title:"Efetue a soma passo a passo",html:`<p>${progressiveText}</p>`},
      {title:"Portanto, o resultado é",html:stepMath(`${source} = ${numText(result)}`)}
    ];
  }

  window.buildCalculationSteps=function(formula,result,symbolic){
    const sum=summationSteps(formula,result); if(sum)return sum;
    const product=productSteps(formula,result); if(product)return product;
    return originalBuild(formula,result,symbolic);
  };
})();