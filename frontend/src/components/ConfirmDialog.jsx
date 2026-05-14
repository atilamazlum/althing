import { useEffect } from 'react';

export default function ConfirmDialog({ title, body, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm letter-modal-backdrop">
      <div className="relative w-full max-w-md paper p-8 letter-modal-paper">
        <h2 className="text-2xl mb-3">{title}</h2>
        <p className="text-ink-soft leading-relaxed mb-6">{body}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-brutal btn-brutal-secondary" onClick={onCancel}>
            {cancelLabel || 'Geri'}
          </button>
          <button className="btn-brutal" onClick={onConfirm}>
            {confirmLabel || 'Evet, sun'}
          </button>
        </div>
      </div>
    </div>
  );
}
