@echo off
cd /d "%~dp0"
echo ============================================
echo   AI PPE ^& Intrusion Detection System
echo ============================================
echo.
set /p VIDEO="Enter video filename (e.g. samplevid1.mp4): "
echo.
echo Running detection on %VIDEO%...
echo.
C:\Users\Student\AppData\Local\Programs\Python\Python319\python.exe scripts/infer.py --source "images/%VIDEO%" --weights "runs\detect\runs\train\ppe_model\weights\best.pt" --conf 0.25 --device 0 --save
echo.
pause
