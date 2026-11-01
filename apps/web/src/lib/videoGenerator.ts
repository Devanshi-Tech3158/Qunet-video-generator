/**
 * Dynamic 9:16 Short Video Generator
 *
 * Renders an animated, polished 9:16 vertical video onto an HTML5 Canvas
 * based on the user's prompt and script beats, synthesizes background audio,
 * and records it into a playable and downloadable video Blob via MediaRecorder.
 */

import type { GeneratedVideoScript } from './scriptGenerator';

const VIDEO_CACHE = new Map<string, string>();

export function getGeneratedVideoUrl(jobId: string): string | null {
  return VIDEO_CACHE.get(jobId) ?? null;
}

export function setGeneratedVideoUrl(jobId: string, url: string): void {
  VIDEO_CACHE.set(jobId, url);
}

/**
 * Synthesizes a real 9:16 vertical short video (720x1280) for the user's prompt.
 */
export async function generateVideoFromScript(
  jobId: string,
  script: GeneratedVideoScript,
): Promise<string> {
  // Check cache first
  const existing = VIDEO_CACHE.get(jobId);
  if (existing !== undefined) return existing;

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return '';
  }

  // Setup 9:16 canvas
  const width = 720;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx === null) {
    return '';
  }

  // Check MediaRecorder support
  const hasMediaRecorder =
    typeof MediaRecorder !== 'undefined' &&
    typeof canvas.captureStream === 'function';

  // Prepare AudioContext for ambient synth soundbed
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      audioDestination = audioContext.createMediaStreamDestination();

      // Play soft ambient chords
      const now = audioContext.currentTime;
      const freqs = [220, 261.63, 329.63, 392.0]; // A minor 7th warm chord
      freqs.forEach((freq, idx) => {
        if (!audioContext || !audioDestination) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.04 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 12);
        osc.connect(gain);
        gain.connect(audioDestination);
        osc.start(now);
        osc.stop(now + 12);
      });
    }
  } catch {
    // Audio fallback ignored
  }

  if (!hasMediaRecorder) {
    // Draw initial static frame for fallback
    renderCanvasFrame(ctx, width, height, script, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    VIDEO_CACHE.set(jobId, dataUrl);
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    try {
      const stream = canvas.captureStream(30);

      // Add audio track if available
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        audioDestination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType.includes('video') ? mimeType : undefined,
        videoBitsPerSecond: 2_500_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        VIDEO_CACHE.set(jobId, videoUrl);
        if (audioContext && audioContext.state !== 'closed') {
          void audioContext.close();
        }
        resolve(videoUrl);
      };

      recorder.start();

      const durationMs = 8000; // 8 second quick video
      const fps = 30;
      const totalFrames = (durationMs / 1000) * fps;
      let frame = 0;

      const interval = setInterval(() => {
        frame++;
        const elapsed = (frame / fps) * 1000;
        const sceneIndex = Math.min(
          script.scenes.length - 1,
          Math.floor((elapsed / durationMs) * script.scenes.length),
        );

        renderCanvasFrame(ctx, width, height, script, elapsed, sceneIndex);

        if (frame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 1000 / fps);
    } catch {
      // In case recording throws in headless environments
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      VIDEO_CACHE.set(jobId, dataUrl);
      resolve(dataUrl);
    }
  });
}

/**
 * Draws an aesthetic 9:16 frame onto the canvas matching CreatorDNA design tokens.
 */
function renderCanvasFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  script: GeneratedVideoScript,
  elapsedMs: number,
  sceneIndex: number,
): void {
  // 1. Dark Gradient Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0f172a'); // slate-900
  grad.addColorStop(0.45, '#1e1b4b'); // indigo-950
  grad.addColorStop(1, '#1c1917'); // warm dark stone
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Floating Tech Glow Orbs
  const pulse = Math.sin(elapsedMs * 0.003);
  ctx.save();
  ctx.beginPath();
  ctx.arc(150 + pulse * 25, 260, 200, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 127, 85, 0.16)'; // coral glow
  ctx.fill();

  ctx.beginPath();
  ctx.arc(580 - pulse * 20, 950, 220, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(129, 140, 248, 0.14)'; // indigo glow
  ctx.fill();
  ctx.restore();

  // 3. Top Header Bar: Creator DNA Badge + Platform Tag
  ctx.save();
  // Pill background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(40, 60, width - 80, 52, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Badge Text
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ff9e78';
  ctx.fillText('🧬 Creator DNA', 65, 93);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 18px system-ui, -apple-system, sans-serif';
  ctx.fillText(`· ${script.topic}`, 225, 93);

  // Live Dot
  ctx.beginPath();
  ctx.arc(width - 75, 86, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.restore();

  // 4. Main Content Card
  const currentScene = script.scenes[sceneIndex] ?? script.scenes[0]!;
  ctx.save();

  // Card background
  const cardX = 40;
  const cardY = 160;
  const cardW = width - 80;
  const cardH = 820;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)'; // slate-800
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 127, 85, 0.4)'; // coral border
  ctx.lineWidth = 2;
  ctx.stroke();

  // Scene Tag
  ctx.fillStyle = 'rgba(255, 127, 85, 0.18)';
  ctx.beginPath();
  ctx.roundRect(cardX + 28, cardY + 28, 170, 38, 12);
  ctx.fill();

  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ff9e78';
  ctx.fillText(`SCENE ${sceneIndex + 1}: ${currentScene.scene.toUpperCase()}`, cardX + 42, cardY + 53);

  // Hook / Scene Main Title
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, currentScene.text, cardX + 30, cardY + 120, cardW - 60, 48, 4);

  // Visual Element: Code Snippet or Conceptual Card
  if (currentScene.codeSnippet) {
    const codeY = cardY + 340;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cardX + 24, codeY, cardW - 48, 220, 18);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mac dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cardX + 48, codeY + 22, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.arc(cardX + 66, codeY + 22, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(cardX + 84, codeY + 22, 6, 0, Math.PI * 2); ctx.fill();

    // Code lines
    ctx.font = 'bold 18px monospace, Courier, sans-serif';
    ctx.fillStyle = '#38bdf8';
    const lines = currentScene.codeSnippet.split('\n');
    lines.forEach((line, lIdx) => {
      ctx.fillText(line, cardX + 48, codeY + 65 + lIdx * 28);
    });
  } else {
    // Illustrated Concept Graphic
    const artY = cardY + 340;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(cardX + 24, artY, cardW - 48, 220, 18);
    ctx.fill();

    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡 🚀 ✨', width / 2, artY + 110);

    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Key Insight: ${script.topic}`, width / 2, artY + 165);
    ctx.textAlign = 'left';
  }

  // Subtitle / Takeaway text
  if (currentScene.subtitle) {
    ctx.font = '500 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    wrapText(ctx, currentScene.subtitle, cardX + 30, cardY + 600, cardW - 60, 32, 3);
  }

  // CTA Pill at bottom of card
  ctx.fillStyle = '#ff7f55';
  ctx.beginPath();
  ctx.roundRect(cardX + 30, cardY + 710, cardW - 60, 60, 30);
  ctx.fill();

  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ Follow @devanshi.cse on Qoneqt', width / 2, cardY + 748);
  ctx.textAlign = 'left';

  ctx.restore();

  // 5. Bottom Audio Waveform Visualizer
  ctx.save();
  const waveY = height - 190;
  const waveW = width - 80;
  const bars = 28;
  const barWidth = 14;
  const barGap = (waveW - bars * barWidth) / (bars - 1);

  for (let i = 0; i < bars; i++) {
    const waveH = Math.max(12, Math.sin(elapsedMs * 0.01 + i * 0.4) * 45 + 50);
    const bx = 40 + i * (barWidth + barGap);
    const by = waveY + (90 - waveH) / 2;

    const bGrad = ctx.createLinearGradient(0, by, 0, by + waveH);
    bGrad.addColorStop(0, '#ff9e78');
    bGrad.addColorStop(1, '#ff7f55');

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(bx, by, barWidth, waveH, 6);
    ctx.fill();
  }
  ctx.restore();

  // 6. Real-time Subtitle Banner
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.beginPath();
  ctx.roundRect(40, height - 90, width - 80, 56, 16);
  ctx.fill();

  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#fde047'; // Bright Yellow Subtitles
  ctx.textAlign = 'center';
  const subtitleSnippet = currentScene.text.slice(0, 48);
  ctx.fillText(`💬 "${subtitleSnippet}..."`, width / 2, height - 55);
  ctx.restore();
}

/**
 * Text wrapping helper for Canvas.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): void {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = `${line}${words[n]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = `${words[n]} `;
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        line += '...';
        ctx.fillText(line, x, currentY);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
