import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'salesbuddy.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            employee_id TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('SA','ASH','RSH','SH','Admin')),
            agency TEXT,
            region_name TEXT,
            branch_code TEXT,
            branch_name TEXT,
            reports_to TEXT,
            photo_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS branches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region_name TEXT NOT NULL,
            branch_code TEXT UNIQUE NOT NULL,
            branch_name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS promos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            promo_id TEXT UNIQUE NOT NULL,
            promo_agency TEXT NOT NULL,
            promo_name TEXT NOT NULL,
            date_start TEXT NOT NULL,
            date_end TEXT NOT NULL,
            description TEXT,
            created_by TEXT NOT NULL,
            proof_of_promo TEXT,
            changes_made TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT UNIQUE NOT NULL,
            loan_type TEXT NOT NULL,
            agency TEXT NOT NULL,
            product TEXT,
            promo_id INTEGER,
            client_name TEXT NOT NULL,
            date_added TEXT NOT NULL,
            branch_name TEXT,
            region_name TEXT,
            school TEXT,
            location TEXT,
            employee_number TEXT,
            mobile_number TEXT,
            customer_email TEXT,
            loan_amount REAL,
            proof_of_engagement TEXT,
            assigned_sa_id INTEGER,
            source TEXT DEFAULT 'Manual',
            priority TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_id TEXT UNIQUE NOT NULL,
            customer_id INTEGER,
            customer_name TEXT,
            loan_type TEXT,
            loan_status TEXT,
            activity_type TEXT,
            activity_status TEXT,
            disbursal_date TEXT,
            duration TEXT,
            address TEXT,
            sales_notes TEXT,
            proof_of_activity TEXT,
            location_lat REAL,
            location_lng REAL,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region_product_group TEXT NOT NULL,
            agency TEXT NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            target_amount REAL DEFAULT 0,
            actual_lr_mtd REAL DEFAULT 0,
            actual_lr_ytd REAL DEFAULT 0,
            mtd_attainment REAL DEFAULT 0,
            ytd_attainment REAL DEFAULT 0,
            actual_lp REAL DEFAULT 0,
            target_lp REAL DEFAULT 0,
            lp_attainment REAL DEFAULT 0,
            lr_stretch_target REAL DEFAULT 0,
            stretch_attainment REAL DEFAULT 0,
            total_new_loan INTEGER DEFAULT 0,
            total_reloan INTEGER DEFAULT 0,
            target_new_money REAL DEFAULT 0,
            actual_new_money REAL DEFAULT 0,
            new_money_attainment REAL DEFAULT 0,
            new_money_stretch_target REAL DEFAULT 0,
            new_money_stretch_attainment REAL DEFAULT 0,
            lr_stretch_target2 REAL DEFAULT 0,
            lp_stretch_attainment REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS target_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sa_id INTEGER,
            agency TEXT NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            target_amount REAL DEFAULT 0,
            actual_lr REAL DEFAULT 0,
            attainment REAL DEFAULT 0,
            assigned_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS target_share_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_share_id INTEGER,
            changed_by INTEGER,
            old_target REAL,
            new_target REAL,
            change_note TEXT,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_lr (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disbursal_date TEXT,
            customer_no TEXT,
            branch_code TEXT,
            branch_name TEXT,
            cluster TEXT,
            account_no TEXT,
            account_name TEXT,
            loan_amount REAL,
            principal_bal REAL,
            adjusted_product TEXT,
            adjusted_product_group TEXT,
            loan_type_old TEXT,
            term INTEGER,
            int_rate REAL,
            region TEXT,
            year INTEGER,
            month INTEGER,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lcs14 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_code TEXT, branch_name TEXT, account_no TEXT, alt_id TEXT,
            customer_no TEXT, account_name TEXT, product TEXT, disbursal_date TEXT,
            maturity_date TEXT, loan_amount REAL, principal_bal REAL, term INTEGER,
            status TEXT, mob INTEGER, sales_cluster TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lcs18_pd_npl (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_code TEXT, account_no TEXT, account_name TEXT, product_categ TEXT,
            disbursal_date TEXT, loan_amount REAL, principal_bal REAL,
            loanstatus TEXT, emp_num TEXT, mob INTEGER, sales_cluster TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS deped_reloan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_code TEXT, branch_name TEXT, account_no TEXT, account_name TEXT,
            loan_type TEXT, disbursal_date TEXT, loan_amount REAL, principal_bal REAL,
            region TEXT, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS deped_sor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_code TEXT, branch_name TEXT, account_no TEXT, account_name TEXT,
            disbursal_date TEXT, loan_amount REAL, principal_bal REAL,
            loanstatus TEXT, emp_num TEXT, region TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS deped_mob (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_code TEXT, account_no TEXT, account_name TEXT, product_categ TEXT,
            disbursal_date TEXT, loan_amount REAL, principal_bal REAL,
            loanstatus TEXT, emp_num TEXT, mob INTEGER, sales_cluster TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()
