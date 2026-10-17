/** Art Square: one on-point centre and four pieced setting triangles. */
export type ArtSquareRole = "center" | "background" | "corners";
export type ArtSquarePoint = [number, number];
export interface ArtSquarePiece { role: ArtSquareRole; points: ArtSquarePoint[] }

export function artSquareGeometry(): ArtSquarePiece[] {
  const pieces: ArtSquarePiece[] = [{ role: "center", points: [[2,0],[4,2],[2,4],[0,2]] }];
  for (let turn = 0; turn < 4; turn++) {
    const rotate = ([x,y]: ArtSquarePoint): ArtSquarePoint => {
      for (let i=0; i<turn; i++) [x,y] = [4-y,x];
      return [x,y];
    };
    const add = (role: ArtSquareRole, points: ArtSquarePoint[]) => pieces.push({ role, points: points.map(rotate) });
    add("corners", [[0,0],[1,0],[1,1],[0,1]]);
    add("background", [[1,0],[2,0],[1,1]]);
    add("background", [[0,1],[1,1],[0,2]]);
  }
  return pieces;
}

const upEighth = (n: number) => Math.ceil((n-1e-10)*8)/8;
export function artSquareDimensions(block: number) {
  if (!(block>0) || !Number.isFinite(block)) throw new Error("A positive Art Square block size is required");
  const corner = block/4, center = block/Math.SQRT2;
  return { corner, center, centerBlank: upEighth(center+0.5), cornerBlank: upEighth(corner+0.5), backgroundBlank: upEighth(corner+0.875) };
}

/** True quarter-inch offsets; rounded rotary-cut blanks are trimmed to these. */
export function artSquareTemplates(block: number) {
  const d = artSquareDimensions(block);
  const square = (s: number): ArtSquarePoint[] => [[0,0],[s,0],[s,s],[0,s]];
  return [
    { name: "Centre square — cut 1, straight grain", seam: square(d.center) },
    { name: "Corner square — cut 4", seam: square(d.corner) },
    { name: "Pieced setting triangle — trim 4 sewn units", seam: [[0,0],[2*d.corner,0],[0,2*d.corner]] as ArtSquarePoint[] },
  ].map(template => {
    const lines = template.seam.map(([x,y],i) => {
      const [nx,ny] = template.seam[(i+1)%template.seam.length];
      const dx=nx-x, dy=ny-y, length=Math.hypot(dx,dy);
      return { a:dy/length, b:-dx/length, c:(dy*x-dx*y)/length+0.25 };
    });
    const cut: ArtSquarePoint[] = lines.map((line,i) => {
      const previous = lines[(i+lines.length-1)%lines.length];
      const det = previous.a*line.b-line.a*previous.b;
      return [(previous.c*line.b-line.c*previous.b)/det, (previous.a*line.c-line.a*previous.c)/det];
    });
    return { ...template, cut };
  });
}