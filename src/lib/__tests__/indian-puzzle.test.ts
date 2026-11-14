import {describe,it,expect} from "vitest";
import {indianPuzzleDimensions,indianPuzzlePieces} from "../indian-puzzle";
import {calculateYardage} from "../yardage";
import {getPattern,PATTERNS,countBlockFabrics} from "../patterns";
import type {PlannerState} from "../planner-store";
const base:PlannerState={pattern:"indian-puzzle",quiltWidth:36,quiltHeight:36,sizePreset:"custom",blockSize:12,fabricWidth:44,borderWidth:0,sashingWidth:0,assignments:{},safetyBuffer:false,fabricNames:{},fabricPhotos:{},cornerAccentSize:0,patchworkFabricCount:3,patchworkGrid:{},pricePerYard:"",itemPrices:{},fabricSource:"yardage",jellyRollStripCount:40,fatQuarterWidth:18,fatQuarterHeight:21,fatQuarterTrimMargin:.5,fatQuarterCount:20,alternateBlocks:false,blockLayout:"straight",customBlock:null,customBlockB:null,useBlockB:false,customSwapPair:null};
const count=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label)).reduce((a,p)=>a+p.count,0)??0;
const pieces=indianPuzzlePieces();
const at=(x:number,y:number)=>pieces.filter(p=>{const c=p.points.map(([ax,ay],i)=>{const [bx,by]=p.points[(i+1)%p.points.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});return c.every(v=>v>1e-8)||c.every(v=>v< -1e-8);}).map(p=>p.role);
describe("Indian Puzzle reference and real construction",()=>{
 it("registers three standard fabrics, preserves Nine Patch first and existing patterns",()=>{const p=getPattern("indian-puzzle");if(!p)throw new Error("Missing pattern");expect(countBlockFabrics(p.sections)).toBe(3);expect(p.sections.slice(0,3).map(s=>s.defaultFabric)).toEqual(["A","B","E"]);expect(PATTERNS[0].id).toBe("nine-patch");expect(PATTERNS).toHaveLength(81);expect(getPattern("eccentric-star")?.id).toBe("eccentric-star");});
 it("preserves the exact top-left corner and continuous top geese",()=>{
  expect(pieces.filter(p=>p.unit==="corner").slice(0,6).map(p=>[p.role,p.points])).toEqual([
   ["background",[[0,0],[1,0],[1,1],[0,1]]],["accent",[[1,0],[2,1],[1,1]]],["background",[[1,0],[2,0],[2,1]]],
   ["accent",[[0,1],[1,1],[1,2]]],["background",[[0,1],[1,2],[0,2]]],["accent",[[1,1],[2,1],[2,2],[1,2]]]]);
  expect(pieces.filter(p=>p.unit==="side").slice(0,6).filter(p=>p.points.some(([x,y])=>x===3&&y===0))).toEqual([
   {unit:"side",role:"background",points:[[2,1],[3,0],[4,1]]},{unit:"side",role:"dark",points:[[2,0],[3,0],[2,1]]},{unit:"side",role:"dark",points:[[3,0],[4,0],[4,1]]}]);
  expect(at(3,1.4)).toEqual(["dark"]);expect(at(3,.6)).toEqual(["background"]);
  expect(pieces.filter(p=>p.unit==="centre"&&p.role==="background")).toEqual([{unit:"centre",role:"background",points:[[3,2],[4,3],[3,4],[2,3]]}]);
 });
 it("covers once, matches both mirrors and quarter turns, with reference area totals",()=>{
  expect(pieces).toHaveLength(53);const areas:Record<string,number>={};for(const p of pieces){const a=Math.abs(p.points.reduce((s,[x,y],i)=>{const [nx,ny]=p.points[(i+1)%p.points.length];return s+x*ny-nx*y;},0))/2;areas[p.role]=(areas[p.role]??0)+a;}expect(areas).toEqual({background:18,accent:8,dark:10});
  for(let y=.0341;y<6;y+=.173)for(let x=.0713;x<6;x+=.197){expect(at(x,y)).toHaveLength(1);expect(at(x,y)).toEqual(at(6-x,y));expect(at(x,y)).toEqual(at(x,6-y));expect(at(x,y)).toEqual(at(6-y,x));}
 });
 it.each([6,9,10,12,13.5,15,18])("has sufficient seam and trimming allowance at %s inches",block=>{
  const d=indianPuzzleDimensions(block);expect(2*d.smallCut-.5).toBeCloseTo(d.unitTrim,12);expect(2*d.geeseHeight-.5).toBeCloseTo(d.unitTrim,12);expect(3*d.unitTrim-1).toBeCloseTo(d.blockTrim,12);expect((d.diamondCut-.5)*Math.SQRT2).toBeCloseTo(d.unit,12);
  expect(d.hstStarter-Math.SQRT2/4-d.smallCut).toBeGreaterThan(.14);
  // Conventional four-at-a-time allowances: width + 1.25, height + .875; ours add >= .25/.125 trim margin.
  expect(d.geeseLarge-(d.unit+1.25)).toBeGreaterThanOrEqual(.25);expect(d.geeseSmall-(d.small+.875)).toBeGreaterThanOrEqual(.125);expect(d.settingStarter-(d.small+.875)).toBeGreaterThanOrEqual(.125);
  const r=calculateYardage({...base,blockSize:block,quiltWidth:block*3,quiltHeight:block*3});for(const f of ["B","E"]){expect(count(r,f,"Corner plain")).toBe(36);expect(count(r,f,"Corner HST")).toBe(36);}for(const f of ["A","B"]){expect(count(r,f,"Flying-geese large")).toBe(9);expect(count(r,f,"Flying-geese wing")).toBe(36);}expect(count(r,"A","Centre setting")).toBe(18);expect(count(r,"B","Whole centre")).toBe(9);
  expect(r.fabrics.find(f=>f.fabric==="B")?.pieces.find(p=>p.label.startsWith("Whole centre"))?.w).toBe(d.diamondCut);
 });
 it("matches hand-calculated 12-inch cuts and bolt totals",()=>{const d=indianPuzzleDimensions(12);expect(d.smallCut).toBe(2.5);expect(d.geeseLarge).toBe(5.5);expect(d.geeseSmall).toBe(3);expect(d.diamondCut).toBeCloseTo(3.32842712474619,12);const r=calculateYardage(base);for(const [f,n] of [["A",26],["B",39.82842712474619],["E",16.5]] as const)expect(r.fabrics.find(x=>x.fabric===f)?.totalInches).toBeCloseTo(n,12);});
 it("fits nine blocks, twelve 2.5×12.5 sashes, four intersections, five 3.5-inch border strips",()=>{const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{sashing:"F",border:"G"}});expect(count(r,"B","Whole centre")).toBe(9);expect(count(r,"F","Sashing strips")).toBe(12);expect(count(r,"F","Sashing intersection")).toBe(4);expect(r.fabrics.find(f=>f.fabric==="F")?.pieces[0]).toMatchObject({w:12.5,h:2.5});expect(r.fabrics.find(f=>f.fabric==="F")?.totalInches).toBe(12.5);expect(r.fabrics.find(f=>f.fabric==="G")?.totalInches).toBe(17.5);});
 it("honours independent assignments and pooled fabric choices without lost cuts",()=>{const r=calculateYardage({...base,assignments:{dark:"H",background:"I",accent:"J"}});expect(count(r,"H","Centre setting")).toBe(18);expect(count(r,"I","Whole centre")).toBe(9);expect(count(r,"J","Corner plain")).toBe(36);const merged=calculateYardage({...base,assignments:{dark:"A",background:"A",accent:"A"}});expect(merged.fabrics).toHaveLength(1);expect(merged.fabrics[0].pieces.reduce((n,p)=>n+p.count,0)).toBe(261);});
 it("creates no sashing for a single block",()=>{const r=calculateYardage({...base,quiltWidth:18,quiltHeight:18,borderWidth:3,sashingWidth:2,assignments:{sashing:"F",border:"G"}});expect(count(r,"B","Whole centre")).toBe(1);expect(r.fabrics.some(f=>f.fabric==="F")).toBe(false);});
});
