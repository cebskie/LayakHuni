-- ============================================================
-- TRIGGER: Auto-generate Cust_Code (C001, C002, ...)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_cust_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COUNT(*) + 1 INTO next_num FROM Customer;
    NEW.Cust_Code := CONCAT('C', LPAD(next_num::TEXT, 3, '0'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cust_code
BEFORE INSERT ON Customer
FOR EACH ROW
EXECUTE FUNCTION fn_generate_cust_code();


-- ============================================================
-- TRIGGER: Auto-generate Dev_Code (D001, D002, ...)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_dev_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COUNT(*) + 1 INTO next_num FROM Developer;
    NEW.Dev_Code := CONCAT('D', LPAD(next_num::TEXT, 3, '0'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dev_code
BEFORE INSERT ON Developer
FOR EACH ROW
EXECUTE FUNCTION fn_generate_dev_code();