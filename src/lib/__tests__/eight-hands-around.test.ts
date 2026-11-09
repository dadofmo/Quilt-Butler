import { describe, expect, it } from "vitest";
import { eightHandsDimensions, eightHandsPolygons, EIGHT_HANDS_COUNTS } from "../eight-hands-around";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern:"eight-hands-around",quiltWidth:36,quiltHeight:36,sizePreset:"custom",
  blockSize:12,fabricWidth:44,borderWidth:0,sashingWidth:0,assignments:{},
  safetyBuffer:false,fabricNames:{},fabricPhotos:{},cornerAccentSize:0,
  patchworkFabricCount:4,patchworkGrid:{},pricePerYard:"",itemPrices:{},
  fabricSource:"yardage",jellyRollStripCount:40,fatQuarterWidth:18,fatQuarterHeight:21,
  fatQuarterTrimMargin:.5,fatQuarterCount:20,alternateBlocks:false,blockLayout:"straight",
  customBlock:null,customBlockB:null,useBlockB:false,customSwapPair:null,
};
const piece=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>
  r.fabrics.find(x=>x.fabric===f)?.pieces.find(p=>p.label.startsWith(label));
const area=(pts:[number,number][])=>Math.abs(pts.reduce((a,[x,y],i)=>{
  const [nx,ny]=pts[(i+1)%pts.length];return a+x*ny-nx*y;
},0))/2;
describe("Eight Hands Around reference geometry",()=>{
  it("registers four fabrics, preserves existing patterns and Nine Patch first",()=>{
    const p=getPattern("eight-hands-around");
    expect(p?.sections.slice(0,4).map(s=>s.defaultFabric)).toEqual(["A","B","C","D"]);
    expect(countBlockFabrics(p?.sections ?? [])).toBe(4);
    expect(PATTERNS).toHaveLength(76);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(EIGHT_HANDS_COUNTS).toEqual({cornerHsts:4,outerGeese:4,innerGeese:4,smallSquares:4,centers:1});
  });
  it("preserves whole geese bodies, both scales and all reference coordinates",()=>{
    const p=eightHandsPolygons(8);
    expect(p).toHaveLength(37);
    expect(p.filter(x=>x.role==="center")).toEqual([{role:"center",points:[[3,3],[5,3],[5,5],[3,5]]}]);
    expect(p).toContainEqual({role:"outer",points:[[0,0],[2,0],[0,2]]});
    expect(p).toContainEqual({role:"outer",points:[[8,0],[8,2],[6,0]]});
    expect(p).toContainEqual({role:"outer",points:[[8,8],[6,8],[8,6]]});
    expect(p).toContainEqual({role:"outer",points:[[0,8],[0,6],[2,8]]});
    expect(p).toContainEqual({role:"background",points:[[2,0],[6,0],[4,2]]});
    expect(p).toContainEqual({role:"background",points:[[3,2],[5,2],[4,3]]});
    expect(p).toContainEqual({role:"background",points:[[8,2],[8,6],[6,4]]});
    expect(p).toContainEqual({role:"background",points:[[6,2],[6,4],[5,3]]});
    expect(p.reduce((s,x)=>s+area(x.points),0)).toBeCloseTo(64);
    for(const [role,total] of [["outer",24],["background",32],["inner",4],["center",4]])
      expect(p.filter(x=>x.role===role).reduce((s,x)=>s+area(x.points),0)).toBeCloseTo(total);
  });
  it("covers every sampled interior point exactly once without overlaps",()=>{
    const p=eightHandsPolygons(8);
    const inside=(x:number,y:number,pts:[number,number][])=>{
      const signs=pts.map(([ax,ay],i)=>{const [bx,by]=pts[(i+1)%pts.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});
      return signs.every(s=>s>0)||signs.every(s=>s<0);
    };
    for(let x=.137;x<8;x+=.25)for(let y=.081;y<8;y+=.25)
      expect(p.filter(poly=>inside(x,y,poly.points))).toHaveLength(1);
  });
});
describe("Eight Hands Around practical cutting",()=>{
  it.each([
    [8,1.5,2.5,3,2,3.5,5.5], [10,1.75,3,3.5,2.25,4,6.5],
    [12,2,3.5,4,2.5,4.5,7.5], [15,2.375,4.25,4.75,2.875,5.25,9],
    [18,2.75,5,5.5,3.25,6,10.5],
  ])("fits both unit scales at %s-inch blocks",(size,small,center,outerSmall,innerSmall,innerLarge,outerLarge)=>{
    const d=eightHandsDimensions(size);
    expect(d).toMatchObject({smallSquare:small,center,outerSmall,innerSmall,innerLarge,outerLarge});
    expect(2*d.smallSquare+d.innerWidth-1).toBeCloseTo(d.middle);
    expect(2*d.innerHeight+d.center-1).toBeCloseTo(d.middle);
    expect(2*d.corner+d.outerWidth-1).toBeCloseTo(d.unfinished);
    expect(2*d.outerHeight+d.middle-1).toBeCloseTo(d.unfinished);
    // Standard no-waste seam geometry: large = 2×small − 1/2,
    // untrimmed goose height = small − 3/8; leaves >=1/8 trimming margin.
    expect(d.outerLarge).toBe(2*d.outerSmall-.5);
    expect(d.innerLarge).toBe(2*d.innerSmall-.5);
    expect(d.outerSmall-.375-d.outerHeight).toBeGreaterThanOrEqual(.125-1e-9);
    expect(d.innerSmall-.375-d.innerHeight).toBeGreaterThanOrEqual(.125-1e-9);
    const r=calculateYardage({...base,blockSize:size,quiltWidth:size*3,quiltHeight:size*3});
    expect(piece(r,"A","Corner HST")).toMatchObject({count:18,w:outerSmall,h:outerSmall});
    expect(piece(r,"B","Outer geese large")).toMatchObject({count:9,w:outerLarge,h:outerLarge});
    expect(piece(r,"B","Inner geese large")).toMatchObject({count:9,w:innerLarge,h:innerLarge});
    expect(piece(r,"B","Small background")).toMatchObject({count:36,w:small,h:small});
    expect(piece(r,"C","Inner geese wing")).toMatchObject({count:36,w:innerSmall,h:innerSmall});
    expect(piece(r,"D","Whole centre")).toMatchObject({count:9,w:center,h:center});
  });
  it("hand-checks strip packing and yardage at 12 inches",()=>{
    // 42.5 usable width: A 54 four-inch cuts => 6 strips;
    // B: 2×4 + 2×7.5 + 1×4.5 + 2×2; C 3×2.5; D 1×3.5.
    expect(calculateYardage(base).fabrics.map(f=>[f.fabric,f.totalInches,f.yards])).toEqual([
      ["A",24,.75],["B",31.5,1],["C",7.5,.25],["D",3.5,.25],
    ]);
    expect(calculateYardage({...base,safetyBuffer:true}).fabrics.find(f=>f.fabric==="B")?.yards).toBe(1);
  });
  it("fits 46-inch quilt with 2-inch sashing and 3-inch borders",()=>{
    const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{border:"D"}});
    expect(piece(r,"D","Whole centre")?.count).toBe(9);
    expect(piece(r,"E","Sashing strips")).toMatchObject({count:12,w:12.5,h:2.5});
    expect(piece(r,"E","Sashing intersection")).toMatchObject({count:4,w:2.5,h:2.5});
    expect(r.fabrics.find(f=>f.fabric==="E")).toMatchObject({totalInches:12.5,yards:.5});
    // Inner top 40×40. Borders: two 40.5 and two 46.5 lengths + joins;
    // five WOF strips at 3.5 => 17.5 inches, plus D centre strip 3.5.
    expect(r.fabrics.find(f=>f.fabric==="D")).toMatchObject({totalInches:21,yards:.75});
    const fit=calculateYardage({...base,quiltWidth:50,quiltHeight:65,sashingWidth:2});
    expect(piece(fit,"D","Whole centre")?.count).toBe(12);
    expect(piece(fit,"E","Sashing strips")?.count).toBe(17);
    expect(piece(fit,"E","Sashing intersection")?.count).toBe(6);
  });
  it("respects independent and shared fabric assignments",()=>{
    const r=calculateYardage({...base,assignments:{outer:"D",background:"C",inner:"B",center:"A"}});
    expect(piece(r,"D","Outer geese wing")?.count).toBe(36);
    expect(piece(r,"C","Small background")?.count).toBe(36);
    expect(piece(r,"B","Inner geese wing")?.count).toBe(36);
    expect(piece(r,"A","Whole centre")?.count).toBe(9);
    const merged=calculateYardage({...base,assignments:{outer:"A",background:"A",inner:"A",center:"A"}});
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((s,p)=>s+p.count,0)).toBe(171);
  });
});