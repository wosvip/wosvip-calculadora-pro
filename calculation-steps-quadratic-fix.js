"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;
  function n(v){return String(+Number(v).toPrecision(12));}
  function parseQuadratic(formula){
    let s=String(formula||"").replace(/\s+/g,"").replace(/²/g,"^2").replace(/−/g,"-").toUpperCase();
    if(!s.includes("="))return null;
    const parts=s.split("="); if(parts.length!==2)return null;
    if(parts[1]!=="0")return null;
    let left=parts[0].replace(/-/g,"+-"); if(left.startsWith("+"))left=left.slice(1);
    let a=0,b=0,c=0;
    for(const term of left.split("+").filter(Boolean)){
      if(/X\^2$/.test(term)){let k=term.replace(/X\^2$/,""); a+=k===""?1:k==="-"?-1:Number(k);}
      else if(/X$/.test(term)){let k=term.replace(/X$/,""); b+=k===""?1:k==="-"?-1:Number(k);}
      else c+=Number(term);
    }
    return [a,b,c].every(Number.isFinite)&&a!==0?{a,b,c}:null;
  }
  function quadraticSteps(formula,result){
    const q=parseQuadratic(formula); if(!q)return null;
    const {a,b,c}=q, delta=b*b-4*a*c;
    const source=String(formula).trim();
    const steps=[
      {title:"Expressão original",html:stepMath(source)},
      {title:"Identifique os coeficientes",html:`<p>Compare com a forma geral <strong>ax² + bx + c = 0</strong>.</p><p>a = <strong>${n(a)}</strong><br>b = <strong>${n(b)}</strong><br>c = <strong>${n(c)}</strong></p>`},
      {title:"Calcule o discriminante (Δ)",html:`<p>Δ = b² − 4ac</p><p>Δ = (${n(b)})² − 4 × (${n(a)}) × (${n(c)})</p><p>(${n(b)})² = ${n(b*b)}</p><p>4 × (${n(a)}) × (${n(c)}) = ${n(4*a*c)}</p><p>Δ = ${n(b*b)} − ${n(4*a*c)} = <strong>${n(delta)}</strong></p>`}
    ];
    if(delta>0){
      const root=Math.sqrt(delta),den=2*a,x1=(-b+root)/den,x2=(-b-root)/den;
      steps.push(
        {title:"Interprete o discriminante",html:`<p>Como Δ = ${n(delta)} &gt; 0, a equação possui <strong>duas raízes reais e distintas</strong>.</p>`},
        {title:"Aplique a fórmula de Bhaskara",html:`<p>x = (−b ± √Δ) / 2a</p><p>x = (−(${n(b)}) ± √${n(delta)}) / (2 × ${n(a)})</p><p>√${n(delta)} = ${n(root)}</p><p>x = (${n(-b)} ± ${n(root)}) / ${n(den)}</p>`},
        {title:"Calcule x₁",html:`<p>x₁ = (${n(-b)} + ${n(root)}) / ${n(den)}</p><p>x₁ = ${n(-b+root)} / ${n(den)}</p><p><strong>x₁ = ${n(x1)}</strong></p>`},
        {title:"Calcule x₂",html:`<p>x₂ = (${n(-b)} − ${n(root)}) / ${n(den)}</p><p>x₂ = ${n(-b-root)} / ${n(den)}</p><p><strong>x₂ = ${n(x2)}</strong></p>`},
        {title:"Verifique as raízes",html:`<p>Para x₁ = ${n(x1)}:</p><p>${n(a)}×(${n(x1)})² + (${n(b)})×(${n(x1)}) + (${n(c)}) = ${n(a*x1*x1+b*x1+c)}</p><p>Para x₂ = ${n(x2)}:</p><p>${n(a)}×(${n(x2)})² + (${n(b)})×(${n(x2)}) + (${n(c)}) = ${n(a*x2*x2+b*x2+c)}</p>`},
        {title:"Portanto, o resultado é",html:stepMath(`x₁ = ${n(x1)}; x₂ = ${n(x2)}`)}
      );
    }else if(delta===0){
      const den=2*a,x=-b/den;
      steps.push(
        {title:"Interprete o discriminante",html:`<p>Como Δ = 0, a equação possui <strong>uma raiz real dupla</strong>.</p>`},
        {title:"Aplique a fórmula de Bhaskara",html:`<p>x = (−b ± √Δ) / 2a</p><p>x = (${n(-b)} ± √0) / ${n(den)}</p><p>x = ${n(-b)} / ${n(den)}</p><p><strong>x = ${n(x)}</strong></p>`},
        {title:"Verifique a raiz",html:`<p>${n(a)}×(${n(x)})² + (${n(b)})×(${n(x)}) + (${n(c)}) = ${n(a*x*x+b*x+c)}</p>`},
        {title:"Portanto, o resultado é",html:stepMath(`x₁ = x₂ = ${n(x)}`)}
      );
    }else{
      const abs=-delta,den=2*a,real=-b/den,imag=Math.sqrt(abs)/Math.abs(den);
      steps.push(
        {title:"Interprete o discriminante",html:`<p>Como Δ = ${n(delta)} &lt; 0, não existem raízes reais. As soluções pertencem aos <strong>números complexos</strong>.</p>`},
        {title:"Aplique a fórmula de Bhaskara",html:`<p>x = (−b ± √Δ) / 2a</p><p>x = (${n(-b)} ± √(${n(delta)})) / ${n(den)}</p>`},
        {title:"Simplifique a raiz negativa",html:`<p>√(${n(delta)}) = i√${n(abs)}</p><p>Logo: x = (${n(-b)} ± i√${n(abs)}) / ${n(den)}</p>`},
        {title:"Separe as duas soluções",html:`<p>x₁ = ${n(real)} + ${n(imag)}i</p><p>x₂ = ${n(real)} − ${n(imag)}i</p>`},
        {title:"Portanto, o resultado é",html:stepMath(`x₁ = ${n(real)} + ${n(imag)}i; x₂ = ${n(real)} − ${n(imag)}i`)}
      );
    }
    return steps;
  }
  window.buildCalculationSteps=function(formula,result,symbolic){
    const q=quadraticSteps(formula,result); if(q)return q;
    return previousBuild(formula,result,symbolic);
  };
})();