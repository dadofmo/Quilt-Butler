## Fabric photo rendering
- Wedding Rings shares its 5×5 cell map across rendering, counts and row instructions; use nine squares and sixteen two-at-a-time HSTs. Why: the reference uses straight seams, not curved wedding-ring piecing.
- Churn Dash uses shared four-role geometry/dimensions across previews and cuts; fit includes sashing and cuts include same-fabric intersections. Why: the drawn quilt must be sewable from the listed pieces.
- Uploads/camera shots go through `prepareFabricPhoto` (downscaled JPEG) before storage. Why: raw phone photos overflow saved planner storage and alias fine weaves.
- `buildFabricTile` fits lighting, scores seamless/repeat candidates with `tileArtifacts`, and box-halves to 256px; run the full fabric battery. Why: no one tiling method suits every print.
