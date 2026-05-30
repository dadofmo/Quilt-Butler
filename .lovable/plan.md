## Change

Update `vercel.json` to add the `github.autoAlias: false` block:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "github": {
    "autoAlias": false
  },
  "rewrites": [
    { "source": "/((?!.*\\.).*)", "destination": "/index.html" }
  ]
}
```

## Result
- Pushes still build Vercel preview deployments.
- quiltbutler.com stays on whatever you last promoted.
- To go live: Vercel dashboard → Deployments → ⋯ → **Promote to Production**.

Switch to build mode to apply.