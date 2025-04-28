-- Function to increment note views (this seems to already exist based on our code)
CREATE OR REPLACE FUNCTION increment_note_views(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notes
  SET views = COALESCE(views, 0) + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment note downloads
CREATE OR REPLACE FUNCTION increment_note_downloads(note_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notes
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve a note
CREATE OR REPLACE FUNCTION approve_note(note_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE notes
  SET 
    is_approved = TRUE,
    updated_at = NOW()
  WHERE id = note_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle admin status
CREATE OR REPLACE FUNCTION toggle_admin_status(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_is_admin BOOLEAN;
  success BOOLEAN;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin INTO current_user_is_admin
  FROM students
  WHERE id = auth.uid();
  
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Only admins can modify admin status';
  END IF;
  
  -- Toggle the admin status
  UPDATE students
  SET is_admin = NOT COALESCE(is_admin, false)
  WHERE id = target_user_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 