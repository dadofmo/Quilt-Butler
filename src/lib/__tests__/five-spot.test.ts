import { describe, it, expect } from "vitest";
import { fiveSpotDimensions, fiveSpotPieces } from "../five-spot";
import { calculateYardage, piecesPerStrip } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "five-spot", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom",
  blockSize: 12, fabricWidth: 44, borderWidth: 0, sashingWidth: 0, assignments: {},
  safetyBuffer: false, fabricNames: {}, fabricPhotos: {}, cornerAccentSize: 0,
  patchworkFabricCount: 5, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18, fatQuarterHeight: 21,
  fatQuarterTrimMargin: .5, fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const pieces = (r: ReturnType<typeof calculateYardage>, f: string, label: string) =>
  r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label)) ?? [];
const count = (r: ReturnType<typeof calculateYardage>, f: string, label: string) => pieces(r,f,label).reduce((sum,p)=>sum+p.count,0);
const area = (pts: [number,number][]) => Math.abs(pts.reduce((sum,[x,y],i)=> {
  const [nx,ny]=pts[(i+1)%pts.length]; return sum+x*ny-nx*y;
},0))/2;

describe("Five Spot",()=> {
  it("registers five standard fabrics without displacing Nine Patch",()=> {
    const p=getPattern("five-spot");
    if (!p) throw new Error("Pattern missing");
    expect(countBlockFabrics(p.sections)).toBe(5);
    expect(p.sections.filter(s=>!['border','sashing'].includes(s.id)).map(s=>s.defaultFabric)).toEqual(["A","B","E","C","D"]);
    expect(PATTERNS[0].id).toBe("nine-patch");
  });
  it("matches five whole diamonds and four unsplit large triangles",()=> {
    const p=fiveSpotPieces();
    expect(p).toHaveLength(41);
    expect(p.filter(x=>x.role==='dark')).toHaveLength(4);
    expect(p.filter(x=>x.points.length===4 && x.unit!=='corner')).toHaveLength(5);
    expect(p.filter(x=>x.unit==='corner' && x.role==='spots')).toHaveLength(4);
    const areas: Record<string,number>={};
    for (const x of p) areas[x.role]=(areas[x.role]??0)+area(x.points);
    expect(areas).toEqual({spots:12, background:10, dark:8, inner:4, centreCorners:2});
    expect(p.find(x=>x.role==='dark')?.points).toEqual([[2,0],[2,2],[0,2]]);
    expect(p.find(x=>x.unit==='side' && x.role==='spots')?.points).toEqual([[3,0],[4,1],[3,2],[2,1]]);
  });
  it("tiles the full block exactly once with no gaps or overlaps",()=> {
    const p=fiveSpotPieces();
    // Non-grid sample points avoid seam lines; winding test for convex pieces.
    for (let y=.037;y<6;y+=.173) for (let x=.061;x<6;x+=.167) {
      const contains=(pts:[number,number][])=> {
        const cross=pts.map(([ax,ay],i)=>{const [bx,by]=pts[(i+1)%pts.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});
        return cross.every(v=>v>1e-8)||cross.every(v=>v< -1e-8);
      };
      expect(p.filter(poly=>contains(poly.points))).toHaveLength(1);
    }
  });
  it.each([10,12,15,18])("keeps exact trim sizes and sufficient triangle allowances at %s inches",block=> {
    const d=fiveSpotDimensions(block), r=calculateYardage({...base,blockSize:block,quiltWidth:block*3,quiltHeight:block*3});
    expect(d.diamondCut).toBeCloseTo(block/3/Math.SQRT2+.5,12);
    expect(d.unfinished*3-1).toBeCloseTo(block+.5,12);
    expect(d.smallSquare*2-.5).toBeCloseTo(d.unfinished,12);
    expect(d.settingStarter).toBeGreaterThan(d.unit/2+.5+Math.SQRT2/4);
    expect(d.darkStarter).toBeGreaterThan(d.unit+.5+Math.SQRT2/4);
    expect(pieces(r,"E","Side diamond")[0]?.w).toBeCloseTo(d.diamondCut,12);
    expect(count(r,"E","Side diamond")).toBe(36);
    expect(count(r,"B","Background triangle")).toBe(72);
    expect(count(r,"C","Inner side triangle")).toBe(36);
    expect(count(r,"D","Centre framing")).toBe(18);
    expect(count(r,"A","Large corner triangle")).toBe(18);
  });
  it("matches hand calculated 12-inch strip yardage",()=> {
    const r=calculateYardage(base);
    // 42.5 usable width: A 18 five-inch starters =>3 strips=15in;
    // B 9 diamonds=>1 strip plus72 three-inch starters=>6 strips;
    // C36 three-inch=>3 strips; D18=>2 strips;
    // E36 diamonds=>3 strips plus36 2.5in corners=>3 strips.
    const expected: Record<string,number>={A:15,B:18+4/Math.SQRT2+.5,C:9,D:6,E:3*(4/Math.SQRT2+.5)+7.5};
    for (const [f,inches] of Object.entries(expected)) expect(r.fabrics.find(x=>x.fabric===f)?.totalInches).toBeCloseTo(inches,2);
    expect(piecesPerStrip(3,44)).toBe(14);
  });
  it("fits sashing and accounts for all intersections and border strips",()=> {
    const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{sashing:"F",border:"G"}});
    expect(count(r,"E","Side diamond")).toBe(36);
    expect(count(r,"F","Sashing strips")).toBe(12);
    expect(count(r,"F","Sashing intersection")).toBe(4);
    expect(r.fabrics.find(x=>x.fabric==='F')?.totalInches).toBe(12.5);
    expect(r.fabrics.find(x=>x.fabric==='G')?.totalInches).toBe(17.5);
  });
  it("honours independent assignments and merged fabrics without losing cuts",()=> {
    const r=calculateYardage({...base,assignments:{dark:"H",background:"I",spots:"J",inner:"K",centreCorners:"L"}});
    expect(count(r,"J","Side diamond")).toBe(36);
    expect(count(r,"I","Centre diamond")).toBe(9);
    expect(count(r,"H","Large corner")).toBe(18);
    expect(count(r,"K","Inner side")).toBe(36);
    expect(count(r,"L","Centre framing")).toBe(18);
    const merged=calculateYardage({...base,assignments:{dark:"A",background:"A",spots:"A",inner:"A",centreCorners:"A"}});
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((sum,p)=>sum+p.count,0)).toBe(252);
  });
});