"use strict";
(function(){
  let worker=null,sequence=0;
  const pending=new Map();
  function getWorker(){
    if(worker)return worker;
    worker=new Worker("./advanced-math-worker.js?v=3");
    worker.onmessage=event=>{
      const data=event.data||{},request=pending.get(data.id);
      if(!request)return;
      clearTimeout(request.timer);pending.delete(data.id);
      data.ok?request.resolve(data):request.reject(new Error(data.error||"Falha no motor matemático."));
    };
    worker.onerror=event=>{
      for(const request of pending.values()){clearTimeout(request.timer);request.reject(new Error(event.message||"Falha ao carregar o motor matemático."))}
      pending.clear();worker.terminate();worker=null;
    };
    return worker;
  }
  function solve(expression){
    return new Promise((resolve,reject)=>{
      const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error("O motor avançado demorou além do esperado."))},45000);
      pending.set(id,{resolve,reject,timer});
      getWorker().postMessage({id,expression:String(expression||"")});
    });
  }
  window.WosvipAdvancedMath={solve};
})();