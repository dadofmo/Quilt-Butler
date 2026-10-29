## Fabric photo rendering
- Uploads/camera shots go through `prepareFabricPhoto` (downscaled JPEG) before storage. Why: raw phone photos overflow saved planner storage and alias fine weaves.
- `buildFabricTile` fits lighting, scores seamless/repeat candidates with `tileArtifacts`, and box-halves to 256px; run the full fabric battery. Why: no one tiling method suits every print.
