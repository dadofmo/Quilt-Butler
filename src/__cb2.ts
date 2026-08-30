import { calculateYardage } from "@/lib/yardage";
import { initialState } from "@/lib/planner-store";
import { emptyDesign, key } from "@/lib/custom-block";
const d = emptyDesign(4, "A");
d.cells[key(0,0)] = { kind:"hst", rotation:0, fabrics:["A","B"] };
const s:any = { ...(initialState as any), pattern:"custom-block", customBlock:d };
const r:any = calculateYardage(s);
for (const f of r.fabrics) console.log(f.fabric, "yards", f.yards, "strips", f.strips.map((x:any)=>[x.stripWidth,x.count]), "pieces", f.pieces.map((p:any)=>[p.label,p.count,p.w,p.h]));
