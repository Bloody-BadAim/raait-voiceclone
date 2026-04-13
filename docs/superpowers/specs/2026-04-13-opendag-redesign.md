# RAAIT Voice Clone — Opendag Redesign

## Doel
Bezoekers van de HBO-ICT opendag (HvA) kunnen in ~2 minuten hun stem laten klonen door AI en vervolgens een gesprek voeren met hun eigen digitale kloon. De app draait op een groot scherm naast een tafel.

## Doelgroep
- Middelbare scholieren (16-18 jaar) en hun ouders
- Korte aandachtsspanne, moet instant snappen wat ze moeten doen
- Staan in een drukke, lawaaierige ruimte

## Visuele richting
**Playful + bold** op HvA huisstijl.

- Donkere achtergrond (#0a0a0a)
- HvA paars (#660099) als primaire accent
- Magenta (#e4007c) als secundaire accent
- Witte tekst, grote typografie (leesbaar vanaf 3m afstand)
- Full-screen wizard: elke stap vult het hele viewport
- Live audio visualizer (waveform bars) tijdens opname
- Smooth CSS transities tussen stappen

### Typography
- Display font: grotere, boldere variant
- Body: clean sans-serif
- Minimale tekst per scherm — max 2 zinnen instructie

### Animatie
- Idle scherm: subtiele pulserende glow op de CTA
- Audio visualizer: realtime frequency bars via Web Audio API
- Stap transities: fade + slide
- Loading stap: kloon-animatie (DNA helix of morphing waveform)

## Flow

### Idle scherm (aantrekker)
- Grote tekst: "Durf jij gekloond te worden?"
- Subtitel: "HBO-ICT | Hogeschool van Amsterdam"
- Pulserende "Start" knop
- Draait in een loop als niemand interacteert

### Stap 1: Stem opnemen (60 seconden)
- Instructie: "Lees de onderstaande tekst hardop voor"
- Voorleestekst verschijnt (Nederlands, gevarieerde klanken, ~60s leestijd)
- Live audio visualizer (frequency bars)
- Countdown timer (60s, visueel als cirkel of balk)
- Automatisch stoppen na 60s, of handmatig eerder stoppen
- Opname als echte PCM WAV via AudioContext + ScriptProcessor/AudioWorklet

### Stap 2: Wie ben jij? (15 seconden)
- Instructie: "Vertel in een paar zinnen wie je bent"
- Suggesties: "Je naam, wat je studeert of wilt studeren, een fun fact"
- Live audio visualizer
- Countdown timer (15s)
- Dit wordt via speech-to-text omgezet naar de AI persoonlijkheid

### Stap 3: Klonen... (loading)
- Animatie terwijl backend werkt (voice clone + agent creation)
- Tekst: "Je kloon wordt gemaakt..."
- Geen interactie nodig, automatische doorgang

### Stap 4: Praat met je kloon
- Tekst: "Hier is je kloon! Stel een vraag."
- ElevenLabs convai widget embed
- "Opnieuw" knop om terug naar idle te gaan (voor volgende bezoeker)

## Backend wijzigingen

### Audio format fix
- Frontend stuurt echte PCM WAV (niet webm gelabeld als wav)
- Opnemen via AudioContext → Float32 samples → WAV encoder
- Content-Type correct als audio/wav

### ElevenLabs API aanpassingen
- `remove_background_noise: "true"` bij voice clone request (drukke ruimte)
- Recording duur: 60s voor voice sample (was 30s)
- Vaste systeemprompt template die de speech-to-text aanvult:

```
Je bent een AI-kloon van een bezoeker op de HBO-ICT opendag van de Hogeschool van Amsterdam.
Je praat Nederlands. Je bent vriendelijk en enthousiast over technologie en HBO-ICT.
De bezoeker heeft het volgende over zichzelf verteld: {speech_to_text_result}
Gedraag je alsof je deze persoon bent. Beantwoord vragen over HBO-ICT, AI, en technologie.
Houd antwoorden kort (max 2 zinnen).
```

### Endpoints
- `POST /api/clone-voice` — ongewijzigd qua interface, backend past prompt template toe
- `POST /api/upload-doc` — verwijderd (niet nodig voor opendag)
- `GET /` — serveert nieuwe frontend

## Technische keuzes
- Vanilla HTML/CSS/JS (geen framework nodig voor 1 pagina)
- CSS custom properties voor design tokens
- Web Audio API voor:
  - Realtime frequency visualizer (AnalyserNode)
  - PCM WAV opname (AudioContext + MediaStreamSource)
- Alle animaties via CSS transitions/keyframes
- Responsive maar geoptimaliseerd voor groot scherm (16:9)

## Scope
- Geen PDF upload
- Geen multi-file support
- Geen persistent storage
- Geen auth
- Eenmalig gebruik per bezoeker, daarna reset

## Bestandsstructuur
```
app.py              — Flask backend (aangepast)
templates/
  index.html        — Nieuwe full-screen wizard UI
static/
  css/style.css     — Design tokens + layout + animaties
  js/app.js         — Flow logic + audio recording + visualizer
  js/wavEncoder.js  — PCM WAV encoder utility
```
