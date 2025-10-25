# Municipal Fund Blockchain - GitHub Push Script
# Run this after installing Git

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Municipal Fund Blockchain - Git Push" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found! Please install Git first:" -ForegroundColor Red
    Write-Host "   Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit
}

# Navigate to project directory
$projectPath = "C:\Users\SAKSHI SANJAY CHAVAN\Downloads\Muncipal-Fund--main\Muncipal-Fund--main"
Set-Location $projectPath
Write-Host "📁 Project directory: $projectPath" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git already initialized" -ForegroundColor Green
}

Write-Host ""

# Ask for repository URL
Write-Host "📝 Enter GitHub repository URL:" -ForegroundColor Cyan
Write-Host "   Example: https://github.com/darshan-stack/Municipal.git" -ForegroundColor Gray
$repoUrl = Read-Host "URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    $repoUrl = "https://github.com/darshan-stack/Municipal.git"
    Write-Host "   Using default: $repoUrl" -ForegroundColor Yellow
}

Write-Host ""

# Remove existing remote and add new one
Write-Host "🔗 Setting up remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl
Write-Host "✅ Remote added: $repoUrl" -ForegroundColor Green
Write-Host ""

# Add all files
Write-Host "📦 Adding all files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files staged for commit" -ForegroundColor Green
Write-Host ""

# Show status
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Commit
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
$commitMessage = @"
feat: Complete Municipal Fund Blockchain System for SIH 2025

Features implemented:
✅ Anonymous tender submission system
✅ 5-milestone workflow (20% each)
✅ Oracle verification for work completion
✅ Automatic payment release on approval
✅ Mandatory quality report submission
✅ Contractor eligibility tracking
✅ IPFS file upload simulation
✅ Role-based access control (Admin/Supervisor/Citizen)
✅ Comprehensive dashboard and analytics
✅ Smart contract integration ready

Tech Stack:
- Frontend: React 18, Tailwind CSS, Shadcn/ui
- Backend: Flask, Python
- Blockchain: Solidity, Polygon Mumbai
- Storage: IPFS simulation

Smart India Hackathon 2025 ready 🏆
"@

git commit -m $commitMessage
Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Set main branch
Write-Host "🌿 Setting up main branch..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Branch set to 'main'" -ForegroundColor Green
Write-Host ""

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "   You will be asked for credentials:" -ForegroundColor Yellow
Write-Host "   - Username: Your GitHub username" -ForegroundColor White
Write-Host "   - Password: Use Personal Access Token (NOT your password)" -ForegroundColor White
Write-Host ""
Write-Host "   How to get Personal Access Token:" -ForegroundColor Cyan
Write-Host "   1. Go to GitHub.com → Settings" -ForegroundColor Gray
Write-Host "   2. Developer settings → Personal access tokens → Tokens (classic)" -ForegroundColor Gray
Write-Host "   3. Generate new token → Select 'repo' scope → Copy token" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to continue with push"

try {
    git push -u origin main
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " ✅ Successfully pushed to GitHub! 🎉" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 View your repository at:" -ForegroundColor Cyan
    Write-Host "   $repoUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Add repository description on GitHub" -ForegroundColor White
    Write-Host "   2. Add topics/tags for visibility" -ForegroundColor White
    Write-Host "   3. Enable GitHub Pages (optional)" -ForegroundColor White
    Write-Host "   4. Add collaborators if needed" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Wrong credentials - Use Personal Access Token" -ForegroundColor White
    Write-Host "   2. Repository doesn't exist - Create it on GitHub first" -ForegroundColor White
    Write-Host "   3. No permission - Ask repo owner to add you as collaborator" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Try using GitHub Desktop instead:" -ForegroundColor Cyan
    Write-Host "   Download: https://desktop.github.com/" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press Enter to exit"
Read-Host
