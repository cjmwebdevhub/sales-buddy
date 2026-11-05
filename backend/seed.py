import bcrypt
from db import get_db, init_db

def seed():
    init_db()
    conn = get_db()
    c = conn.cursor()

    # Branches
    branches = [
        ('NCR NORTH', 'NCR-N-001', 'Caloocan Branch'),
        ('NCR NORTH', 'NCR-N-002', 'Malabon Branch'),
        ('NCR SOUTH', 'NCR-S-001', 'Parañaque Branch'),
        ('NCR SOUTH', 'NCR-S-002', 'Las Piñas Branch'),
        ('REGION 1', 'R1-001', 'San Fernando Branch'),
        ('REGION 1', 'R1-002', 'Vigan Branch'),
        ('REGION 3', 'R3-001', 'Angeles City Branch'),
        ('REGION 4A', 'R4A-001', 'Calamba Branch'),
        ('REGION 7', 'R7-001', 'Cebu Branch'),
        ('REGION 11', 'R11-001', 'Davao Branch'),
    ]
    for b in branches:
        c.execute("INSERT OR IGNORE INTO branches (region_name, branch_code, branch_name) VALUES (?,?,?)", b)

    # Users
    users = [
        ('admin@csb.com', 'Admin@123', 'System Admin', 'ADMIN001', 'Admin', 'ALL', 'ALL', 'ALL', 'ALL', None),
        ('sh@csb.com', 'Sh@12345', 'Juan Sales Head', 'SH001', 'SH', 'DEPED', 'NCR NORTH', 'NCR-N-001', 'Caloocan Branch', 'admin@csb.com'),
        ('rsh@csb.com', 'Rsh@1234', 'Maria Regional Head', 'RSH001', 'RSH', 'DEPED', 'NCR NORTH', 'NCR-N-001', 'Caloocan Branch', 'sh@csb.com'),
        ('ash@csb.com', 'Ash@1234', 'Pedro Area Head', 'ASH001', 'ASH', 'DEPED', 'NCR NORTH', 'NCR-N-001', 'Caloocan Branch', 'rsh@csb.com'),
        ('sa1@csb.com', 'Sa@12345', 'Ana Sales Associate', 'SA001', 'SA', 'DEPED', 'NCR NORTH', 'NCR-N-001', 'Caloocan Branch', 'ash@csb.com'),
        ('sa2@csb.com', 'Sa@12345', 'Jose Sales Associate', 'SA002', 'SA', 'PENSION', 'NCR SOUTH', 'NCR-S-001', 'Parañaque Branch', 'ash@csb.com'),
        ('sa3@csb.com', 'Sa@12345', 'Rosa Sales Associate', 'SA003', 'SA', 'BEYOND_DEPED', 'REGION 1', 'R1-001', 'San Fernando Branch', 'ash@csb.com'),
    ]
    for u in users:
        email, pwd, full_name, emp_id, role, agency, region, bcode, bname, reports_to = u
        hashed = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
        c.execute("""INSERT OR IGNORE INTO users (email, password_hash, full_name, employee_id, role, agency, region_name, branch_code, branch_name, reports_to)
                     VALUES (?,?,?,?,?,?,?,?,?,?)""",
                  (email, hashed, full_name, emp_id, role, agency, region, bcode, bname, reports_to))

    # Promos
    promos = [
        ('PROMO-001', 'DEPED', 'Cashback Promo', '2025-01-01', '2026-12-31', 'Get 1% cashback on first loan release.', 'admin@csb.com'),
        ('PROMO-002', 'PENSION', 'Senior Discount', '2025-06-01', '2026-06-30', 'Special rate for senior pensioners.', 'admin@csb.com'),
        ('PROMO-003', 'BEYOND_DEPED', 'Quick Approval (Expired)', '2025-03-01', '2024-12-31', 'Expired promo for testing.', 'admin@csb.com'),
    ]
    for p in promos:
        c.execute("INSERT OR IGNORE INTO promos (promo_id, promo_agency, promo_name, date_start, date_end, description, created_by) VALUES (?,?,?,?,?,?,?)", p)

    conn.commit()

    # Customers
    sa1 = c.execute("SELECT id FROM users WHERE email='sa1@csb.com'").fetchone()
    sa2 = c.execute("SELECT id FROM users WHERE email='sa2@csb.com'").fetchone()
    sa1_id = sa1['id'] if sa1 else None
    sa2_id = sa2['id'] if sa2 else None

    customers = [
        ('CUST-0001', 'New Loan', 'DEPED', '01.01 DEPED', 'Lito Reyes', '2025-09-01', 'Caloocan Branch', 'NCR NORTH', 'Caloocan HS', 'Caloocan City', 'EMP-001', '09171234567', 'lito.reyes@deped.gov.ph', 150000, sa1_id, 'Manual', sa1_id),
        ('CUST-0002', 'Reloan', 'DEPED', '01.02 DEPED CALAMITY', 'Carmen Santos', '2025-09-02', 'Caloocan Branch', 'NCR NORTH', 'Malabon NHS', 'Malabon City', 'EMP-002', '09189876543', 'carmen.santos@deped.gov.ph', 200000, sa1_id, 'Manual', sa1_id),
        ('CUST-0003', 'New Loan', 'PENSION', 'GSIS Pension', 'Eduardo Cruz', '2025-09-03', 'Parañaque Branch', 'NCR SOUTH', None, 'Parañaque', None, '09201112222', 'eduardo.cruz@gmail.com', 100000, sa2_id, 'Manual', sa2_id),
        ('CUST-0004', 'Reloan', 'DEPED', '02 NEWLY HIRED TEACHERS', 'Nora Bautista', '2025-09-05', 'Caloocan Branch', 'NCR NORTH', 'Pasig Elem', 'Pasig City', 'EMP-003', '09333334444', 'nora.bautista@deped.gov.ph', 180000, sa1_id, 'MOB', sa1_id),
        ('CUST-0005', 'New Loan', 'DEPED', '01.01 DEPED', 'Ricardo Lim', '2025-09-10', 'Caloocan Branch', 'NCR NORTH', 'QC HS', 'QC', 'EMP-004', '09455556666', 'ricardo.lim@deped.gov.ph', 220000, sa1_id, 'Manual', sa1_id),
    ]
    for cust in customers:
        c.execute("""INSERT OR IGNORE INTO customers
            (customer_id, loan_type, agency, product, client_name, date_added, branch_name, region_name,
             school, location, employee_number, mobile_number, customer_email, loan_amount, assigned_sa_id, source, created_by)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", cust)

    conn.commit()

    # Activities
    cust1 = c.execute("SELECT id FROM customers WHERE customer_id='CUST-0001'").fetchone()
    cust2 = c.execute("SELECT id FROM customers WHERE customer_id='CUST-0002'").fetchone()
    cust3 = c.execute("SELECT id FROM customers WHERE customer_id='CUST-0003'").fetchone()

    activities = [
        ('ACT-0001', cust1['id'] if cust1 else None, 'Lito Reyes', 'New Loan', 'For Application', 'Visit', 'Done', None, '30 mins', 'Caloocan City', 'Client interested in 150k loan.', sa1_id, '2025-09-01 10:00:00'),
        ('ACT-0002', cust2['id'] if cust2 else None, 'Carmen Santos', 'Reloan', 'Pending Approval', 'Call', 'Pending', None, '15 mins', 'Malabon City', 'Waiting for doc requirements.', sa1_id, '2025-09-02 14:00:00'),
        ('ACT-0003', cust3['id'] if cust3 else None, 'Eduardo Cruz', 'New Loan', 'Released', 'Visit', 'Done', '2025-09-10', '45 mins', 'Parañaque City', 'Loan released successfully.', sa2_id, '2025-09-10 09:00:00'),
        ('ACT-0004', cust1['id'] if cust1 else None, 'Lito Reyes', 'New Loan', 'Released', 'Visit', 'Done', '2025-09-15', '1 hour', 'Caloocan City', 'Documents submitted.', sa1_id, '2025-09-15 11:00:00'),
    ]
    for a in activities:
        c.execute("""INSERT OR IGNORE INTO activities
            (activity_id, customer_id, customer_name, loan_type, loan_status, activity_type, activity_status,
             disbursal_date, duration, address, sales_notes, created_by, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""", a)

    # Targets
    targets = [
        ('NCR NORTH', 'DEPED', 9, 2025, 5000000, 3200000, 28000000, 64, 70, 40, 60, 66.67, 5500000, 58.18, 12, 8, 2000000, 1500000, 75),
        ('NCR SOUTH', 'PENSION', 9, 2025, 3000000, 2100000, 18900000, 70, 70, 25, 35, 71.43, 3300000, 63.64, 8, 5, 1200000, 900000, 75),
        ('REGION 1', 'BEYOND_DEPED', 9, 2025, 2500000, 1750000, 15000000, 70, 66.67, 18, 25, 72, 2800000, 62.5, 7, 3, 1000000, 800000, 80),
    ]
    for t in targets:
        c.execute("""INSERT OR IGNORE INTO targets
            (region_product_group, agency, month, year, target_amount, actual_lr_mtd, actual_lr_ytd,
             mtd_attainment, ytd_attainment, actual_lp, target_lp, lp_attainment, lr_stretch_target,
             stretch_attainment, total_new_loan, total_reloan, target_new_money, actual_new_money, new_money_attainment)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", t)

    # Target shares
    ash = c.execute("SELECT id FROM users WHERE email='ash@csb.com'").fetchone()
    if sa1_id and ash:
        c.execute("INSERT OR IGNORE INTO target_shares (sa_id, agency, month, year, target_amount, actual_lr, attainment, assigned_by) VALUES (?,?,?,?,?,?,?,?)",
                  (sa1_id, 'DEPED', 9, 2025, 500000, 320000, 64, ash['id']))

    # Daily LR
    c.execute("INSERT OR IGNORE INTO daily_lr (disbursal_date, customer_no, branch_code, branch_name, account_name, loan_amount, principal_bal, region, year, month) VALUES ('2025-09-10','CN-001','NCR-N-001','Caloocan Branch','Lito Reyes',150000,148500,'NCR NORTH',2025,9)")
    c.execute("INSERT OR IGNORE INTO daily_lr (disbursal_date, customer_no, branch_code, branch_name, account_name, loan_amount, principal_bal, region, year, month) VALUES ('2025-09-10','CN-002','NCR-S-001','Parañaque Branch','Eduardo Cruz',100000,99000,'NCR SOUTH',2025,9)")
    c.execute("INSERT OR IGNORE INTO daily_lr (disbursal_date, customer_no, branch_code, branch_name, account_name, loan_amount, principal_bal, region, year, month) VALUES ('2025-09-15','CN-003','NCR-N-001','Caloocan Branch','Nora Bautista',180000,178200,'NCR NORTH',2025,9)")

    conn.commit()
    conn.close()
    print("✅ Database seeded successfully!")

if __name__ == "__main__":
    seed()
