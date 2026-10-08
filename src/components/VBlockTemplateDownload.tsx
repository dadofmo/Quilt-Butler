import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vBlockTemplates } from "@/lib/v-block";

export function VBlockTemplateDownload({ blockSize }: { blockSize: number }) {
  const download = async () => {
    const { jsPDF } = await import("jspdf");
    const unit = blockSize / 3;
    const width = Math.max(8.5, unit + 2), height = Math.max(11, unit + 3);
    const doc = new jsPDF({ unit: "in", format: [width, height] });
    const draw = (poly: [number, number][], ox: number, oy: number) => {
      poly.forEach((p, i) => {
        const next = poly[(i + 1) % poly.length];
        doc.line(ox + p[0], oy + p[1], ox + next[0], oy + next[1]);
      });
    };
    vBlockTemplates(unit).forEach((template, i) => {
      if (i) doc.addPage([width, height]);
      doc.setFontSize(16);
      doc.text(`54-40 or Fight: ${template.name}`, 0.5, 0.5);
      doc.setFontSize(10);
      doc.text(`Finished block: ${blockSize} inches. V unit: ${unit.toFixed(3)} inches.`, 0.5, 0.8);
      doc.text("Print at 100% / Actual size. Do not fit to page. Solid = cut; dashed = sew.", 0.5, 1.05);
      doc.setLineWidth(0.012);
      draw(template.cut, 0.75, 1.6);
      doc.setLineDashPattern([0.06, 0.04], 0);
      draw(template.seam, 0.75, 1.6);
      doc.setLineDashPattern([], 0);
      doc.rect(0.75, height - 1.5, 1, 1);
      doc.text("Check this square measures exactly 1 inch before cutting fabric.", 2, height - 1);
    });
    doc.save(`54-40-or-fight-${blockSize}-inch-templates.pdf`);
  };
  return <Button variant="outline" className="mt-3" onClick={download}>
    <Download className="mr-2 h-4 w-4" /> Download full-size V-block templates
  </Button>;
}