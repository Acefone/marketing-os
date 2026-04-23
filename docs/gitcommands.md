# Show current branch name
git branch

# Show changed, staged, and untracked files
git status

# Switch to dev branch
git checkout dev

# Pull latest code from remote dev branch
git pull origin dev

# Create new branch from current branch and switch to it
git checkout -b feature/my-task

# Switch to existing branch
git checkout feature/my-task

# Modern switch command to change branch
git switch dev

# Modern switch command to create new branch
git switch -c feature/my-task

# Stage all changed files for commit
git add .

# Stage only one specific file
git add filename

# Create commit with message
git commit -m "Your commit message"

# Push current branch to remote
git push

# First push of new branch and set upstream
git push -u origin feature/my-task

# Push dev branch directly
git push origin dev

# Show local branches
git branch

# Show all local + remote branches
git branch -a

# Delete local branch safely (only if merged)
git branch -d feature/my-task

# Force delete local branch
git branch -D feature/my-task

# Download latest branch references from remote
git fetch --all

# Merge dev branch into current branch
git merge dev

# Rebase current branch on top of dev branch
git rebase dev

# Pull latest changes using rebase instead of merge
git pull --rebase origin dev

# Show simple commit history
git log --oneline

# Show branch graph with commit history
git log --oneline --graph --all

# Unstage one staged file
git reset filename

# Unstage everything
git reset

# Discard changes in one file
git checkout -- filename

# Discard all unstaged local changes
git checkout -- .

# Save unfinished work temporarily
git stash

# Restore latest stashed work
git stash pop

# Show all saved stashes
git stash list

# Rename current branch
git branch -m new-branch-name

# Show connected remote repositories
git remote -v

# Change remote repository URL
git remote set-url origin git@github.com:Acefone/marketing-os.git

# Full daily workflow example
git checkout dev
git pull origin dev
git checkout -b feature/my-task
git add .
git commit -m "Done task"
git push -u origin feature/my-task