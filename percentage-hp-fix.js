"use strict";
(function(){
  const originalPress=window.press;
  const originalBuild=window.buildCalculationSteps;
  let percentInfo=null;
  let monetaryPercentPending=null;

  function cleanNumber(v){return String(+Number(v).toPrecision(12));}
  function displayNumber(v){const value=Number(v);if(!Number.isFinite(value))return String(v);const text=cleanNumber(value);return numberFormat==="BR"?text.replace(".",","):text;}
  function parseSimplePercent(source){const s=String(source||"").replace(/\s+/g,"").replace(/,/g,".");const m=s.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))([+\-*/])(-?(?:\d+(?:\.\d+)?|\.\d+))%$/);if(!m)return null;return {base:Number(m[1]),op:m[2],rate:Number(m[3]),source:String(source||"").trim()};}
  function calculate(p){const amount=p.base*p.rate/100;let total;if(p.op==="+")total=p.base+amount;else if(p.op==="-")total=p.base-amount;else if(p.op==="*")total=amount;else total=p.base/(p.rate/100);return {amount,total};}
  function currencyActive(){return typeof currencyMode!=="undefined"&&currencyMode!=="OFF";}
  function setScreenValue(value){const screen=document.getElementById("screen");if(screen)screen.value=displayNumber(value);}

  window.press=function(action){
    if(action==="percent"){
      insertAtCursor("%");resultShown=false;updateDisplay();
      const p=parseSimplePercent(expr);
      if(p){const r=calculate(p);percentInfo={...p,...r};setScreenValue(r.amount);if(currencyActive()&&p.op==="*")monetaryPercentPending={base:p.base,rate:p.rate,amount:r.amount,source:p.source,selected:null};else monetaryPercentPending=null;}
      return;
    }
    if(currencyActive()&&monetaryPercentPending&&(action==="+"||action==="-")){
      const p=monetaryPercentPending;p.selected=action;expr=`${cleanNumber(p.base)}${action}${cleanNumber(p.amount)}`;cursorPosition=expr.length;resultShown=false;updateDisplay();return;
    }
    if(action==="equal"){
      if(currencyActive()&&monetaryPercentPending&&monetaryPercentPending.selected){
        const p=monetaryPercentPending,total=p.selected==="+"?p.base+p.amount:p.base-p.amount;
        const semanticFormula=`${cleanNumber(p.base)}${p.selected}${cleanNumber(p.rate)}%`;
        percentInfo={base:p.base,rate:p.rate,amount:p.amount,op:p.selected,total,source:semanticFormula,monetary:true};
        lastFormula=semanticFormula;lastAnswer=total;localStorage.setItem("wosvipLastAnswer",String(total));addHistory("Cálculo",semanticFormula,cleanNumber(total));expr=cleanNumber(total);cursorPosition=expr.length;resultShown=true;monetaryPercentPending=null;updateDisplay();return;
      }
      const p=parseSimplePercent(expr);
      if(p){const r=calculate(p);percentInfo={...p,...r};lastFormula=expr;lastAnswer=r.total;localStorage.setItem("wosvipLastAnswer",String(r.total));addHistory("Cálculo",expr,cleanNumber(r.total));expr=cleanNumber(r.total);cursorPosition=expr.length;resultShown=true;monetaryPercentPending=null;updateDisplay();return;}
    }
    if(monetaryPercentPending&&action!=="cursorLeft"&&action!=="cursorRight")monetaryPercentPending=null;
    return originalPress(action);
  };

  const originalSafeEval=window.safeEval;
  if(typeof originalSafeEval==="function")window.safeEval=function(source,x){const p=parseSimplePercent(source);if(p)return calculate(p).total;return originalSafeEval(source,x);};

  window.buildCalculationSteps=function(formula,result,symbolic){
    const p=parseSimplePercent(formula);
    if(p){
      const r=calculate(p),amount=cleanNumber(r.amount),total=cleanNumber(r.total),base=cleanNumber(p.base),rate=cleanNumber(p.rate);
      if((p.op==="+"||p.op==="-")&&percentInfo&&Number(percentInfo.base)===p.base&&Number(percentInfo.rate)===p.rate){
        const verb=p.op==="+"?"adicionar":"subtrair",sign=p.op==="+"?"+":"−";
        return [
          {title:"Expressão financeira",html:stepMath(`${base} ${sign} ${rate}%`)},
          {title:"Identifique os dados",html:`<div><strong>Valor-base:</strong> ${base}<br><strong>Percentual:</strong> ${rate}%<br><strong>Operação escolhida:</strong> ${verb}</div>`},
          {title:`Calcule ${rate}% de ${base}`,html:stepMath(`${base} × ${rate} ÷ 100`)},
          {title:"Multiplique o valor-base pela taxa",html:stepMath(`${base} × ${rate} = ${cleanNumber(p.base*p.rate)}`)},
          {title:"Divida por 100",html:stepMath(`${cleanNumber(p.base*p.rate)} ÷ 100 = ${amount}`)},
          {title:"Valor correspondente ao percentual",html:stepMath(`${rate}% de ${base} = ${amount}`)},
          {title:`Agora, ${verb} esse valor ao valor-base`,html:stepMath(`${base} ${sign} ${amount} = ${total}`)},
          {title:"Portanto, o resultado final é",html:stepMath(total)}
        ];
      }
      const opText={"+":"adição","-":"subtração","*":"percentual de","/":"divisão percentual"}[p.op];
      const finalLine=p.op==="+"?`${base} + ${amount} = ${total}`:p.op==="-"?`${base} − ${amount} = ${total}`:p.op==="*"?`${base} × ${rate}% = ${amount}`:`${base} ÷ ${rate}% = ${total}`;
      return [
        {title:"Expressão original",html:stepMath(p.source)},
        {title:"Identifique o valor-base e a porcentagem",html:`<div>Valor-base: <strong>${base}</strong><br>Porcentagem: <strong>${rate}%</strong><br>Operação: <strong>${opText}</strong></div>`},
        {title:"Calcule o valor da porcentagem",html:stepMath(`${base} × ${rate} ÷ 100 = ${amount}`)},
        {title:"Aplique a porcentagem ao valor-base",html:stepMath(finalLine)},
        {title:"Portanto, o resultado é",html:stepMath(total)}
      ];
    }
    return originalBuild(formula,result,symbolic);
  };
})();