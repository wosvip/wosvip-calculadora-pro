import {PreTrainedTokenizer,Tensor,VisionEncoderDecoderModel,cat,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
env.allowLocalModels=false;
env.backends.onnx.wasm.proxy=true;
const MODEL='alephpi/FormulaNet';
let modelPromise=null,tokenizerPromise=null,currentId=null;
function progress(item){
  let value=0;if(typeof item?.progress==='number')value=item.progress<=1?item.progress*72:item.progress*.72;
  postMessage({id:currentId,type:'progress',value:Math.max(2,Math.min(74,value||5))})
}
async function resources(){
  if(!modelPromise)modelPromise=VisionEncoderDecoderModel.from_pretrained(MODEL,{dtype:'fp32',progress_callback:progress});
  if(!tokenizerPromise)tokenizerPromise=PreTrainedTokenizer.from_pretrained(MODEL,{progress_callback:progress});
  return Promise.all([modelPromise,tokenizerPromise])
}
async function imageTensor(blob){
  const bitmap=await createImageBitmap(blob),source=new OffscreenCanvas(bitmap.width,bitmap.height),context=source.getContext('2d',{willReadFrequently:true});context.fillStyle='#fff';context.fillRect(0,0,source.width,source.height);context.drawImage(bitmap,0,0);bitmap.close?.();
  const pixels=context.getImageData(0,0,source.width,source.height),gray=new Uint8Array(source.width*source.height);let dark=0,light=0,minX=source.width,minY=source.height,maxX=-1,maxY=-1;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){const i=y*source.width+x,p=i*4,g=Math.round((pixels.data[p]*299+pixels.data[p+1]*587+pixels.data[p+2]*114)/1000);gray[i]=g;if(g<128)dark++;else light++}
  const invert=dark>light;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){const i=y*source.width+x,g=invert?255-gray[i]:gray[i];gray[i]=g;if(g<220){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}}
  if(maxX<minX||maxY<minY){minX=0;minY=0;maxX=source.width-1;maxY=source.height-1}
  const margin=Math.max(4,Math.round(Math.max(maxX-minX,maxY-minY)*.04));minX=Math.max(0,minX-margin);minY=Math.max(0,minY-margin);maxX=Math.min(source.width-1,maxX+margin);maxY=Math.min(source.height-1,maxY+margin);
  const cropWidth=maxX-minX+1,cropHeight=maxY-minY+1,crop=new OffscreenCanvas(cropWidth,cropHeight),cropContext=crop.getContext('2d'),cropData=cropContext.createImageData(cropWidth,cropHeight);
  for(let y=0;y<cropHeight;y++)for(let x=0;x<cropWidth;x++){const g=gray[(minY+y)*source.width+minX+x],p=(y*cropWidth+x)*4;cropData.data[p]=cropData.data[p+1]=cropData.data[p+2]=g;cropData.data[p+3]=255}cropContext.putImageData(cropData,0,0);
  const size=384,fit=360,scale=Math.min(fit/cropWidth,fit/cropHeight),width=Math.max(1,Math.round(cropWidth*scale)),height=Math.max(1,Math.round(cropHeight*scale)),target=new OffscreenCanvas(size,size),targetContext=target.getContext('2d',{willReadFrequently:true});targetContext.fillStyle='#000';targetContext.fillRect(0,0,size,size);targetContext.imageSmoothingEnabled=true;targetContext.imageSmoothingQuality='high';targetContext.drawImage(crop,Math.round((size-width)/2),Math.round((size-height)/2),width,height);
  const output=targetContext.getImageData(0,0,size,size).data,array=new Float32Array(size*size);for(let i=0;i<array.length;i++)array[i]=(output[i*4]/255-.7931)/.1738;
  const one=new Tensor('float32',array,[1,1,size,size]);return cat([one,one,one],1)
}
self.onmessage=async event=>{
  const data=event.data||{};if(data.type!=='recognize')return;currentId=data.id;
  try{postMessage({id:data.id,type:'progress',value:2});const [model,tokenizer]=await resources();postMessage({id:data.id,type:'progress',value:78});const pixelValues=await imageTensor(data.image);postMessage({id:data.id,type:'progress',value:86});const outputs=await model.generate({inputs:pixelValues});const text=tokenizer.batch_decode(outputs,{skip_special_tokens:true})[0];postMessage({id:data.id,type:'progress',value:100});postMessage({id:data.id,type:'result',text})}catch(error){postMessage({id:data.id,type:'error',message:error?.message||String(error)})}finally{currentId=null}
};