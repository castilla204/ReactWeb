# 📋 IMPLEMENTACIÓN FRONTEND: Manejo de Timezone

## ✅ Estado Actual del Frontend

Este documento explica **minuciosamente** cómo está implementado el frontend para el manejo de timezones, para que el backend pueda verificar al 100% que todo está correcto.

---

## 🎯 Principio Fundamental

**El frontend NO hace conversiones manuales de timezone.**

- ✅ **Envía** fechas/horas en hora LOCAL del experto (sin conversión)
- ✅ **Muestra** usando los campos `*Local` que el backend proporciona
- ❌ **NO convierte** manualmente con JavaScript
- ❌ **NO usa** `proposedDate`/`proposedTime` para mostrar (están en UTC)

---

## 📡 1. ENVÍO DE DATOS AL BACKEND

### Endpoint: `POST /api/appointments/propose/{searchHireId}`

#### Código Frontend (AppointmentForm.tsx)

```typescript
// ✅ CORRECTO: Envía fecha/hora en hora LOCAL (sin conversión)
const dataToSubmit: ProposeAppointmentDto = {
  proposedDate: "2025-03-15",      // ✅ Formato: "YYYY-MM-DD" (hora LOCAL)
  proposedTime: "14:00:00",        // ✅ Formato: "HH:mm:ss" (hora LOCAL)
  location: "Calle Principal 123",
  latitude: 40.4168,
  longitude: -3.7038,
  // timezone: NO se envía - el backend lo detecta automáticamente del experto
};
```

#### Ejemplo Real de Request Body

```json
{
  "proposedDate": "2025-03-15",
  "proposedTime": "14:00:00",
  "location": "Calle Mayor 123, Madrid",
  "latitude": 40.4168,
  "longitude": -3.7038,
  "doorNumber": "Portal A, 2ºB",
  "ownerPhone": "+34 666 123 456",
  "siteDetails": "Entrada por el garaje"
}
```

**⚠️ IMPORTANTE:**
- `proposedDate` y `proposedTime` están en **hora LOCAL del experto**
- **NO se envía** el campo `timezone` (el backend lo detecta automáticamente)
- **NO se convierte** a UTC en el frontend
- El backend debe convertir `Local → UTC` antes de guardar

---

## 📥 2. RECEPCIÓN DE DATOS DEL BACKEND

### Endpoint: `GET /api/appointments/{id}` o `GET /api/appointments/by-search-hire/{searchHireId}`

#### Qué Espera el Frontend

El frontend espera recibir un objeto `Appointment` con estos campos:

```typescript
interface Appointment {
  id: number;
  searchHireId: number;
  status: string;
  
  // ⚠️ NO USAR PARA MOSTRAR - Están en UTC
  proposedDate?: string;           // UTC (formato: "YYYY-MM-DD")
  proposedTime?: string;           // UTC (formato: "HH:mm:ss")
  
  // ✅ USAR ESTOS PARA MOSTRAR - Hora local del experto
  proposedDateLocal?: string;      // Hora LOCAL (formato: "YYYY-MM-DD")
  proposedTimeLocal?: string;      // Hora LOCAL (formato: "HH:mm:ss")
  timezone?: string;               // IANA timezone (ej: "Europe/Madrid")
  country?: string;                // Código de país (ej: "ES")
  
  location?: string;
  latitude?: number;
  longitude?: number;
  // ... otros campos
}
```

#### Ejemplo Real de Response Esperado

```json
{
  "id": 456,
  "searchHireId": 123,
  "status": "appointment_confirmed",
  
  "proposedDate": "2025-03-15",           // ⚠️ UTC (NO usar para mostrar)
  "proposedTime": "13:00:00",             // ⚠️ UTC (NO usar para mostrar)
  
  "proposedDateLocal": "2025-03-15",     // ✅ Hora LOCAL (USAR ESTE)
  "proposedTimeLocal": "14:00:00",        // ✅ Hora LOCAL (USAR ESTE)
  "timezone": "Europe/Madrid",            // ✅ Timezone usado
  "country": "ES",                        // ✅ País del experto
  
  "location": "Calle Principal 123",
  "latitude": 40.4168,
  "longitude": -3.7038
}
```

**✅ CRÍTICO:**
- El backend **DEBE** proporcionar `proposedDateLocal` y `proposedTimeLocal`
- Estos campos deben estar en **hora LOCAL del experto** (no UTC)
- El campo `timezone` debe ser el IANA timezone del experto

---

## 🖥️ 3. CÓMO EL FRONTEND MUESTRA LAS FECHAS

### Código: `formatAppointmentForDisplay()` en `dateService.ts`

```typescript
export const formatAppointmentForDisplay = (
  appointment: Appointment,
  timezone?: string
): FormattedAppointmentDate => {
  // ✅ CORRECTO: Usar campos *Local que el backend proporciona
  if (appointment.proposedDateLocal && appointment.proposedTimeLocal) {
    // El backend ya convirtió UTC → Local, solo formatear para mostrar
    const localDateTime = parseISO(`${appointment.proposedDateLocal}T${appointment.proposedTimeLocal}`);
    
    return {
      date: format(localDateTime, 'dd/MM/yyyy'),           // "15/03/2025"
      time: format(localDateTime, 'HH:mm'),                  // "14:00"
      fullDateTime: format(localDateTime, "EEEE, d 'de' MMMM yyyy, HH:mm", { locale: es }),
      // "Sábado, 15 de marzo de 2025, 14:00"
      dayOfWeek: format(localDateTime, 'EEEE', { locale: es }), // "Sábado"
      relative: getRelativeTime(localDateTime)               // "en 2 días"
    };
  }
  
  // ⚠️ FALLBACK: Solo si no hay campos *Local (no debería pasar)
  // ... código de fallback usando UTC ...
};
```

### Uso en Componentes

#### AppointmentStatus.tsx

```typescript
// ✅ CORRECTO: Usa formatAppointmentForDisplay que usa campos *Local
const formattedDate = formatAppointmentForDisplay(appointment);
const appointmentTimezone = appointment.timezone || appointment.userTimezone || 'UTC';

// Muestra:
// "Sábado, 15 de marzo de 2025, 14:00"
// "Zona horaria: Europe/Madrid"
```

#### SearchDetails.tsx

```typescript
// ✅ CORRECTO: Prioriza campos *Local
const dateToUse = appointment.proposedDateLocal || appointment.proposedDate;
const timeToUse = appointment.proposedTimeLocal || appointment.proposedTime;

// Formatea para mostrar:
new Date(dateToUse).toLocaleDateString('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
}) + ' ' + timeToUse.substring(0, 5)
// Resultado: "15 mar 2025 14:00"
```

---

## 🔄 4. FLUJO COMPLETO FRONTEND-BACKEND

### Escenario: Cliente Propone Cita

```
1. Frontend: Usuario selecciona fecha/hora
   - Fecha: 15 marzo 2025
   - Hora: 14:00 (hora local del experto)

2. Frontend envía al backend:
   POST /api/appointments/propose/123
   {
     "proposedDate": "2025-03-15",      // ✅ Hora LOCAL
     "proposedTime": "14:00:00",        // ✅ Hora LOCAL
     "location": "Calle Principal 123"
   }

3. Backend recibe y procesa:
   - Detecta timezone del experto: "Europe/Madrid" (desde SearchHire.ExpertTimezone)
   - Convierte: 14:00 Europe/Madrid → 13:00 UTC (en marzo, UTC+1)
   - Guarda en BD: 2025-03-15 13:00:00 UTC

4. Backend devuelve respuesta:
   {
     "proposedDate": "2025-03-15",           // UTC
     "proposedTime": "13:00:00",             // UTC
     "proposedDateLocal": "2025-03-15",     // ✅ LOCAL
     "proposedTimeLocal": "14:00:00",       // ✅ LOCAL
     "timezone": "Europe/Madrid"             // ✅ Timezone usado
   }

5. Frontend muestra:
   "Cita propuesta: 15 de marzo de 2025 a las 14:00 (Europe/Madrid)"
   ✅ Usa proposedDateLocal y proposedTimeLocal
```

### Escenario: Experto Ve Cita Propuesta

```
1. Frontend obtiene cita:
   GET /api/appointments/by-search-hire/123

2. Backend devuelve:
   {
     "proposedDateLocal": "2025-03-15",  // ✅ Hora LOCAL
     "proposedTimeLocal": "14:00:00",     // ✅ Hora LOCAL
     "timezone": "Europe/Madrid"
   }

3. Frontend muestra:
   "Cita propuesta: 15 de marzo de 2025 a las 14:00"
   ✅ El experto ve la hora en su timezone local
```

---

## ✅ 5. CHECKLIST PARA EL BACKEND

### Al Recibir Datos del Frontend

- [ ] **Recibir** `proposedDate` y `proposedTime` en hora LOCAL del experto
- [ ] **NO esperar** que el frontend envíe timezone (se detecta automáticamente)
- [ ] **Detectar** timezone del experto desde `SearchHire.ExpertTimezone`
- [ ] **Convertir** Local → UTC antes de guardar en BD
- [ ] **Validar** que la fecha/hora esté en el futuro (mínimo 24h)

### Al Devolver Datos al Frontend

- [ ] **Proporcionar** `proposedDateLocal` y `proposedTimeLocal` (hora LOCAL)
- [ ] **Proporcionar** `proposedDate` y `proposedTime` (UTC) para cálculos
- [ ] **Incluir** campo `timezone` con IANA timezone del experto
- [ ] **Incluir** campo `country` con código ISO del país (opcional pero recomendado)
- [ ] **Asegurar** que `proposedDateLocal` y `proposedTimeLocal` NO estén en UTC

### Validaciones Críticas

- [ ] **Verificar** que `proposedDateLocal` ≠ `proposedDate` (excepto si timezone es UTC)
- [ ] **Verificar** que `proposedTimeLocal` ≠ `proposedTime` (excepto si timezone es UTC)
- [ ] **Verificar** que la conversión UTC → Local sea correcta
- [ ] **Manejar** DST (horario de verano) correctamente

---

## 🧪 6. CASOS DE PRUEBA PARA VERIFICAR

### Caso 1: Experto en Madrid (Europe/Madrid, UTC+1 en marzo)

**Input del Frontend:**
```json
{
  "proposedDate": "2025-03-15",
  "proposedTime": "14:00:00"
}
```

**Backend debe guardar en BD:**
- UTC: `2025-03-15 13:00:00` (14:00 - 1 hora = 13:00 UTC)

**Backend debe devolver:**
```json
{
  "proposedDate": "2025-03-15",           // UTC
  "proposedTime": "13:00:00",             // UTC
  "proposedDateLocal": "2025-03-15",     // LOCAL
  "proposedTimeLocal": "14:00:00",       // LOCAL
  "timezone": "Europe/Madrid"
}
```

**Frontend mostrará:**
- "15 de marzo de 2025 a las 14:00 (Europe/Madrid)" ✅

---

### Caso 2: Experto en México (America/Mexico_City, UTC-6)

**Input del Frontend:**
```json
{
  "proposedDate": "2025-03-15",
  "proposedTime": "14:00:00"
}
```

**Backend debe guardar en BD:**
- UTC: `2025-03-15 20:00:00` (14:00 + 6 horas = 20:00 UTC)

**Backend debe devolver:**
```json
{
  "proposedDate": "2025-03-15",           // UTC
  "proposedTime": "20:00:00",             // UTC
  "proposedDateLocal": "2025-03-15",     // LOCAL
  "proposedTimeLocal": "14:00:00",       // LOCAL
  "timezone": "America/Mexico_City"
}
```

**Frontend mostrará:**
- "15 de marzo de 2025 a las 14:00 (America/Mexico_City)" ✅

---

### Caso 3: Verificar que NO se use UTC para mostrar

**❌ INCORRECTO (Backend devuelve):**
```json
{
  "proposedDate": "2025-03-15",
  "proposedTime": "13:00:00",
  "proposedDateLocal": "2025-03-15",     // ⚠️ Está en UTC, no en LOCAL
  "proposedTimeLocal": "13:00:00",       // ⚠️ Está en UTC, no en LOCAL
  "timezone": "Europe/Madrid"
}
```

**Resultado:**
- Frontend mostrará "13:00" en lugar de "14:00" ❌
- El usuario verá la hora incorrecta

**✅ CORRECTO (Backend devuelve):**
```json
{
  "proposedDate": "2025-03-15",
  "proposedTime": "13:00:00",
  "proposedDateLocal": "2025-03-15",     // ✅ Hora LOCAL (14:00 en Madrid)
  "proposedTimeLocal": "14:00:00",       // ✅ Hora LOCAL (14:00 en Madrid)
  "timezone": "Europe/Madrid"
}
```

**Resultado:**
- Frontend mostrará "14:00" ✅
- El usuario ve la hora correcta

---

## 📝 7. CÓDIGO FRONTEND CLAVE

### Archivo: `src/utils/dateService.ts`

```typescript
/**
 * ✅ IMPORTANTE: El backend maneja automáticamente todas las conversiones de timezone.
 * El frontend solo necesita:
 * 1. Enviar fechas/horas en hora LOCAL del experto (sin conversión)
 * 2. Mostrar fechas/horas usando los campos *Local que el backend proporciona
 * 3. NO hacer conversiones manuales - el backend lo hace todo
 */

export const formatAppointmentForDisplay = (
  appointment: Appointment,
  timezone?: string
): FormattedAppointmentDate => {
  // ✅ CORRECTO: Usar campos *Local que el backend proporciona
  if (appointment.proposedDateLocal && appointment.proposedTimeLocal) {
    const localDateTime = parseISO(`${appointment.proposedDateLocal}T${appointment.proposedTimeLocal}`);
    
    return {
      date: format(localDateTime, 'dd/MM/yyyy'),
      time: format(localDateTime, 'HH:mm'),
      fullDateTime: format(localDateTime, "EEEE, d 'de' MMMM yyyy, HH:mm", { locale: es }),
      dayOfWeek: format(localDateTime, 'EEEE', { locale: es }),
      relative: getRelativeTime(localDateTime)
    };
  }
  
  // ⚠️ FALLBACK: Solo si no hay campos *Local (no debería pasar)
  // ...
};
```

### Archivo: `src/components/AppointmentForm.tsx`

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (validateForm()) {
    // ✅ INTERNACIONALIZACIÓN: El backend usa automáticamente el timezone del experto
    // No es necesario enviar timezone - se maneja automáticamente
    const dataToSubmit: ProposeAppointmentDto = {
      ...formData
      // timezone: NO se envía - el backend lo detecta automáticamente del experto
    };
    
    onSubmit(dataToSubmit);
  }
};
```

### Archivo: `src/components/AppointmentStatus.tsx`

```typescript
// ✅ CORRECTO: Usa formatAppointmentForDisplay que usa campos *Local
const formattedDate = formatAppointmentForDisplay(appointment);
const appointmentTimezone = appointment.timezone || appointment.userTimezone || 'UTC';

// Muestra:
// "Sábado, 15 de marzo de 2025, 14:00"
// "Zona horaria: Europe/Madrid"
```

---

## ⚠️ 8. ERRORES COMUNES A EVITAR

### ❌ Error 1: Backend devuelve campos *Local en UTC

```json
// ❌ INCORRECTO
{
  "proposedDateLocal": "2025-03-15",     // ⚠️ Está en UTC
  "proposedTimeLocal": "13:00:00"       // ⚠️ Está en UTC (debería ser 14:00)
}
```

**Solución:**
- Asegurar que `proposedDateLocal` y `proposedTimeLocal` estén en hora LOCAL del experto
- Convertir correctamente UTC → Local antes de devolver

---

### ❌ Error 2: Backend no proporciona campos *Local

```json
// ❌ INCORRECTO
{
  "proposedDate": "2025-03-15",
  "proposedTime": "13:00:00"
  // ⚠️ Faltan proposedDateLocal y proposedTimeLocal
}
```

**Solución:**
- Siempre proporcionar `proposedDateLocal` y `proposedTimeLocal`
- El frontend tiene fallback pero no es recomendado

---

### ❌ Error 3: Backend espera que frontend envíe timezone

```typescript
// ❌ INCORRECTO (Backend espera)
{
  "proposedDate": "2025-03-15",
  "proposedTime": "14:00:00",
  "timezone": "Europe/Madrid"  // ⚠️ Frontend NO envía esto
}
```

**Solución:**
- El backend debe detectar timezone automáticamente desde `SearchHire.ExpertTimezone`
- El campo `timezone` en el request es opcional (solo para sobrescribir)

---

## ✅ 9. RESUMEN FINAL

### Lo que el Frontend HACE:

1. ✅ **Envía** `proposedDate` y `proposedTime` en hora LOCAL del experto
2. ✅ **Muestra** usando `proposedDateLocal` y `proposedTimeLocal`
3. ✅ **Usa** el campo `timezone` del response para mostrar información
4. ✅ **NO envía** timezone (el backend lo detecta automáticamente)

### Lo que el Frontend NO HACE:

1. ❌ **NO convierte** fechas/horas a UTC antes de enviar
2. ❌ **NO usa** `proposedDate`/`proposedTime` para mostrar (están en UTC)
3. ❌ **NO hace** conversiones manuales con JavaScript
4. ❌ **NO asume** timezone del navegador del usuario

### Lo que el Backend DEBE HACER:

1. ✅ **Recibir** `proposedDate` y `proposedTime` en hora LOCAL
2. ✅ **Detectar** timezone del experto automáticamente
3. ✅ **Convertir** Local → UTC antes de guardar
4. ✅ **Convertir** UTC → Local antes de devolver
5. ✅ **Proporcionar** `proposedDateLocal` y `proposedTimeLocal` en hora LOCAL
6. ✅ **Incluir** campo `timezone` con IANA timezone del experto

---

## 🎯 CONCLUSIÓN

**El frontend está 100% listo y correcto según la guía.**

El backend solo necesita:
1. Asegurar que `proposedDateLocal` y `proposedTimeLocal` estén en hora LOCAL (no UTC)
2. Proporcionar siempre estos campos en las respuestas
3. Convertir correctamente UTC → Local antes de devolver

**No se requieren cambios en el frontend.**
