# Sonic Scribe 🎙️

**Sonic Scribe** is a powerful, local audio transcription tool built with **Next.js** and **Python**. It leverages OpenAI's [Whisper](https://github.com/openai/whisper) model to transcribe audio files of unlimited length completely offline, ensuring privacy and zero cost.

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Whisper](https://img.shields.io/badge/OpenAI_Whisper-412991?style=for-the-badge&logo=openai&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)

## ✨ Features

-   **♾️ Unlimited Audio Length**: Automatically splits large audio files (1h, 2h, 4h+) into manageable chunks for processing.
-   **🔒 100% Local & Private**: No API keys required. All processing happens on your machine.
-   **🧹 Audio Enhancement**: Built-in noise reduction pipeline using spectral gating to clean background noise before transcription.
-   **💅 Premium UI**: A modern, dark-mode interface designed with Vanilla CSS and Glassmorphism effects.
-   **📊 Real-time Progress**: Visual circular progress bar and detailed status updates (e.g., "Processing Chunk 3/12").

## 🛠️ Prerequisites

Ensure you have the following installed on your system:

1.  **Node.js** (v18+)
2.  **Python 3** (v3.8+)
3.  **FFmpeg** (Must be added to your system PATH)

## 🚀 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/sonic-scribe.git
    cd sonic-scribe
    ```

2.  **Install Node dependencies**:
    ```bash
    npm install
    ```

3.  **Install Python dependencies**:
    ```bash
    pip3 install openai-whisper noisereduce soundfile numpy
    ```
    *(Note: You might need `scipy` or `torch` depending on your environment, but `whisper` usually handles its own dependencies)*

## 🏃‍♂️ Usage

1.  Start the development server:
    ```bash
    npm run dev
    ```

2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

3.  **Drag and drop** an audio file (MP3, WAV, M4A, etc.) into the upload zone.

4.  Wait for the magic to happen! 🎧 -> 📝

## ⚙️ How it Works

1.  **Upload**: The file is uploaded to `lib/tmp/uploads`.
2.  **Split**: NodeJS uses `ffmpeg` to split the file into 10-minute `.wav` chunks (16kHz).
3.  **Denoise**: A Python script loads each chunk, applies noise reduction, and saves a temp file.
4.  **Transcribe**: The clean audio is passed to the local Whisper model.
5.  **Merge**: Results are stitched together and displayed in the UI.

## 📄 License

MIT
