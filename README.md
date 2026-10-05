# Spotify Song Finder – online deploy ready

Die Website nutzt React/Vite als Frontend und Express + Spotify Web API als Backend. In Produktion wird das Vite-Build direkt vom Express-Server ausgeliefert.

## Lokal

1. `.env.example` nach `.env` kopieren.
2. Spotify Client ID und Client Secret eintragen.
3. `npm install`
4. `npm run dev`
5. `http://127.0.0.1:5173`

## Online mit Render

Für diese Version ist ein **Render Web Service** passend, weil die App serverseitigen Express-Code benötigt. Render beschreibt Web Services ausdrücklich für Express/Node-Apps. citeturn0search0turn0search11

1. Lade den Ordner in ein GitHub-Repository hoch.
2. Öffne Render und wähle **New → Web Service**.
3. Verbinde dein GitHub-Repository.
4. Stelle ein:
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: **Free** zum Testen
5. Unter **Environment** diese Variablen hinzufügen:
   - `SPOTIFY_CLIENT_ID` = deine Client ID
   - `SPOTIFY_CLIENT_SECRET` = dein Client Secret
   - `SPOTIFY_MARKET` = `DE`
   - `NODE_VERSION` = `20`
6. Deploy starten.

Render unterstützt Environment Variables/Secrets im Dashboard; sie gehören nicht ins Repository. citeturn0search1turn0search7

Wichtig: Der Server hört in dieser Version auf `0.0.0.0`, damit Render ihn öffentlich erreichen kann. Render verlangt dies für Web Services. citeturn0search11

Nach dem erfolgreichen Deploy bekommst du eine öffentliche `onrender.com`-Adresse. Der kostenlose Web-Service kann bei Inaktivität herunterfahren und beim nächsten Zugriff wieder starten. citeturn0search4
