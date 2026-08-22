if(window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true)document.documentElement.classList.add('standalone-app');
const $=s=>document.querySelector(s), money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});let expr='',lastFormula='',resultShown=false,cursorPosition=0,structuredEntry=null,angleMode=localStorage.getItem('wosvipAngleMode')||'DEG',history=JSON.parse(localStorage.getItem('wosvipHistory')||'[]'),lastAnswer=Number(localStorage.getItem('wosvipLastAnswer')||0),memoryValue=Number(localStorage.getItem('wosvipMemory')||0);
const addHistory=(type,detail,result)=>{history.unshift({type,detail,result,date:new Date().toLocaleString('pt-BR')});history=history.slice(0,100);localStorage.setItem('wosvipHistory',JSON.stringify(history));renderHistory()};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button,.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active');if(b.dataset.tab==='history')renderHistory()});
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('wosvipTheme',document.body.classList.contains('light')?'light':'dark')};if(localStorage.getItem('wosvipTheme')==='light')document.body.classList.add('light');
function updateAngleMode(){const deg=angleMode==='DEG';$('#degBtn').classList.toggle('active',deg);$('#radBtn').classList.toggle('active',!deg);$('#modeLabel').textContent=angleMode}
$('#degBtn').onclick=()=>{angleMode='DEG';localStorage.setItem('wosvipAngleMode',angleMode);updateAngleMode()};$('#radBtn').onclick=()=>{angleMode='RAD';localStorage.setItem('wosvipAngleMode',angleMode);updateAngleMode()};updateAngleMode();
let shiftActive=false;
function setShift(active){shiftActive=active;document.querySelector('.shift-key').classList.toggle('active',active);document.querySelectorAll('[data-secondary-action]').forEach(b=>{b.textContent=active?b.dataset.secondaryLabel:b.dataset.primaryLabel})}
const controlButtons=[['SHIFT','shift'],['MENU','noop'],['◀','cursorLeft'],['▶','cursorRight'],['⌫','back'],['AC','clear']];
const scientificButtons=[
 ['DRG','mode','→DRG','mode'],['x↔E','sci','FSE','sci'],['▦','noop','MTRX','noop'],['Σ','summation','Π','product'],['∫dx','integral','d/dx','derivative'],['▣','camera','','noop'],
 ['π','pi','hyp','noop'],['sin','sin','sin⁻¹','asin'],['cos','cos','cos⁻¹','acos'],['tan','tan','tan⁻¹','atan'],['i','imaginary','∠','complexAngle'],['logₓy','logBase','logₓy','logBase'],
 ['x⁻¹','inv','lim','limit'],['x²','sq','x³','cube'],['√x','sqrt','∛x','cbrt'],['xʸ','pow','ʸ√x','yroot'],['log₁₀','log','10ˣ','pow10'],['ln','ln','eˣ','powE'],
 ["D°M'S",'dms','STAT','stats'],['d/c','fraction','a b/c','fraction'],['X','variable','Y','variableY'],['X/Y,M','variables','HISTORY','showHistory'],['MR','memoryRecall','M+','memoryAdd'],['x→M','memoryStore','M−','memorySubtract']
];
const numberButtons=[
 ['7','7','CPLX','complex'],['8','8','∞','infinity'],['9','9','123','base10'],['(', '(','%','percent'],[')',')','mod','mod'],
 ['4','4','n!','factorial'],['5','5','nCr','ncr'],['6','6','nPr','npr'],['×','*','▶BIN','bin'],['÷','/','▶OCT','oct'],
 ['1','1','CNST','constants'],['2','2','CONV','quickConvert'],['3','3','abs','absolute'],['+','+','▶DEC','dec'],['−','-','▶HEX','hex'],
 ['0','0','OTHER','other'],['.','.','ran#','random'],['+/−','neg','Ans','answer'],['EXP','exp','EXP SI','engineering'],['=','equal','= < >','compare']
];
function makeKey(container,[label,action,alt,secondaryAction],kind=''){const wrap=document.createElement('div');wrap.className='classic-key-wrap';if(alt)wrap.dataset.alt=alt;const b=document.createElement('button');b.textContent=label;b.className=kind;b.dataset.primaryLabel=label;if(action==='camera')b.classList.add('camera-key');if(secondaryAction&&secondaryAction!=='noop'){b.dataset.secondaryAction=secondaryAction;b.dataset.secondaryLabel=alt}b.onclick=()=>{const chosen=shiftActive&&b.dataset.secondaryAction?b.dataset.secondaryAction:action;if(action!=='shift'&&shiftActive)setShift(false);press(chosen)};wrap.appendChild(b);container.appendChild(wrap)}
controlButtons.forEach((k,i)=>makeKey($('#controlKeys'),k,i===0?'shift-key':i>3?'danger-key':'control-key'));
scientificButtons.forEach(k=>makeKey($('#scientificKeys'),k,'science-key'));
numberButtons.forEach((k,i)=>makeKey($('#numberKeys'),k,i===19?'enter-key':i%5<3?'number-key':'operator-key'));
function closeParentheses(value){const opened=(value.match(/\(/g)||[]).length,closed=(value.match(/\)/g)||[]).length;return value+')'.repeat(Math.max(0,opened-closed))}
function approximateFraction(value,maxDen=100000){if(!Number.isFinite(value))throw Error();let sign=value<0?-1:1,x=Math.abs(value),bestN=Math.round(x),bestD=1,bestError=Math.abs(x-bestN);for(let d=1;d<=maxDen;d++){const n=Math.round(x*d),error=Math.abs(x-n/d);if(error<bestError){bestN=n;bestD=d;bestError=error;if(error<1e-12)break}}const g=(a,b)=>b?g(b,a%b):a,div=g(bestN,bestD);return `${sign*bestN/div}/${bestD/div}`}
function calculateLimit(){if(!/[xX]/.test(expr)){alert('Digite primeiro uma expressão usando X. Exemplo: sin(X)/X');return}const answer=prompt('Calcular o limite quando X tende a:','0');if(answer===null)return;const point=Number(answer.replace(',','.'));if(!Number.isFinite(point)){alert('Valor inválido.');return}try{const source=closeParentheses(expr),values=[1e-4,1e-5,1e-6].map(h=>(safeEval(source,point-h)+safeEval(source,point+h))/2),r=values[values.length-1];if(!Number.isFinite(r)||Math.abs(values[2]-values[1])>1e-4*Math.max(1,Math.abs(r)))throw Error();addHistory('Limite',`lim X→${point}: ${expr}`,String(+r.toPrecision(12)));expr=String(+r.toPrecision(12));cursorPosition=expr.length;updateDisplay()}catch{alert('Não foi possível determinar esse limite numericamente.')}}
function insertAtCursor(value){const text=String(value);expr=expr.slice(0,cursorPosition)+text+expr.slice(cursorPosition);cursorPosition+=text.length}
function setComputedValue(value,type,detail){if(!Number.isFinite(value))throw Error();expr=String(+value.toPrecision(12));cursorPosition=expr.length;lastAnswer=value;localStorage.setItem('wosvipLastAnswer',String(value));if(type)addHistory(type,detail,expr)}
function factorialValue(n){if(!Number.isInteger(n)||n<0||n>170)throw Error();let r=1;for(let i=2;i<=n;i++)r*=i;return r}
function combinationValue(n,r){if(!Number.isInteger(n)||!Number.isInteger(r)||n<0||r<0||r>n)throw Error();r=Math.min(r,n-r);let out=1;for(let i=1;i<=r;i++)out=out*(n-r+i)/i;return out}
function showLimitInfo(){
  document.querySelector('.limit-help-overlay')?.remove();
  const overlay=document.createElement('div');overlay.className='converter-overlay limit-help-overlay';
  overlay.innerHTML='<div class="limit-help-card" role="dialog" aria-modal="true"><h3>Limite</h3><p>Também é possível avaliar um limite unilateral.</p><p>Use <strong>+</strong> ou <strong>−</strong> no final do valor para indicar o lado de aproximação.</p><div class="limit-help-examples"><span>X → 0<sup>+</sup> pela direita</span><span>X → 0<sup>−</sup> pela esquerda</span></div><button type="button">ENTENDI</button></div>';
  document.body.appendChild(overlay);overlay.querySelector('button').onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove()}
}
function startStructuredEntry(type){
  if(type==='yroot')structuredEntry={type,index:expr||'',radicand:'',field:expr?'radicand':'index'};
  else structuredEntry=(type==='integral'||type==='summation'||type==='product')?{type,lower:'',upper:'',formula:expr||'',field:'formula'}:{type,formula:expr||'',point:'',field:'formula'};
  expr='';resultShown=false;updateDisplay()
}
function structuredFields(){if(structuredEntry.type==='yroot')return ['index','radicand'];return ['integral','summation','product'].includes(structuredEntry.type)?['lower','upper','formula']:['formula','point']}
function structuredToken(k){const map={sin:'sin(',cos:'cos(',tan:'tan(',asin:'asin(',acos:'acos(',atan:'atan(',sqrt:'√(',cbrt:'∛(',pi:'π',pow:'^',inv:'1/(',sq:'^2',cube:'^3',ln:'ln(',log:'log(',pow10:'10^',powE:'e^',variable:'X',variableY:'Y',absolute:'abs(',imaginary:'i',exp:'×10^',neg:'-'};return map[k]??(/^[0-9.+\-*/^()%]$/.test(k)?k:null)}
function finishStructuredEntry(){
  try{const e=structuredEntry;let value,detail;if(e.type==='yroot'){const index=safeEval(e.index),radicand=safeEval(e.radicand);if(!Number.isFinite(index)||index===0||!Number.isFinite(radicand))throw Error();if(radicand<0){if(!Number.isInteger(index)||Math.abs(index)%2!==1)throw Error();value=-Math.pow(-radicand,1/index)}else value=Math.pow(radicand,1/index);detail='root('+e.index+','+e.radicand+')'}else if(e.type==='integral'){const a=safeEval(e.lower),b=safeEval(e.upper),source=e.formula||'X',n=1000,h=(b-a)/n;let sum=safeEval(source,a)+safeEval(source,b);for(let j=1;j<n;j++)sum+=(j%2?4:2)*safeEval(source,a+j*h);value=sum*h/3;detail='∫['+a+','+b+'] '+source+' dX'}else if(e.type==='summation'||e.type==='product'){const a=safeEval(e.lower),b=safeEval(e.upper),source=e.formula||'X';if(!Number.isInteger(a)||!Number.isInteger(b)||b<a||b-a>100000)throw Error();value=e.type==='summation'?0:1;for(let j=a;j<=b;j++){const term=safeEval(source,j);value=e.type==='summation'?value+term:value*term}detail=(e.type==='summation'?'Σ':'Π')+' X='+a+'…'+b+' ('+source+')'}else if(e.type==='limit'){const rawPoint=e.point.trim(),direction=rawPoint.endsWith('+')?1:rawPoint.endsWith('-')?-1:0,point=safeEval(direction?rawPoint.slice(0,-1):rawPoint),source=e.formula||'X',steps=[1e-4,1e-5,1e-6],values=steps.map(h=>direction?safeEval(source,point+direction*h):(safeEval(source,point-h)+safeEval(source,point+h))/2);value=values[values.length-1];if(!Number.isFinite(value)||Math.abs(values[2]-values[1])>1e-4*Math.max(1,Math.abs(value)))throw Error();detail='lim X→'+point+(direction>0?'+':direction<0?'-':'')+' ('+source+')'}else{const x=safeEval(e.point),source=e.formula||'X',h=Math.max(1e-6,Math.abs(x)*1e-6);value=(safeEval(source,x+h)-safeEval(source,x-h))/(2*h);detail='d/dX('+source+') em X='+x}structuredEntry=null;setComputedValue(value,e.type==='yroot'?'Raiz de índice '+e.index:e.type==='integral'?'Integral':e.type==='summation'?'Somatório':e.type==='product'?'Produtório':e.type==='limit'?'Limite':'Derivada',detail);resultShown=true;lastFormula=detail;updateDisplay()}catch{$('#expression').textContent='Preencha todos os campos corretamente'}
}
function handleStructuredPress(k){
  const fields=structuredFields(),index=fields.indexOf(structuredEntry.field);
  if(k==='cursorLeft'||k==='cursorRight'){const delta=k==='cursorLeft'?-1:1;structuredEntry.field=fields[(index+delta+fields.length)%fields.length];updateDisplay();return true}
  if(k==='clear'){structuredEntry=null;expr='';cursorPosition=0;updateDisplay();return true}
  if(k==='back'){const f=structuredEntry.field;structuredEntry[f]=structuredEntry[f].slice(0,-1);updateDisplay();return true}
  if(k==='equal'){finishStructuredEntry();return true}
  const token=structuredToken(k);if(token!==null){structuredEntry[structuredEntry.field]+=token;updateDisplay();return true}
  return true
}
function renderStructuredEntry(){
  const e=structuredEntry,slot=(name,value)=>'<span class="math-entry-slot '+(e.field===name?'active':'')+'">'+(value?formatMath(value):'□')+'</span>';
  if(e.type==='yroot')return '<span class="nth-root-template"><sup>'+slot('index',e.index)+'</sup><span class="nth-root-symbol">√</span><span class="nth-root-radicand">'+slot('radicand',e.radicand)+'</span></span>';if(e.type==='integral')return '<span class="integral-template"><span class="integral-limits"><span>'+slot('upper',e.upper)+'</span><span>'+slot('lower',e.lower)+'</span></span><span class="integral-symbol">∫</span><span class="integral-formula">'+slot('formula',e.formula)+'</span><span class="integral-dx">dX</span></span>';if(e.type==='summation'||e.type==='product')return '<span class="series-template"><span class="series-operator"><span>'+slot('upper',e.upper)+'</span><strong>'+(e.type==='summation'?'Σ':'Π')+'</strong><small>X = '+slot('lower',e.lower)+'</small></span><span class="series-formula">('+slot('formula',e.formula)+')</span></span>';
  if(e.type==='limit')return '<span class="limit-template"><span class="limit-operator"><span>lim</span><small>X → '+slot('point',e.point)+'</small></span><span>(</span>'+slot('formula',e.formula)+'<span>)</span></span>'+(!/\d/.test(e.formula)?'<button type="button" class="limit-info-button" aria-label="Informações sobre limite">i</button>':'');
  return '<span class="derivative-template"><span class="derivative-frac"><span>d</span><span>dX</span></span><span>(</span>'+slot('formula',e.formula)+'<span>)</span><sub>X = '+slot('point',e.point)+'</sub></span>'
}
function parseSimpleComplex(value){
  const s=String(value).replace(/\s+/g,'').replace(/−/g,'-');
  if(!s.includes('i'))return {re:safeEval(s),im:0};
  if(!/^[+\-]?\d*(?:\.\d+)?(?:[+\-]\d*(?:\.\d+)?)?i$/.test(s))throw Error();
  const body=s.slice(0,-1);let split=-1;for(let j=1;j<body.length;j++)if(body[j]==='+'||body[j]==='-')split=j;
  if(split<0){const im=body===''||body==='+'?1:body==='-'?-1:Number(body);return {re:0,im}}
  const re=Number(body.slice(0,split)),part=body.slice(split),im=part==='+'?1:part==='-'?-1:Number(part);if(!Number.isFinite(re)||!Number.isFinite(im))throw Error();return {re,im}
}
function formatComplex(z){if(Math.abs(z.im)<1e-14)return String(+z.re.toPrecision(12));const re=Math.abs(z.re)<1e-14?'':String(+z.re.toPrecision(12));const imAbs=String(+Math.abs(z.im).toPrecision(12));if(!re)return (z.im<0?'-':'')+(imAbs==='1'?'':imAbs)+'i';return re+(z.im<0?' − ':' + ')+(imAbs==='1'?'':imAbs)+'i'}
function openMathDialog(type){
  document.querySelector('.math-overlay')?.remove();
  const overlay=document.createElement('div');overlay.className='converter-overlay math-overlay';
  const isIntegral=type==='integral',isDerivative=type==='derivative';
  const title=isIntegral?'Integral definida':isDerivative?'Derivada numérica':'Logaritmo com base';
  const formula=(expr||'X').replace(/"/g,'&quot;');
  overlay.innerHTML='<div class="converter-dialog math-dialog" role="dialog" aria-modal="true"><h3>'+title+'</h3><label>Expressão<input id="mathFormula" value="'+formula+'"></label><div class="math-fields"></div><div class="converter-actions"><button type="button" class="converter-cancel">Cancelar</button><button type="button" class="converter-confirm">Calcular</button></div></div>';
  document.body.appendChild(overlay);const fields=overlay.querySelector('.math-fields');
  if(isIntegral)fields.innerHTML='<label>Limite inferior<input id="mathA" value="0"></label><label>Limite superior<input id="mathB" value="1"></label>';
  else if(isDerivative)fields.innerHTML='<label>Calcular em X =<input id="mathPoint" value="0"></label>';
  else fields.innerHTML='<label>Base<input id="mathBase" value="10"></label><label>Valor<input id="mathValue" value="'+(expr||'100')+'"></label>';
  overlay.querySelector('.converter-cancel').onclick=()=>overlay.remove();overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
  overlay.querySelector('.converter-confirm').onclick=()=>{try{
    let result,detail;
    if(isIntegral){const source=overlay.querySelector('#mathFormula').value,a=Number(overlay.querySelector('#mathA').value.replace(',','.')),b=Number(overlay.querySelector('#mathB').value.replace(',','.'));if(!Number.isFinite(a)||!Number.isFinite(b))throw Error();const n=1000,h=(b-a)/n;let sum=safeEval(source,a)+safeEval(source,b);for(let j=1;j<n;j++)sum+=(j%2?4:2)*safeEval(source,a+j*h);result=sum*h/3;detail='∫['+a+','+b+'] '+source+' dX'}
    else if(isDerivative){const source=overlay.querySelector('#mathFormula').value,x=Number(overlay.querySelector('#mathPoint').value.replace(',','.')),h=Math.max(1e-6,Math.abs(x)*1e-6);result=(safeEval(source,x+h)-safeEval(source,x-h))/(2*h);detail='d/dX '+source+' em '+x}
    else{const base=safeEval(overlay.querySelector('#mathBase').value),value=safeEval(overlay.querySelector('#mathValue').value);if(base<=0||base===1||value<=0)throw Error();result=Math.log(value)/Math.log(base);detail='log base '+base+' de '+value}
    setComputedValue(result,isIntegral?'Integral':isDerivative?'Derivada':'Logaritmo',detail);overlay.remove();updateDisplay()
  }catch{$('#expression').textContent='Não foi possível calcular';}};
}
function cameraOcrLines(raw){return String(raw||'').split(/\n+/).map(line=>line.trim()).filter(Boolean)}
function cleanCameraOcrLine(raw){
  return String(raw||'').replace(/[−–—_=|]/g,char=>/[−–—]/.test(char)?'-':'').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/([xX])\s*(?:[?°º*]|2)(?=\s*[-+)]|$)/g,'$1^2').replace(/\s+/g,'').replace(/[^0-9A-Za-zπ√∛+\-*/^().,%]/g,'')
}
function scoreCameraOcrLine(line){
  const foreign=(line.match(/[A-Za-z]/g)||[]).filter(char=>!/[xy]/i.test(char)).length,operators=(line.match(/[+\-/^]/g)||[]).length,variables=(line.match(/[xXyY]/g)||[]).length,powers=(line.match(/\^2|\^3/g)||[]).length;
  return line.length+operators*4+variables*3+powers*5-foreign*9
}
function combineCameraOcr(primary,alternate){
  const a=cameraOcrLines(primary),b=cameraOcrLines(alternate),count=Math.max(a.length,b.length),lines=[];
  for(let i=0;i<count;i++){let first=cleanCameraOcrLine(a[i]||''),second=cleanCameraOcrLine(b[i]||'');if(/^\d+$/.test(first)&&/^\d+[xX]$/.test(second)){const digits=second.slice(0,-1);if(first.endsWith(digits))second=first+'x'}else if(/^\d+[xX]$/.test(first)&&/^\d+$/.test(second)){const digits=first.slice(0,-1);if(second.endsWith(digits))first=second+'x'}const chosen=scoreCameraOcrLine(second)>scoreCameraOcrLine(first)?second:first;if(chosen)lines.push(chosen)}
  let text=lines.length===2?'('+lines[0]+')/('+lines[1]+')':lines.join('');
  return text.replace(/√\s*([0-9A-Za-z.]+)/g,'√($1)').replace(/([0-9)])(?=√|\()/g,'$1*').replace(/([0-9)])([xXyY])/g,'$1*$2')
}
async function prepareCameraOcrImage(image){
  const bitmap=await createImageBitmap(image),scale=Math.min(4,Math.max(2,1400/Math.max(1,bitmap.width))),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.filter='grayscale(1) contrast(165%)';context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();return canvas
}
async function loadCameraOcr(){
  if(window.__wosvipOcrWorkerPromise)return window.__wosvipOcrWorkerPromise;
  window.__wosvipOcrWorkerPromise=(async()=>{
    if(!window.Tesseract){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';script.crossOrigin='anonymous';script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar o reconhecimento'));document.head.appendChild(script)})}
    if(!window.Tesseract)throw new Error('OCR indisponível');
    return window.Tesseract.createWorker('eng',1,{logger:message=>{if(window.__wosvipOcrProgress&&message.status==='recognizing text'){const value=window.__wosvipOcrPhase+(message.progress||0)*window.__wosvipOcrRange;window.__wosvipOcrProgress(Math.min(99,Math.round(value)))}}})
  })();
  return window.__wosvipOcrWorkerPromise
}
function cameraFractionRegions(canvas){
  const context=canvas.getContext('2d',{willReadFrequently:true}),width=canvas.width,height=canvas.height,data=context.getImageData(0,0,width,height).data,rows=[];
  for(let y=Math.round(height*.18);y<Math.round(height*.82);y++){let dark=0,minX=width,maxX=-1;for(let x=0;x<width;x++){const i=(y*width+x)*4,luma=(data[i]*299+data[i+1]*587+data[i+2]*114)/1000;if(luma<105){dark++;if(x<minX)minX=x;if(x>maxX)maxX=x}}rows.push({y,dark,minX,maxX,span:maxX>=minX?maxX-minX+1:0})}
  rows.sort((a,b)=>b.span-a.span||b.dark-a.dark);const bar=rows[0];if(!bar||bar.span<width*.32||bar.dark<width*.24)return null;
  let top=bar.y,bottom=bar.y;while(top>1&&rows.some(r=>r.y===top-1&&r.span>width*.25))top--;while(bottom<height-2&&rows.some(r=>r.y===bottom+1&&r.span>width*.25))bottom++;
  const padX=Math.max(8,Math.round(bar.span*.08)),left=Math.max(0,bar.minX-padX),right=Math.min(width,bar.maxX+padX),upperTop=Math.max(0,Math.round(height*.04)),lowerBottom=Math.min(height,Math.round(height*.96));
  if(top-upperTop<height*.08||lowerBottom-bottom<height*.08)return null;
  return {numerator:{x:left,y:upperTop,width:right-left,height:top-upperTop},denominator:{x:left,y:bottom+1,width:right-left,height:lowerBottom-bottom-1}}
}
function cameraCropCanvas(source,box){
  const canvas=document.createElement('canvas'),scale=1.35;canvas.width=Math.max(1,Math.round(box.width*scale));canvas.height=Math.max(1,Math.round(box.height*scale));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(source,box.x,box.y,box.width,box.height,0,0,canvas.width,canvas.height);return canvas
}
function cleanCameraFractionPart(value){
  return String(value||'').replace(/[|_]/g,'').replace(/[×·]/g,'*').replace(/[—–−]/g,'-').replace(/\s+/g,'').replace(/([0-9)])([XY])/g,(match,digit,variable)=>digit+variable.toLowerCase()).replace(/[XY](?=[0-9(])/g,variable=>variable.toLowerCase()).replace(/[?]/g,'^2').replace(/²/g,'^2').replace(/³/g,'^3').replace(/[^0-9xXyY+\-*/().^√=]/g,'')
}
function readLatexGroup(text,start){
  if(text[start]!=='{')return null;let depth=0;
  for(let i=start;i<text.length;i++){if(text[i]==='{')depth++;else if(text[i]==='}'&&--depth===0)return {value:text.slice(start+1,i),end:i+1}}
  return null
}
function expandLatexFractions(value){
  let text=String(value||'');
  for(let guard=0;guard<12;guard++){const match=/\\(?:d|t)?frac\s*\{/.exec(text);if(!match)break;const firstStart=match.index+match[0].lastIndexOf('{'),first=readLatexGroup(text,firstStart);if(!first)break;let secondStart=first.end;while(/\s/.test(text[secondStart]||''))secondStart++;const second=readLatexGroup(text,secondStart);if(!second)break;text=text.slice(0,match.index)+'('+expandLatexFractions(first.value)+')/('+expandLatexFractions(second.value)+')'+text.slice(second.end)}
  return text
}
function latexToCalculator(value){
  let text=expandLatexFractions(String(value||'').replace(/\\left|\\right/g,''));
  text=text.replace(/^\s*\d+\.\s+(?=(?:\d+\s*)?[xXyY])/,'');
  for(let guard=0;guard<8;guard++){const match=/\\sqrt\s*\{/.exec(text);if(!match)break;const start=match.index+match[0].lastIndexOf('{'),group=readLatexGroup(text,start);if(!group)break;text=text.slice(0,match.index)+'√('+latexToCalculator(group.value)+')'+text.slice(group.end)}
  text=text.replace(/\\(?:cdot|times)/g,'*').replace(/\\div/g,'/').replace(/\\(?:mathrm|text|operatorname)\s*\{([^{}]*)\}/g,'$1').replace(/\^\s*\{(-?\d+(?:\.\d+)?)\}/g,'^$1').replace(/\^\s*\{([^{}]+)\}/g,'^($1)').replace(/_\s*\{[^{}]*\}/g,'').replace(/[{}]/g,'').replace(/[×·]/g,'*').replace(/[—–−]/g,'-').replace(/\\,/g,'').replace(/\\[a-zA-Z]+/g,'').replace(/\s+/g,'').replace(/X/g,'x').replace(/Y/g,'y');
  text=text.replace(/\^\((-?\d+(?:\.\d+)?)\)/g,'^$1').replace(/(\d|x|y|\))(?=x|y|\()/g,'$1*').replace(/\)(?=\d)/g,')*').replace(/[^0-9xy+\-*/().^√=]/g,'').replace(/\.$/,'');
  const splitMinus=text.match(/^\(([^()]+)\)\/\(([^()]+)\)\*?\(([^()]+)\)\/\(([^()]+)\)$/);if(splitMinus)text='('+splitMinus[1]+'-'+splitMinus[3]+')/('+splitMinus[2]+'-'+splitMinus[4]+')';
  return text
}
async function cameraImageBlob(image){
  if(image instanceof Blob)return image;
  if(typeof image==='string')return fetch(image).then(response=>response.blob());
  if(image instanceof HTMLCanvasElement)return new Promise((resolve,reject)=>image.toBlob(blob=>blob?resolve(blob):reject(new Error('Imagem inválida')),'image/png'));
  throw new Error('Formato de imagem incompatível')
}
async function recognizeFormulaModel(image,onProgress){
  if(!window.Worker)throw new Error('Leitor matemático incompatível');
  if(!window.__wosvipFormulaWorker){
    const worker=new Worker('./formula-ocr-worker.js?v=1',{type:'module'});window.__wosvipFormulaWorker=worker;window.__wosvipFormulaJobs=new Map();
    worker.onmessage=event=>{const data=event.data||{},job=window.__wosvipFormulaJobs.get(data.id);if(!job)return;if(data.type==='progress'){job.onProgress?.(Math.max(1,Math.min(99,Math.round(data.value||0))))}else if(data.type==='result'){window.__wosvipFormulaJobs.delete(data.id);job.resolve(data.text)}else if(data.type==='error'){window.__wosvipFormulaJobs.delete(data.id);job.reject(new Error(data.message||'Falha no leitor matemático'))}};
    worker.onerror=()=>{for(const job of window.__wosvipFormulaJobs.values())job.reject(new Error('Falha ao carregar o leitor matemático'));window.__wosvipFormulaJobs.clear();window.__wosvipFormulaWorker=null}
  }
  const blob=await cameraImageBlob(image),id='formula-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  return new Promise((resolve,reject)=>{window.__wosvipFormulaJobs.set(id,{resolve,reject,onProgress});window.__wosvipFormulaWorker.postMessage({id,type:'recognize',image:blob})})
}
async function recognizeCameraMath(image,onProgress){
  try{
    onProgress?.(1);const latex=await recognizeFormulaModel(image,onProgress),formula=latexToCalculator(latex);
    if(formula&&/[0-9xy]/.test(formula)){onProgress?.(100);return formula}
  }catch(error){console.warn('Leitor matemático principal indisponível; usando reserva.',error)}
  const worker=await loadCameraOcr(),prepared=await prepareCameraOcrImage(image);window.__wosvipOcrProgress=onProgress;
  try{
    const regions=cameraFractionRegions(prepared);
    if(regions){
      await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789xXyY+-*/()^√.=²³',preserve_interword_spaces:'1'});
      window.__wosvipOcrPhase=0;window.__wosvipOcrRange=42;const numeratorResult=await worker.recognize(cameraCropCanvas(prepared,regions.numerator));
      window.__wosvipOcrPhase=45;window.__wosvipOcrRange=42;const denominatorResult=await worker.recognize(cameraCropCanvas(prepared,regions.denominator));
      const numerator=cleanCameraFractionPart(numeratorResult.data&&numeratorResult.data.text),denominator=cleanCameraFractionPart(denominatorResult.data&&denominatorResult.data.text);
      if(numerator&&denominator&&/[0-9xXyY]/.test(numerator)&&/[0-9xXyY]/.test(denominator)){onProgress?.(100);return '('+numerator+')/('+denominator+')'}
    }
    window.__wosvipOcrPhase=0;window.__wosvipOcrRange=46;await worker.setParameters({tessedit_pageseg_mode:'6',tessedit_char_whitelist:'',preserve_interword_spaces:'1'});const primary=await worker.recognize(prepared);
    window.__wosvipOcrPhase=50;window.__wosvipOcrRange=46;await worker.setParameters({tessedit_pageseg_mode:'11',tessedit_char_whitelist:'0123456789xXyY+-*/()^√.=²³',preserve_interword_spaces:'1'});const alternate=await worker.recognize(prepared);
    onProgress?.(100);return combineCameraOcr(primary.data&&primary.data.text,alternate.data&&alternate.data.text)
  }finally{window.__wosvipOcrProgress=null}
}
function openCalculatorCamera(){
  document.querySelector('.math-camera-screen')?.remove();
  const screen=document.createElement('div');screen.className='math-camera-screen';
  screen.innerHTML='<header class="math-camera-header"><button class="math-camera-close" type="button" aria-label="Fechar">←</button><strong>Fotografe a expressão matemática</strong></header><main class="math-camera-body"><div class="math-camera-stage"><video autoplay playsinline muted></video><div class="math-camera-frame"></div><p>Centralize somente a fórmula dentro da moldura</p></div></main><footer class="math-camera-controls"><button class="math-camera-gallery" type="button">Imagem</button><button class="math-camera-shot" type="button" aria-label="Fotografar"></button><span></span></footer><input class="math-camera-file" type="file" accept="image/*" hidden>';
  document.body.appendChild(screen);
  const video=screen.querySelector('video'),fileInput=screen.querySelector('.math-camera-file'),stage=screen.querySelector('.math-camera-stage'),frame=screen.querySelector('.math-camera-frame');let stream=null;
  const stop=()=>{if(stream)stream.getTracks().forEach(track=>track.stop());stream=null};
  const close=()=>{stop();screen.remove()};
  const pointers=new Map();let gesture=null;
  const frameBox=()=>{const stageRect=stage.getBoundingClientRect(),frameRect=frame.getBoundingClientRect();return {left:frameRect.left-stageRect.left,top:frameRect.top-stageRect.top,width:frameRect.width,height:frameRect.height}};
  const applyFrameBox=box=>{const stageWidth=stage.clientWidth,stageHeight=stage.clientHeight,width=Math.max(70,Math.min(stageWidth,box.width)),height=Math.max(55,Math.min(stageHeight,box.height)),left=Math.max(0,Math.min(stageWidth-width,box.left)),top=Math.max(0,Math.min(stageHeight-height,box.top));frame.style.left=left+'px';frame.style.top=top+'px';frame.style.width=width+'px';frame.style.height=height+'px';frame.style.right='auto'};
  const resetGesture=()=>{const points=[...pointers.values()],box=frameBox();if(points.length===1)gesture={mode:'move',x:points[0].x,y:points[0].y,box};else if(points.length>=2){const a=points[0],b=points[1],dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y),distance=Math.hypot(b.x-a.x,b.y-a.y);gesture={mode:'resize',dx,dy,distance,midX:(a.x+b.x)/2,midY:(a.y+b.y)/2,box}}else gesture=null};
  const pointerDown=event=>{event.preventDefault();stage.setPointerCapture?.(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});resetGesture()};
  const pointerMove=event=>{if(!pointers.has(event.pointerId))return;event.preventDefault();pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...pointers.values()];if(!gesture)return;if(points.length===1&&gesture.mode==='move'){applyFrameBox({...gesture.box,left:gesture.box.left+points[0].x-gesture.x,top:gesture.box.top+points[0].y-gesture.y})}else if(points.length>=2&&gesture.mode==='resize'){const a=points[0],b=points[1],dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y),distance=Math.hypot(b.x-a.x,b.y-a.y),uniform=distance/Math.max(20,gesture.distance),scaleX=gesture.dx>=25?dx/gesture.dx:uniform,scaleY=gesture.dy>=25?dy/gesture.dy:uniform,width=gesture.box.width*Math.max(.25,scaleX),height=gesture.box.height*Math.max(.25,scaleY),midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;applyFrameBox({width,height,left:gesture.box.left+(midX-gesture.midX)-(width-gesture.box.width)/2,top:gesture.box.top+(midY-gesture.midY)-(height-gesture.box.height)/2})}};
  const pointerUp=event=>{if(!pointers.has(event.pointerId))return;event.preventDefault();pointers.delete(event.pointerId);resetGesture()};
  stage.addEventListener('pointerdown',pointerDown,{passive:false});stage.addEventListener('pointermove',pointerMove,{passive:false});stage.addEventListener('pointerup',pointerUp,{passive:false});stage.addEventListener('pointercancel',pointerUp,{passive:false});
  screen.querySelector('.math-camera-close').onclick=close;
  function showEditor(image,recognized,message){
    screen.innerHTML='<header class="math-camera-header"><button class="math-camera-close" type="button">←</button><strong>Revisar expressão</strong></header><main class="math-camera-review"><img alt="Expressão fotografada"><label>Expressão reconhecida<div class="math-camera-rendered"></div><input class="math-camera-expression" autocomplete="off" spellcheck="false" placeholder="Digite ou corrija a fórmula"></label><p class="math-camera-message"></p><div class="math-camera-review-actions"><button class="math-camera-retry" type="button">Tentar novamente</button><button class="math-camera-insert" type="button">Inserir no visor</button></div></main>';
    const preview=screen.querySelector('img');preview.src=typeof image==='string'?image:URL.createObjectURL(image);
    const field=screen.querySelector('.math-camera-expression'),rendered=screen.querySelector('.math-camera-rendered');field.value=recognized||'';const refreshRendered=()=>{rendered.innerHTML=field.value?formatMath(field.value):'<span>Fórmula não reconhecida</span>'};field.addEventListener('input',refreshRendered);refreshRendered();
    screen.querySelector('.math-camera-message').textContent=message||'Confira a fórmula antes de inserir.';
    screen.querySelector('.math-camera-close').onclick=close;
    screen.querySelector('.math-camera-retry').onclick=()=>{close();openCalculatorCamera()};
    screen.querySelector('.math-camera-insert').onclick=()=>{const value=field.value.trim();if(!value){screen.querySelector('.math-camera-message').textContent='Digite ou reconheça uma expressão.';field.focus();return}expr=value;cursorPosition=expr.length;lastFormula='';resultShown=false;close();updateDisplay()};
    field.focus()
  }
  async function processImage(image){
    stop();screen.classList.add('recognizing');
    const body=screen.querySelector('.math-camera-body');body.innerHTML='<div class="math-camera-loading"><div class="math-camera-spinner"></div><strong>Reconhecendo a expressão…</strong><span>0%</span><small>Na primeira utilização, o modelo matemático será baixado e salvo no aparelho.</small></div>';
    try{const value=await recognizeCameraMath(image,percent=>{const label=screen.querySelector('.math-camera-loading span');if(label)label.textContent=percent+'%'});showEditor(image,value,value?'Reconhecimento concluído. Corrija se necessário.':'Não consegui identificar tudo. Digite a fórmula no campo.')}catch(error){showEditor(image,'','O reconhecimento automático não ficou disponível. Digite a fórmula no campo.')}
  }
  screen.querySelector('.math-camera-gallery').onclick=()=>fileInput.click();
  fileInput.onchange=()=>{const file=fileInput.files&&fileInput.files[0];if(file)processImage(file)};
  screen.querySelector('.math-camera-shot').onclick=()=>{
    if(!video.videoWidth){fileInput.click();return}
    const stageRect=stage.getBoundingClientRect(),frameRect=frame.getBoundingClientRect(),scale=Math.max(stageRect.width/video.videoWidth,stageRect.height/video.videoHeight),drawnWidth=video.videoWidth*scale,drawnHeight=video.videoHeight*scale,offsetX=(stageRect.width-drawnWidth)/2,offsetY=(stageRect.height-drawnHeight)/2;
    let sourceX=(frameRect.left-stageRect.left-offsetX)/scale,sourceY=(frameRect.top-stageRect.top-offsetY)/scale,sourceWidth=frameRect.width/scale,sourceHeight=frameRect.height/scale;sourceX=Math.max(0,Math.min(video.videoWidth-1,sourceX));sourceY=Math.max(0,Math.min(video.videoHeight-1,sourceY));sourceWidth=Math.max(1,Math.min(video.videoWidth-sourceX,sourceWidth));sourceHeight=Math.max(1,Math.min(video.videoHeight-sourceY,sourceHeight));
    const crop=document.createElement('canvas');crop.width=Math.round(sourceWidth);crop.height=Math.round(sourceHeight);crop.getContext('2d').drawImage(video,sourceX,sourceY,sourceWidth,sourceHeight,0,0,crop.width,crop.height);crop.toBlob(blob=>{if(blob)processImage(blob)},'image/jpeg',.94)
  };
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(media=>{stream=media;video.srcObject=media}).catch(()=>{screen.querySelector('.math-camera-stage p').textContent='A câmera não foi liberada. Toque em Imagem para escolher uma foto.'});
  else screen.querySelector('.math-camera-stage p').textContent='Toque em Imagem para escolher uma foto.'
}
function openQuickConverter(){
  let current=0;try{current=expr?safeEval(closeParentheses(expr)):0}catch{}
  document.querySelector('.converter-screen')?.remove();
  const groups={
    'Distância':{m:1,km:1000,cm:.01,mm:.001,'pol':.0254,'pé':.3048,'mi':1609.344},
    'Área':{'m²':1,'km²':1e6,'cm²':1e-4,'mm²':1e-6,'ha':1e4},
    'Volume':{'m³':1,L:.001,mL:1e-6,'cm³':1e-6,'gal':.003785411784},
    'Massa':{kg:1,g:.001,mg:1e-6,t:1000,lb:.45359237,'oz':.028349523125},
    'Hora':{s:1,min:60,h:3600,dia:86400},
    'Velocidade':{'m/s':1,'km/h':1/3.6,'mph':.44704,'nó':.514444},
    'Frequência':{Hz:1,kHz:1000,MHz:1e6,GHz:1e9,rpm:1/60},
    'Força':{N:1,kN:1000,'kgf':9.80665,'lbf':4.4482216153},
    'Torque':{'N·m':1,'kN·m':1000,'kgf·m':9.80665,'lbf·ft':1.3558179483},
    'Pressão':{Pa:1,kPa:1000,MPa:1e6,bar:1e5,psi:6894.7572932,atm:101325},
    'Energia':{J:1,kJ:1000,Wh:3600,kWh:3.6e6,cal:4.184},
    'Potência':{W:1,kW:1000,MW:1e6,'cv':735.49875,'hp':745.699872},
    'Temperatura':{'°C':'C','°F':'F',K:'K'},
    'Ângulo':{rad:1,'grau':Math.PI/180,'grad':Math.PI/200}
  };
  const screen=document.createElement('div');screen.className='converter-screen';document.body.appendChild(screen);
  function header(title,back){return '<header class="converter-screen-header"><button class="converter-back" type="button" aria-label="Voltar">'+(back?'←':'×')+'</button><strong>'+title+'</strong></header>'}
  function showCategories(){screen.innerHTML=header('Conversão de unidades',false)+'<main class="converter-category-list">'+Object.keys(groups).map(name=>'<button type="button" data-category="'+name+'"><span>'+name+'</span><span>›</span></button>').join('')+'</main>';screen.querySelector('.converter-back').onclick=()=>screen.remove();screen.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>showCategory(button.dataset.category))}
  function showCategory(name){
    const table=groups[name],units=Object.keys(table);
    const unitNames={m:'Metros',km:'Quilômetros',cm:'Centímetros',mm:'Milímetros',pol:'Polegadas','pé':'Pés',mi:'Milhas','m²':'Metros Quadrados','km²':'Quilômetros Quadrados','cm²':'Centímetros Quadrados','mm²':'Milímetros Quadrados',ha:'Hectare','m³':'Metros Cúbicos',L:'Litros',mL:'Mililitros','cm³':'Centímetros Cúbicos',gal:'Galões',kg:'Quilogramas',g:'Gramas',mg:'Miligramas',t:'Toneladas',lb:'Libras',oz:'Onças',s:'Segundos',min:'Minutos',h:'Horas',dia:'Dias','m/s':'Metros por Segundo','km/h':'Quilômetros por Hora',mph:'Milhas por Hora','nó':'Nós',Hz:'Hertz',kHz:'Quilohertz',MHz:'Megahertz',GHz:'Gigahertz',rpm:'Rotações por Minuto',N:'Newtons',kN:'Quilonewtons',kgf:'Quilograma-força',lbf:'Libra-força','N·m':'Newton-metro','kN·m':'Quilonewton-metro','kgf·m':'Quilograma-força metro','lbf·ft':'Libra-força pé',Pa:'Pascal',kPa:'Quilopascal',MPa:'Megapascal',bar:'Bar',psi:'PSI',atm:'Atmosfera',J:'Joules',kJ:'Quilojoules',Wh:'Watt-hora',kWh:'Quilowatt-hora',cal:'Calorias',W:'Watts',kW:'Quilowatts',MW:'Megawatts',cv:'Cavalo-vapor',hp:'Horsepower','°C':'Graus Celsius','°F':'Graus Fahrenheit',K:'Kelvin',rad:'Radianos',grau:'Graus',grad:'Gradianos'};
    screen.innerHTML=header('Conversão de unidades: '+name,true)+'<main class="converter-all-detail"><div class="converter-source-label">CONVERTER</div><div class="converter-source-box"><input id="allConvValue" inputmode="decimal" value="'+current+'"><select id="allConvFrom">'+units.map(u=>'<option>'+u+'</option>').join('')+'</select></div><div class="converter-target-label">PARA</div><div class="converter-results-list">'+units.map(u=>'<div class="converter-result-row" data-unit="'+u+'"><div><strong>'+u+'</strong><span>'+unitNames[u]+'</span></div><output>0</output></div>').join('')+'</div></main>';
    screen.querySelector('.converter-back').onclick=showCategories;
    const input=screen.querySelector('#allConvValue'),from=screen.querySelector('#allConvFrom');
    function convertOne(value,target){if(name==='Temperatura'){let c=from.value==='°C'?value:from.value==='°F'?(value-32)*5/9:value-273.15;return target==='°C'?c:target==='°F'?c*9/5+32:c+273.15}return value*table[from.value]/table[target]}
    function refresh(){const value=Number(input.value.replace(',','.'));screen.querySelectorAll('.converter-result-row').forEach(row=>{const output=row.querySelector('output');if(!Number.isFinite(value)){output.textContent='—';return}const result=convertOne(value,row.dataset.unit);output.textContent=String(+result.toPrecision(12))});if(Number.isFinite(value))current=value}
    input.oninput=refresh;from.onchange=refresh;refresh()
  }
  showCategories()
}
function press(k){if(structuredEntry&&k!=='shift')return handleStructuredPress(k);const confirmedResult=resultShown;if(confirmedResult&&/^[0-9.]$/.test(k)){expr='';cursorPosition=0;lastFormula=''}if(k!=='equal'&&k!=='shift'&&k!=='cursorLeft'&&k!=='cursorRight')resultShown=false;if(k==='shift'){setShift(!shiftActive);return}if(k==='cursorLeft'){cursorPosition=Math.max(0,cursorPosition-1);updateDisplay();return}else if(k==='cursorRight'){cursorPosition=Math.min(expr.length,cursorPosition+1);updateDisplay();return}else if(k==='clear'){expr='';lastFormula='';cursorPosition=0;}else if(k==='back'){if(cursorPosition>0){expr=expr.slice(0,cursorPosition-1)+expr.slice(cursorPosition);cursorPosition--}}else if(k==='equal')calculate();else if(k==='neg'){expr=expr?`-(${expr})`:'-';cursorPosition=expr.length;}else if(k==='mode'){angleMode=angleMode==='DEG'?'RAD':'DEG';localStorage.setItem('wosvipAngleMode',angleMode);updateAngleMode()}else if(k==='limit'){startStructuredEntry('limit');return}else if(k==='yroot'){startStructuredEntry('yroot');return}else if(k==='fraction'){try{expr=approximateFraction(safeEval(closeParentheses(expr)))}catch{$('#expression').textContent='Não foi possível converter'}}else if(k==='sci'){try{expr=safeEval(closeParentheses(expr)).toExponential(10)}catch{$('#expression').textContent='Expressão inválida'}}else if(k==='dms'){try{const v=safeEval(closeParentheses(expr)),d=Math.trunc(v),m=Math.trunc(Math.abs(v-d)*60),s=(Math.abs(v-d)*60-m)*60;lastFormula=expr;expr=`${d}°${m}′${+s.toPrecision(8)}″`;addHistory('DMS',lastFormula,expr)}catch{$('#expression').textContent='Expressão inválida'}}else if(k==='stats'){try{const values=expr.split(',').map(v=>safeEval(closeParentheses(v.trim()))).filter(Number.isFinite);if(!values.length)throw Error();const mean=values.reduce((a,b)=>a+b,0)/values.length;lastFormula=`Média de ${values.join(', ')}`;expr=String(+mean.toPrecision(12));addHistory('Estatística',lastFormula,expr)}catch{$('#expression').textContent='Digite valores separados por vírgula'}}else if(k==='variables'){const before=expr[cursorPosition-1];if(before==='X')expr=expr.slice(0,cursorPosition-1)+'Y'+expr.slice(cursorPosition);else if(before==='Y')expr=expr.slice(0,cursorPosition-1)+'M'+expr.slice(cursorPosition);else insertAtCursor('X')}else if(k==='memoryRecall'){insertAtCursor(String(memoryValue));$('#expression').textContent=`MR = ${memoryValue}`}else if(k==='memoryStore'){try{memoryValue=safeEval(closeParentheses(expr));localStorage.setItem('wosvipMemory',String(memoryValue));$('#expression').textContent=`M = ${memoryValue}`}catch{$('#expression').textContent='Nada válido para armazenar'}}else if(k==='memoryAdd'||k==='memorySubtract'){try{const value=safeEval(closeParentheses(expr));memoryValue+=k==='memoryAdd'?value:-value;localStorage.setItem('wosvipMemory',String(memoryValue));$('#expression').textContent=`M = ${memoryValue}`}catch{$('#expression').textContent='Expressão inválida'}}else if(k==='showHistory'){const lines=history.slice(0,10).map((h,i)=>`${i+1}. ${h.detail} = ${h.result}`);alert(lines.length?lines.join('\n'):'Histórico vazio')}
else if(k==='integral'||k==='derivative'||k==='summation'||k==='product'){startStructuredEntry(k);return}
else if(k==='logBase'){openMathDialog('logBase');return}
else if(k==='camera'){openCalculatorCamera();return}
else if(k==='imaginary')insertAtCursor('i')
else if(k==='complexAngle'){try{const z=parseSimpleComplex(expr),angle=Math.atan2(z.im,z.re)*(angleMode==='DEG'?180/Math.PI:1);setComputedValue(angle,'Ângulo complexo','∠('+expr+')')}catch{$('#expression').textContent='Use um complexo como 2+3i';return}}
else if(k==='infinity')insertAtCursor('Infinity')
else if(k==='percent')insertAtCursor('%')
else if(k==='mod')insertAtCursor(' mod ')
else if(k==='absolute')insertAtCursor('abs(')
else if(k==='other')insertAtCursor(',')
else if(k==='answer')insertAtCursor(String(lastAnswer))
else if(k==='random'){const v=Math.random();setComputedValue(v,'Aleatório','ran#')}
else if(k==='factorial'){try{const n=safeEval(closeParentheses(expr));setComputedValue(factorialValue(n),'Fatorial',n+'!')}catch{$('#expression').textContent='Fatorial exige inteiro entre 0 e 170';return}}
else if(k==='ncr'||k==='npr'){try{const n=safeEval(closeParentheses(expr)),raw=prompt(k==='ncr'?'Digite r para nCr:':'Digite r para nPr:','2');if(raw===null)return;const r=Number(raw),value=k==='ncr'?combinationValue(n,r):combinationValue(n,r)*factorialValue(r);setComputedValue(value,k==='ncr'?'Combinação':'Permutação',n+(k==='ncr'?' nCr ':' nPr ')+r)}catch{$('#expression').textContent='Use números inteiros com 0 ≤ r ≤ n';return}}
else if(k==='bin'||k==='oct'||k==='hex'||k==='dec'||k==='base10'){try{const v=Math.trunc(safeEval(closeParentheses(expr))),base=k==='bin'?2:k==='oct'?8:k==='hex'?16:10;expr=v.toString(base).toUpperCase();cursorPosition=expr.length;addHistory('Conversão de base',v+' para base '+base,expr)}catch{$('#expression').textContent='Valor inválido para conversão';return}}
else if(k==='engineering'){try{const v=safeEval(closeParentheses(expr));if(v===0)setComputedValue(0,'EXP SI',expr);else{const exponent=Math.floor(Math.log10(Math.abs(v))/3)*3;expr=(v/10**exponent).toPrecision(10).replace(/\.?0+$/,'')+'×10^'+exponent;cursorPosition=expr.length;addHistory('EXP SI',String(v),expr)}}catch{$('#expression').textContent='Expressão inválida';return}}
else if(k==='constants'){const choice=prompt('Constante: PI, E, C (luz) ou G (gravidade)','PI');if(choice===null)return;const constants={PI:'π',E:'e',C:'299792458',G:'9.80665'};const value=constants[choice.trim().toUpperCase()];if(!value){$('#expression').textContent='Constante não reconhecida';return}insertAtCursor(value)}
else if(k==='quickConvert'){openQuickConverter();return}
else if(k==='complex'){const real=Number(prompt('Parte real:','0')),imag=Number(prompt('Parte imaginária:','1'));if(!Number.isFinite(real)||!Number.isFinite(imag))return;const magnitude=Math.hypot(real,imag),angle=Math.atan2(imag,real)*(angleMode==='DEG'?180/Math.PI:1);expr=real+(imag<0?' − ':' + ')+Math.abs(imag)+'i';cursorPosition=expr.length;lastAnswer=magnitude;addHistory('Complexo',expr,'|z|='+magnitude.toPrecision(10)+', ∠='+angle.toPrecision(10))}
else if(k==='compare'){try{const a=safeEval(closeParentheses(expr)),raw=prompt('Comparar com:','0');if(raw===null)return;const b=safeEval(closeParentheses(raw)),symbol=a<b?'<':a>b?'>':'=';lastFormula=expr+' '+symbol+' '+raw;expr=symbol;cursorPosition=expr.length;resultShown=true;addHistory('Comparação',lastFormula,symbol)}catch{$('#expression').textContent='Comparação inválida';return}}
else if(k==='noop')return;else{const map={sin:'sin(',cos:'cos(',tan:'tan(',asin:'asin(',acos:'acos(',atan:'atan(',sqrt:'√(',cbrt:'∛(',pi:'π',pow:'^',yroot:'^(1/',inv:'1/(',sq:'^2',cube:'^3',ln:'ln(',log:'log(',pow10:'10^',powE:'e^',variable:'X',variableY:'Y',e:'e',exp:'×10^'};insertAtCursor(map[k]??k)}cursorPosition=Math.min(cursorPosition,expr.length);updateDisplay()}
function safeEval(source,x,y){let normalized=String(source).replace(/\bmod\b/gi,'%').replace(/X/g,'x').replace(/Y/g,'y').replace(/M/g,'mem').replace(/√/g,'sqrt').replace(/∛/g,'cbrt').replace(/π/g,'pi').replace(/×/g,'*').replace(/÷/g,'/');if(!/^[0-9x+\-*/^().,%\s_a-z*]+$/i.test(normalized))throw Error('Caracteres inválidos');const toRad=v=>angleMode==='DEG'?v*Math.PI/180:v,fromRad=v=>angleMode==='DEG'?v*180/Math.PI:v,trigSin=v=>Math.sin(toRad(v)),trigCos=v=>Math.cos(toRad(v)),trigTan=v=>Math.tan(toRad(v)),trigAsin=v=>fromRad(Math.asin(v)),trigAcos=v=>fromRad(Math.acos(v)),trigAtan=v=>fromRad(Math.atan(v));let s=normalized.replace(/\^/g,'**').replace(/\bpi\b/gi,'Math.PI').replace(/\be\b/g,'Math.E').replace(/\basin\b/g,'trigAsin').replace(/\bacos\b/g,'trigAcos').replace(/\batan\b/g,'trigAtan').replace(/\bsin\b/g,'trigSin').replace(/\bcos\b/g,'trigCos').replace(/\btan\b/g,'trigTan').replace(/\bcbrt\b/g,'Math.cbrt').replace(/\bsqrt\b/g,'Math.sqrt').replace(/\bln\b/g,'Math.log').replace(/\blog\b/g,'Math.log10').replace(/\babs\b/g,'Math.abs').replace(/\bexp\b/g,'Math.exp');return Function('x','y','mem','trigSin','trigCos','trigTan','trigAsin','trigAcos','trigAtan',`"use strict";return (${s})`)(x,y,memoryValue,trigSin,trigCos,trigTan,trigAsin,trigAcos,trigAtan)}
function hasImaginaryUnit(value){return /(^|[^A-Za-z])i($|[^A-Za-z])/.test(String(value||''))}
function equationPolynomial(value){
  const parts=String(value).split('=');if(parts.length!==2)return null;
  const left=parseSimplePolynomial(parts[0]),right=parseSimplePolynomial(parts[1]);if(!left||!right)return null;
  const map=new Map(left);for(const [power,coefficient] of right)map.set(power,(map.get(power)||0)-coefficient);
  return map
}
function quadraticData(value){
  const map=equationPolynomial(value);if(!map||[...map.keys()].some(power=>power>2)||Math.abs(map.get(2)||0)<1e-12)return null;
  const qa=map.get(2)||0,qb=map.get(1)||0,qc=map.get(0)||0,delta=qb*qb-4*qa*qc;
  const clean=n=>+n.toPrecision(12);
  if(delta>=0){const root=Math.sqrt(delta);return {a:qa,b:qb,c:qc,delta,roots:[clean((-qb+root)/(2*qa)),clean((-qb-root)/(2*qa))],complex:false}}
  const real=clean(-qb/(2*qa)),imag=clean(Math.sqrt(-delta)/Math.abs(2*qa));
  return {a:qa,b:qb,c:qc,delta,roots:[real+(imag<0?' - ':' + ')+Math.abs(imag)+'i',real+(imag<0?' + ':' - ')+Math.abs(imag)+'i'],complex:true}
}
function solveQuadratic(value){
  const data=quadraticData(value);if(!data)return false;
  lastFormula=value;expr='x₁ = '+data.roots[0]+'; x₂ = '+data.roots[1];cursorPosition=expr.length;resultShown=true;
  addHistory('Equação do 2º grau',lastFormula,expr);updateDisplay();return true
}
function calculate(){try{if(expr.includes('=')&&solveQuadratic(expr))return;lastFormula=expr;if(hasImaginaryUnit(expr)){const z=parseSimpleComplex(expr);expr=formatComplex(z);cursorPosition=expr.length;addHistory('Complexo',lastFormula,expr);resultShown=true;updateDisplay();return}const source=closeParentheses(expr.replace(/(\d+(?:\.\d+)?)%(?![\d.(])/g,'($1/100)')),r=safeEval(source);if(!Number.isFinite(r))throw Error();addHistory('Científica',`${expr} [${angleMode}]`,String(+r.toPrecision(12)));expr=String(+r.toPrecision(12));cursorPosition=expr.length;lastAnswer=r;localStorage.setItem('wosvipLastAnswer',String(r));resultShown=true}catch{$('#expression').textContent='Expressão inválida';return}updateDisplay()}
function escapeMath(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function stripMathOuter(value){let s=String(value).trim();while(s.startsWith('(')&&s.endsWith(')')){let depth=0,wraps=true;for(let i=0;i<s.length;i++){depth+=s[i]==='('?1:s[i]===')'?-1:0;if(depth===0&&i<s.length-1){wraps=false;break}}if(!wraps)break;s=s.slice(1,-1).trim()}return s}
function splitMathFraction(value){const s=String(value),parts=[];let depth=0;for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;else if(s[i]===')')depth--;else if(s[i]==='/'&&depth===0){parts.push(stripMathOuter(s.slice(0,i)),stripMathOuter(s.slice(i+1)));return parts}}return null}
function formatMathInline(value){let prepared=String(value||'').replace(/\^\((-?\d+(?:\.\d+)?)\)/g,'^$1').replace(/(\d|\))\*([xX])/g,'$1$2').replace(/([xX])\*(?=[xX])/g,'$1').replace(/([0-9xX]|\))\*\(/g,'$1(');let out=escapeMath(prepared).replace(/\*/g,'×').replace(/\//g,'÷');out=out.replace(/root\(([^,()]+),([^()]+)\)/g,'<span class="math-root indexed-root"><span class="root-index">$1</span><span class="root-sign">√</span><span class="radicand">$2</span></span>');out=out.replace(/√\(([^)]*)\)?/g,(_,inside)=>`<span class="math-root"><span class="root-sign">√</span><span class="radicand">${inside||'<span class="math-slot"></span>'}</span></span>`);out=out.replace(/∛\(([^)]*)\)?/g,(_,inside)=>`<span class="math-root cube-root"><span class="root-index">3</span><span class="root-sign">√</span><span class="radicand">${inside||'<span class="math-slot"></span>'}</span></span>`);out=out.replace(/\^(-?\d+(?:\.\d+)?)/g,'<sup>$1</sup>');return out}
function formatMath(value){const fraction=splitMathFraction(value);return fraction?`<span class="math-fraction"><span>${formatMathInline(fraction[0])}</span><span>${formatMathInline(fraction[1])}</span></span>`:formatMathInline(value)}
function parseSimplePolynomial(value){const s=stripMathOuter(value).replace(/X/g,'x').replace(/\s+/g,'').replace(/−/g,'-'),terms=s.replace(/-/g,'+-').split('+').filter(Boolean),map=new Map();for(let term of terms){term=term.replace(/\*/g,'');const xIndex=term.indexOf('x');let coefficient,power;if(xIndex>=0){const raw=term.slice(0,xIndex);coefficient=raw===''?1:raw==='-'?-1:Number(raw);const match=term.slice(xIndex+1).match(/^\^(\d+)$/);power=match?Number(match[1]):1}else{coefficient=Number(term);power=0}if(!Number.isFinite(coefficient)||!Number.isInteger(power))return null;map.set(power,(map.get(power)||0)+coefficient)}return map}
function formatSimplePolynomial(map){const powers=[...map.keys()].filter(power=>Math.abs(map.get(power))>1e-12).sort((a,b)=>b-a);if(!powers.length)return '0';return powers.map((power,index)=>{const value=map.get(power),negative=value<0,amount=+Math.abs(value).toPrecision(10),coefficient=power>0&&amount===1?'':String(amount),variable=power===0?'':power===1?'x':'x^'+power,body=coefficient+variable;return index?(negative?' - ':' + ')+body:(negative?'-':'')+body}).join('')}
function polynomialArray(map){const powers=[...map.keys()],max=powers.length?Math.max(...powers):0,array=Array(max+1).fill(0);for(const [power,coefficient] of map)array[power]=coefficient;return polynomialTrim(array)}
function polynomialTrim(array){const out=array.slice();while(out.length>1&&Math.abs(out[out.length-1])<1e-10)out.pop();return out.map(value=>Math.abs(value)<1e-10?0:value)}
function polynomialDivide(dividend,divisor){let remainder=polynomialTrim(dividend),denominator=polynomialTrim(divisor);if(denominator.length===1&&Math.abs(denominator[0])<1e-12)return null;const quotient=Array(Math.max(1,remainder.length-denominator.length+1)).fill(0);while(remainder.length>=denominator.length&&!(remainder.length===1&&Math.abs(remainder[0])<1e-10)){const degree=remainder.length-denominator.length,factor=remainder[remainder.length-1]/denominator[denominator.length-1];quotient[degree]=factor;for(let i=0;i<denominator.length;i++)remainder[i+degree]-=factor*denominator[i];remainder=polynomialTrim(remainder)}return {quotient:polynomialTrim(quotient),remainder}}
function polynomialGcd(left,right){let a=polynomialTrim(left),b=polynomialTrim(right),guard=0;while(!(b.length===1&&Math.abs(b[0])<1e-9)&&guard++<12){const division=polynomialDivide(a,b);if(!division)return [1];a=b;b=division.remainder}const lead=a[a.length-1];return Math.abs(lead)<1e-12?[1]:polynomialTrim(a.map(value=>value/lead))}
function polynomialMap(array){const map=new Map();polynomialTrim(array).forEach((coefficient,power)=>{if(Math.abs(coefficient)>1e-10)map.set(power,coefficient)});return map.size?map:new Map([[0,0]])}
function reducePolynomialFraction(numerator,denominator){const common=polynomialGcd(polynomialArray(numerator),polynomialArray(denominator));if(common.length<=1)return null;const n=polynomialDivide(polynomialArray(numerator),common),d=polynomialDivide(polynomialArray(denominator),common);if(!n||!d||n.remainder.some(value=>Math.abs(value)>1e-8)||d.remainder.some(value=>Math.abs(value)>1e-8))return null;return {common:polynomialMap(common),numerator:polynomialMap(n.quotient),denominator:polynomialMap(d.quotient)}}
function formatReducedFraction(reduction){const numerator=formatSimplePolynomial(reduction.numerator),denominator=formatSimplePolynomial(reduction.denominator);if(denominator==='1')return numerator;const wrap=map=>{const text=formatSimplePolynomial(map).replace(/\s+/g,''),terms=[...map.values()].filter(value=>Math.abs(value)>1e-10).length;return terms>1?'('+text+')':text};return wrap(reduction.numerator)+'/'+wrap(reduction.denominator)}
function polynomialRoots(map){const a=map.get(2)||0,b=map.get(1)||0,c=map.get(0)||0,roots=[];if(Math.abs(a)>1e-12){const delta=b*b-4*a*c;if(delta>=-1e-10){const root=Math.sqrt(Math.max(0,delta));roots.push((-b+root)/(2*a));if(root>1e-10)roots.push((-b-root)/(2*a))}}else if(Math.abs(b)>1e-12)roots.push(-c/b);return [...new Set(roots.filter(Number.isFinite).map(value=>+value.toPrecision(10)))].sort((x,y)=>x-y)}
function factorPiece(map){const text=formatSimplePolynomial(map).replace(/\s+/g,'');return [...map.keys()].filter(power=>Math.abs(map.get(power))>1e-10).length>1?'('+text+')':text}
function factoredPolynomial(reduction,which){const quotient=factorPiece(reduction[which]),common=factorPiece(reduction.common);return quotient==='1'?common:common==='1'?quotient:quotient+'*'+common}
function simplifySymbolic(value){const fraction=splitMathFraction(value);if(!fraction)return '';const numerator=parseSimplePolynomial(fraction[0]),denominator=parseSimplePolynomial(fraction[1]);if(!numerator||!denominator)return '';const denominatorTerms=[...denominator.entries()].filter(([,coefficient])=>Math.abs(coefficient)>1e-12);if(denominatorTerms.length===1){const [denominatorPower,denominatorCoefficient]=denominatorTerms[0];if(denominatorCoefficient&&![...numerator.keys()].some(power=>power<denominatorPower)){const result=new Map();for(const [power,coefficient] of numerator)result.set(power-denominatorPower,coefficient/denominatorCoefficient);return formatSimplePolynomial(result)}}const reduction=reducePolynomialFraction(numerator,denominator);return reduction?formatReducedFraction(reduction):''}
function stepNumber(value){const number=Number(value);return Number.isFinite(number)?String(+number.toPrecision(12)):String(value)}
function stepMath(value){return '<div class="calculation-step-math">'+formatMath(String(value))+'</div>'}
function numericCalculationSteps(formula,finalResult){
  const rootMatch=String(formula).match(/^root\(([^,()]+),([^()]+)\)$/);
  if(rootMatch){
    const index=stepNumber(safeEval(rootMatch[1])),radicand=stepNumber(safeEval(rootMatch[2])),result=stepNumber(finalResult),power=radicand+'^(1/'+index+')';
    return [
      {title:'Expressão original',html:stepMath(formula)},
      {title:'Transforme a raiz em potência de expoente fracionário',html:stepMath(power)},
      {title:'Calcule a potência',html:stepMath(power+' = '+result)},
      {title:'Resultado final',html:stepMath(result)}
    ]
  }
  const steps=[{title:'Expressão original',html:stepMath(formula)}];let working=closeParentheses(String(formula).replace(/(\d+(?:\.\d+)?)%(?![\d.(])/g,'($1/100)')),guard=0;
  const add=(title,before,part,value)=>{working=before.slice(0,part.index)+stepNumber(value)+before.slice(part.index+part[0].length);steps.push({title,html:stepMath(part[0]+' = '+stepNumber(value))+(working!==stepNumber(value)?'<small>Agora:</small>'+stepMath(working):'')})};
  const reduce=(regex,title)=>{let match;while((match=regex.exec(working))&&guard++<30){const before=working;try{add(title,before,match,safeEval(match[0]))}catch{break}regex.lastIndex=0}};
  reduce(/(?:asin|acos|atan|sin|cos|tan|sqrt|cbrt|log|ln|abs|exp)\((-?\d+(?:\.\d+)?)\)/i,angleMode==='DEG'?'Calcule a função usando graus':'Calcule a função usando radianos');
  reduce(/\((-?\d+(?:\.\d+)?(?:[+\-*/^]-?\d+(?:\.\d+)?)*)\)/,'Resolva primeiro os parênteses');
  reduce(/-?\d+(?:\.\d+)?\^-?\d+(?:\.\d+)?/,'Resolva a potência');
  reduce(/-?\d+(?:\.\d+)?[*/]-?\d+(?:\.\d+)?/,'Faça multiplicações e divisões da esquerda para a direita');
  reduce(/-?\d+(?:\.\d+)?[+\-]\d+(?:\.\d+)?/,'Faça adições e subtrações da esquerda para a direita');
  const result=stepNumber(finalResult);if(!steps.some(step=>step.html.includes('= '+result)))steps.push({title:'Resultado final',html:stepMath(result)});else steps.push({title:'Resultado final',html:stepMath(result)});
  return steps
}
function polynomialTermText(coefficient,power){
  const negative=coefficient<0,amount=Math.abs(coefficient),coefficientText=power>0&&amount===1?'':stepNumber(amount),variable=power===0?'':power===1?'x':'x^'+power;return {negative,text:coefficientText+variable}
}
function quadraticCalculationSteps(formula,result){
  const data=quadraticData(formula);if(!data)return [{title:'Expressão original',html:stepMath(formula)},{title:'Expressão algébrica',html:'<p>Não foi possível identificar uma equação quadrática válida.</p>'}];
  const deltaText='Δ = ('+data.b+')^2 - 4×('+data.a+')×('+data.c+') = '+stepNumber(data.delta);
  const formulaText='x = (-b ± √Δ)/(2a)';
  const rootsText=data.complex?'x₁ = '+data.roots[0]+'; x₂ = '+data.roots[1]:'x₁ = '+stepNumber(data.roots[0])+'; x₂ = '+stepNumber(data.roots[1]);
  const steps=[
    {title:'Expressão original',html:stepMath(formula)},
    {title:'Identifique os coeficientes',html:stepMath('a = '+data.a+', b = '+data.b+', c = '+data.c)},
    {title:'Calcule o discriminante',html:stepMath(deltaText)}
  ];
  if(data.complex)steps.push({title:'Interprete o discriminante',html:'<p>Como Δ &lt; 0, a equação não possui raízes reais. As soluções pertencem aos números complexos.</p>'});
  steps.push({title:'Aplique a fórmula de Bhaskara',html:stepMath(formulaText)});
  steps.push({title:'Resultado final',html:stepMath(rootsText)});
  return steps
}
function symbolicCalculationSteps(formula,result){
  const steps=[{title:'Expressão original',html:stepMath(formula)}],fraction=splitMathFraction(formula);
  if(fraction){
    const numerator=parseSimplePolynomial(fraction[0]),denominator=parseSimplePolynomial(fraction[1]);
    if(numerator&&denominator){
      const denominatorTerms=[...denominator.entries()].filter(([,coefficient])=>Math.abs(coefficient)>1e-12),polynomialReduction=reducePolynomialFraction(numerator,denominator);
      if(polynomialReduction){
        const numeratorFactored=factoredPolynomial(polynomialReduction,'numerator'),denominatorFactored=factoredPolynomial(polynomialReduction,'denominator'),common=factorPiece(polynomialReduction.common),restrictions=[...new Set([...polynomialRoots(polynomialReduction.common),...polynomialRoots(polynomialReduction.denominator)].map(value=>+value.toPrecision(10)))].sort((a,b)=>a-b);
        steps.push({title:'Fatore o numerador e o denominador',html:stepMath('('+numeratorFactored+')/('+denominatorFactored+')')});
        steps.push({title:'Cancele o fator comum '+common,html:stepMath(result)+(restrictions.length?'<p class="calculation-domain">Restrições da expressão original: '+restrictions.map(value=>'x ≠ '+stepNumber(value)).join(' e ')+'</p>':'')});
        steps.push({title:'Resultado simplificado',html:stepMath(result)});return steps
      }
      if(denominatorTerms.length===1){
        const [denominatorPower,denominatorCoefficient]=denominatorTerms[0],pieces=[];
        for(const [power,coefficient] of [...numerator.entries()].sort((a,b)=>b[0]-a[0])){
          if(Math.abs(coefficient)<1e-12)continue;
          const ratio=coefficient/denominatorCoefficient,absoluteNumerator=Math.abs(coefficient),absoluteDenominator=Math.abs(denominatorCoefficient),numeratorVariable=power===0?'1':power===1?'x':'x^'+power,denominatorVariable=denominatorPower===0?'1':denominatorPower===1?'x':'x^'+denominatorPower,reducedPower=power-denominatorPower,reducedAmount=+Math.abs(ratio).toPrecision(10),reducedCoefficient=reducedPower>0&&reducedAmount===1?'':String(reducedAmount),reducedVariable=reducedPower===0?'':reducedPower===1?'x':'x^'+reducedPower;
          pieces.push({negative:ratio<0,numerator:(absoluteNumerator===1&&power>0?'':stepNumber(absoluteNumerator))+numeratorVariable,denominator:(absoluteDenominator===1&&denominatorPower>0?'':stepNumber(absoluteDenominator))+denominatorVariable,coefficientNumerator:stepNumber(absoluteNumerator),coefficientDenominator:stepNumber(absoluteDenominator),numeratorVariable,denominatorVariable,reduced:reducedCoefficient+reducedVariable})
        }
        if(pieces.length){
          const separated='<div class="calculation-step-math symbolic-terms">'+pieces.map((piece,index)=>(index?'<b class="symbolic-sign">'+(piece.negative?'−':'+')+'</b>':piece.negative?'<b class="symbolic-sign">−</b>':'')+'<span class="symbolic-term">'+formatMath('('+piece.numerator+')/('+piece.denominator+')')+'</span>').join('')+'</div>';
          steps.push({title:'Divida cada termo do numerador pelo denominador',html:separated});
          const reductions='<div class="calculation-step-math symbolic-reductions">'+pieces.map((piece,index)=>'<div class="symbolic-reduction-row"><b>'+(piece.negative?'−':index?'+':'')+'</b><span>'+formatMath('('+piece.coefficientNumerator+')/('+piece.coefficientDenominator+')')+' × '+formatMath('('+piece.numeratorVariable+')/('+piece.denominatorVariable+')')+'</span><i>=</i><span>'+formatMath(piece.reduced)+'</span></div>').join('')+'</div>';
          steps.push({title:'Reduza os coeficientes e subtraia os expoentes correspondentes',html:reductions})
        }
        steps.push({title:'Resultado simplificado',html:stepMath(result)});return steps
      }
    }
  }
  steps.push({title:'Expressão algébrica',html:'<p>Para obter um número, informe os valores das variáveis presentes na expressão.</p>'});if(result)steps.push({title:'Forma simplificada',html:stepMath(result)});return steps
}
function calculationStepsContext(){
  const formula=(resultShown?lastFormula:expr)||'',preview=resultShown?expr:livePreview();if(!formula)return null;
  return {formula,result:preview||'',symbolic:/[xXyY]/.test(formula)}
}
function buildCalculationSteps(formula,result,symbolic){if(String(formula).includes('='))return quadraticCalculationSteps(formula,result);return symbolic?symbolicCalculationSteps(formula,result):numericCalculationSteps(formula,result)}
function chatStepTitle(title){
  if(title==='Expressão original')return 'Considere a expressão:';
  if(title==='Resultado simplificado'||title==='Resultado final')return 'Portanto, o resultado é:';
  if(title.startsWith('Fatore'))return 'Fatorando o numerador e o denominador:';
  if(title.startsWith('Cancele o fator comum'))return title.replace('Cancele','Cancelando')+':';
  if(title.startsWith('Divida cada termo'))return 'Separando cada termo do numerador pelo denominador:';
  if(title.startsWith('Reduza os coeficientes'))return 'Reduzindo os coeficientes e os expoentes:';
  if(title==='Expressão algébrica')return 'Observação:';
  if(title.startsWith('Resolva'))return title.replace('Resolva','Resolvendo')+':';
  if(title.startsWith('Faça'))return title.replace('Faça','Efetuando')+':';
  if(title.startsWith('Calcule'))return title.replace('Calcule','Calculando')+':';
  return title.endsWith(':')?title:title+':'
}
function advancedMathStepHtml(step){
  const math=step.math?stepMath(step.math):'',after=step.after?'<div class="advanced-math-transition"><span>=</span>'+stepMath(step.after)+'</div>':'',text=step.text?'<p class="advanced-step-text">'+String(step.text).replace(/[<&]/g,char=>char==='<'?'&lt;':'&amp;')+'</p>':'',note=step.note?'<p class="advanced-step-note">'+String(step.note).replace(/[<&]/g,char=>char==='<'?'&lt;':'&amp;')+'</p>':'';
  return '<article'+(step.result?' class="advanced-final-result"':'')+'><div><strong>'+String(step.title||'Etapa matemática')+':</strong>'+math+after+text+note+'</div></article>'
}
async function showCalculationSteps(){
  const context=calculationStepsContext();if(!context)return;document.querySelector('.calculation-steps-overlay')?.remove();
  const overlay=document.createElement('div');overlay.className='calculation-steps-overlay';
  overlay.innerHTML='<section class="calculation-steps-card chat-math-solution" role="dialog" aria-modal="true" aria-label="Resolução matemática"><header><h2>Resolução matemática</h2><button type="button" aria-label="Fechar">×</button></header><div class="calculation-engine-status"><span class="advanced-engine-spinner"></span><div><strong>Preparando o motor matemático avançado</strong><small>Na primeira utilização, o carregamento pode demorar alguns segundos.</small></div></div><div class="calculation-steps-list"></div></section>';
  document.body.appendChild(overlay);const close=()=>overlay.remove();overlay.querySelector('header button').onclick=close;overlay.onclick=event=>{if(event.target===overlay)close()};
  const list=overlay.querySelector('.calculation-steps-list'),status=overlay.querySelector('.calculation-engine-status');
  try{
    if(!context.symbolic||!window.WosvipAdvancedMath||context.formula.includes('='))throw new Error('Usar solucionador de equações local');
    const advanced=await window.WosvipAdvancedMath.solve(context.formula);
    if(!document.body.contains(overlay))return;
    if(!advanced.verified)throw new Error('A equivalência não pôde ser confirmada.');
    list.innerHTML=advanced.steps.map(advancedMathStepHtml).join('');
    status.innerHTML='<span class="advanced-engine-ok">✓</span><div><strong>Resultado verificado pelo motor simbólico</strong><small>As transformações foram conferidas antes da apresentação.</small></div>';
    status.classList.add('is-ready');
  }catch(error){
    if(!document.body.contains(overlay))return;
    const steps=buildCalculationSteps(context.formula,context.result,context.symbolic);
    list.innerHTML=steps.map(step=>'<article><div><strong>'+chatStepTitle(step.title)+'</strong>'+step.html+'</div></article>').join('');
    status.innerHTML='<span class="advanced-engine-local">◆</span><div><strong>Resolução pelo motor local</strong><small>O modo avançado não ficou disponível nesta consulta; o cálculo existente foi preservado.</small></div>';
    status.classList.add('is-fallback');
  }
}
function updateStepsButton(){
  const button=$('#resultStepsBtn');if(!button)return;const context=calculationStepsContext();button.hidden=!context||(!context.result&&!context.symbolic)
}
function livePreview(){if(!expr||hasImaginaryUnit(expr)||expr.includes('='))return '';if(/[xXyY]/.test(expr))return simplifySymbolic(expr);try{const source=closeParentheses(expr.replace(/(\d+(?:\.\d+)?)%(?![\d.(])/g,'($1/100)')),value=safeEval(source);return Number.isFinite(value)?String(+value.toPrecision(12)):''}catch{return ''}}
function updateDisplay(){cursorPosition=Math.max(0,Math.min(cursorPosition,expr.length));const display=$('#expression');if(structuredEntry){display.innerHTML=renderStructuredEntry();$('#screen').value='';updateStepsButton();const info=display.querySelector('.limit-info-button');if(info)info.onclick=event=>{event.stopPropagation();showLimitInfo()};return}if(resultShown)display.innerHTML=lastFormula?formatMath(lastFormula):'Pronto';else if(expr)display.innerHTML=formatMath(expr.slice(0,cursorPosition))+'<span class="edit-caret" aria-hidden="true"></span>'+formatMath(expr.slice(cursorPosition));else display.innerHTML='<span class="edit-caret" aria-hidden="true"></span>';$('#screen').value=resultShown?expr:livePreview();updateStepsButton();requestAnimationFrame(()=>{const caret=display.querySelector('.edit-caret');if(caret)caret.scrollIntoView({block:'nearest',inline:'nearest'})})}updateDisplay();$('#resultStepsBtn').onclick=showCalculationSteps;
$('#financeCalc').onclick=()=>{const c=+$('#capital').value,r=+$('#rate').value/100,n=+$('#periods').value,t=$('#finType').value;if(c<0||n<=0||!Number.isFinite(r))return;let value,label;if(t==='compound'){value=c*(1+r)**n;label='Montante'}else if(t==='simple'){value=c*(1+r*n);label='Montante'}else{value=r===0?c/n:c*r*(1+r)**n/((1+r)**n-1);label='Parcela'}const interest=t==='payment'?null:value-c;const out=`<strong>${label}: ${money(value)}</strong>${interest!==null?`<br>Juros acumulados: ${money(interest)}`:`<br>Total pago: ${money(value*n)}`}`;$('#financeResult').innerHTML=out;addHistory('Financeira',`${t}: ${money(c)}, ${r*100}% × ${n}`,`${label}: ${money(value)}`)};
const units={Comprimento:{metro:1,quilômetro:1000,centímetro:.01,milímetro:.001,polegada:.0254,pé:.3048,milha:1609.344},Massa:{quilograma:1,grama:.001,miligrama:.000001,tonelada:1000,libra:.45359237,onça:.0283495},Área:{'m²':1,'km²':1e6,'cm²':1e-4,hectare:1e4,'pé²':.092903},Volume:{litro:1,mililitro:.001,'m³':1000,galão:3.785411784},Velocidade:{'m/s':1,'km/h':1/3.6,'mph':.44704},Temperatura:{C:'C',F:'F',K:'K'}};
Object.keys(units).forEach(x=>$('#category').add(new Option(x,x)));function fillUnits(){const u=Object.keys(units[$('#category').value]);['#fromUnit','#toUnit'].forEach((s,i)=>{$(s).innerHTML='';u.forEach(x=>$(s).add(new Option(x,x)));if(i&&u[1])$(s).selectedIndex=1})}$('#category').onchange=fillUnits;fillUnits();
$('#convertCalc').onclick=()=>{const cat=$('#category').value,a=$('#fromUnit').value,b=$('#toUnit').value,v=+$('#convValue').value;let r;if(cat==='Temperatura'){let c=a==='C'?v:a==='F'?(v-32)*5/9:v-273.15;r=b==='C'?c:b==='F'?c*9/5+32:c+273.15}else r=v*units[cat][a]/units[cat][b];const text=`${v.toLocaleString('pt-BR')} ${a} = ${(+r.toPrecision(12)).toLocaleString('pt-BR')} ${b}`;$('#convertResult').textContent=text;addHistory('Conversão',cat,text)};
function plot(){const canvas=$('#graphCanvas'),ctx=canvas.getContext('2d'),fn=$('#functionInput').value,x0=+$('#xMin').value,x1=+$('#xMax').value;$('#graphError').textContent='';if(!(x1>x0))return $('#graphError').textContent='O valor máximo deve ser maior.';let pts=[],ys=[];try{for(let i=0;i<canvas.width;i++){let x=x0+(x1-x0)*i/(canvas.width-1),y=safeEval(fn,x);pts.push([i,y]);if(Number.isFinite(y))ys.push(y)}}catch(e){return $('#graphError').textContent='Função inválida.'}if(!ys.length)return $('#graphError').textContent='Sem valores válidos.';ys.sort((a,b)=>a-b);let y0=ys[Math.floor(ys.length*.02)],y1=ys[Math.floor(ys.length*.98)];if(y0===y1){y0--;y1++}ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#29425b';ctx.lineWidth=1;const py=y=>canvas.height-(y-y0)/(y1-y0)*canvas.height;ctx.beginPath();let zeroY=py(0);ctx.moveTo(0,zeroY);ctx.lineTo(canvas.width,zeroY);let zeroX=(0-x0)/(x1-x0)*canvas.width;ctx.moveTo(zeroX,0);ctx.lineTo(zeroX,canvas.height);ctx.stroke();ctx.strokeStyle='#20d8b4';ctx.lineWidth=3;ctx.beginPath();let started=false;pts.forEach(([px,y])=>{const yy=py(y);if(!Number.isFinite(yy)||yy< -canvas.height||yy>canvas.height*2){started=false;return}if(!started){ctx.moveTo(px,yy);started=true}else ctx.lineTo(px,yy)});ctx.stroke();addHistory('Gráfico',`f(x) = ${fn}`,`Intervalo [${x0}, ${x1}]`)}$('#plotBtn').onclick=plot;plot();
function renderHistory(){const el=$('#historyList');el.innerHTML=history.length?history.map(h=>`<div class="history-item"><div><strong>${h.type}</strong><br>${h.detail}<br><small>${h.date}</small></div><b>${h.result}</b></div>`).join(''):'<div class="empty">Nenhum cálculo registrado.</div>'}$('#clearHistory').onclick=()=>{if(confirm('Deseja apagar todo o histórico?')){history=[];localStorage.removeItem('wosvipHistory');renderHistory()}};renderHistory();

let deferredInstallPrompt=null;
const installBtn=$('#installBtn');
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
function updateInstallButton(){installBtn.hidden=isStandalone()}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;installBtn.hidden=false});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;installBtn.hidden=true});
installBtn.onclick=async()=>{if(isStandalone())return;if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;updateInstallButton();return}const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);alert(ios?'Para instalar: toque em Compartilhar e depois em Adicionar à Tela de Início.':'Abra o menu do navegador e escolha Instalar WOSVIP Calculadora PRO ou Instalar aplicativo.')};
updateInstallButton();
if('serviceWorker'in navigator){
  let serviceWorkerRefreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(serviceWorkerRefreshing)return;serviceWorkerRefreshing=true;if(!sessionStorage.getItem('wosvip-sw-reloaded')){sessionStorage.setItem('wosvip-sw-reloaded','1');location.reload()}});
  window.addEventListener('load',async()=>{try{const registration=await navigator.serviceWorker.register('./sw.js?v=35',{updateViaCache:'none'});await registration.update();if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});setTimeout(()=>sessionStorage.removeItem('wosvip-sw-reloaded'),8000)}catch{}});
}
