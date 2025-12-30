-- Script SQL para asegurar que todos los servicios tengan al menos una imagen DISTINTA
-- Ejecutar en PostgreSQL
-- Este script asigna imágenes únicas a cada servicio basándose en su ID

-- ============================================
-- OPCIÓN 1: Si imageUrls se almacena como JSONB o JSON
-- ============================================

-- Primero, verificar servicios sin imágenes
SELECT 
    "Id",
    "ImageUrls",
    "CategoryId",
    "ServiceTypeId"
FROM "Services"
WHERE 
    "ImageUrls" IS NULL 
    OR "ImageUrls" = '[]'::jsonb
    OR jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) = 0;

-- Actualizar servicios sin imágenes con imágenes distintas basadas en su ID
-- Usando Unsplash Source para imágenes aleatorias pero consistentes por ID
UPDATE "Services"
SET "ImageUrls" = jsonb_build_array(
    'https://source.unsplash.com/400x400/?service,product&sig=' || "Id"
)
WHERE 
    "ImageUrls" IS NULL 
    OR "ImageUrls" = '[]'::jsonb
    OR jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) = 0;

-- Alternativa: Usar imágenes de placeholder con diferentes colores/textos basados en ID
-- Descomentar si prefieres esta opción:
/*
UPDATE "Services"
SET "ImageUrls" = jsonb_build_array(
    'https://picsum.photos/seed/service-' || "Id" || '/400/400'
)
WHERE 
    "ImageUrls" IS NULL 
    OR "ImageUrls" = '[]'::jsonb
    OR jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) = 0;
*/

-- Alternativa 2: Usar diferentes categorías de imágenes según CategoryId
-- Descomentar si prefieres esta opción:
/*
UPDATE "Services"
SET "ImageUrls" = CASE
    WHEN "CategoryId" = 1 THEN jsonb_build_array('https://source.unsplash.com/400x400/?car,vehicle&sig=' || "Id")
    WHEN "CategoryId" = 2 THEN jsonb_build_array('https://source.unsplash.com/400x400/?motorcycle,bike&sig=' || "Id")
    WHEN "CategoryId" = 3 THEN jsonb_build_array('https://source.unsplash.com/400x400/?house,property&sig=' || "Id")
    ELSE jsonb_build_array('https://source.unsplash.com/400x400/?service,product&sig=' || "Id")
END
WHERE 
    "ImageUrls" IS NULL 
    OR "ImageUrls" = '[]'::jsonb
    OR jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) = 0;
*/

-- ============================================
-- OPCIÓN 2: Si imageUrls se almacena como array de texto (text[])
-- ============================================
-- Descomentar y usar esta versión si es el caso:

/*
-- Verificar servicios sin imágenes
SELECT 
    "Id",
    "ImageUrls",
    "CategoryId",
    "ServiceTypeId"
FROM "Services"
WHERE 
    "ImageUrls" IS NULL 
    OR array_length("ImageUrls", 1) IS NULL
    OR array_length("ImageUrls", 1) = 0;

-- Actualizar con imágenes distintas
UPDATE "Services"
SET "ImageUrls" = ARRAY['https://source.unsplash.com/400x400/?service,product&sig=' || "Id"::text]
WHERE 
    "ImageUrls" IS NULL 
    OR array_length("ImageUrls", 1) IS NULL
    OR array_length("ImageUrls", 1) = 0;
*/

-- ============================================
-- OPCIÓN 3: Si imageUrls se almacena como string separado por comas
-- ============================================
-- Descomentar y usar esta versión si es el caso:

/*
UPDATE "Services"
SET "ImageUrls" = 'https://source.unsplash.com/400x400/?service,product&sig=' || "Id"::text
WHERE 
    "ImageUrls" IS NULL 
    OR "ImageUrls" = ''
    OR TRIM("ImageUrls") = '';
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar el resultado
SELECT 
    COUNT(*) as total_servicios,
    COUNT(CASE WHEN "ImageUrls" IS NOT NULL AND jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) > 0 THEN 1 END) as servicios_con_imagen,
    COUNT(CASE WHEN "ImageUrls" IS NULL OR jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) = 0 THEN 1 END) as servicios_sin_imagen
FROM "Services";

-- Verificar que todas las imágenes sean distintas
SELECT 
    "ImageUrls",
    COUNT(*) as cantidad
FROM "Services"
WHERE "ImageUrls" IS NOT NULL 
    AND jsonb_array_length(COALESCE("ImageUrls", '[]'::jsonb)) > 0
GROUP BY "ImageUrls"
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Reemplaza "Services" con el nombre real de tu tabla
-- 2. Reemplaza "ImageUrls" con el nombre real de tu columna
-- 3. Ajusta las URLs según tu preferencia:
--    - Unsplash Source: https://source.unsplash.com/ (imágenes aleatorias pero consistentes)
--    - Picsum Photos: https://picsum.photos/ (imágenes aleatorias con seed)
--    - Tu propio CDN/servidor de imágenes
-- 4. El parámetro "sig" en Unsplash asegura que cada ID tenga una imagen diferente
-- 5. Puedes agregar más parámetros a las URLs para categorizar (ej: ?car, ?house, etc.)

