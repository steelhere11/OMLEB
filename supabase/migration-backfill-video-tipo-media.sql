-- Backfill tipo_media for videos uploaded before the column/fix existed
UPDATE reporte_fotos
SET tipo_media = 'video'
WHERE (tipo_media IS NULL OR tipo_media = 'foto')
  AND (
    url ILIKE '%.mp4%'
    OR url ILIKE '%.mov%'
    OR url ILIKE '%.webm%'
    OR url ILIKE '%.avi%'
    OR url ILIKE '%.mkv%'
  );

-- Ensure all remaining NULLs default to 'foto'
UPDATE reporte_fotos
SET tipo_media = 'foto'
WHERE tipo_media IS NULL;

-- Link orphan photos to their step when equipment has exactly 1 step
UPDATE reporte_fotos rf
SET reporte_paso_id = sub.solo_paso_id
FROM (
  SELECT rp.id AS solo_paso_id, rp.reporte_equipo_id, re.reporte_id, re.equipo_id
  FROM reporte_pasos rp
  JOIN reporte_equipos re ON re.id = rp.reporte_equipo_id
  WHERE rp.reporte_equipo_id IN (
    SELECT reporte_equipo_id FROM reporte_pasos
    GROUP BY reporte_equipo_id HAVING COUNT(*) = 1
  )
) sub
WHERE rf.reporte_paso_id IS NULL
  AND rf.reporte_id = sub.reporte_id
  AND rf.equipo_id = sub.equipo_id
  AND rf.etiqueta NOT IN ('llegada', 'sitio', 'equipo_general', 'placa');
