# Antigravity Context Analyzer & Live Monitor
# UTF-8 & ASCII safe version for all Windows PowerShell environments.

$ErrorActionPreference = "SilentlyContinue"

# Known UUID mapping for recent conversations to make reading easy
$knownTitles = @{
    "9ffc679f-165f-4fed-9b3b-b58e634e91c2" = "[CURRENT] Querying Context Ratio"
    "b108020d-7799-431f-a467-8ead421b1837" = "Project Status Analysis"
    "824458e7-a4e1-469a-85c7-7db83bc558ae" = "Direct Command Execution Preference"
    "462f0b2e-08e6-4236-af9f-f4dae1dd7a07" = "Adding Git Commit Rule"
    "3fa9bd5e-cee4-4ef6-ab61-82fccbd1eb3f" = "Adapting Antigravity Assistant"
    "07335ca8-4485-4eee-8610-b591e528450e" = "Run This Project"
}

# ASCII-safe progress bar
function Get-ProgressBar ($percentage, $width = 15) {
    $filledLength = [math]::Round(($percentage / 100) * $width)
    $emptyLength = $width - $filledLength
    if ($filledLength -lt 0) { $filledLength = 0 }
    if ($emptyLength -lt 0) { $emptyLength = 0 }
    
    $filled = "=" * $filledLength
    $empty = "." * $emptyLength
    return "[$filled$empty]"
}

# File size formatter
function Format-FileSize ($bytes) {
    if ($bytes -ge 1MB) {
        return "{0:N2} MB" -f ($bytes / 1MB)
    } elseif ($bytes -ge 1KB) {
        return "{0:N2} KB" -f ($bytes / 1KB)
    } else {
        return "$bytes B"
    }
}

Write-Host "Initializing Antigravity Live Context Monitor..." -ForegroundColor Cyan

while ($true) {
    Clear-Host
    
    $pbFiles = Get-ChildItem -Path "C:\Users\pc\.gemini\antigravity\conversations" -Filter "*.pb" | Sort-Object Length -Descending
    if (-not $pbFiles) {
        Write-Host "No context data files (*.pb) found in the appdata folder." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        continue
    }

    $totalSize = ($pbFiles | Measure-Object -Property Length -Sum).Sum
    
    Write-Host "==========================================================================================" -ForegroundColor DarkCyan
    Write-Host "    🪐 ANTIGRAVITY CONTEXT MONITOR (Live Conversation Context Usage)" -ForegroundColor Cyan
    Write-Host "==========================================================================================" -ForegroundColor DarkCyan
    Write-Host (" Active Contexts : " + $pbFiles.Count.ToString().PadRight(10) + " | Total Disk Footprint: " + (Format-FileSize $totalSize)) -ForegroundColor Gray
    Write-Host " Last Updated    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  | Refresh Rate        : Every 2s" -ForegroundColor Gray
    Write-Host "------------------------------------------------------------------------------------------" -ForegroundColor DarkCyan
    
    $headerId = "Conversation ID".PadRight(38)
    $headerTitle = "Topic/Title".PadRight(35)
    $headerSize = "Size".PadRight(12)
    $headerPercent = "Ratio".PadRight(8)
    $headerProgress = "Distribution"
    Write-Host "$headerId | $headerTitle | $headerSize | $headerPercent | $headerProgress" -ForegroundColor White
    Write-Host "------------------------------------------------------------------------------------------" -ForegroundColor DarkCyan

    $limit = 15
    $displayedSize = 0
    $count = 0

    foreach ($file in $pbFiles) {
        $count++
        $id = $file.BaseName
        $size = $file.Length
        $displayedSize += $size
        
        $percent = ($size / $totalSize) * 100
        $progressBar = Get-ProgressBar $percent 15
        
        $title = "Historical Conversation"
        if ($knownTitles.ContainsKey($id)) {
            $title = $knownTitles[$id]
        }
        
        $dispId = $id
        if ($dispId.Length -gt 36) { $dispId = $dispId.Substring(0, 36) + ".." }
        $dispId = $dispId.PadRight(38)
        
        $dispTitle = $title
        if ($dispTitle.Length -gt 33) { $dispTitle = $dispTitle.Substring(0, 31) + ".." }
        $dispTitle = $dispTitle.PadRight(35)
        
        $dispSize = (Format-FileSize $size).PadRight(12)
        $dispPercent = ("{0:F1}%" -f $percent).PadRight(8)
        
        # Color coding: Green for current, Yellow for large, Gray for others
        if ($id -eq "9ffc679f-165f-4fed-9b3b-b58e634e91c2") {
            Write-Host "$dispId | " -NoNewline -ForegroundColor Green
            Write-Host "$dispTitle" -NoNewline -ForegroundColor Green
            Write-Host " | $dispSize | $dispPercent | " -NoNewline -ForegroundColor Green
            Write-Host "$progressBar" -ForegroundColor Green
        } elseif ($percent -gt 15) {
            Write-Host "$dispId | $dispTitle | $dispSize | $dispPercent | " -NoNewline -ForegroundColor Yellow
            Write-Host "$progressBar" -ForegroundColor Yellow
        } else {
            Write-Host "$dispId | $dispTitle | $dispSize | $dispPercent | " -NoNewline -ForegroundColor Gray
            Write-Host "$progressBar" -ForegroundColor DarkGray
        }

        if ($count -eq $limit) {
            break
        }
    }

    if ($pbFiles.Count -gt $limit) {
        $otherSize = $totalSize - $displayedSize
        $otherPercent = ($otherSize / $totalSize) * 100
        $otherProgress = Get-ProgressBar $otherPercent 15
        
        $otherId = ("Other $($pbFiles.Count - $limit) small contexts...").PadRight(38)
        $otherTitle = "-".PadRight(35)
        $otherDispSize = (Format-FileSize $otherSize).PadRight(12)
        $otherDispPercent = ("{0:F1}%" -f $otherPercent).PadRight(8)
        
        Write-Host "$otherId | $otherTitle | $otherDispSize | $otherDispPercent | " -NoNewline -ForegroundColor DarkGray
        Write-Host "$otherProgress" -ForegroundColor DarkGray
    }

    Write-Host "------------------------------------------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host " [Info] The size of each .pb file correlates directly with the number of tokens in the history." -ForegroundColor DarkYellow
    Write-Host " [Tips] Press Ctrl+C inside the terminal to stop monitoring." -ForegroundColor DarkYellow
    
    Start-Sleep -Seconds 2
}
