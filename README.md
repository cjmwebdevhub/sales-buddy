# Sales Buddy 3.0

All-in-one sales management platform for City Savings Bank's Salary and Pension Loans teams.

## Tech Stack

- **Backend:** Python · Flask · SQLite · JWT · bcrypt
- **Frontend:** React 18 (CDN) · Recharts · Poppins · Inline SVG icons
- **Server:** Gunicorn (production) / Flask dev server (local)

---

## Run Locally

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start the server
bash start.sh
```

Open **http://localhost:3001**

Demo logins:
| Email | Password | Role |
|---|---|---|
| admin@csb.com | Admin@123 | Admin |
| ash@csb.com | Ash@1234 | ASH |
| sa1@csb.com | Sa@12345 | SA |

---

## Deploy to Render (Free)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/sales-buddy.git
   git push -u origin main
   ```

2. **Create a Render account** at [render.com](https://render.com) (free, no credit card)

3. **New Web Service → Connect your GitHub repo**
   - Render will auto-detect `render.yaml` and configure everything

4. **Set environment variables** (already in render.yaml, auto-generated):
   - `JWT_SECRET` — auto-generated secure value

5. **Deploy** — Render will:
   - Install dependencies via `pip install -r requirements.txt`
   - Start with `gunicorn app:app`
   - Mount a 1 GB persistent disk for the SQLite database
   - Give you a public URL like `https://sales-buddy.onrender.com`

> **Note:** The free tier spins down after 15 minutes of inactivity and takes ~30 seconds to wake up on the first request. Upgrade to a paid plan ($7/mo) to keep it always-on.
