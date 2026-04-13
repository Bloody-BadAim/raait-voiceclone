import os
import io
from flask import Flask, request, jsonify, render_template
import requests
import speech_recognition as sr

app = Flask(__name__)

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    print("WARNING: ELEVENLABS_API_KEY not set. Set it via environment variable.")

VOICE_CLONE_URL = "https://api.elevenlabs.io/v1/voices/add"
AGENT_CREATE_URL = "https://api.elevenlabs.io/v1/convai/agents/create"

SYSTEM_PROMPT_TEMPLATE = """Je bent een AI-kloon van een bezoeker op de HBO-ICT opendag van de Hogeschool van Amsterdam.
Je praat Nederlands. Je bent vriendelijk en enthousiast over technologie en HBO-ICT.
De bezoeker heeft het volgende over zichzelf verteld: {user_description}
Gedraag je alsof je deze persoon bent. Beantwoord vragen over HBO-ICT, AI, en technologie.
Houd antwoorden kort (max 2 zinnen)."""


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/clone-voice', methods=['POST'])
def clone_voice():
    if 'voice_sample' not in request.files or 'role_audio' not in request.files:
        return jsonify({"error": "Missing voice_sample or role_audio file."}), 400

    voice_file = request.files['voice_sample']
    role_audio_file = request.files['role_audio']

    voice_bytes = io.BytesIO(voice_file.read())
    role_audio_bytes = io.BytesIO(role_audio_file.read())

    # Step 1: Clone voice
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    files_payload = {"files": ("sample.wav", voice_bytes, "audio/wav")}
    data_payload = {"name": "OpenDag_Kloon", "remove_background_noise": "true"}

    clone_response = requests.post(VOICE_CLONE_URL, headers=headers, files=files_payload, data=data_payload)
    if clone_response.status_code != 200:
        return jsonify({"error": "Voice cloning failed", "details": clone_response.text}), 400

    clone_data = clone_response.json()
    cloned_voice_id = clone_data.get("voice_id")
    if not cloned_voice_id:
        return jsonify({"error": "Voice cloning did not return voice_id", "details": clone_data}), 400

    # Step 2: Convert role audio to text
    recognizer = sr.Recognizer()
    try:
        role_audio_bytes.seek(0)
        from pydub import AudioSegment
        audio_segment = AudioSegment.from_file(role_audio_bytes)
        converted_audio = io.BytesIO()
        audio_segment.export(converted_audio, format="wav")
        converted_audio.seek(0)
        with sr.AudioFile(converted_audio) as source:
            audio_data = recognizer.record(source)
        user_description = recognizer.recognize_google(audio_data, language="nl-NL")
    except Exception as e:
        print("Error in speech recognition:", e)
        user_description = "een bezoeker van de HBO-ICT opendag"

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_description=user_description)
    print("System prompt:", system_prompt)

    # Step 3: Create conversational agent
    agent_payload = {
        "name": "HBO-ICT Kloon",
        "conversation_config": {
            "tts": {
                "model_id": "eleven_multilingual_v2",
                "voice_id": cloned_voice_id,
                "similarity_boost": 0.85,
                "stability": 0.5,
                "style": 0.4,
                "use_speaker_boost": True
            },
            "agent": {
                "language": "nl",
                "prompt": {
                    "prompt": system_prompt,
                    "knowledge_base": []
                }
            }
        },
        "platform_settings": {
            "widget": {
                "variant": "full"
            }
        }
    }

    agent_response = requests.post(
        AGENT_CREATE_URL,
        headers={**headers, "Content-Type": "application/json"},
        json=agent_payload
    )
    if agent_response.status_code != 200:
        return jsonify({"error": "Agent creation failed", "details": agent_response.text}), 400

    agent_data = agent_response.json()
    agent_id = agent_data.get("agent_id")
    if not agent_id:
        return jsonify({"error": "Agent creation did not return agent_id", "details": agent_data}), 400

    return jsonify({
        "agent_id": agent_id,
        "system_prompt": system_prompt,
        "cloned_voice_id": cloned_voice_id
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
