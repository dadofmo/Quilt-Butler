## Fabric photo rendering
- Eight Hands Around shares its 8×8 geometry and two unit scales across all previews and cuts; use oversized four-at-a-time geese, two-at-a-time corner HSTs and a nested nine-patch. Why: continuous triangles and straight seams match the reference without needless seams.
- Wedding Rings shares its 5×5 cell map across rendering, counts and row instructions; use nine squares and sixteen two-at-a-time HSTs. Why: the reference uses straight seams, not curved wedding-ring piecing.
- Churn Dash uses shared four-role geometry/dimensions across previews and cuts; fit includes sashing and cuts include same-fabric intersections. Why: the drawn quilt must be sewable from the listed pieces.
- Uploads/camera shots go through `prepareFabricPhoto` (downscaled JPEG) before storage. Why: raw phone photos overflow saved planner storage and alias fine weaves.
- `buildFabricTile` fits lighting, scores seamless/repeat candidates with `tileArtifacts`, and box-halves to 256px; run the full fabric battery. Why: no one tiling method suits every print.
- Country Roads shares its 7×7 cell map across previews and cuts: four continuous 1×3 bars, a separate centre square, and four mirrored corner nine-patches (corner square, four squares, four two-at-a-time HSTs). Why: straight seams, fewest pieces.
