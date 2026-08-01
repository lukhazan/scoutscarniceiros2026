
ALTER TABLE public.match_requests
  ADD CONSTRAINT match_requests_team_name_len CHECK (char_length(btrim(team_name)) BETWEEN 2 AND 80),
  ADD CONSTRAINT match_requests_contact_name_len CHECK (char_length(btrim(contact_name)) BETWEEN 2 AND 80),
  ADD CONSTRAINT match_requests_whatsapp_fmt CHECK (whatsapp ~ '^[0-9 ()+-]{8,20}$'),
  ADD CONSTRAINT match_requests_location_len CHECK (location IS NULL OR char_length(location) <= 120),
  ADD CONSTRAINT match_requests_notes_len CHECK (notes IS NULL OR char_length(notes) <= 500),
  ADD CONSTRAINT match_requests_time_order CHECK (end_time > start_time),
  ADD CONSTRAINT match_requests_date_range CHECK (request_date >= '2024-01-01'::date AND request_date <= CURRENT_DATE + 365);
