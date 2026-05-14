import { useState, useRef } from 'react';

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 4;

export default function ImageUploader({ images, setImages }) {
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function handleFiles(files) {
    setError(null);
    const arr = Array.from(files).slice(0, MAX_IMAGES - images.length);
    const newImages = [];
    for (const file of arr) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} bir görsel değil.`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name} ${MAX_SIZE_MB} MB'dan büyük.`);
        continue;
      }
      const base64 = await fileToBase64(file);
      newImages.push({
        mimeType: file.type,
        data: base64,
        name: file.name,
        preview: `data:${file.type};base64,${base64}`,
      });
    }
    setImages([...images, ...newImages]);
  }

  function remove(idx) {
    setImages(images.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img
              src={img.preview}
              alt={img.name}
              className="w-16 h-16 object-cover border border-ink"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-ink text-parchment text-xs leading-none rounded-full hidden group-hover:flex items-center justify-center"
              aria-label="Sil"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-16 h-16 border border-dashed border-ink-faded text-ink-faded hover:border-oxblood hover:text-oxblood text-xs font-mono uppercase tracking-widest flex items-center justify-center"
          >
            + kanıt
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <div className="error-box mt-3 text-xs">{error}</div>}

      <p className="text-xs text-ink-faded font-mono tracking-wide mt-2 uppercase">
        Görsel kanıt · maks {MAX_IMAGES} adet · {MAX_SIZE_MB} MB
      </p>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result; // "data:image/png;base64,XXX"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
