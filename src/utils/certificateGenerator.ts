/**
 * Certificate Generator Utility for NAVROOPAM v7.0
 * Renders the participant's name onto the official Navroopam certificate template
 * matching color, elegant legible typography, resting exactly on the trident baseline,
 * and dynamically shrinking font size to fit within the two trident heads.
 */

export interface RenderCertificateOptions {
  participantName: string;
  templateUrl?: string; // defaults to '/Navroopam-certificate.jpeg'
}

/**
 * Normalizes name formatting:
 * If user inputs all-caps (e.g. "SAYAN MAITY" or "SUMAN DEY"), title-case or normalize it
 * so cursive/script fonts look gorgeous and dignified rather than distorted all-caps script.
 */
export function formatParticipantName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';

  // If the whole string is uppercase and has multiple letters, convert to Title Case
  // e.g. "SAYAN MAITY" -> "Sayan Maity"
  const isAllUpper = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  if (isAllUpper) {
    return trimmed
      .toLowerCase()
      .split(' ')
      .map(part => part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : '')
      .join(' ');
  }
  return trimmed;
}

/**
 * Draws the high-res certificate on an offscreen HTMLCanvasElement
 * Template Dimensions: 1600 x 1131
 * 
 * Trident specifications on 1600x1131 canvas:
 * - Left Trident Head finishes around X = 460
 * - Right Trident Head starts around X = 1140
 * - Available horizontal clear span between the two trident heads: ~640px (safe maxWidth = 620px)
 * - Center X = 800
 * - Trident Horizontal Line baseline: Y = 527 (top edge of line around Y=525, center Y=527)
 * - Using textBaseline = "bottom" with Y = 524 ensures the letters rest right above/on the baseline without clipping into it!
 */
export async function renderCertificateCanvas(
  options: RenderCertificateOptions
): Promise<HTMLCanvasElement> {
  const { participantName, templateUrl = '/Navroopam-certificate.jpeg' } = options;

  // Format name nicely
  const displayName = formatParticipantName(participantName);

  // Pre-load elegant fonts
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('60px "Alex Brush"'),
        document.fonts.load('bold 55px "Playfair Display"'),
        document.fonts.load('italic 60px "Cormorant Garamond"'),
        document.fonts.load('bold 55px "Dancing Script"')
      ]);
    } catch (e) {
      console.warn('Font loading check error:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1600;
      canvas.height = img.naturalHeight || 1131;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas 2D context'));
        return;
      }

      // 1. Draw base certificate template
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Set styling
      // Color matching the certificate's official maroon header: #800020
      ctx.fillStyle = '#800020';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // 3. Center coordinates
      const centerX = canvas.width / 2; // 800

      // The horizontal trident baseline bar center is at Y = 527 (top edge Y = 525)
      const tridentBaselineY = 525;

      // 4. Calculate maximum width allowed between the two trident heads:
      // Left spear ends around X=470, right spear begins around X=1130.
      // Safe maximum text width = 620px.
      const maxAllowedWidth = 620;

      // Primary Font Family:
      // "Alex Brush" is a world-standard, highly legible calligraphy script with beautiful flourishes.
      // Fallbacks: "Cormorant Garamond", "Dancing Script", "Playfair Display", cursive.
      const fontFamilies = '"Alex Brush", "Cormorant Garamond", "Dancing Script", "Playfair Display", "Brush Script MT", cursive';

      // Dynamic font size calculation:
      // Start with ideal generous size, measure text width, and shrink down until it fits within maxAllowedWidth
      let fontSize = 78;
      const minFontSize = 38;

      ctx.font = `400 ${fontSize}px ${fontFamilies}`;
      let textWidth = ctx.measureText(displayName).width;

      while (textWidth > maxAllowedWidth && fontSize > minFontSize) {
        fontSize -= 2;
        ctx.font = `400 ${fontSize}px ${fontFamilies}`;
        textWidth = ctx.measureText(displayName).width;
      }

      // Precise descender alignment:
      // In Canvas 2D TextMetrics, actualBoundingBoxDescent gives the exact pixel depth of the lowest descender below the baseline.
      // If the text contains descenders (like 'k', 'y', 'g', 'p', 'q', 'j', 'z', or cursive flourished capitals),
      // we lift the baseline up so that the lowest point of the lowest descender touches the trident bar (Y = 525).
      // If the name has no descenders, we position the base of the letters gracefully 1-2px above the bar.
      const metrics = ctx.measureText(displayName);
      const lowestDescenderDepth = metrics.actualBoundingBoxDescent || 0;

      let baselineY: number;
      if (lowestDescenderDepth > 2) {
        // Lift text up so the deepest descender just touches the trident baseline bar
        baselineY = tridentBaselineY - lowestDescenderDepth;
      } else {
        // For names without low descenders (e.g. "ANIL", "DEB"), position flat letters right on the baseline
        baselineY = tridentBaselineY - 2;
      }

      // Subtle warm drop shadow for crisp visibility and premium depth
      ctx.shadowColor = 'rgba(128, 0, 32, 0.12)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // 5. Render name on canvas
      ctx.fillText(displayName, centerX, baselineY);

      // Reset shadows
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      resolve(canvas);
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load certificate template: ${err}`));
    };

    img.src = templateUrl;
  });
}

/**
 * Downloads the rendered certificate as high-quality JPEG
 */
export async function downloadCertificateAsImage(
  participantName: string,
  filename?: string
): Promise<void> {
  const canvas = await renderCertificateCanvas({ participantName });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  
  const cleanName = formatParticipantName(participantName).replace(/[^a-zA-Z0-9_-]/g, '_') || 'Participant';
  const downloadName = filename || `Navroopam_Certificate_${cleanName}.jpg`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
