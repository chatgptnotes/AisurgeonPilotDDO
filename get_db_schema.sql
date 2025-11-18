-- Get all table structures in public schema

SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('patients', 'visits', 'User', 'appointments', 'doctors', 'medications', 'visit_medications')
ORDER BY table_name, ordinal_position;
