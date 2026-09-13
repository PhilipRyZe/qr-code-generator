const typeButtons = document.querySelectorAll(".type-btn");
const fieldGroups = document.querySelectorAll(".field-group");
const qrPreview = document.getElementById("qrPreview");
const qrHint = document.getElementById("qrHint");
const downloadButton = document.getElementById("downloadButton");

const colorDots = document.getElementById("colorDots");
const colorBackground = document.getElementById("colorBackground");
const dotStyle = document.getElementById("dotStyle");

let activeType = "link";

// --- QR-Code-Instanz ------------------------------------------------------

const qrCode = new QRCodeStyling({
    width: 260,
    height: 260,
    type: "svg",
    data: " ", // Platzhalter, wird sofort überschrieben
    margin: 8,
    qrOptions: { errorCorrectionLevel: "M" },
    dotsOptions: { color: colorDots.value, type: dotStyle.value },
    backgroundOptions: { color: colorBackground.value },
    cornersSquareOptions: { color: colorDots.value, type: "extra-rounded" },
    cornersDotOptions: { color: colorDots.value, type: "dot" },
});

qrCode.append(qrPreview);
qrPreview.style.display = "none"; // erst zeigen, sobald echte Daten da sind

// --- Tabs -------------------------------------------------------------

typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        typeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeType = btn.dataset.type;

        fieldGroups.forEach((group) => {
            group.classList.toggle("hidden", group.dataset.fields !== activeType);
        });

        updateQrCode();
    });
});

// --- Hilfsfunktionen für die verschiedenen Datenformate ------------------

// Escaped Sonderzeichen, die im WIFI-QR-Format eine Bedeutung haben
function escapeWifi(value) {
    return (value || "").replace(/([\\;,:"])/g, "\\$1");
}

function buildPayload() {
    switch (activeType) {
        case "link": {
            const url = document.getElementById("linkUrl").value.trim();
            return url || null;
        }

        case "file": {
            const url = document.getElementById("fileUrl").value.trim();
            return url || null;
        }

        case "text": {
            const text = document.getElementById("plainText").value.trim();
            return text || null;
        }

        case "wifi": {
            const ssid = document.getElementById("wifiSsid").value.trim();
            if (!ssid) return null;
            const password = document.getElementById("wifiPassword").value;
            const encryption = document.getElementById("wifiEncryption").value;
            const hidden = document.getElementById("wifiHidden").checked;

            const passPart = encryption === "nopass" ? "" : `P:${escapeWifi(password)};`;
            return `WIFI:T:${encryption};S:${escapeWifi(ssid)};${passPart}H:${hidden ? "true" : "false"};;`;
        }

        case "contact": {
            const firstName = document.getElementById("contactFirstName").value.trim();
            const lastName = document.getElementById("contactLastName").value.trim();
            const phone = document.getElementById("contactPhone").value.trim();
            const email = document.getElementById("contactEmail").value.trim();
            const org = document.getElementById("contactOrg").value.trim();
            const website = document.getElementById("contactWebsite").value.trim();

            if (!firstName && !lastName && !phone && !email) return null;

            const lines = ["BEGIN:VCARD", "VERSION:3.0"];
            lines.push(`N:${lastName};${firstName};;;`);
            lines.push(`FN:${[firstName, lastName].filter(Boolean).join(" ")}`);
            if (org) lines.push(`ORG:${org}`);
            if (phone) lines.push(`TEL:${phone}`);
            if (email) lines.push(`EMAIL:${email}`);
            if (website) lines.push(`URL:${website}`);
            lines.push("END:VCARD");

            return lines.join("\n");
        }

        case "email": {
            const address = document.getElementById("emailAddress").value.trim();
            if (!address) return null;
            const subject = document.getElementById("emailSubject").value.trim();
            const body = document.getElementById("emailBody").value.trim();

            const params = [];
            if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
            if (body) params.push(`body=${encodeURIComponent(body)}`);

            return `mailto:${address}${params.length ? "?" + params.join("&") : ""}`;
        }

        case "sms": {
            const phone = document.getElementById("smsPhone").value.trim();
            if (!phone) return null;
            const message = document.getElementById("smsMessage").value.trim();
            return `sms:${phone}${message ? "?body=" + encodeURIComponent(message) : ""}`;
        }

        case "phone": {
            const phone = document.getElementById("phoneNumber").value.trim();
            return phone ? `tel:${phone}` : null;
        }

        default:
            return null;
    }
}

// --- QR-Code aktualisieren ------------------------------------------------

function updateQrCode() {
    const payload = buildPayload();

    qrCode.update({
        data: payload || " ",
        dotsOptions: { color: colorDots.value, type: dotStyle.value },
        backgroundOptions: { color: colorBackground.value },
        cornersSquareOptions: { color: colorDots.value },
        cornersDotOptions: { color: colorDots.value },
    });

    const hasData = Boolean(payload);
    qrPreview.style.display = hasData ? "flex" : "none";
    qrHint.style.display = hasData ? "none" : "block";
    downloadButton.disabled = !hasData;
}

// Auf jede Eingabe im gesamten Formular reagieren (Event-Delegation)
document.querySelectorAll(".field-group input, .field-group select, .field-group textarea").forEach((el) => {
    el.addEventListener("input", updateQrCode);
    el.addEventListener("change", updateQrCode);
});

[colorDots, colorBackground, dotStyle].forEach((el) => {
    el.addEventListener("input", updateQrCode);
    el.addEventListener("change", updateQrCode);
});

downloadButton.addEventListener("click", () => {
    qrCode.download({ name: "qr-code", extension: "png" });
});

// Initialer Zustand
updateQrCode();
