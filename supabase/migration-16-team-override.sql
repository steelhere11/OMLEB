-- Add optional team override for legacy/imported reports
-- When set, the PDF uses this string instead of the auto-generated team member list
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS team_override text;
