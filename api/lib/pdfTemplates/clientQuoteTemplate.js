// White-label PDF template for client quotes
// No Kitchen Rescue branding - completely builder-branded

function renderClientQuoteHTML({
  builderName = "Your Kitchen Installer",
  builderLogoUrl = null,     // optional
  clientPostcode,
  weeks,
  baseHire,
  deliveryFee,
  distanceMiles,
  totalClientPrice,
  startDate = null,
  validDays = 30,
}) {
  const money = (n) => `£${Number(n).toFixed(2)}`;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Temporary Kitchen Option</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 28px; }
    .header { display:flex; align-items:center; gap:14px; margin-bottom:18px; }
    .logo { width:140px; height:auto; object-fit:contain; }
    h1 { font-size:22px; margin:0; }
    h2 { font-size:16px; margin:18px 0 8px; }
    p, li { font-size:13.5px; line-height:1.5; margin:6px 0; }
    .muted { color:#555; font-size:12.5px; }
    .panel { border:1px solid #e5e5e5; border-radius:12px; padding:14px; background:#fafafa; }
    table { width:100%; border-collapse:collapse; font-size:13.5px; }
    td { padding:8px 0; border-bottom:1px solid #e9e9e9; }
    td:last-child { text-align:right; }
    .total td { border-bottom:none; font-weight:bold; font-size:15px; padding-top:10px; }
    .badge { display:inline-block; background:#111; color:#fff; padding:4px 8px; border-radius:999px; font-size:11.5px; }
    .cols { display:flex; gap:16px; }
    .col { flex:1; }
    .footer { margin-top:18px; font-size:12.5px; color:#444; }
    .hr { height:1px; background:#eee; margin:14px 0; }
  </style>
</head>
<body>

  <div class="header">
    ${builderLogoUrl ? `<img class="logo" src="${builderLogoUrl}" />` : ""}
    <div>
      <h1>Temporary Kitchen Option</h1>
      <div class="muted">Provided during your kitchen renovation</div>
      <div class="muted"><strong>Installer:</strong> ${builderName}</div>
    </div>
  </div>

  <div class="panel">
    <p>
      While your main kitchen is being renovated, a fully equipped temporary kitchen pod can be delivered to your driveway.
      It allows you to cook proper meals, wash up normally, and keep your household running throughout the works.
    </p>

    <div class="cols">
      <div class="col">
        <h2>What's included</h2>
        <ul>
          <li>Full-size oven & hob</li>
          <li>Fridge freezer</li>
          <li>Sink with hot water</li>
          <li>Full-size dishwasher</li>
          <li>Washing machine</li>
          <li>Worktop & storage</li>
        </ul>
      </div>

      <div class="col">
        <h2>What you need on site</h2>
        <ul>
          <li>Two standard double sockets</li>
          <li>Outdoor tap</li>
          <li>Normal drain access</li>
        </ul>
        <p class="muted">
          If the drain is further away, waste can be pumped across the garden/driveway.
        </p>
      </div>
    </div>

    <div class="hr"></div>

    <h2>How it works</h2>
    <ol>
      <li>Pod is delivered and positioned on your driveway.</li>
      <li>Connections are completed by the delivery team.</li>
      <li>Setup takes around 2–3 hours.</li>
      <li>At the end of hire, collection is arranged for you.</li>
    </ol>
  </div>

  <h2>Your temporary kitchen quote</h2>
  <div class="panel">
    <table>
      <tr><td>Postcode</td><td>${clientPostcode}</td></tr>
      <tr><td>Duration</td><td>${weeks} week(s)</td></tr>
      ${startDate ? `<tr><td>Estimated start date</td><td>${startDate}</td></tr>` : ""}
      <tr><td>Base hire</td><td>${money(baseHire)}</td></tr>
      <tr><td>Delivery & collection</td><td>${money(deliveryFee)}</td></tr>
      <tr><td>Distance</td><td>${Number(distanceMiles).toFixed(1)} miles</td></tr>
      <tr class="total"><td>Total</td><td>${money(totalClientPrice)}</td></tr>
    </table>
    <p class="muted" style="margin-top:8px;">
      Quote valid for ${validDays} days. Final booking and payment are handled directly by the temporary kitchen provider.
    </p>
  </div>

  <div class="footer">
    <p>
      If you'd like to add this option to your renovation, just tell your installer and they will arrange it for you.
    </p>
  </div>

</body>
</html>
  `;
}

module.exports = { renderClientQuoteHTML };

