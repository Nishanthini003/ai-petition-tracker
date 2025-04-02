import React, { useState } from 'react';
import { recognize } from 'tesseract.js';

function demo() {
  const [imageUrl, setImageUrl] = useState('');
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleExtract = async () => {
    setIsLoading(true);
    try {
      const { data: { text } } = await recognize(imageUrl, 'eng', {
        logger: (m) => setProgress(Math.round(m.progress * 100)),
      });
      setText(text);
    } catch (err) {
      console.error(err);
      setText('Error extracting text');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Enter image URL"
      />
      <button onClick={handleExtract} disabled={!imageUrl || isLoading}>
        {isLoading ? `Processing... ${progress}%` : 'Extract Text'}
      </button>
      {text && <pre>{text}</pre>}
    </div>
  );
}

export default demo;