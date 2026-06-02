/**
 * SpinToWinPopup — storefront popup with spinning wheel.
 * - If user is NOT logged in → shows login/register prompt
 * - If user IS logged in → auto-uses their email/phone, no form needed
 * Reward is decided by the backend.
 */
import { ModuleGate } from '@components/common/modules/ModuleGate.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ── Wheel canvas renderer ── */
function drawWheel(
  canvas: HTMLCanvasElement,
  segments: string[],
  colors: string[],
  rotation: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(cx, cy) - 8;
  const arc = (2 * Math.PI) / segments.length;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  for (let i = 0; i < segments.length; i++) {
    const angle = i * arc;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, angle, angle + arc);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    const label = segments[i].length > 16 ? segments[i].slice(0, 15) + '…' : segments[i];
    ctx.fillText(label, r - 14, 4);
    ctx.restore();
  }

  ctx.restore();

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pointer triangle (top)
  ctx.beginPath();
  ctx.moveTo(cx - 10, 6);
  ctx.lineTo(cx + 10, 6);
  ctx.lineTo(cx, 24);
  ctx.closePath();
  ctx.fillStyle = '#e11d48';
  ctx.fill();
}

/* ── Popup inner ── */
function SpinPopupInner({
  config,
  customer,
  loginUrl,
  registerUrl
}: {
  config: any;
  customer: { email: string; fullName: string } | null;
  loginUrl: string;
  registerUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'result'>('ready');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animRef = useRef<number>(0);
  const alreadyShown = useRef(false);

  const isLoggedIn = !!customer;
  const segments = config?.rewards?.map((r: any) => r.label) || [];
  const colors = config?.settings?.wheelColors || ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  // Check if popup should show based on cooldown cookie
  useEffect(() => {
    if (alreadyShown.current) return;
    const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('stw_shown='));
    if (cookie) return;

    const settings = config?.settings;
    if (!settings?.enabled) return;

    // Check page type
    const path = window.location.pathname;
    const showOn = settings.showOnPages || [];
    let pageMatch = false;
    if (showOn.includes('homepage') && (path === '/' || path === '')) pageMatch = true;
    if (showOn.includes('productView') && path.includes('/product')) pageMatch = true;
    if (showOn.includes('categoryView') && path.includes('/category')) pageMatch = true;
    if (showOn.includes('cart') && path.includes('/cart')) pageMatch = true;
    if (showOn.includes('checkout') && path.includes('/checkout')) pageMatch = true;
    if (!pageMatch) return;

    const trigger = settings.triggerType || 'delay';
    if (trigger === 'manual') return;

    if (trigger === 'delay') {
      const delay = (settings.triggerDelay || 5) * 1000;
      const timer = setTimeout(() => {
        alreadyShown.current = true;
        setOpen(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (trigger === 'exit_intent') {
      const handler = (e: MouseEvent) => {
        if (e.clientY < 10 && !alreadyShown.current) {
          alreadyShown.current = true;
          setOpen(true);
        }
      };
      document.addEventListener('mouseout', handler);
      return () => document.removeEventListener('mouseout', handler);
    }

    if (trigger === 'scroll') {
      const handler = () => {
        const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPct > 50 && !alreadyShown.current) {
          alreadyShown.current = true;
          setOpen(true);
        }
      };
      window.addEventListener('scroll', handler);
      return () => window.removeEventListener('scroll', handler);
    }
  }, [config]);

  // Draw wheel
  useEffect(() => {
    if (!canvasRef.current || segments.length === 0) return;
    drawWheel(canvasRef.current, segments, colors, rotationRef.current);
  }, [open, segments.length]);

  const doSpin = useCallback(async () => {
    if (!isLoggedIn) return;
    setError('');
    setPhase('spinning');

    // Phase 1: Start a fast "blur" spin while we wait for the API
    const startRot = rotationRef.current;
    let blurRunning = true;
    let blurAngle = startRot;
    const blurSpeed = 0.15; // radians per frame (~9°/frame)

    const blurSpin = () => {
      if (!blurRunning) return;
      blurAngle += blurSpeed;
      rotationRef.current = blurAngle;
      if (canvasRef.current) {
        drawWheel(canvasRef.current, segments, colors, blurAngle);
      }
      animRef.current = requestAnimationFrame(blurSpin);
    };
    animRef.current = requestAnimationFrame(blurSpin);

    // Call backend while wheel is spinning fast
    try {
      const res = await fetch('/api/spin-wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: customer!.email,
          phone: ''
        })
      });
      const json = await res.json();

      // Phase 2: We have the result — stop blur and do final targeted spin
      blurRunning = false;
      cancelAnimationFrame(animRef.current);

      if (json.data) {
        // Find which segment index matches the result label
        const winLabel = json.data.reward?.label || '';
        let targetIdx = segments.findIndex((s: string) => s === winLabel);
        if (targetIdx === -1) targetIdx = 0;

        // Calculate target angle so the pointer (top center) lands on that segment
        // The pointer is at the top (12 o'clock = angle 0 in canvas)
        // Segment i spans from i*arc to (i+1)*arc
        // We want the middle of segment targetIdx to be at the top
        // Since the wheel rotates clockwise, we need:
        //   finalRotation mod 2π = -(targetIdx * arc + arc/2)
        // Which means the segment center aligns with 0 (top)
        const arc = (2 * Math.PI) / segments.length;
        const segmentCenter = targetIdx * arc + arc / 2;
        // Target: rotation that puts segmentCenter at the top (angle 0)
        // The wheel is drawn with rotation applied, pointer at top reads angle 0
        // So we need: rotation + segmentCenter ≡ 2π*n (pointing up)
        // => rotation = 2π*n - segmentCenter
        // Add enough full turns for a nice spin effect
        const currentAngle = blurAngle % (2 * Math.PI);
        const targetAngle = -segmentCenter;
        // Normalize: add full rotations so we always spin forward at least 5 turns
        const extraTurns = Math.PI * 10; // 5 full rotations
        let finalAngle = blurAngle + extraTurns;
        // Adjust so it lands on the right segment
        const remainder = finalAngle % (2 * Math.PI);
        finalAngle += (targetAngle - remainder);
        // Make sure we go forward
        if (finalAngle < blurAngle + Math.PI * 6) {
          finalAngle += 2 * Math.PI;
        }
        // Add small random offset within segment (so it doesn't always hit dead center)
        const jitter = (Math.random() - 0.5) * arc * 0.6;
        finalAngle += jitter;

        // Animate the deceleration spin to target
        const decelStart = Date.now();
        const decelDuration = 3500;
        const decelStartAngle = blurAngle;
        const totalSpin = finalAngle - decelStartAngle;

        const decelerate = () => {
          const elapsed = Date.now() - decelStart;
          const progress = Math.min(elapsed / decelDuration, 1);
          // Ease out quart for satisfying deceleration
          const ease = 1 - Math.pow(1 - progress, 4);
          rotationRef.current = decelStartAngle + totalSpin * ease;
          if (canvasRef.current) {
            drawWheel(canvasRef.current, segments, colors, rotationRef.current);
          }
          if (progress < 1) {
            animRef.current = requestAnimationFrame(decelerate);
          }
        };
        animRef.current = requestAnimationFrame(decelerate);

        // Wait for deceleration animation to finish
        await new Promise((resolve) => setTimeout(resolve, decelDuration + 300));

        setResult(json.data);
        setPhase('result');
        document.cookie = 'stw_shown=1; path=/; max-age=86400';
      } else {
        setError(json.error?.message || 'Erreur lors du tour.');
        setPhase('ready');
      }
    } catch (e: any) {
      blurRunning = false;
      cancelAnimationFrame(animRef.current);
      setError(e.message || 'Erreur réseau.');
      setPhase('ready');
    }
  }, [customer, segments, colors]);

  const handleCopy = () => {
    if (result?.couponCode) {
      navigator.clipboard.writeText(result.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open || !config?.settings?.enabled) return null;
  if (!segments.length) return null;

  const settings = config.settings;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: settings.bgColor || '#fff' }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-gray-600"
        >
          ✕
        </button>

        <div className="p-6 text-center">
          {/* Title */}
          <h2 className="text-xl font-bold mb-1" style={{ color: settings.textColor }}>
            {_(settings.popupTitle || 'Tentez votre chance')}
          </h2>
          <p className="text-sm mb-4" style={{ color: settings.textColor, opacity: 0.7 }}>
            {_(settings.popupSubtitle || 'Tournez la roue et gagnez une remise')}
          </p>

          {/* Wheel */}
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="max-w-full"
            />
          </div>

          {/* ── Not logged in: show login/register prompt ── */}
          {phase === 'ready' && !isLoggedIn && (
            <div className="space-y-3">
              <div
                className="p-4 rounded-lg border-2 border-dashed"
                style={{ borderColor: settings.mainColor || '#e11d48' }}
              >
                <div className="text-base font-semibold mb-2" style={{ color: settings.textColor }}>
                  {_('Connectez-vous pour tourner la roue !')}
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {_('Créez un compte ou connectez-vous pour tenter votre chance et gagner des réductions.')}
                </p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={loginUrl}
                    className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors"
                    style={{ backgroundColor: settings.buttonColor || '#e11d48' }}
                  >
                    {_('Se connecter')}
                  </a>
                  <a
                    href={registerUrl}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm border-2 transition-colors"
                    style={{
                      borderColor: settings.buttonColor || '#e11d48',
                      color: settings.buttonColor || '#e11d48'
                    }}
                  >
                    {_('Créer un compte')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── Logged in: show spin button (no email/phone form) ── */}
          {phase === 'ready' && isLoggedIn && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500">
                {_('Bienvenue')} <strong>{customer!.fullName}</strong> 👋
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={doSpin}
                className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors hover:opacity-90"
                style={{ backgroundColor: settings.buttonColor || '#e11d48' }}
              >
                🎰 {_(settings.buttonText || 'Tourner la roue')}
              </button>
              {settings.termsText && (
                <p className="text-[10px] text-gray-400 mt-2">{settings.termsText}</p>
              )}
            </div>
          )}

          {/* Spinning phase */}
          {phase === 'spinning' && (
            <div className="py-4">
              <div className="animate-pulse text-sm font-medium" style={{ color: settings.textColor }}>
                {_('La roue tourne')}... 🎰
              </div>
            </div>
          )}

          {/* Result phase */}
          {phase === 'result' && result && (
            <div className="space-y-3">
              <div className="text-lg font-bold" style={{ color: result.won ? '#10b981' : settings.textColor }}>
                {result.won ? '🎉 ' : ''}{result.message}
              </div>
              {result.won && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    {result.reward?.label}
                  </div>
                  {result.couponCode && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{_('Votre code promo')} :</span>
                      <code className="px-3 py-1 bg-white rounded border border-green-300 font-mono text-sm font-bold text-green-700">
                        {result.couponCode}
                      </code>
                      <button
                        onClick={handleCopy}
                        className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        {copied ? '✓' : _('Copier le code')}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!result.won && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {_('Pas de chance cette fois-ci. Réessayez plus tard !')}
                  </p>
                </div>
              )}
              <button
                onClick={() => setOpen(false)}
                className="mt-2 px-6 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
              >
                {_('Fermer')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Wrapped with ModuleGate ── */
export default function SpinToWinPopup({
  spinToWinFrontConfig,
  spinToWinRewardLabels,
  customer,
  loginUrl,
  registerUrl
}: {
  spinToWinFrontConfig: any;
  spinToWinRewardLabels: { rewards: Array<{ label: string }> } | null;
  customer: { email: string; fullName: string } | null;
  loginUrl: string;
  registerUrl: string;
}) {
  return (
    <ModuleGate module="spinToWin">
      <SpinPopupInner
        config={{
          settings: spinToWinFrontConfig,
          rewards: (spinToWinRewardLabels?.rewards || []).map((r) => ({ label: r.label }))
        }}
        customer={customer}
        loginUrl={loginUrl}
        registerUrl={registerUrl}
      />
    </ModuleGate>
  );
}

export const layout = {
  areaId: 'body',
  sortOrder: 999
};

export const query = `
  query Query {
    spinToWinRewardLabels: spinToWinConfig {
      rewards {
        label
      }
    }
    spinToWinFrontConfig {
      enabled
      popupTitle
      popupSubtitle
      buttonText
      successMessage
      failureMessage
      triggerType
      triggerDelay
      showOnPages
      inputRequired
      allowGuest
      requireLogin
      wheelColors
      mainColor
      bgColor
      textColor
      buttonColor
      soundEnabled
      confettiEnabled
      termsText
    }
    customer: currentCustomer {
      email
      fullName
    }
    loginUrl: url(routeId: "login")
    registerUrl: url(routeId: "register")
  }
`;
