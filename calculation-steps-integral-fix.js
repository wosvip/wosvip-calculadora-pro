"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;

  function clean(v){return String(+Number(v).toPrecision(12));}
  function prettyExpr(s){return String(s).replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\*/g,"×");}
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=b;b=a%b;a=t;}return a||1;}
  function frac(num,den){if(!Number.isInteger(num)||!Number.isInteger(den)||den===0)return null;const g=gcd(num,den);num/=g;den/=g;if(den<0){num=-num;den=-den;}return den===1?String(num):`${num}/${den}`;}
  function fracHtml(num,den){return `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em"><span style="padding:0 .18em .08em;border-bottom:1.5px solid currentColor">${num}</span><span style="padding:.08em .18em 0">${den}</span></span>`;}
  function mathLine(html){return `<div style="font-size:1.35rem;line-height:1.65;margin:.35rem 0;overflow-x:auto;white-space:nowrap">${html}</div>`;}
  function parseIntegral(formula){
    const s=String(formula||"").trim().replace(/²/g,"^2").replace(/³/g,"^3");
    const m=s.match(/^∫\[\s*([^,]+)\s*,\s*([^\]]+)\]\s*(.*?)\s*dX$/i);
    if(!m)return null;
    const lower=Number(String(m[1]).replace(",",".")),upper=Number(String(m[2]).replace(",","."));
    if(!Number.isFinite(lower)||!Number.isFinite(upper))return null;
    return {lower,upper,body:m[3].trim(),source:String(formula||"").trim()};
  }
  function parseMonomial(body){
    const s=String(body||"").replace(/\s+/g,"").replace(/·/g,"*").replace(/×/g,"*").replace(/\*/g,"").toUpperCase();
    const m=s.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+)?)X(?:\^(\-?\d+(?:\.\d+)?))?$/);if(!m)return null;
    let coeff=m[1];if(coeff===""||coeff==="+")coeff=1;else if(coeff==="-")coeff=-1;else coeff=Number(coeff);
    const power=m[2]===undefined?1:Number(m[2]);if(!Number.isFinite(coeff)||!Number.isFinite(power)||power===-1)return null;return {coeff,power};
  }
  function monomialSteps(q,result){
    const mono=parseMonomial(q.body);if(!mono)return null;
    const {coeff,power}=mono,next=power+1,primitiveCoeff=coeff/next;
    const F=x=>primitiveCoeff*Math.pow(x,next),Fu=F(q.upper),Fl=F(q.lower),final=Fu-Fl;
    const coeffText=clean(coeff),powerText=clean(power),nextText=clean(next),bodyPretty=prettyExpr(q.body);
    const exactPrimitive=Number.isInteger(coeff)&&Number.isInteger(next)?frac(coeff,next):null;
    let exactFu=null,exactFl=null,exactFinal=null;
    if(exactPrimitive&&Number.isInteger(q.upper)&&Number.isInteger(q.lower)&&Number.isInteger(coeff)&&Number.isInteger(next)){
      const numU=coeff*Math.pow(q.upper,next),numL=coeff*Math.pow(q.lower,next);exactFu=frac(numU,next);exactFl=frac(numL,next);exactFinal=frac(numU-numL,next);
    }
    const primitiveHtml=exactPrimitive&&exactPrimitive.includes("/")?(()=>{const [n,d]=exactPrimitive.split("/");return `${fracHtml(n,d)}X<sup>${nextText}</sup>`;})():`${clean(primitiveCoeff)}X<sup>${nextText}</sup>`;
    const ruleHtml=
      mathLine(`∫ aX<sup>n</sup> dX = a · ${fracHtml('X<sup>n + 1</sup>','n + 1')}`)+
      mathLine(`∫ ${coeffText}X<sup>${powerText}</sup> dX = ${coeffText} · ${fracHtml(`X<sup>${powerText} + 1</sup>`,`${powerText} + 1`)}`)+
      mathLine(`= ${coeffText} · ${fracHtml(`X<sup>${nextText}</sup>`,nextText)}`)+
      mathLine(`= ${primitiveHtml}`);
    const primitiveLine=mathLine(`F(X) = ${primitiveHtml}`);
    const substituteLine=exactPrimitive&&exactPrimitive.includes("/")?(()=>{const [n,d]=exactPrimitive.split("/");return mathLine(`(${fracHtml(n,d)} · ${clean(q.upper)}<sup>${nextText}</sup>) − (${fracHtml(n,d)} · ${clean(q.lower)}<sup>${nextText}</sup>)`);})():stepMath(`(${clean(primitiveCoeff)} × ${clean(q.upper)}^${nextText}) − (${clean(primitiveCoeff)} × ${clean(q.lower)}^${nextText})`);
    let termHtml,finalHtml;
    if(exactFu&&exactFl&&exactFinal&&exactFinal.includes("/")){
      const [fn,fd]=exactFinal.split("/");
      termHtml=mathLine(`${fracHtml(fn,fd)} − 0 = ${fracHtml(fn,fd)}`);
      finalHtml=mathLine(`${fracHtml(fn,fd)} = ${clean(final)}`);
    }else{
      termHtml=stepMath(`${clean(Fu)} − ${clean(Fl)} = ${clean(final)}`);
      finalHtml=stepMath(clean(final));
    }
    return [
      {title:"Integral definida",html:stepMath(`∫[${clean(q.lower)}, ${clean(q.upper)}] ${bodyPretty} dX`)},
      {title:"Identifique os limites e o integrando",html:`<div>Limite inferior: <strong>${clean(q.lower)}</strong><br>Limite superior: <strong>${clean(q.upper)}</strong><br>Função: <strong>${bodyPretty}</strong></div>`},
      {title:"Aplique a regra da potência",html:ruleHtml},
      {title:"Calcule a primitiva",html:primitiveLine},
      {title:"Aplique o Teorema Fundamental do Cálculo",html:stepMath(`F(${clean(q.upper)}) − F(${clean(q.lower)})`)},
      {title:"Substitua os limites",html:substituteLine},
      {title:"Calcule cada termo",html:termHtml},
      {title:"Portanto, o valor da integral é",html:finalHtml}
    ];
  }
  window.buildCalculationSteps=function(formula,result,symbolic){
    const q=parseIntegral(formula);if(q){const steps=monomialSteps(q,result);if(steps)return steps;return [
      {title:"Integral definida",html:stepMath(q.source)},
      {title:"Intervalo de integração",html:`<div>De <strong>${clean(q.lower)}</strong> até <strong>${clean(q.upper)}</strong></div>`},
      {title:"Integrando",html:stepMath(prettyExpr(q.body))},
      {title:"Resultado numérico",html:stepMath(String(result))}
    ];}return previousBuild(formula,result,symbolic);
  };
})();