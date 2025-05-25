export const getDominantColor = (imgElement: HTMLImageElement): string => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) return 'rgba(0,0,0,0.5)';

  canvas.width = imgElement.width;
  canvas.height = imgElement.height;

  context.drawImage(imgElement, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixelData = imageData.data;

  const colorCount: Record<string, number> = {};
  const step = 5; // skip pixel untuk optimasi

  for (let i = 0; i < pixelData.length; i += 4 * step) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    // abaikan warna terlalu gelap/terang (opsional)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 30 || brightness > 220) continue;

    const key = `${r},${g},${b}`;
    colorCount[key] = (colorCount[key] || 0) + 1;
  }

  let maxColor = '';
  let maxCount = 0;

  for (const [key, count] of Object.entries(colorCount)) {
    if (count > maxCount) {
      maxCount = count;
      maxColor = key;
    }
  }

  const [r, g, b] = maxColor.split(',').map(Number);
  return `rgba(${r}, ${g}, ${b}, 0.6)`; // sesuaikan opacity
};