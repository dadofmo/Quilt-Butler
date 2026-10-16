import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { albumFivePatchTemplates } from "@/lib/album-five-patch";

export function AlbumFivePatchTemplateDownload({ blockSize }: { blockSize: number }) {
  const download = async () => {
    const { jsPDF } = await import("jspdf");
    const templates = albumFivePatchTemplates(blockSize);
    const doc = new jsPDF({ unit: "in", format: "letter" });
    templates.forEach((template, i) => {
      const xs = template.cut.map(p => p[0]), ys = template.cut.map(p => p[1]);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      const width = Math.max(8.5, Math.max(...xs) - minX + 1.5);
      const height = Math.max(11, Math.max(...ys) - minY + 4);
      // Custom-size pages preserve full scale for larger blocks, never shrink.
      if (i === 0) doc.deletePage(1);
      doc.addPage([width, height], width > height ? "landscape" : "portrait");
      doc.setFontSize(14);
      doc.text(`Album 5 Patch: ${template.name}`, 0.5, 0.5);
      doc.setFontSize(10);
      doc.text(`Finished block: ${blockSize} inches. 1/4-inch seam allowances included.`, 0.5, 0.8);
      doc.text("Print Actual size / 100%. Never Fit. Solid = cut/trim; dashed = seam.", 0.5, 1.05);
      doc.text("Use straight grain for the long edges of rails and bars. Mark seam endpoints.", 0.5, 1.3);
      const draw = (points: [number, number][]) => points.forEach(([x, y], j) => {
        const next = points[(j + 1) % points.length];
        doc.line(0.75 + x - minX, 1.75 + y - minY, 0.75 + next[0] - minX, 1.75 + next[1] - minY);
      });
      doc.setLineWidth(0.012);
      draw(template.cut);
      doc.setLineDashPattern([0.06, 0.04], 0);
      draw(template.seam);
      doc.setLineDashPattern([], 0);
      for (const [x, y] of template.seam) doc.circle(0.75 + x - minX, 1.75 + y - minY, 0.025);
      doc.rect(0.75, height - 1.5, 1, 1);
      doc.text("Check this square measures exactly 1 inch before cutting.", 2, height - 1);
    });
    doc.save(`album-5-patch-${blockSize}-inch-templates.pdf`);
  };
  return <Button variant="outline" className="mt-3" onClick={download}>
    <Download className="mr-2 h-4 w-4" /> Download Album 5 Patch cutting templates
  </Button>;
}