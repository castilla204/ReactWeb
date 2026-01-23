# 🔑 Client IDs Configurados

## ✅ Android OAuth Client ID (CONFIGURADO)

**Client ID:**
```
61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com
```

**Configurado en:**
- ✅ `src/services/nativeAuthService.ts` (línea 36) - **ACTUALIZADO**

**SHA-1 usado:**
```
A7:77:CA:D5:A4:43:D5:EA:C5:A2:66:C5:40:CA:94:4D:94:42:65:10
```

**Package name:**
```
com.inspecciono.app
```

---

## 🌐 Web OAuth Client ID (EXISTENTE)

**Client ID:**
```
61603823707-4vsp43naifci8t893hdc276kkhbvn49a.apps.googleusercontent.com
```

**Configurado en:**
- `src/components/GoogleSignInButton.tsx`
- `src/pages/ServiceReviewPage.tsx`
- `src/components/MobileBottomBar.tsx`
- `src/main.tsx`
- `src/components/GoogleAuth.tsx`
- `src/services/authService.ts`

**Uso:** Versión web de la aplicación

---

## 📱 iOS OAuth Client ID

**Estado:** Pendiente de crear

**Pasos:**
1. Ve a Google Cloud Console
2. Crea un nuevo OAuth Client ID
3. Tipo: iOS
4. Bundle ID: `com.inspecciono.app`
5. Copia el Client ID generado

**Cuando lo tengas, actualiza:**
- `src/services/nativeAuthService.ts` (si quieres usar uno diferente para iOS)

---

## ✅ Estado Actual

- ✅ Android: **CONFIGURADO** con Client ID: `61603823707-qdtl859lc1cktfh8m77ppl1brtdkndsv.apps.googleusercontent.com`
- ✅ Web: Configurado con Client ID existente
- ⏳ iOS: Pendiente de crear Client ID (puede usar el mismo de Android o crear uno específico)

---

## 🔄 Próximos Pasos

1. **Crear OAuth Client ID para iOS** en Google Cloud Console
2. **Actualizar código** si quieres usar un Client ID diferente para iOS
3. **Probar en Android:** `npm run cap:run:android`
4. **Probar en iOS:** `npm run cap:run:ios` (después de crear Client ID)

---

## 📝 Nota

Actualmente, el código usa el mismo Client ID de Android para ambas plataformas móviles. Si creas un Client ID específico para iOS, puedes actualizar `nativeAuthService.ts` para detectar la plataforma y usar el Client ID correspondiente.
