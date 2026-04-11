import toast from 'react-hot-toast';

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  return audioCtx;
};

export const playSound = (type: 'success' | 'comment' | 'error') => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type === 'error' ? 'sawtooth' : 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'comment') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (error) {
    console.error('Audio playback failed', error);
  }
};

export const notifySuccess = (message: string) => {
  playSound('success');
  toast.custom(() => (
    <div className="react-hot-toast__toast bg-slate-900 border border-white/20 shadow-lg">
      <div className="font-bold tracking-wide text-xl py-[1.75rem] px-[1.6875rem] text-[var(--color-primary)]">
        {message}
      </div>
    </div>
  ), { position: 'top-right', duration: 3000 });
};

export const notifyError = (message: string) => {
  playSound('error');
  toast.error(message, {
    position: 'top-right',
    duration: 4000,
    style: { background: '#FF5151', color: '#fff', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }
  });
};