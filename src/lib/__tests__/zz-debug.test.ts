import { it } from "vitest";
import { detectPrintRepeat, lightingGain, repeatTilePixels, seamlessFabricPixels, tileArtifacts } from "../fabric-texture";
const side=128;
const make=(paint:(x:number,y:number)=>number[], lit=true)=>{const px=new Uint8ClampedArray(side*side*4);for(let y=0;y<side;y++)for(let x=0;x<side;x++){const l=lit?1.1-0.3*((x+y)/(2*side)):1;const c=paint(x,y);px.set([c[0]*l,c[1]*l,c[2]*l,255],(y*side+x)*4);}return px;};
const luma=(p:Uint8ClampedArray)=>Float64Array.from({length:side*side},(_,i)=>0.299*p[4*i]+0.587*p[4*i+1]+0.114*p[4*i+2]);
const fab:Record<string,any>={knit:(x:number,y:number)=>{const v=120+25*Math.sin(2*Math.PI*x/3+0.8*Math.sin(y/7));return[v,v,v+4];},stripes:(x:number)=>x%37<18?[30,60,120]:[240,230,200]};
it("dbg",()=>{for(const k of Object.keys(fab)){const src=make(fab[k]);const ref=make(fab[k],false);const flat=new Uint8ClampedArray(src);const g=lightingGain(luma(flat),side);for(let i=0;i<side*side;i++)for(let c=0;c<3;c++)flat[4*i+c]*=g[i];
const whole=seamlessFabricPixels(flat,side,side);const r=detectPrintRepeat(luma(flat),side);const crop=repeatTilePixels(flat,side,r.x,r.y);
console.log(k,r,'flat',tileArtifacts(flat,ref,side),'whole',tileArtifacts(whole,ref,side),'crop',tileArtifacts(crop,ref,side),'ref',tileArtifacts(ref,ref,side));}});
