"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;
  function n(v){return String(+Number(v).toPrecision(12));}
  function parseQuadratic(formula){
    let s=String(formula||"").replace(/\s+/g,"").replace(/²/g,"^2").replace(/−/g,"-").toUpperCase();
    if(!s.includes("="))return null;
    const parts=s.split("="); if(parts.length!==2||parts[1]!=="0")return null;
    let left=parts[0].replace(/-/g,"+-"); if(left.startsWith("+"))left=left.slice(1);
    let a=0,b=0,c=0;
    for(const term of left.split("+").filter(Boolean)){
      if(/X\^2$/.test(term)){let k=term.replace(/X\^2$/,""); a+=k===""?1:k==="-"?-1:Number(k);}
      else if(/X$/.test(term)){let k=term.replace(/X$/,""); b+=k===""?1:k==="-"?-1:Number(k);}
      else c+=Number(term);
    }
    return [a,b,c].every(Number.isFinite)&&a!==0?{a,b,c}:null;
  }
  function graphHtml(a,b,c){
    const xv=-b/(2*a),yv=a*xv*xv+b*xv+c,delta=b*b-4*a*c;
    const roots=delta>=0?[(-b+Math.sqrt(delta))/(2*a),(-b-Math.sqrt(delta))/(2*a)]:[];
    const rootText=delta>0?`Raízes reais: x₁ = <strong>${n(roots[0])}</strong> e x₂ = <strong>${n(roots[1])}</strong>.`:delta===0?`Raiz real dupla: x = <strong>${n(roots[0])}</strong>.`:`Como Δ &lt; 0, a parábola não intercepta o eixo X.`;
    return `<div class="quadratic-graph-block"><canvas class="quadratic-step-graph" width="720" height="380" data-a="${a}" data-b="${b}" data-c="${c}" style="width:100%;max-width:720px;height:auto;border:1px solid #29425b;border-radius:10px;background:#07111c"></canvas><p><strong>Vértice:</strong> V(${n(xv)}, ${n(yv)})<br><strong>Eixo de simetria:</strong> x = ${n(xv)}<br><strong>Intercepto em Y:</strong> (0, ${n(c)})<br><strong>Concavidade:</strong> ${a>0?"para cima (a > 0)":"para baixo (a < 0)"}<br>${rootText}</p></div>`;
  }
  function quadraticSteps(formula,result){
    const q=parseQuadratic(formula); if(!q)return null;
    const {a,b,c}=q,delta=b*b-4*a*c,source=String(formula).trim();
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
        {title:"Gráfico da função no plano cartesiano",html:graphHtml(a,b,c)},
        {title:"Portanto, o resultado é",html:stepMath(`x₁ = ${n(x1)}; x₂ = ${n(x2)}`)}
      );
    }else if(delta===0){
      const den=2*a,x=-b/den;
      steps.push(
        {title:"Interprete o discriminante",html:`<p>Como Δ = 0, a equação possui <strong>uma raiz real dupla</strong>.</p>`},
        {title:"Aplique a fórmula de Bhaskara",html:`<p>x = (−b ± √Δ) / 2a</p><p>x = (${n(-b)} ± √0) / ${n(den)}</p><p>x = ${n(-b)} / ${n(den)}</p><p><strong>x = ${n(x)}</strong></p>`},
        {title:"Verifique a raiz",html:`<p>${n(a)}×(${n(x)})² + (${n(b)})×(${n(x)}) + (${n(c)}) = ${n(a*x*x+b*x+c)}</p>`},
        {title:"Gráfico da função no plano cartesiano",html:graphHtml(a,b,c)},
        {title:"Portanto, o resultado é",html:stepMath(`x₁ = x₂ = ${n(x)}`)}
      );
    }else{
      const abs=-delta,den=2*a,real=-b/den,imag=Math.sqrt(abs)/Math.abs(den);
      steps.push(
        {title:"Interprete o discriminante",html:`<p>Como Δ = ${n(delta)} &lt; 0, não existem raízes reais. As soluções pertencem aos <strong>números complexos</strong>.</p>`},
        {title:"Aplique a fórmula de Bhaskara",html:`<p>x = (−b ± √Δ) / 2a</p><p>x = (${n(-b)} ± √(${n(delta)})) / ${n(den)}</p>`},
        {title:"Simplifique a raiz negativa",html:`<p>√(${n(delta)}) = i√${n(abs)}</p><p>Logo: x = (${n(-b)} ± i√${n(abs)}) / ${n(den)}</p>`},
        {title:"Separe as duas soluções",html:`<p>x₁ = ${n(real)} + ${n(imag)}i</p><p>x₂ = ${n(real)} − ${n(imag)}i</p>`},
        {title:"Gráfico da função no plano cartesiano",html:graphHtml(a,b,c)},
        {title:"Portanto, o resultado é",html:stepMath(`x₁ = ${n(real)} + ${n(imag)}i; x₂ = ${n(real)} − ${n(imag)}i`)}
      );
    }
    return steps;
  }
  function drawGraph(canvas){
    if(canvas.dataset.drawn)return; canvas.dataset.drawn="1";
    const a=Number(canvas.dataset.a),b=Number(canvas.dataset.b),c=Number(canvas.dataset.c),ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
    const delta=b*b-4*a*c,xv=-b/(2*a),yv=a*xv*xv+b*xv+c;
    const roots=delta>=0?[(-b+Math.sqrt(delta))/(2*a),(-b-Math.sqrt(delta))/(2*a)]:[];
    let span=5;if(roots.length)span=Math.max(span,Math.abs(roots[0]-roots[1])*1.15);span=Math.max(span,Math.abs(xv)*.35+3);
    const xmin=xv-span,xmax=xv+span,samples=[];for(let i=0;i<=240;i++){const x=xmin+(xmax-xmin)*i/240;samples.push(a*x*x+b*x+c);}samples.push(0,c,yv);
    let ymin=Math.min(...samples),ymax=Math.max(...samples);if(ymin===ymax){ymin-=1;ymax+=1;}const py=(ymax-ymin)*.12;ymin-=py;ymax+=py;
    const X=x=>(x-xmin)/(xmax-xmin)*W,Y=y=>H-(y-ymin)/(ymax-ymin)*H;
    ctx.clearRect(0,0,W,H);ctx.fillStyle="#07111c";ctx.fillRect(0,0,W,H);ctx.lineWidth=1;ctx.strokeStyle="#203247";
    for(let i=0;i<=8;i++){const x=i*W/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let i=0;i<=6;i++){const y=i*H/6;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#dce7f3";ctx.lineWidth=1.5;if(xmin<=0&&xmax>=0){ctx.beginPath();ctx.moveTo(X(0),0);ctx.lineTo(X(0),H);ctx.stroke();}if(ymin<=0&&ymax>=0){ctx.beginPath();ctx.moveTo(0,Y(0));ctx.lineTo(W,Y(0));ctx.stroke();}
    ctx.setLineDash([6,6]);ctx.strokeStyle="#91a4b7";ctx.beginPath();ctx.moveTo(X(xv),0);ctx.lineTo(X(xv),H);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle="#2f8cff";ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=360;i++){const x=xmin+(xmax-xmin)*i/360,y=a*x*x+b*x+c;i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y));}ctx.stroke();
    function point(x,y,label,color){const px=X(x),pyy=Y(y);ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,pyy,5,0,Math.PI*2);ctx.fill();ctx.font="15px sans-serif";ctx.fillText(label,Math.min(W-130,px+9),Math.max(18,pyy-9));}
    if(delta>=0){point(roots[0],0,delta===0?`x = ${n(roots[0])}`:`x₁ = ${n(roots[0])}`,"#42e38b");if(delta>0)point(roots[1],0,`x₂ = ${n(roots[1])}`,"#42e38b");}
    point(xv,yv,`V(${n(xv)}, ${n(yv)})`,"#ffc857");point(0,c,`(0, ${n(c)})`,"#ff8a65");
  }
  const observer=new MutationObserver(()=>document.querySelectorAll("canvas.quadratic-step-graph").forEach(drawGraph));observer.observe(document.documentElement,{childList:true,subtree:true});
  window.buildCalculationSteps=function(formula,result,symbolic){const q=quadraticSteps(formula,result);if(q)return q;return previousBuild(formula,result,symbolic);};
})();