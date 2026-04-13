# RAAIT Voice Clone

AI voice cloning demo voor de HBO-ICT opendag van de Hogeschool van Amsterdam. Bezoekers lezen een tekst voor, vertellen wie ze zijn, en praten daarna met een AI-kloon van zichzelf.

## Vereisten

- Python 3.9+
- pip
- ffmpeg
- ElevenLabs API key

## Installatie

```bash
git clone https://github.com/Bloody-BadAim/raait-voiceclone.git
cd raait-voiceclone
pip install -r requirements.txt
```

ffmpeg is nodig voor audio conversie:

```bash
# Ubuntu / WSL
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

## Starten

```bash
ELEVENLABS_API_KEY="jouw_api_key" python app.py
```

Open http://localhost:5000 in je browser.

## Hoe het werkt

1. **Start** — Druk op de startknop
2. **Stap 1** — Lees de voorleestekst hardop voor (60 seconden). Dit is het stemvoorbeeld voor de kloon.
3. **Stap 2** — Vertel wie je bent: je naam, studie, hobby's, een fun fact (20 seconden)
4. **Kloon** — De app maakt een voice clone via ElevenLabs en start een conversational agent
5. **Praat** — Stel vragen aan je AI-kloon en hoor jezelf antwoorden

## Omgevingsvariabelen

| Variabele | Verplicht | Omschrijving |
|---|---|---|
| `ELEVENLABS_API_KEY` | Ja | API key van elevenlabs.io |
| `PORT` | Nee | Server port (default: 5000) |

## Docker

```bash
docker build -t raait-voiceclone .
docker run -p 5000:5000 -e ELEVENLABS_API_KEY="jouw_api_key" raait-voiceclone
```

## Projectstructuur

```
app.py                  Flask backend (voice clone + agent creation)
templates/index.html    Frontend wizard
static/css/style.css    HBO-ICT design system
static/js/app.js        App logica (recording, visualizer, countdown)
static/js/wavEncoder.js PCM WAV encoder
static/img/             Logo en afbeeldingen
```

## API

### POST /api/clone-voice

Kloont een stem en maakt een conversational agent.

**Request** (multipart/form-data):
- `voice_sample` — WAV audio van de voorleestekst
- `role_audio` — WAV audio van de zelfbeschrijving

**Response:**
```json
{
  "agent_id": "string",
  "system_prompt": "string",
  "cloned_voice_id": "string"
}
```

## Licentie

MIT
