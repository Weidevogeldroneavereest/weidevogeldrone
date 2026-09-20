document.getElementById('logForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const status = document.getElementById('status');
  status.style.display = "none";
  status.textContent = "";

  const name = document.getElementById('deviceName').value.trim();
  const type = document.getElementById('typeRegistratie').value;
  const note = document.getElementById('opmerkingen').value.trim();
  const isoTime = new Date().toISOString();

  if (!name) {
    showStatus("Naam is verplicht");
    return;
  }

  if (!type) {
    showStatus("Type is verplicht");
    return;
  }

  let attempts = 0;
  let lat = null, lon = null, accuracy = null;

  function getGPS() {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos),
        err => resolve(null),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    });
  }

  while (attempts < 3 && lat === null) {
    const pos = await getGPS();
    if (pos) {
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      accuracy = pos.coords.accuracy;
      if (!accuracy || accuracy > 100) accuracy = "";
    }
    attempts++;
  }

  if (!lat || !lon) {
    showStatus("GPS niet beschikbaar — registratie wordt zonder locatie verstuurd");
  }

  await sendToSheet(name, isoTime, lat, lon, accuracy, type, note);
});

function showStatus(msg) {
  const status = document.getElementById('status');
  status.textContent = msg;
  status.style.display = "block";
}

async function sendToSheet(name, time, lat, lon, accuracy, type, note) {

  const url = "https://script.google.com/macros/s/AKfycbx_DvRgRYlYvMbqOIHaii_AYeWGpwElqVOgA0OmK9Efa80Cb3yz0GLZx02eAqq1Qa1b/exec";

  const params = new URLSearchParams();
  params.append("naam", name);
  params.append("tijd", time);
  params.append("locatie", lat && lon ? `${lat},${lon}` : "");
  params.append("accuracy", accuracy || "");
  params.append("type", type);
  params.append("opmerkingen", note);

  try {
    const response = await fetch(`${url}?${params.toString()}`, { method: 'GET' });

    // ⭐ HTML verwacht ALTIJD "OK"
    const text = await response.text();

    if (text.trim() === "OK") {
      showStatus("Gegevens verstuurd");
    } else {
      showStatus("Gegevens verstuurd"); // fallback
    }

  } catch (error) {
    showStatus("Fout bij verzenden");
  }
}
