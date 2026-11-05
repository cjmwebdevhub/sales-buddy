import sqlite3
import os
import csv
import io
import json
import datetime
from functools import wraps

import bcrypt
import jwt
from flask import Flask, request, jsonify, g
from flask_cors import CORS

from db import get_db, init_db
from seed import seed

FRONTEND_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'index.html')

app = Flask(__name__)
CORS(app, origins=["*"], supports_credentials=True)

JWT_SECRET = os.environ.get("JWT_SECRET", "salesbuddy-secret-2025")

# Initialise DB and seed on every startup (safe — uses CREATE IF NOT EXISTS)
init_db()
seed()

# ─── Helpers ────────────────────────────────────────────────────────────────

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

def rows_to_list(rows):
    return [dict(r) for r in rows]

def make_token(user_id, email, role):
    payload = {
        "id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        try:
            g.user = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user.get("role") not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def next_id(conn, table, col, prefix):
    row = conn.execute(f"SELECT {col} FROM {table} ORDER BY id DESC LIMIT 1").fetchone()
    if not row:
        return f"{prefix}-0001"
    try:
        num = int(str(row[col]).split("-")[-1]) + 1
        return f"{prefix}-{str(num).zfill(4)}"
    except:
        return f"{prefix}-0001"


# ─── Auth ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "version": "3.0"})

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    required = ["email", "password", "full_name", "employee_id", "role"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "Required fields missing"}), 400
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email=? OR employee_id=?", (data["email"], data["employee_id"])).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email or Employee ID already registered"}), 409
    pw_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
    cur = conn.execute("""INSERT INTO users (email,password_hash,full_name,employee_id,role,agency,region_name,branch_code,branch_name,reports_to)
                          VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (data["email"], pw_hash, data["full_name"], data["employee_id"], data["role"],
         data.get("agency"), data.get("region_name"), data.get("branch_code"), data.get("branch_name"), data.get("reports_to")))
    conn.commit()
    user = row_to_dict(conn.execute("SELECT id,email,full_name,employee_id,role,agency,region_name,branch_code,branch_name FROM users WHERE id=?", (cur.lastrowid,)).fetchone())
    conn.close()
    if not user:
        return jsonify({"error": "Registration failed"}), 500
    token = make_token(user["id"], user["email"], user["role"])
    return jsonify({"token": token, "user": user})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (data.get("email",""),)).fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    user = dict(user)
    if not bcrypt.checkpw(data.get("password","").encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    safe = {k: v for k, v in user.items() if k != "password_hash"}
    token = make_token(user["id"], user["email"], user["role"])
    return jsonify({"token": token, "user": safe})


# ─── Users ───────────────────────────────────────────────────────────────────

@app.route("/api/users/me", methods=["GET"])
@auth_required
def get_me():
    conn = get_db()
    u = row_to_dict(conn.execute("SELECT id,email,full_name,employee_id,role,agency,region_name,branch_code,branch_name,reports_to,photo_url,created_at FROM users WHERE id=?", (g.user["id"],)).fetchone())
    conn.close()
    return jsonify(u)

@app.route("/api/users/me", methods=["PUT"])
@auth_required
def update_me():
    data = request.get_json()
    conn = get_db()
    conn.execute("UPDATE users SET full_name=?, photo_url=?, reports_to=? WHERE id=?",
                 (data.get("full_name"), data.get("photo_url"), data.get("reports_to"), g.user["id"]))
    conn.commit()
    u = row_to_dict(conn.execute("SELECT id,email,full_name,employee_id,role,agency,region_name,branch_code,branch_name,reports_to,photo_url FROM users WHERE id=?", (g.user["id"],)).fetchone())
    conn.close()
    return jsonify(u)

@app.route("/api/users", methods=["GET"])
@auth_required
def get_users():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    role = g.user["role"]
    q = "SELECT id,email,full_name,employee_id,role,agency,region_name,branch_code,branch_name,reports_to,created_at FROM users WHERE 1=1"
    params = []
    if role == "Admin":
        if request.args.get("role"):
            q += " AND role=?"; params.append(request.args["role"])
        if request.args.get("agency"):
            q += " AND agency=?"; params.append(request.args["agency"])
    elif role == "SH":
        q += " AND agency=?"; params.append(me["agency"])
    elif role == "RSH":
        q += " AND region_name=? AND agency=?"; params += [me["region_name"], me["agency"]]
    elif role == "ASH":
        q += " AND branch_code=? AND agency=?"; params += [me["branch_code"], me["agency"]]
    else:
        conn.close(); return jsonify({"error": "Forbidden"}), 403
    users = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(users)

@app.route("/api/users/<int:uid>", methods=["PUT"])
@auth_required
@require_role("Admin")
def update_user(uid):
    data = request.get_json()
    conn = get_db()
    conn.execute("UPDATE users SET full_name=?,role=?,agency=?,region_name=?,branch_code=?,branch_name=?,reports_to=? WHERE id=?",
                 (data.get("full_name"), data.get("role"), data.get("agency"), data.get("region_name"),
                  data.get("branch_code"), data.get("branch_name"), data.get("reports_to"), uid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/users/<int:uid>", methods=["DELETE"])
@auth_required
@require_role("Admin")
def delete_user(uid):
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=?", (uid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ─── Customers ───────────────────────────────────────────────────────────────

@app.route("/api/customers", methods=["GET"])
@auth_required
def get_customers():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    q = """SELECT c.*, u.full_name as sa_name FROM customers c
           LEFT JOIN users u ON c.assigned_sa_id = u.id WHERE 1=1"""
    params = []
    role = g.user["role"]
    if role == "SA":
        q += " AND c.assigned_sa_id=?"; params.append(g.user["id"])
    elif role == "ASH":
        q += " AND c.branch_name=? AND c.agency=?"; params += [me["branch_name"], me["agency"]]
    elif role == "RSH":
        q += " AND c.region_name=? AND c.agency=?"; params += [me["region_name"], me["agency"]]
    elif role == "SH":
        q += " AND c.agency=?"; params.append(me["agency"])
    if request.args.get("loan_type"):
        q += " AND c.loan_type=?"; params.append(request.args["loan_type"])
    if request.args.get("agency"):
        q += " AND c.agency=?"; params.append(request.args["agency"])
    q += " ORDER BY c.created_at DESC"
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/customers/<int:cid>", methods=["GET"])
@auth_required
def get_customer(cid):
    conn = get_db()
    c = row_to_dict(conn.execute("SELECT c.*, u.full_name as sa_name FROM customers c LEFT JOIN users u ON c.assigned_sa_id=u.id WHERE c.id=?", (cid,)).fetchone())
    if not c:
        conn.close(); return jsonify({"error": "Not found"}), 404
    acts = rows_to_list(conn.execute("SELECT * FROM activities WHERE customer_id=? ORDER BY created_at DESC", (cid,)).fetchall())
    conn.close()
    c["activities"] = acts
    return jsonify(c)

@app.route("/api/customers", methods=["POST"])
@auth_required
def create_customer():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    data = request.get_json()
    cid = next_id(conn, "customers", "customer_id", "CUST")
    cur = conn.execute("""INSERT INTO customers
        (customer_id,loan_type,agency,product,promo_id,client_name,date_added,branch_name,region_name,
         school,location,employee_number,mobile_number,customer_email,loan_amount,
         proof_of_engagement,assigned_sa_id,source,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (cid, data.get("loan_type"), data.get("agency", me["agency"]), data.get("product"),
         data.get("promo_id"), data.get("client_name"), data.get("date_added"),
         me["branch_name"], me["region_name"], data.get("school"), data.get("location"),
         data.get("employee_number"), data.get("mobile_number"), data.get("customer_email"),
         data.get("loan_amount"), data.get("proof_of_engagement"), g.user["id"], data.get("source","Manual"), g.user["id"]))
    conn.commit()
    result = row_to_dict(conn.execute("SELECT * FROM customers WHERE id=?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/customers/<int:cid>", methods=["PUT"])
@auth_required
def update_customer(cid):
    data = request.get_json()
    conn = get_db()
    conn.execute("""UPDATE customers SET loan_type=?,product=?,promo_id=?,client_name=?,school=?,
                    location=?,employee_number=?,mobile_number=?,customer_email=?,loan_amount=? WHERE id=?""",
                 (data.get("loan_type"), data.get("product"), data.get("promo_id"),
                  data.get("client_name"), data.get("school"), data.get("location"),
                  data.get("employee_number"), data.get("mobile_number"), data.get("customer_email"),
                  data.get("loan_amount"), cid))
    conn.commit()
    result = row_to_dict(conn.execute("SELECT * FROM customers WHERE id=?", (cid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/customers/<int:cid>/assign", methods=["POST"])
@auth_required
@require_role("ASH","RSH","SH","Admin")
def assign_customer(cid):
    data = request.get_json()
    conn = get_db()
    conn.execute("UPDATE customers SET assigned_sa_id=?, priority=? WHERE id=?",
                 (data.get("sa_id"), data.get("priority"), cid))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ─── Activities ───────────────────────────────────────────────────────────────

@app.route("/api/activities", methods=["GET"])
@auth_required
def get_activities():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    q = """SELECT a.*, c.client_name, c.branch_name, c.region_name, u.full_name as sa_name
           FROM activities a
           LEFT JOIN customers c ON a.customer_id=c.id
           LEFT JOIN users u ON a.created_by=u.id WHERE 1=1"""
    params = []
    role = g.user["role"]
    if role == "SA":
        q += " AND a.created_by=?"; params.append(g.user["id"])
    elif role == "ASH":
        q += " AND c.branch_name=?"; params.append(me["branch_name"])
    elif role == "RSH":
        q += " AND c.region_name=?"; params.append(me["region_name"])
    if request.args.get("status"):
        q += " AND a.activity_status=?"; params.append(request.args["status"])
    if request.args.get("date"):
        q += " AND DATE(a.created_at)=?"; params.append(request.args["date"])
    q += " ORDER BY a.created_at DESC"
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/activities", methods=["POST"])
@auth_required
def create_activity():
    data = request.get_json()
    conn = get_db()
    aid = next_id(conn, "activities", "activity_id", "ACT")
    customer_name = data.get("customer_name")
    loan_type = data.get("loan_type")
    if data.get("customer_id"):
        cust = row_to_dict(conn.execute("SELECT * FROM customers WHERE id=?", (data["customer_id"],)).fetchone())
        if cust:
            customer_name = cust["client_name"]
            loan_type = loan_type or cust["loan_type"]
    cur = conn.execute("""INSERT INTO activities
        (activity_id,customer_id,customer_name,loan_type,loan_status,activity_type,activity_status,
         disbursal_date,duration,address,sales_notes,proof_of_activity,location_lat,location_lng,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (aid, data.get("customer_id"), customer_name, loan_type, data.get("loan_status"),
         data.get("activity_type"), data.get("activity_status"), data.get("disbursal_date") or None,
         data.get("duration"), data.get("address"), data.get("sales_notes"),
         data.get("proof_of_activity"), data.get("location_lat"), data.get("location_lng"), g.user["id"]))
    conn.commit()
    result = row_to_dict(conn.execute("SELECT * FROM activities WHERE id=?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/activities/<int:aid>", methods=["PUT"])
@auth_required
def update_activity(aid):
    data = request.get_json()
    conn = get_db()
    conn.execute("""UPDATE activities SET loan_status=?,activity_type=?,activity_status=?,
                    disbursal_date=?,duration=?,address=?,sales_notes=? WHERE id=?""",
                 (data.get("loan_status"), data.get("activity_type"), data.get("activity_status"),
                  data.get("disbursal_date") or None, data.get("duration"), data.get("address"),
                  data.get("sales_notes"), aid))
    conn.commit()
    result = row_to_dict(conn.execute("SELECT * FROM activities WHERE id=?", (aid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/activities/<int:aid>", methods=["DELETE"])
@auth_required
def delete_activity(aid):
    conn = get_db()
    conn.execute("DELETE FROM activities WHERE id=?", (aid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ─── Promos ───────────────────────────────────────────────────────────────────

@app.route("/api/promos", methods=["GET"])
@auth_required
def get_promos():
    conn = get_db()
    q = "SELECT * FROM promos WHERE 1=1"
    params = []
    if request.args.get("agency"):
        q += " AND promo_agency=?"; params.append(request.args["agency"])
    if request.args.get("active_only") == "true":
        q += " AND date_end >= DATE('now')"
    q += " ORDER BY date_start DESC"
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/promos", methods=["POST"])
@auth_required
@require_role("Admin")
def create_promo():
    data = request.get_json()
    conn = get_db()
    pid = next_id(conn, "promos", "promo_id", "PROMO")
    cur = conn.execute("""INSERT INTO promos (promo_id,promo_agency,promo_name,date_start,date_end,description,created_by,proof_of_promo)
                          VALUES (?,?,?,?,?,?,?,?)""",
                       (pid, data["promo_agency"], data["promo_name"], data["date_start"], data["date_end"],
                        data.get("description"), g.user["email"], data.get("proof_of_promo")))
    conn.commit()
    result = row_to_dict(conn.execute("SELECT * FROM promos WHERE id=?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/promos/<int:pid>", methods=["PUT"])
@auth_required
@require_role("Admin")
def update_promo(pid):
    data = request.get_json()
    conn = get_db()
    conn.execute("UPDATE promos SET promo_name=?,date_start=?,date_end=?,description=?,changes_made=? WHERE id=?",
                 (data.get("promo_name"), data.get("date_start"), data.get("date_end"),
                  data.get("description"), data.get("changes_made"), pid))
    conn.commit()
    result = row_to_dict(conn.execute("SELECT * FROM promos WHERE id=?", (pid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/promos/<int:pid>", methods=["DELETE"])
@auth_required
@require_role("Admin")
def delete_promo(pid):
    conn = get_db()
    conn.execute("DELETE FROM promos WHERE id=?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# ─── Targets ─────────────────────────────────────────────────────────────────

@app.route("/api/targets", methods=["GET"])
@auth_required
def get_targets():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    role = g.user["role"]
    q = "SELECT * FROM targets WHERE 1=1"
    params = []
    if role != "Admin":
        if role == "SH":
            q += " AND agency=?"; params.append(me["agency"])
        else:
            q += " AND agency=? AND region_product_group=?"; params += [me["agency"], me["region_name"]]
    else:
        if request.args.get("agency"):
            q += " AND agency=?"; params.append(request.args["agency"])
    if request.args.get("month"):
        q += " AND month=?"; params.append(int(request.args["month"]))
    if request.args.get("year"):
        q += " AND year=?"; params.append(int(request.args["year"]))
    q += " ORDER BY year DESC, month DESC"
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/targets", methods=["POST"])
@auth_required
@require_role("Admin","SH")
def create_target():
    data = request.get_json()
    conn = get_db()
    rpg, agency = data["region_product_group"], data["agency"]
    month, year = int(data["month"]), int(data["year"])
    existing = conn.execute("SELECT id FROM targets WHERE region_product_group=? AND agency=? AND month=? AND year=?",
                            (rpg, agency, month, year)).fetchone()
    target = float(data.get("target_amount", 0) or 0)
    mtd = float(data.get("actual_lr_mtd", 0) or 0)
    ytd = float(data.get("actual_lr_ytd", 0) or 0)
    lp = float(data.get("actual_lp", 0) or 0)
    tlp = float(data.get("target_lp", 0) or 0)
    mtd_att = (mtd / target * 100) if target else 0
    ytd_att = (ytd / target * 100) if target else 0
    lp_att = (lp / tlp * 100) if tlp else 0

    if existing:
        conn.execute("""UPDATE targets SET target_amount=?,actual_lr_mtd=?,actual_lr_ytd=?,mtd_attainment=?,ytd_attainment=?,
                       actual_lp=?,target_lp=?,lp_attainment=?,lr_stretch_target=?,total_new_loan=?,total_reloan=?,
                       target_new_money=?,actual_new_money=? WHERE id=?""",
                     (target, mtd, ytd, mtd_att, ytd_att, lp, tlp, lp_att,
                      data.get("lr_stretch_target", 0), data.get("total_new_loan", 0), data.get("total_reloan", 0),
                      data.get("target_new_money", 0), data.get("actual_new_money", 0), existing["id"]))
        conn.commit()
        result = row_to_dict(conn.execute("SELECT * FROM targets WHERE id=?", (existing["id"],)).fetchone())
    else:
        cur = conn.execute("""INSERT INTO targets
            (region_product_group,agency,month,year,target_amount,actual_lr_mtd,actual_lr_ytd,
             mtd_attainment,ytd_attainment,actual_lp,target_lp,lp_attainment,lr_stretch_target,
             total_new_loan,total_reloan,target_new_money,actual_new_money)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (rpg, agency, month, year, target, mtd, ytd, mtd_att, ytd_att, lp, tlp, lp_att,
             data.get("lr_stretch_target", 0), data.get("total_new_loan", 0), data.get("total_reloan", 0),
             data.get("target_new_money", 0), data.get("actual_new_money", 0)))
        conn.commit()
        result = row_to_dict(conn.execute("SELECT * FROM targets WHERE id=?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify(result)

@app.route("/api/targets/shares", methods=["GET"])
@auth_required
def get_shares():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    role = g.user["role"]
    q = """SELECT ts.*, u.full_name, u.employee_id, u.branch_name FROM target_shares ts
           JOIN users u ON ts.sa_id=u.id WHERE 1=1"""
    params = []
    if role == "SA":
        q += " AND ts.sa_id=?"; params.append(g.user["id"])
    elif role == "ASH":
        q += " AND u.branch_code=? AND ts.agency=?"; params += [me["branch_code"], me["agency"]]
    elif role == "RSH":
        q += " AND u.region_name=? AND ts.agency=?"; params += [me["region_name"], me["agency"]]
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/targets/shares", methods=["POST"])
@auth_required
@require_role("ASH","RSH","SH","Admin")
def create_share():
    data = request.get_json()
    conn = get_db()
    sa_id, agency = int(data["sa_id"]), data["agency"]
    month, year = int(data["month"]), int(data["year"])
    target = float(data.get("target_amount", 0) or 0)
    existing = conn.execute("SELECT * FROM target_shares WHERE sa_id=? AND agency=? AND month=? AND year=?",
                            (sa_id, agency, month, year)).fetchone()
    if existing:
        existing = dict(existing)
        conn.execute("INSERT INTO target_share_audit (target_share_id,changed_by,old_target,new_target) VALUES (?,?,?,?)",
                     (existing["id"], g.user["id"], existing["target_amount"], target))
        actual = existing.get("actual_lr", 0) or 0
        att = (actual / target * 100) if target else 0
        conn.execute("UPDATE target_shares SET target_amount=?,attainment=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                     (target, att, existing["id"]))
        conn.commit()
        result = row_to_dict(conn.execute("SELECT * FROM target_shares WHERE id=?", (existing["id"],)).fetchone())
    else:
        cur = conn.execute("INSERT INTO target_shares (sa_id,agency,month,year,target_amount,assigned_by) VALUES (?,?,?,?,?,?)",
                           (sa_id, agency, month, year, target, g.user["id"]))
        conn.commit()
        result = row_to_dict(conn.execute("SELECT * FROM target_shares WHERE id=?", (cur.lastrowid,)).fetchone())
    conn.close()
    return jsonify(result)


# ─── Reports / Reference ─────────────────────────────────────────────────────

@app.route("/api/reports/dashboard", methods=["GET"])
@auth_required
def dashboard():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    role = g.user["role"]

    act_q = """SELECT activity_status, COUNT(*) as count FROM activities a
               LEFT JOIN customers c ON a.customer_id=c.id WHERE 1=1"""
    cust_q = "SELECT loan_type, COUNT(*) as count FROM customers WHERE 1=1"
    lr_q = "SELECT COALESCE(SUM(loan_amount),0) as total FROM daily_lr WHERE 1=1"
    act_p, cust_p, lr_p = [], [], []

    if role == "SA":
        act_q += " AND a.created_by=?"; act_p.append(g.user["id"])
        cust_q += " AND assigned_sa_id=?"; cust_p.append(g.user["id"])
    elif role == "ASH":
        act_q += " AND c.branch_name=?"; act_p.append(me["branch_name"])
        cust_q += " AND branch_name=?"; cust_p.append(me["branch_name"])
        lr_q += " AND branch_code=?"; lr_p.append(me["branch_code"])
    elif role == "RSH":
        act_q += " AND c.region_name=?"; act_p.append(me["region_name"])
        cust_q += " AND region_name=?"; cust_p.append(me["region_name"])
        lr_q += " AND region=?"; lr_p.append(me["region_name"])

    act_q += " GROUP BY activity_status"
    cust_q += " GROUP BY loan_type"

    act_stats = rows_to_list(conn.execute(act_q, act_p).fetchall())
    cust_stats = rows_to_list(conn.execute(cust_q, cust_p).fetchall())
    lr_total = (conn.execute(lr_q, lr_p).fetchone() or {"total": 0})["total"]
    recent = rows_to_list(conn.execute("""SELECT a.*, c.client_name FROM activities a
        LEFT JOIN customers c ON a.customer_id=c.id WHERE a.created_by=?
        ORDER BY a.created_at DESC LIMIT 5""", (g.user["id"],)).fetchall())

    total_cust_q = "SELECT COUNT(*) as cnt FROM customers WHERE 1=1"
    total_p = []
    if role == "SA":
        total_cust_q += " AND assigned_sa_id=?"; total_p.append(g.user["id"])
    elif role == "ASH":
        total_cust_q += " AND branch_name=?"; total_p.append(me["branch_name"])
    elif role == "RSH":
        total_cust_q += " AND region_name=?"; total_p.append(me["region_name"])
    elif role == "SH":
        total_cust_q += " AND agency=?"; total_p.append(me["agency"])
    total = (conn.execute(total_cust_q, total_p).fetchone() or {"cnt": 0})["cnt"]

    conn.close()
    return jsonify({
        "activity_stats": act_stats,
        "customer_stats": cust_stats,
        "lr_total": lr_total,
        "recent_activities": recent,
        "total_customers": total
    })

@app.route("/api/reports/daily-lr", methods=["GET"])
@auth_required
def daily_lr_report():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    q = """SELECT disbursal_date, branch_name, region, SUM(loan_amount) as total_lr, COUNT(*) as count
           FROM daily_lr WHERE 1=1"""
    params = []
    if g.user["role"] == "ASH":
        q += " AND branch_code=?"; params.append(me["branch_code"])
    elif g.user["role"] == "RSH":
        q += " AND region=?"; params.append(me["region_name"])
    if request.args.get("month"):
        q += " AND month=?"; params.append(int(request.args["month"]))
    if request.args.get("year"):
        q += " AND year=?"; params.append(int(request.args["year"]))
    q += " GROUP BY disbursal_date, branch_name, region ORDER BY disbursal_date DESC"
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/reports/branches", methods=["GET"])
def get_branches():
    conn = get_db()
    result = rows_to_list(conn.execute("SELECT * FROM branches ORDER BY region_name, branch_name").fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/reports/sa-list", methods=["GET"])
@auth_required
def sa_list():
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    q = "SELECT id,full_name,employee_id,agency,branch_code,branch_name,region_name FROM users WHERE role='SA'"
    params = []
    if g.user["role"] == "ASH":
        q += " AND branch_code=? AND agency=?"; params += [me["branch_code"], me["agency"]]
    elif g.user["role"] == "RSH":
        q += " AND region_name=? AND agency=?"; params += [me["region_name"], me["agency"]]
    result = rows_to_list(conn.execute(q, params).fetchall())
    conn.close()
    return jsonify(result)

@app.route("/api/reports/target-audit/<int:sa_id>", methods=["GET"])
@auth_required
def target_audit(sa_id):
    conn = get_db()
    result = rows_to_list(conn.execute("""
        SELECT tsa.*, u.full_name as changed_by_name FROM target_share_audit tsa
        JOIN users u ON tsa.changed_by=u.id
        JOIN target_shares ts ON tsa.target_share_id=ts.id
        WHERE ts.sa_id=? ORDER BY tsa.changed_at DESC""", (sa_id,)).fetchall())
    conn.close()
    return jsonify(result)


# ─── Uploads ─────────────────────────────────────────────────────────────────

ALLOWED_TABLES = {"daily_lr", "lcs14", "lcs18_pd_npl", "deped_reloan", "deped_sor", "deped_mob"}

TABLE_COLS = {
    "daily_lr": ["disbursal_date","customer_no","branch_code","branch_name","cluster","account_no","account_name","loan_amount","principal_bal","adjusted_product","adjusted_product_group","loan_type_old","term","int_rate","region","year","month"],
    "lcs14": ["branch_code","branch_name","account_no","alt_id","customer_no","account_name","product","disbursal_date","maturity_date","loan_amount","principal_bal","term","status","mob","sales_cluster"],
    "lcs18_pd_npl": ["branch_code","account_no","account_name","product_categ","disbursal_date","loan_amount","principal_bal","loanstatus","emp_num","mob","sales_cluster"],
    "deped_reloan": ["branch_code","branch_name","account_no","account_name","loan_type","disbursal_date","loan_amount","principal_bal","region"],
    "deped_sor": ["branch_code","branch_name","account_no","account_name","disbursal_date","loan_amount","principal_bal","loanstatus","emp_num","region"],
    "deped_mob": ["branch_code","account_no","account_name","product_categ","disbursal_date","loan_amount","principal_bal","loanstatus","emp_num","mob","sales_cluster"],
}

# Tables that carry month/year columns (uploaded from daily_lr CSV)
TABLES_WITH_MONTH_YEAR = {"daily_lr"}

@app.route("/api/uploads/<table>", methods=["GET"])
@auth_required
def get_upload_data(table):
    if table not in ALLOWED_TABLES:
        return jsonify({"error": "Unknown table"}), 400
    conn = get_db()
    me = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()) or {}
    role = g.user["role"]
    if role == "SA":
        conn.close(); return jsonify({"error": "Forbidden"}), 403
    q = f"SELECT * FROM {table} WHERE 1=1"
    params = []
    if role == "ASH":
        q += " AND branch_code=?"; params.append(me["branch_code"])
    if table in TABLES_WITH_MONTH_YEAR:
        if request.args.get("month"):
            q += " AND month=?"; params.append(int(request.args["month"]))
        if request.args.get("year"):
            q += " AND year=?"; params.append(int(request.args["year"]))
    q += " ORDER BY id DESC LIMIT 500"
    try:
        result = rows_to_list(conn.execute(q, params).fetchall())
    except Exception as e:
        result = []
    conn.close()
    return jsonify(result)

@app.route("/api/uploads/<table>", methods=["POST"])
@auth_required
@require_role("Admin")
def upload_csv(table):
    if table not in ALLOWED_TABLES:
        return jsonify({"error": "Unknown table"}), 400
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    f = request.files["file"]
    if not (f.filename or "").endswith(".csv"):
        return jsonify({"error": "Only CSV files accepted"}), 400
    content = f.read().decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    if not rows:
        return jsonify({"error": "Empty CSV"}), 400

    allowed = TABLE_COLS.get(table, [])
    conn = get_db()
    inserted = 0
    for row in rows:
        # Normalize column names
        norm = {k.strip().lower().replace(" ", "_").replace("-", "_"): v for k, v in row.items()}
        cols = [c for c in allowed if c in norm]
        if not cols:
            continue
        vals = [norm[c] or None for c in cols]
        try:
            conn.execute(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(['?']*len(cols))})", vals)
            inserted += 1
        except Exception:
            pass
    conn.commit()
    conn.close()
    return jsonify({"success": True, "inserted": inserted})


# ─── Frontend ────────────────────────────────────────────────────────────────

STATIC_PATH = os.path.join(os.path.dirname(__file__), 'static')

@app.route('/static/<path:filename>')
def serve_static(filename):
    filepath = os.path.join(STATIC_PATH, filename)
    if not os.path.exists(filepath):
        return '', 404
    ext = filename.rsplit('.', 1)[-1].lower()
    mime = {'js': 'application/javascript', 'css': 'text/css'}.get(ext, 'application/octet-stream')
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read(), 200, {'Content-Type': mime}

@app.route('/')
@app.route('/index.html')
def serve_frontend():
    if os.path.exists(FRONTEND_PATH):
        with open(FRONTEND_PATH, 'r') as f:
            return f.read(), 200, {'Content-Type': 'text/html; charset=utf-8'}
    return '<h1>Open sales-buddy/frontend/index.html in your browser.</h1>', 404

# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print(f"\n🚀 Sales Buddy 3.0 running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
