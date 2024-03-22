# bunfig.toml
```toml
preload = ["bun-ts-runtime-checks/register-plugins.ts"]
```

# build script

```typescript
import Bun from 'bun'
import { tsRuntimeChecks } from 'bun-ts-runtime-checks/ts-runtime-checks.js'

await Bun.build({
  entrypoints: ['./index.ts'],
  plugins: [tsRuntimeChecks],
  outdir: './out'
})
```