$tok = Get-Content "$PSScriptRoot\.token"
$base = "http://127.0.0.1:8090/api"
$h = @{ Authorization = $tok; "Content-Type" = "application/json" }

function Req($method, $path, $body = $null) {
    $args = @{ Method = $method; Uri = "$base$path"; Headers = $h }
    if ($body) { $args.Body = ($body | ConvertTo-Json -Depth 20 -Compress) }
    try { Invoke-RestMethod @args } catch { Write-Output "ERR $method $path :: $($_.ErrorDetails.Message)"; $null }
}

# 1. Patch users collection: add role + status fields, relax createRule for admin-managed seeding
$usersPatch = @{
    listRule = "@request.auth.id != ''"
    viewRule = "@request.auth.id != ''"
    createRule = $null  # only superuser/admin via API
    updateRule = "id = @request.auth.id || (@request.auth.role = 'admin')"
    deleteRule = "@request.auth.role = 'admin'"
    fields = @(
        @{ name="id"; type="text"; system=$true; primaryKey=$true; required=$true; min=15; max=15; pattern="^[a-z0-9]+$"; autogeneratePattern="[a-z0-9]{15}" },
        @{ name="password"; type="password"; system=$true; hidden=$true; required=$true; min=8 },
        @{ name="tokenKey"; type="text"; system=$true; hidden=$true; required=$true; min=30; max=60; autogeneratePattern="[a-zA-Z0-9]{50}" },
        @{ name="email"; type="email"; system=$true; required=$true },
        @{ name="emailVisibility"; type="bool"; system=$true },
        @{ name="verified"; type="bool"; system=$true },
        @{ name="name"; type="text"; max=255 },
        @{ name="role"; type="select"; required=$true; maxSelect=1; values=@("admin","kurir") },
        @{ name="status"; type="select"; required=$true; maxSelect=1; values=@("active","inactive") },
        @{ name="created"; type="autodate"; onCreate=$true },
        @{ name="updated"; type="autodate"; onCreate=$true; onUpdate=$true }
    )
}
Write-Output "PATCH users:"
Req PATCH "/collections/users" $usersPatch | Out-Null

# 2. Create inventory collection
$inv = @{
    name = "inventory"; type = "base"
    listRule = ""; viewRule = ""  # public read (matches old rule)
    createRule = "@request.auth.role = 'admin'"
    updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'kurir'"
    deleteRule = "@request.auth.role = 'admin'"
    fields = @(
        @{ name="name"; type="text"; required=$true; max=100 },
        @{ name="cat"; type="text"; max=50 },
        @{ name="power"; type="text"; max=10 },
        @{ name="desc"; type="text"; max=500 },
        @{ name="imageUrl"; type="url" },
        @{ name="price"; type="number"; required=$true },
        @{ name="stockLevel"; type="number"; required=$true },
        @{ name="minStockLevel"; type="number"; required=$true }
    )
}
Write-Output "CREATE inventory:"
Req POST "/collections" $inv | Out-Null

# 3. Create requests collection
$req = @{
    name = "requests"; type = "base"
    listRule = "kurirId = @request.auth.id || @request.auth.role = 'admin'"
    viewRule = "kurirId = @request.auth.id || @request.auth.role = 'admin'"
    createRule = "@request.auth.role = 'kurir' && kurirId = @request.auth.id"
    updateRule = "@request.auth.role = 'admin'"
    deleteRule = "@request.auth.role = 'admin'"
    fields = @(
        @{ name="kurirId"; type="relation"; required=$true; collectionId="_pb_users_auth_"; cascadeDelete=$false; maxSelect=1 },
        @{ name="kurirName"; type="text"; required=$true; max=100 },
        @{ name="items"; type="json"; required=$true },
        @{ name="status"; type="select"; required=$true; maxSelect=1; values=@("pending","approved","rejected") },
        @{ name="note"; type="text"; max=1000 }
    )
}
Write-Output "CREATE requests:"
Req POST "/collections" $req | Out-Null

# 4. Create transactions collection
$tx = @{
    name = "transactions"; type = "base"
    listRule = "kurirId = @request.auth.id || @request.auth.role = 'admin'"
    viewRule = "kurirId = @request.auth.id || @request.auth.role = 'admin'"
    createRule = "@request.auth.role = 'kurir' && kurirId = @request.auth.id"
    updateRule = $null
    deleteRule = $null
    fields = @(
        @{ name="kurirId"; type="relation"; required=$true; collectionId="_pb_users_auth_"; cascadeDelete=$false; maxSelect=1 },
        @{ name="kurirName"; type="text"; required=$true; max=100 },
        @{ name="items"; type="json"; required=$true },
        @{ name="totalAmount"; type="number"; required=$true },
        @{ name="type"; type="select"; required=$true; maxSelect=1; values=@("sale","restock","adjustment") }
    )
}
Write-Output "CREATE transactions:"
Req POST "/collections" $tx | Out-Null

# 5. Seed users: admin (cuansite) + kurir (bertrand)
$adminUser = @{
    email = "cuansite@gmail.com"
    password = "KopiKabin2026!"
    passwordConfirm = "KopiKabin2026!"
    name = "System Admin"
    role = "admin"
    status = "active"
    verified = $true
}
Write-Output "CREATE admin user:"
Req POST "/collections/users/records" $adminUser | Out-Null

$kurirUser = @{
    email = "bertrand.max.99@gmail.com"
    password = "KopiKabin2026!"
    passwordConfirm = "KopiKabin2026!"
    name = "Bertrand Max"
    role = "kurir"
    status = "active"
    verified = $true
}
Write-Output "CREATE kurir user:"
Req POST "/collections/users/records" $kurirUser | Out-Null

# 6. Seed default inventory
$defaults = @(
    @{ id="01"; name="Kabin Signature"; price=28000; cat="ICED_COFFEE"; power="90%"; desc="Cold brew, aren sugar, creamy oat milk." },
    @{ id="02"; name="Dark Void Americano"; price=25000; cat="BLACK_COFFEE"; power="100%"; desc="Double shot espresso straight from the abyss." },
    @{ id="03"; name="Neon Matcha"; price=30000; cat="NON_COFFEE"; power="60%"; desc="Kyoto matcha blended with vanilla sweet cream." },
    @{ id="04"; name="Cyber Hazelnut"; price=32000; cat="FLAVORED"; power="75%"; desc="Roasted hazelnut syrup with espresso base." },
    @{ id="05"; name="Glitch Lychee Tea"; price=22000; cat="REFRESHER"; power="40%"; desc="Black tea, fresh lychee, mint leaves." },
    @{ id="06"; name="Caramel Overdrive"; price=35000; cat="FLAVORED"; power="85%"; desc="Salted caramel ribbon over our signature latte." },
    @{ id="07"; name="Plasma Velvet"; price=35000; cat="NON_COFFEE"; power="10%"; desc="Red velvet choco blend with cream cheese." },
    @{ id="08"; name="Quantum Nitro"; price=38000; cat="BLACK_COFFEE"; power="110%"; desc="Nitrogen-infused cold brew. Maximum focus." }
)
foreach ($d in $defaults) {
    $body = @{ name=$d.name; price=$d.price; cat=$d.cat; power=$d.power; desc=$d.desc; stockLevel=100; minStockLevel=20 }
    Write-Output "SEED inv $($d.id) $($d.name):"
    Req POST "/collections/inventory/records" $body | Out-Null
}

Write-Output "DONE"
