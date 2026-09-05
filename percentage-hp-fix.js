"use strict";
(function(){
  const originalPress=window.press;
  const originalBuild=window.buildCalculationSteps;
  let percentInfo=null;

  function cleanNumber(v){return String(+Number(v).toPrecision(12));}
  function parseSimplePercent(source){
    const s=String(source||"").replace(/\s+/g,"").replace(/,/g,".");
    const m=s.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))([+\-*/])(-?(?:\d+(?:\.\d+)?|\.\d+))%$/);
    if(!m)return null;
    return {base:Number(m[1]),op:m[2],rate:Number(m[3]),source:String(source||"").trim()};
  }
  function calculate(p){
    const amount=p.base*p.rate/100;
    let total;
    if(p.op==="+")total=p.base+amount;
    else if(p.op==="-")total=p.base-amount;
    else if(p.op==="*")total=amount;
    else total=p.base/(p.rate/100);
    return {amount,total};
  }

  window.press=function(action){
    if(action==="percent"){
      // Keep % visible in the expression. The contextual HP calculation is
      // applied by safeEval/equal through the transformed expression below.
      insertAtCursor("%");
      resultShown=false;
      updateDisplay();
      return;
    }
    if(action==="equal"){
      const p=parseSimplePercent(expr);
      if(p){
        const r=calculate(p);
        percentInfo={...p,...r};
        lastFormula=expr;
        lastAnswer=r.total;
        localStorage.setItem("wosvipLastAnswer",String(r.total));
        addHistory("Cálculo",expr,cleanNumber(r.total));
        expr=cleanNumber(r.total);
        cursorPosition=expr.length;
        resultShown=true;
        updateDisplay();
        return;
      }
    }
    return originalPress(action);
  };

  // Live preview: safeEval normally treats 30% as 0.3. For a simple
  // base +/-/*// percentage expression, reinterpret it contextually.
  const originalSafeEval=window.safeEval;
  if(typeof originalSafeEval==="function"){
    window.safeEval=function(source,x){
      const p=parseSimplePercent(source);
      if(p)return calculate(p).total;
      return originalSafeEval(source,x);
    };
  }

  window.buildCalculationSteps=function(formula,result,symbolic){
    const p=parseSimplePercent(formula);
    if(p){
      const r=calculate(p),opText={"+":"adição","-":"subtração","*":"percentual de","/":"divisão percentual"}[p.op];
      const amount=cleanNumber(r.amount),total=cleanNumber(r.total),base=cleanNumber(p.base),rate=cleanNumber(p.rate);
      const finalLine=p.op==="+"?`${base} + ${amount} = ${total}`:p.op==="-"?`${base} − ${amount} = ${total}`:p.op==="*"?`${base} × ${rate}% = ${amount}`:`${base} ÷ ${rate}% = ${total}`;
      return [
        {title:"Expressão original",html:stepMath(p.source)},
        {title:"Identifique o valor-base e a porcentagem",html:`<p>Valor-base: <strong>${base}</strong><br>Porcentagem: <strong>${rate}%</strong><br>Operação: <strong>${opText}</strong></p>`},
        {title:"Calcule o valor da porcentagem",html:`<p>${rate}% de ${base}</p><p>${base} × ${rate} ÷ 100</p><p>${base} × ${rate} = ${cleanNumber(p.base*p.rate)}</p><p>${cleanNumber(p.base*p.rate)} ÷ 100 = <strong>${amount}</strong></p>`},
        {title:"Aplique a porcentagem ao valor-base",html:stepMath(finalLine)},
        {title:"Portanto, o resultado é",html:stepMath(total)}
      ];
    }
    return originalBuild(formula,result,symbolic);
  };
})();