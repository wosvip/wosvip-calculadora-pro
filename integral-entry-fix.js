"use strict";
(function(){
  const previousPress=window.press;

  function normalizeIntegralFormula(source){
    return String(source||"X")
      .replace(/,/g,".")
      .replace(/²/g,"^2")
      .replace(/³/g,"^3")
      .replace(/(\d|\)|π)(?=[Xx(])/g,"$1*")
      .replace(/([Xx)])(?=\d|π|\()/g,"$1*")
      .replace(/\)(?=\d|[Xxπ(])/g,")*");
  }

  function finishIntegralSafely(){
    if(!structuredEntry||structuredEntry.type!=="integral")return false;
    try{
      const lowerText=String(structuredEntry.lower??"").trim();
      const upperText=String(structuredEntry.upper??"").trim();
      const formulaText=String(structuredEntry.formula||"X").trim();
      if(lowerText===""||upperText===""||formulaText==="")throw Error("missing");
      const lower=safeEval(lowerText),upper=safeEval(upperText);
      if(!Number.isFinite(lower)||!Number.isFinite(upper)||lower===upper)throw Error("bounds");
      const formula=normalizeIntegralFormula(formulaText);
      const steps=1000,h=(upper-lower)/steps;
      let sum=safeEval(formula,lower)+safeEval(formula,upper);
      if(!Number.isFinite(sum))throw Error("formula");
      for(let i=1;i<steps;i++){
        const y=safeEval(formula,lower+i*h);
        if(!Number.isFinite(y))throw Error("formula");
        sum+=(i%2?4:2)*y;
      }
      const value=sum*h/3;
      if(!Number.isFinite(value))throw Error("result");
      const description=`∫[${lower},${upper}] ${formulaText} dX`;
      structuredEntry=null;
      lastFormula=description;
      lastAnswer=value;
      localStorage.setItem("wosvipLastAnswer",String(value));
      addHistory("Integral",description,String(+value.toPrecision(12)));
      expr=String(+value.toPrecision(12));
      cursorPosition=expr.length;
      resultShown=true;
      updateDisplay();
      return true;
    }catch(err){
      alert("Não foi possível calcular a integral. Confira os limites e a expressão.");
      return true;
    }
  }

  window.press=function(action){
    if(action==="equal"&&structuredEntry&&structuredEntry.type==="integral"){
      finishIntegralSafely();
      return;
    }
    return previousPress(action);
  };
})();