# ---------------------------
# YOU WORK (dev branch)
# ---------------------------

git checkout dev
git pull origin dev

git add .
git commit -m "your message"
git push origin dev


# ---------------------------
# RITWIK WORK (agent branch)
# ---------------------------

git checkout agent
git pull origin agent

git add .
git commit -m "ritwik changes"
git push origin agent


# ---------------------------
# GITHUB FLOW (IMPORTANT)
# ---------------------------
# You create PR on GitHub:
# agent  → feature/0.5.0
# dev    → feature/0.5.0
# then merge BOTH into feature/0.5.0


# ---------------------------
# GET RITWIK + YOUR MERGED CODE
# (feature → dev sync)
# ---------------------------

git checkout dev
git pull origin feature/0.5.0


# ---------------------------
# UPDATE LOCAL FEATURE CODE (optional)
# ---------------------------

git checkout feature/0.5.0
git pull origin feature/0.5.0


# ---------------------------
# PUSH FEATURE AFTER CHANGES (if needed)
# ---------------------------

git add .
git commit -m "feature update"
git push origin feature/0.5.0


# ---------------------------
# RELEASE TO MAIN
# ---------------------------

git checkout main
git pull origin main
git merge feature/0.5.0
git push origin main


# ---------------------------
# SAFE SYNC (daily use)
# ---------------------------

git fetch origin
git status
git branch