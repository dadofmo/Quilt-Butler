"""SOP browser walkthrough: Picker -> Size -> Fabrics -> Results -> Print for one pattern.
Usage: python3 scripts/verify-pattern-walkthrough.py "Pattern Name" [block_inches] [outdir]"""
import asyncio, re, sys, os
from playwright.async_api import async_playwright
NAME=sys.argv[1]; BLOCK=sys.argv[2] if len(sys.argv)>2 else "12"; S=(sys.argv[3] if len(sys.argv)>3 else "/tmp/browser/sop")+"/"
os.makedirs(S,exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True); c=await b.new_context(viewport={"width":1280,"height":1800}); pg=await c.new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("console",lambda m: m.type=="error" and errs.append(m.text))
    await pg.goto("http://localhost:8080/")
    await pg.evaluate("localStorage.clear();localStorage.setItem('qb_license_v1',JSON.stringify({unlocked:true,source:'owner',at:new Date().toISOString()}))")
    await pg.goto("http://localhost:8080/",wait_until="networkidle")
    card=pg.get_by_text(NAME,exact=True).first
    await card.scroll_into_view_if_needed(); await pg.wait_for_timeout(600)
    bb=await card.bounding_box()
    await pg.screenshot(clip={"x":max(0,bb["x"]-60),"y":max(0,bb["y"]-320),"width":340,"height":380},path=S+"1_picker.png")
    await card.click(); await pg.wait_for_timeout(1200); print("size url",pg.url)
    await pg.get_by_placeholder("e.g. 44").fill("42"); await pg.get_by_placeholder("e.g. 4.5").fill(BLOCK); await pg.get_by_placeholder("e.g. 3 (or 0").fill("3")
    await pg.screenshot(path=S+"2_size.png")
    await pg.get_by_role("button",name=re.compile("Assign fabrics")).click(); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(2000)
    print("fabrics url",pg.url); await pg.screenshot(path=S+"3_fabrics.png")
    open(S+"fabrics.txt","w").write(await pg.inner_text("body"))
    btn=pg.get_by_role("button",name=re.compile("results|calculate|yardage|plan",re.I)).last
    await btn.click(); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(2000); print("results url",pg.url)
    open(S+"results.txt","w").write(await pg.inner_text("body")); await pg.screenshot(path=S+"4_results.png")
    await pg.emulate_media(media="print"); await pg.wait_for_timeout(800); await pg.screenshot(path=S+"5_print.png")
    await pg.pdf(path=S+"print.pdf"); print("errors",errs); await b.close()
asyncio.run(main())
