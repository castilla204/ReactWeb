# Optimizaciones pendientes en el dashboard de Cloudflare

> Los dos cambios siguientes **no son de código** — hay que activarlos en el panel
> de la zona `inspecciono.com` (o el dominio activo). Tiempo total: ~3 minutos.

## 1. Compression Rules — preferir Zstd/Brotli sobre Gzip

> **Nota Free vs Pro:** en el plan **Free**, las Compression Rules SOLO dejan
> elegir el orden de algoritmos. La opción de "Additional MIME types" para
> `application/geo+json` o `application/x-protobuf` es **solo Pro+**. Para los
> GeoJSON usamos el truco del Content-Type — ver más abajo.

**Pasos (Free):**
1. Cloudflare Dashboard → `inspecciono.com` → **Rules → Compression Rules**.
2. Click **Create rule** → nombre: `Zstd > Brotli > Gzip para todo el dominio`.
3. Filtro: `Custom filter expression` →
   ```
   (http.host eq "inspecciono.com")
   ```
4. Then → **Custom** → orden de algoritmos:
   1. `Zstandard`
   2. `Brotli`
   3. `Gzip`
5. **Deploy**.

**Ganancia:** Zstd ahorra ~5-15% adicional sobre brotli en clientes Chrome 120+
(mayoría a fecha 2026). Brotli sigue activo como fallback para los demás.

### Truco para GeoJSON (sin pagar Pro)

Cloudflare comprime por defecto `application/json` pero NO `application/geo+json`.
En `public/serve.json` añadimos una override de header que hace que `serve` envíe
los `.geojson` con `Content-Type: application/json; charset=utf-8`. Resultado:
CF los mete en su lista de comprimibles automáticamente.

```jsonc
// public/serve.json
{
  "source": "**/*.geojson",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=86400" },
    { "key": "Content-Type", "value": "application/json; charset=utf-8" }
  ]
}
```

**Ganancia esperada en los 3 GeoJSON** (`ne_110m_land` 47 KB, `ne_50m_coastline`
462 KB, `ne_50m_admin_0_boundary_lines_land` 159 KB): brotli típicamente ~85-90%
sobre JSON estructurado → **~668 KB → ~80 KB** cuando se piden los tres.

### Vector tiles `.pbf`

Si en algún momento sirves tiles desde tu origen, ponles `Cache-Control:
no-transform` para que Cloudflare no los re-encode (suelen venir pre-gzipped
desde Mapbox/Protomaps). Hoy van directo a `api.mapbox.com` → no aplica.

## 2. HTTP/3 + 0-RTT

Cloudflare lo da gratis en cualquier plan. Reduce el handshake inicial en móviles
con redes inestables.

**Pasos:**
1. Cloudflare Dashboard → `inspecciono.com` → **Speed → Optimization → Protocol
   Optimization**.
2. Habilitar:
   - **HTTP/3 (with QUIC)** → ON
   - **0-RTT Connection Resumption** → ON
3. Save.

**Verificar:**
- `curl -I --http3 https://inspecciono.com/` → cabeceras incluyen `alt-svc: h3="..."`.
- Chrome DevTools → Network → columna **Protocol** debe decir `h3` para los assets
  de Cloudflare.

**Ganancia esperada:** -50 a -150 ms en la primera conexión sobre 4G.

## 3. Validación posterior

Una vez activado, hacer un Lighthouse en mobile slow-4G:
- LCP: objetivo < 2.5 s
- INP: objetivo < 200 ms (datos field, no lab)
- CLS: objetivo < 0.1

Comparar con el baseline RUM en Supabase:
```sql
select name, percentile_cont(0.75) within group (order by value) as p75,
       count(*) as n, max(inserted_at) as last
from public.web_vitals
where inserted_at > now() - interval '7 days'
group by name;
```

## Lo que NO activar (consenso del audit anterior)

- **APO (Automatic Platform Optimization)**: WordPress-only, no aplica.
- **Polish**: deprecado para zonas nuevas desde marzo 2026; no genera AVIF. Si
  necesitas resizing on-the-fly, usar **Image Resizing** (`cdn-cgi/image`, 5k
  transformaciones gratis/mes) — pero ya generamos AVIF en build con Sharp.
- **Mirage**: deprecado.
- **103 Early Hints**: el HTML ya está cacheado en edge (TTFB ~5 ms); sin
  think-time la ganancia es nula.
