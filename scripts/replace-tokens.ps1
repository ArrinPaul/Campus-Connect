$files = Get-ChildItem "d:\cluster-delta-main\src\app\(dashboard)" -Filter "*.tsx" -Recurse | Where-Object {
    $_.Name -notmatch "\.test\.tsx$" -and $_.Name -ne "layout.tsx" -and $_.FullName -notmatch "feed.page\.tsx$"
}

# Replacements ordered: longer/more-specific patterns first
$replacements = [ordered]@{
    # Spinner patterns
    "border-4 border-gray-300 border-t-blue-600" = "border-4 border-border border-t-primary"
    "border-gray-300 border-t-blue-600" = "border-border border-t-primary"
    # Shadow
    "shadow dark:shadow-gray-900/50" = "shadow-elevation-1"
    # bg-white dark: pairs
    "bg-white dark:bg-gray-900" = "bg-card"
    "bg-white dark:bg-gray-800" = "bg-card"
    "bg-white dark:bg-gray-700" = "bg-card"
    # bg-gray-50 dark: pairs
    "bg-gray-50 dark:bg-gray-900" = "bg-background"
    "bg-gray-50 dark:bg-gray-800" = "bg-muted"
    # bg-gray-100 dark: pairs
    "bg-gray-100 dark:bg-gray-800" = "bg-muted"
    "bg-gray-100 dark:bg-gray-700" = "bg-muted"
    # hover:bg pairs
    "hover:bg-gray-100 dark:hover:bg-gray-700" = "hover:bg-accent"
    "hover:bg-gray-100 dark:hover:bg-gray-800" = "hover:bg-accent"
    "hover:bg-gray-50 dark:hover:bg-gray-800" = "hover:bg-accent"
    "hover:bg-gray-50 dark:hover:bg-gray-700" = "hover:bg-accent"
    "hover:bg-blue-700" = "hover:bg-primary/90"
    "hover:bg-blue-600" = "hover:bg-primary/90"
    # text pairs
    "text-gray-900 dark:text-gray-100" = "text-foreground"
    "text-gray-900 dark:text-white" = "text-foreground"
    "text-gray-800 dark:text-gray-200" = "text-foreground"
    "text-gray-700 dark:text-gray-300" = "text-foreground"
    "text-gray-700 dark:text-gray-200" = "text-foreground"
    "text-gray-600 dark:text-gray-400" = "text-muted-foreground"
    "text-gray-600 dark:text-gray-300" = "text-muted-foreground"
    "text-gray-500 dark:text-gray-400" = "text-muted-foreground"
    "text-gray-500 dark:text-gray-500" = "text-muted-foreground"
    "text-gray-400 dark:text-gray-500" = "text-muted-foreground"
    # blue text pairs
    "text-blue-600 dark:text-blue-400" = "text-primary"
    "text-blue-500 dark:text-blue-400" = "text-primary"
    # hover text
    "hover:text-blue-600" = "hover:text-primary"
    "hover:text-blue-700" = "hover:text-primary"
    "hover:text-gray-600 dark:hover:text-gray-300" = "hover:text-foreground"
    "hover:text-gray-600 dark:hover:text-gray-200" = "hover:text-foreground"
    "hover:text-gray-700 dark:hover:text-gray-300" = "hover:text-foreground"
    "hover:text-gray-700 dark:hover:text-gray-200" = "hover:text-foreground"
    # border pairs
    "border-blue-600 dark:border-blue-400" = "border-primary"
    "border-gray-200 dark:border-gray-700" = "border-border"
    "border-gray-200 dark:border-gray-600" = "border-border"
    "border-gray-300 dark:border-gray-600" = "border-border"
    "border-gray-300 dark:border-gray-700" = "border-border"
    # standalone blue
    "bg-blue-600" = "bg-primary"
    "bg-blue-500" = "bg-primary"
    "text-blue-600" = "text-primary"
    "text-blue-500" = "text-primary"
    "border-blue-600" = "border-primary"
    "ring-blue-500" = "ring-ring"
    "ring-blue-600" = "ring-ring"
    # standalone colors
    "bg-red-500" = "bg-destructive"
    "bg-red-600" = "bg-destructive"
    "text-red-500" = "text-destructive"
    "text-red-600" = "text-destructive"
    "bg-green-500" = "bg-success"
    "bg-green-600" = "bg-success"
    "text-green-500" = "text-success"
    "text-green-600" = "text-success"
    "bg-yellow-500" = "bg-warning"
    "text-yellow-500" = "text-warning"
}

$totalChanges = 0
$changedFilesCount = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content
    $fileChanges = 0

    foreach ($key in $replacements.Keys) {
        $old = $key
        $new = $replacements[$key]
        $count = ([regex]::Matches($content, [regex]::Escape($old))).Count
        if ($count -gt 0) {
            $content = $content.Replace($old, $new)
            $fileChanges += $count
        }
    }

    if ($fileChanges -gt 0) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        $rel = $file.FullName.Replace("d:\cluster-delta-main\src\app\(dashboard)\", "").Replace("\", "/")
        Write-Host "$rel : $fileChanges replacements"
        $totalChanges += $fileChanges
        $changedFilesCount++
    }
}

Write-Host ""
Write-Host "=== SUMMARY ==="
Write-Host "Files changed: $changedFilesCount / $($files.Count)"
Write-Host "Total replacements: $totalChanges"
