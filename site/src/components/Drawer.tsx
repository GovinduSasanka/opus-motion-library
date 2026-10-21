import React, {useEffect, useRef} from 'react';
import {hoverSlot} from './live';

/** side panel (full screen on phones) with focus handling, Esc to close and scroll lock */
export const Drawer: React.FC<{open: boolean; onClose: () => void; label: string; children: React.ReactNode; wide?: boolean}> = ({open, onClose, label, children, wide}) => {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    hoverSlot.lock(true);
    const prev = document.activeElement as HTMLElement | null;
    const y = window.scrollY;
    document.documentElement.classList.add('is-locked');
    panel.current?.focus({preventScroll: true});
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => {
      hoverSlot.lock(false);
      document.documentElement.classList.remove('is-locked');
      window.removeEventListener('keydown', key);
      window.scrollTo({top: y});
      prev?.focus?.({preventScroll: true});
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <div ref={panel} className={`drawer ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
};

export const CloseButton: React.FC<{onClick: () => void}> = ({onClick}) => (
  <button className="icon-btn" onClick={onClick} aria-label="Close">
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </button>
);

export const Segmented: React.FC<{options: {id: string; label: string; disabled?: boolean}[]; value: string; onChange: (v: string) => void; label: string}> = ({options, value, onChange, label}) => (
  <div className="seg" role="radiogroup" aria-label={label}>
    {options.map((o) => (
      <button key={o.id} role="radio" aria-checked={o.id === value} disabled={o.disabled} className={o.id === value ? 'is-on' : ''} onClick={() => onChange(o.id)}>
        {o.label}
      </button>
    ))}
  </div>
);
