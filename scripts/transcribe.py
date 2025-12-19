
import sys
import os
import whisper
import warnings
import noisereduce as nr
import soundfile as sf
import numpy as np

# Suppress warnings
warnings.filterwarnings("ignore")

def transcribe(file_path, model_name="base"):
    try:
        print(f"Loading audio for denoising: {file_path}", file=sys.stderr)
        
        # 1. Load Audio
        data, rate = sf.read(file_path)
        
        # Handle multi-channel audio (convert to mono)
        if len(data.shape) > 1:
            data = data.mean(axis=1)

        # 2. Reduce Noise
        # Using stationary noise reduction (prop_decrease=0.8 to be safe/conservative)
        print("Applying noise reduction...", file=sys.stderr)
        reduced_noise = nr.reduce_noise(y=data, sr=rate, prop_decrease=0.8)
        
        # 3. Save Temporary Clean File
        clean_path = file_path + ".clean.wav"
        sf.write(clean_path, reduced_noise, rate)
        
        # 4. Transcribe
        print("Loading Whisper model...", file=sys.stderr)
        model = whisper.load_model(model_name)
        
        print("Transcribing...", file=sys.stderr)
        result = model.transcribe(clean_path)
        
        # Cleanup
        if os.path.exists(clean_path):
            os.remove(clean_path)
        
        # Print text to stdout
        print(result["text"])
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <file_path> [model_name]")
        sys.exit(1)
        
    file_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "base"
    
    transcribe(file_path, model_name)
