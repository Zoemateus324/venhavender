-- Create RPC functions for counting data
-- This provides alternative ways to get counts when direct queries fail

-- Function to get users count
CREATE OR REPLACE FUNCTION get_users_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ads count
CREATE OR REPLACE FUNCTION get_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active ads count
CREATE OR REPLACE FUNCTION get_active_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads WHERE status = 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payments count
CREATE OR REPLACE FUNCTION get_payments_count(status_filter TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF status_filter IS NULL THEN
    RETURN (SELECT COUNT(*) FROM payments);
  ELSE
    RETURN (SELECT COUNT(*) FROM payments WHERE status = status_filter);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total revenue
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'approved'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get new users today
CREATE OR REPLACE FUNCTION get_new_users_today()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payments_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_revenue() TO authenticated;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO authenticated;

GRANT EXECUTE ON FUNCTION get_users_count() TO anon;
GRANT EXECUTE ON FUNCTION get_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_active_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_payments_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_total_revenue() TO anon;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO anon;
