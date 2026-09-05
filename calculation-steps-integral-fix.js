"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;

  function clean(v){return String(+Number(v).toPrecision(12));}
  function prettyExpr(s){return String(s).replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\*/g,"×");}
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;}
  function frac(num,den){
    if(!Number.isInteger(num)||!Number.isInteger(den)||den===0)return null;
    const g=gcd(num,den);num/=g;den/=g;if(den<0){num=-num;den=-den;}
    return den===1?String(num):`${num}/${den}`;
  }
  function parseIntegral(formula){
    const s=String(formula||"").trim().replace(/²/g,"^2").replace(/³/g,"^3");
    const m=s.match(/^∫\[\s*([^,]+)\s*,\s*([^\]]+)\]\s*(.*?)\s*dX$/i);
    if(!m)return null;
    const lower=Number(String(m[1]).replace(",","."));
    const upper=Number(String(m[2]).replace(",","."));
    if(!Number.isFinite(lower)||!Number.isFinite(upper))return null;
    return {lower,upper,body:m[3].trim(),source:String(formula||"").trim()};
  }
  function parseMonomial(body){
    const s=String(body||"").replace(/\s+/g,"").replace(/·/g,"*").replace(/×/g,"*").replace(/\*/g,"").toUpperCase();
    const m=s.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+)?)X(?:\^(\-?\d+(?:\.\d+)?))?$/);
    if(!m)return null;
    let coeff=m[1];
    if(coeff===""||coeff==="+")coeff=1; else if(coeff==="-")coeff=-1; else coeff=Number(coeff);
    const power=m[2]===undefined?1:Number(m[2]);
    if(!Number.isFinite(coeff)||!Number.isFinite(power)||power===-1)return null;
    return {coeff,power};
  }
  function monomialSteps(q,result){
    const mono=parseMonomial(q.body);
    if(!mono)return null;
    const {coeff,power}=mono,next=power+1,primitiveCoeff=coeff/next;
    const F=x=>primitiveCoeff*Math.pow(x,next),Fu=F(q.upper),Fl=F(q.lower),final=Fu-Fl;
    const coeffText=clean(coeff),nextText=clean(next),bodyPretty=prettyExpr(q.body);
    const exactPrimitive=Number.isInteger(coeff)&&Number.isInteger(next)?frac(coeff,next):null;
    const primitive=exactPrimitive?(exactPrimitive==="1"?`X^${nextText}`:exactPrimitive==="-1"?`−X^${nextText}`:`(${exactPrimitive})X^${nextText}`):(primitiveCoeff===1?`X^${nextText}`:primitiveCoeff===-1?`−X^${nextText}`:`${clean(primitiveCoeff)}X^${nextText}`);

    let exactFu=null,exactFl=null,exactFinal=null;
    if(exactPrimitive&&Number.isInteger(q.upper)&&Number.isInteger(q.lower)&&Number.isInteger(coeff)&&Number.isInteger(next)){
      const numU=coeff*Math.pow(q.upper,next),numL=coeff*Math.pow(q.lower,next);
      exactFu=frac(numU,next);exactFl=frac(numL,next);exactFinal=frac(numU-numL,next);
    }
    const substituteExact=exactPrimitive?`(${exactPrimitive} × ${clean(q.upper)}^${nextText}) − (${exactPrimitive} × ${clean(q.lower)}^${nextText})`:`(${clean(primitiveCoeff)} × ${clean(q.upper)}^${nextText}) − (${clean(primitiveCoeff)} × ${clean(q.lower)}^${nextText})`;
    const termLine=exactFu&&exactFl&&exactFinal?`${exactFu} − ${exactFl} = ${exactFinal}`:`${clean(Fu)} − ${clean(Fl)} = ${clean(final)}`;
    const finalLine=exactFinal&&exactFinal!==clean(final)?`${exactFinal} = ${clean(final)}`:clean(final);

    return [
      {title:"Integral definida",html:stepMath(`∫[${clean(q.lower)}, ${clean(q.upper)}] ${bodyPretty} dX`)},
      {title:"Identifique os limites e o integrando",html:`<div>Limite inferior: <strong>${clean(q.lower)}</strong><br>Limite superior: <strong>${clean(q.upper)}</strong><br>Função: <strong>${bodyPretty}</strong></div>`},
      {title:"Aplique a regra da potência",html:stepMath(`∫ ${coeffText}X^${clean(power)} dX = ${coeffText} × X^(${clean(power)} + 1) ÷ (${clean(power)} + 1)`)},
      {title:"Calcule a primitiva",html:stepMath(`F(X) = ${primitive}`)},
      {title:"Aplique o Teorema Fundamental do Cálculo",html:stepMath(`F(${clean(q.upper)}) − F(${clean(q.lower)})`)},
      {title:"Substitua os limites",html:stepMath(substituteExact)},
      {title:"Calcule cada termo",html:stepMath(termLine)},
      {title:"Portanto, o valor da integral é",html:stepMath(finalLine)}
    ];
  }

  window.buildCalculationSteps=function(formula,result,symbolic){
    const q=parseIntegral(formula);
    if(q){const steps=monomialSteps(q,result);if(steps)return steps;return [
      {title:"Integral definida",html:stepMath(q.source)},
      {title:"Intervalo de integração",html:`<div>De <strong>${clean(q.lower)}</strong> até <strong>${clean(q.upper)}</strong></div>`},
      {title:"Integrando",html:stepMath(prettyExpr(q.body))},
      {title:"Resultado numérico",html:stepMath(String(result))}
    ];}
    return previousBuild(formula,result,symbolic);
  };
})();