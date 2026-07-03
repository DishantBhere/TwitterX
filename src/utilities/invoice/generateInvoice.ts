// @ts-nocheck
const { jsPDF } = require("jspdf");

// ---------------------------------------------------------------------------
// Theme configuration per subscription plan
// ---------------------------------------------------------------------------
const THEMES = {
  BRONZE: {
    accent: [205, 127, 50],   // #CD7F32
    accentLight: [250, 235, 220], // tinted panel background
    badgeText: [255, 255, 255],
    name: "BRONZE",
  },
  SILVER: {
    accent: [140, 140, 140],  // slightly darker than #C0C0C0 for legibility
    accentLight: [235, 235, 235],
    badgeText: [255, 255, 255],
    name: "SILVER",
  },
  GOLD: {
    accent: [212, 175, 20],   // deeper gold than #FFD700 for print contrast
    accentLight: [255, 246, 214],
    badgeText: [90, 70, 0],
    name: "GOLD",
  },
};

function lighten(rgb, amount) {
  return rgb.map((c) => Math.round(c + (255 - c) * amount));
}

function formatDateTime(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return { date: `${day} ${month} ${year}`, time: `${hours}:${minutes} ${ampm}` };
}

function makeInvoiceId(paymentId) {
  const rawId = String(paymentId || "").trim();
  if (!rawId) return "INV-UNKNOWN";
  return `INV-${rawId}`;
}

// --- tiny vector icon helpers (all draw inside a small bounding box) -------
function iconDoc(doc, x, y, size, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, size * 0.75, size, 0.6, 0.6, "FD");
  doc.setLineWidth(0.35);
  for (let i = 0; i < 3; i++) {
    const ly = y + size * 0.3 + i * size * 0.2;
    doc.line(x + size * 0.15, ly, x + size * 0.6, ly);
  }
}

function iconPerson(doc, x, y, size, color) {
  doc.setDrawColor(...color);
  doc.setFillColor(...color);
  const cx = x + size / 2;
  doc.circle(cx, y + size * 0.28, size * 0.22, "F");
  doc.ellipse(cx, y + size * 0.85, size * 0.35, size * 0.28, "F");
}

function iconEnvelope(doc, x, y, w, h, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, "FD");
  doc.line(x, y, x + w / 2, y + h * 0.6);
  doc.line(x + w, y, x + w / 2, y + h * 0.6);
}

function iconCalendar(doc, x, y, w, h, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 0.5, 0.5, "FD");
  doc.line(x, y + h * 0.32, x + w, y + h * 0.32);
  doc.setLineWidth(0.7);
  doc.line(x + w * 0.25, y - h * 0.12, x + w * 0.25, y + h * 0.18);
  doc.line(x + w * 0.75, y - h * 0.12, x + w * 0.75, y + h * 0.18);
}

function iconCrown(doc, x, y, w, h, color) {
  doc.setDrawColor(...color);
  doc.setFillColor(...color);
  const pts = [
    [x, y + h], [x, y + h * 0.35], [x + w * 0.22, y + h * 0.62],
    [x + w * 0.5, y], [x + w * 0.78, y + h * 0.62], [x + w, y + h * 0.35],
    [x + w, y + h],
  ];
  doc.lines(
    pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]),
    pts[0][0], pts[0][1], [1, 1], "F", true
  );
}

function iconHeart(doc, x, y, size, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);
  const cx = x + size / 2;
  doc.circle(x + size * 0.28, y + size * 0.3, size * 0.28, "S");
  doc.circle(x + size * 0.72, y + size * 0.3, size * 0.28, "S");
  doc.lines(
    [[size * 0.22, size * 0.22], [ -size * 0.22, size * 0.22]],
    x + size * 0.06, y + size * 0.42, [1, 1], "S", false
  );
}

function iconCoin(doc, x, y, size, color) {
  doc.setDrawColor(...color);
  doc.setFillColor(...lighten(color, 0.55));
  doc.circle(x + size / 2, y + size / 2, size / 2, "FD");
  doc.setFontSize(size * 3.2);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.text("$", x + size / 2, y + size / 2 + size * 0.16, { align: "center" });
}

// twitter-style bird, drawn simply for the header + faint watermark
function drawBird(doc, x, y, size, color, opacity = 1) {
  const gState = doc.GState ? new doc.GState({ opacity }) : null;
  if (gState) doc.setGState(gState);
  doc.setFillColor(...color);
  doc.setDrawColor(...color);
  // simplified bird silhouette using overlapping ellipses
  doc.ellipse(x + size * 0.5, y + size * 0.55, size * 0.42, size * 0.3, "F");
  doc.ellipse(x + size * 0.78, y + size * 0.35, size * 0.2, size * 0.18, "F");
  doc.triangle(
    x + size * 0.9, y + size * 0.28,
    x + size * 1.08, y + size * 0.22,
    x + size * 0.92, y + size * 0.42,
    "F"
  );
  doc.triangle(
    x + size * 0.15, y + size * 0.78,
    x + size * 0.02, y + size * 1.0,
    x + size * 0.35, y + size * 0.85,
    "F"
  );
  doc.triangle(
    x + size * 0.55, y + size * 0.82,
    x + size * 0.45, y + size * 1.05,
    x + size * 0.7, y + size * 0.88,
    "F"
  );
  if (gState) doc.setGState(new doc.GState({ opacity: 1 }));
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function generateInvoice({ userName, email, plan, amount, purchaseDate, paymentId, orderId }) {
  const planKey = String(plan || "").toUpperCase();
  const theme = THEMES[planKey];
  if (!theme) {
    throw new Error(`Invalid plan "${plan}". Must be BRONZE, SILVER, or GOLD.`);
  }

  const doc = new jsPDF({ unit: "mm", format: [140, 190] });
  const pageW = 140;
  const pageH = 190;
  const accent = theme.accent;

  // ---- outer border -------------------------------------------------------
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.1);
  doc.roundedRect(4, 4, pageW - 8, pageH - 8, 3, 3, "S");
  doc.setLineWidth(0.3);
  doc.roundedRect(6, 6, pageW - 12, pageH - 12, 2, 2, "S");

  // ---- faint watermark bird -------------------------------------------
  drawBird(doc, pageW / 2 - 20, pageH / 2 - 15, 40, [230, 230, 235], 0.5);

  // ---- header ---------------------------------------------------------
  drawBird(doc, 16, 12, 8, [29, 155, 240], 1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("TwitterX", pageW / 2 + 4, 19, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...accent);
  doc.text("Subscription Invoice", pageW / 2, 26, { align: "center" });

  doc.setDrawColor(...lighten(accent, 0.5));
  doc.setLineWidth(0.3);
  doc.line(10, 30, pageW - 10, 30);

  // ---- layout panels ----------------------------------------------------
  const topY = 34;
  const bottomY = pageH - 22;
  const leftX = 8;
  const leftW = 42;
  const rightX = leftX + leftW + 4;
  const rightW = pageW - rightX - 8;

  // left panel background
  doc.setFillColor(...theme.accentLight);
  doc.roundedRect(leftX, topY, leftW, bottomY - topY, 2, 2, "F");

  const invoiceId = makeInvoiceId(paymentId);
  const { date, time } = formatDateTime(purchaseDate || new Date());

  let ly = topY + 8;
  doc.setTextColor(60, 60, 60);

  // invoice id block
  iconDoc(doc, leftX + 5, ly - 4, 5, accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Invoice ID", leftX + 12, ly);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(invoiceId, leftX + 12, ly + 4.5, { maxWidth: leftW - 14 });

  ly += 20;
  iconCalendar(doc, leftX + 6, ly - 3, 3.6, 3.6, accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Date", leftX + 12, ly);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(date, leftX + 12, ly + 4.5);
  doc.text(time, leftX + 12, ly + 8.5);

  // thank you block (near bottom of left panel)
  const thankY = bottomY - 28;
  iconHeart(doc, leftX + leftW / 2 - 3.5, thankY, 7, accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...accent);
  doc.text("Thank you", leftX + leftW / 2, thankY + 12, { align: "center" });
  doc.text("for subscribing!", leftX + leftW / 2, thankY + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 110);
  const enjoyLines = doc.splitTextToSize(
    "Enjoy your premium experience with TwitterX.",
    leftW - 8
  );
  doc.text(enjoyLines, leftX + leftW / 2, thankY + 21, { align: "center" });

  // ---- right panel: details table ---------------------------------------
  let ry = topY + 6;
  const rowGap = 15.5;
  const iconSize = 5;
  const textX = rightX + iconSize + 5;

  function row(iconFn, label, value, extra) {
    iconFn();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text(label, textX, ry);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(25, 25, 25);
    doc.text(String(value), textX, ry + 5, { maxWidth: rightW - iconSize - 8 });
    if (extra) extra();
    ry += rowGap;
  }

  row(
    () => iconPerson(doc, rightX, ry - 4, iconSize, accent),
    "User Name",
    userName
  );
  row(
    () => iconEnvelope(doc, rightX, ry - 4, iconSize, iconSize * 0.7, accent),
    "Email",
    email
  );
  row(
    () => iconCalendar(doc, rightX + 0.5, ry - 3.2, iconSize * 0.75, iconSize * 0.75, accent),
    "Purchased Date & Time",
    `${date}, ${time}`
  );

  // plan badge row
  iconCrown(doc, rightX, ry - 4.5, iconSize, iconSize * 0.8, accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Subscription Plan", textX, ry);
  doc.setFillColor(...accent);
  doc.roundedRect(textX, ry + 1.5, 20, 6, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...theme.badgeText);
  doc.text(theme.name, textX + 10, ry + 5.7, { align: "center" });
  ry += rowGap;

  row(
    () => iconCoin(doc, rightX, ry - 4.5, iconSize, accent),
    "Amount Paid",
    `Rs. ${Number(amount).toFixed(2)}`
  );

  row(
    () => iconDoc(doc, rightX, ry - 4.5, iconSize, accent),
    "Payment ID",
    paymentId
  );

  row(
    () => iconDoc(doc, rightX, ry - 4.5, iconSize, accent),
    "Order ID",
    orderId
  );

  // ---- footer -------------------------------------------------------------
  doc.setDrawColor(...lighten(accent, 0.5));
  doc.setLineWidth(0.3);
  doc.line(10, bottomY, pageW - 10, bottomY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...accent);
  doc.text("Thank you for subscribing to TwitterX!", pageW / 2, bottomY + 8, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Enjoy your premium experience.", pageW / 2, bottomY + 13, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
