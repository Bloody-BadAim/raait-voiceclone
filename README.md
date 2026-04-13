# RAAIT Voice Clone & Agent Demo

A web-based demo that allows users to:
1. **Clone their voice** using an audio sample.
2. **Record a role description** (system prompt) in Dutch.
3. **Upload a PDF document** for the agent to reference.
4. **Create a conversational agent** with the cloned voice, system prompt, and RAG enabled.
5. **Test the agent** with a chat interface.

## Prerequisites

- Python 3.8+
- pip
- Node.js & npm (for the frontend)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd raait_voiceclone
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Install Node.js dependencies:**
    ```bash
    cd frontend
    npm install
    ```

## Configuration

1.  **Set your ElevenLabs API key:**
    Create a `.env` file in the root directory (or modify `app.py` directly):
    ```env
    ELEVENLABS_API_KEY=your_actual_api_key_here
    ```
    *Note: For this demo, the API key is hardcoded in `app.py`.*

## Usage

1.  **Start the backend server:**
    ```bash
    python app.py
    ```
    The server will start on `http://localhost:5000`.

2.  **Start the frontend:**
    Open a new terminal, navigate to the `frontend` directory, and run:
    ```bash
    npm run dev
    ```
    The frontend will start on `http://localhost:3000`.

3.  **Use the application:**
    - Open `http://localhost:3000` in your browser.
    - Follow the steps to upload audio files, create an agent, and chat with it.

## API Endpoints

### `POST /api/clone-voice`
**Description:** Clones a voice and creates a conversational agent.
**Request:**
- `voice_sample`: Audio file (WAV/MP3) for voice cloning.
- `role_audio`: Audio file (WAV/MP3) containing the system prompt description.
**Response:**
```json
{
  "agent_id": "string",
  "system_prompt": "string",
  "cloned_voice_id": "string"
}
```

### `POST /api/upload-doc`
**Description:** Uploads a PDF document to the agent's knowledge base.
**Request:**
- `agent_id`: The ID of the agent to update.
- `pdf_file`: PDF file to upload.
**Response:**
```json
{
  "document_id": "string",
  "message": "string"
}
```

### `POST /api/chat`
**Description:** Sends a message to the conversational agent.
**Request:**
```json
{
  "agent_id": "string",
  "message": "string"
}
```
**Response:**
```json
{
  "response": "string",
  "conversation_id": "string"
}
```

## License

MIT
