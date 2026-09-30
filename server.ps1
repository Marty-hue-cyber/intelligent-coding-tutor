# SynapseCode Local HTTP Server
$port = 8080
$prefix = 'http://localhost:8080/'
$webRoot = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host '==========================================================' -ForegroundColor Cyan
    Write-Host '  SynapseCode - Intelligent Adaptive Coding Tutor' -ForegroundColor Green
    Write-Host "  Server running at: $prefix" -ForegroundColor Yellow
    Write-Host '  Press Ctrl+C in this terminal to stop the server.' -ForegroundColor Gray
    Write-Host '==========================================================' -ForegroundColor Cyan

    Start-Process $prefix

    $mimeTypes = @{
        '.html' = 'text/html; charset=utf-8'
        '.htm'  = 'text/html; charset=utf-8'
        '.css'  = 'text/css; charset=utf-8'
        '.js'   = 'application/javascript; charset=utf-8'
        '.json' = 'application/json; charset=utf-8'
        '.png'  = 'image/png'
        '.jpg'  = 'image/jpeg'
        '.svg'  = 'image/svg+xml'
        '.ico'  = 'image/x-icon'
    }

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.RawUrl.Split('?')[0]
        if ($rawUrl -eq '/' -or [string]::IsNullOrWhiteSpace($rawUrl)) {
            $rawUrl = '/index.html'
        }

        $cleanPath = $rawUrl.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $localPath = [System.IO.Path]::Combine($webRoot, $cleanPath)

        if ([System.IO.File]::Exists($localPath)) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = 'application/octet-stream'
            if ($mimeTypes.ContainsKey($ext)) {
                $contentType = $mimeTypes[$ext]
            }

            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errorMsg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
        }
        $response.Close()
    }
}
catch {
    Write-Host 'Server stopped or encountered error.' -ForegroundColor Yellow
}
finally {
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
    }
}
