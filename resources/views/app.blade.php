<!DOCTYPE html>
<html>
<head>
    <title>Contnental Club</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <!-- IMPORTANT: Add this -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body>
    @inertia
</body>
</html>
