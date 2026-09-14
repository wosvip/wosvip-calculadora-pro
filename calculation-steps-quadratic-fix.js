"use strict";
(function(){
  const previousBuild=window.buildCalculationSteps;
  const previousSolve=window.solveEquation;
  function n(v){return String(+Number(v).toPrecision(12));}
  function cleanZero(v){return Math.abs(v)<1e-10?0:v;}
  function complexText(real,imag){
    real=cleanZero(real);imag=cleanZero(imag);
    return `${n(real)} ${imag<0?"−":"+"} ${n(Math.abs(imag))}i`;
  }
  function parseCubic(formula){
    let s=String(formula||"").replace(/\s+/g,"").replace(/³/g,"^3").replace(/²/g,"^2").replace(/−/g,"-").toUpperCase();
    if(!s.includes("="))return null;
    const parts=s.split("=");if(parts.length!==2)return null;
    function terms(side,multiplier){
      let normalized=side.replace(/-/g,"+-");if(normalized.startsWith("+"))normalized=normalized.slice(1);
      const out=[0,0,0,0];
      for(const term of normalized.split("+").filter(Boolean)){
        let degree=0,coefficient=term;
        if(/X\^3$/.test(term)){degree=3;coefficient=term.replace(/X\^3$/,"");}
        else if(/X\^2$/.test(term)){degree=2;coefficient=term.replace(/X\^2$/,"");}
        else if(/X$/.test(term)){degree=1;coefficient=term.replace(/X$/,"");}
        else if(/X/.test(term))return null;
        const value=coefficient===""?1:coefficient==="-"?-1:Number(coefficient);
        if(!Number.isFinite(value))return null;
        out[degree]+=multiplier*value;
      }
      return out;
    }
    const left=terms(parts[0],1),right=terms(parts[1],-1);if(!left||!right)return null;
    const coefficients=left.map((value,index)=>value+right[index]);
    if(!coefficients.every(Number.isFinite)||Math.abs(coefficients[3])<1e-12)return null;
    const [d,c,b,a]=coefficients;
    return {a,b,c,d};
  }
  function cubicData(formula){
    const coefficients=parseCubic(formula);if(!coefficients)return null;
    const {a,b,c,d}=coefficients,offset=b/(3*a);
    const p=(3*a*c-b*b)/(3*a*a);
    const q=(2*b*b*b-9*a*b*c+27*a*a*d)/(27*a*a*a);
    const discriminant=(q*q)/4+(p*p*p)/27;
    const tolerance=1e-12*Math.max(1,Math.abs(q*q/4),Math.abs(p*p*p/27));
    let roots,kind;
    if(discriminant>tolerance){
      const sqrt=Math.sqrt(discriminant),u=Math.cbrt(-q/2+sqrt),v=Math.cbrt(-q/2-sqrt);
      roots=[{re:u+v-offset,im:0},{re:-(u+v)/2-offset,im:(Math.sqrt(3)/2)*(u-v)},{re:-(u+v)/2-offset,im:-(Math.sqrt(3)/2)*(u-v)}];
      kind="one-real";
    }else if(discriminant<-tolerance){
      const radius=2*Math.sqrt(-p/3),theta=Math.acos((3*q/(2*p))*Math.sqrt(-3/p));
      roots=[0,1,2].map(k=>({re:radius*Math.cos((theta+2*Math.PI*k)/3)-offset,im:0})).sort((x,y)=>y.re-x.re);
      kind="three-real";
    }else{
      const u=Math.cbrt(-q/2);
      roots=[{re:2*u-offset,im:0},{re:-u-offset,im:0},{re:-u-offset,im:0}];
      kind="multiple";
    }
    roots.forEach(root=>{root.re=cleanZero(root.re);root.im=cleanZero(root.im);});
    return {...coefficients,p,q,discriminant:cleanZero(discriminant),roots,kind};
  }
  function rootLabel(root){return root.im?complexText(root.re,root.im):n(root.re);}
  function cubicResult(data){return data.roots.map((root,index)=>`x${index+1} = ${rootLabel(root)}`).join("; ");}
  function cubicValue(data,root){
    if(root.im)return null;
    const x=root.re;return cleanZero(data.a*x*x*x+data.b*x*x+data.c*x+data.d);
  }
  function cubicSteps(formula){
    const data=cubicData(formula);if(!data)return null;
    const {a,b,c,d,p,q,discriminant,roots,kind}=data;
    const steps=[
      {title:"Expressão original",html:stepMath(String(formula).trim())},
      {title:"Identifique os coeficientes",html:`<p>Compare com a forma geral <strong>ax³ + bx² + cx + d = 0</strong>.</p><p>a = <strong>${n(a)}</strong><br>b = <strong>${n(b)}</strong><br>c = <strong>${n(c)}</strong><br>d = <strong>${n(d)}</strong></p>`},
      {title:"Reduza à forma cúbica de Cardano",html:`<p>Use x = t − b/(3a), obtendo <strong>t³ + pt + q = 0</strong>.</p><p>p = (3ac − b²)/(3a²) = <strong>${n(p)}</strong></p><p>q = (2b³ − 9abc + 27a²d)/(27a³) = <strong>${n(q)}</strong></p>`},
      {title:"Calcule o discriminante da cúbica",html:`<p>Δ = (q/2)² + (p/3)³</p><p>Δ = <strong>${n(discriminant)}</strong></p>`}
    ];
    if(kind==="one-real")steps.push({title:"Interprete o discriminante",html:"<p>Como Δ &gt; 0, existe <strong>uma raiz real</strong> e um par de raízes complexas conjugadas.</p>"});
    else if(kind==="three-real")steps.push({title:"Interprete o discriminante",html:"<p>Como Δ &lt; 0, existem <strong>três raízes reais e distintas</strong>.</p>"});
    else steps.push({title:"Interprete o discriminante",html:"<p>Como Δ = 0, a equação possui <strong>raízes reais repetidas</strong>.</p>"});
    steps.push({title:"Calcule as raízes",html:roots.map((root,index)=>`<p><strong>x${index+1} = ${rootLabel(root)}</strong></p>`).join("")});
    const realRoots=roots.filter(root=>!root.im);
    steps.push({title:"Verifique as raízes reais",html:realRoots.map((root,index)=>`<p>Para x = ${n(root.re)}:</p><p>${n(a)}×(${n(root.re)})³ + (${n(b)})×(${n(root.re)})² + (${n(c)})×(${n(root.re)}) + (${n(d)}) = <strong>${n(cubicValue(data,root))}</strong></p>`).join("")});
    steps.push({title:"Portanto, o resultado é",html:stepMath(cubicResult(data))});
    return steps;
  }
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
  window.solveEquation=function(formula){
    const cubic=cubicData(formula);
    if(!cubic)return previousSolve(formula);
    lastFormula=formula;
    expr=cubicResult(cubic);
    cursorPosition=expr.length;
    resultShown=true;
    const realRoots=cubic.roots.filter(root=>!root.im).length;
    lastAnswer=realRoots?cubic.roots.find(root=>!root.im).re:lastAnswer;
    localStorage.setItem("wosvipLastAnswer",String(lastAnswer));
    addHistory("Equação do 3º grau",lastFormula,expr);
    updateDisplay();
    return true;
  };
  window.buildCalculationSteps=function(formula,result,symbolic){const c=cubicSteps(formula);if(c)return c;const q=quadraticSteps(formula,result);if(q)return q;return previousBuild(formula,result,symbolic);};
})();
