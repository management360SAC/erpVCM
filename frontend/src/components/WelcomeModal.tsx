


type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  body?: string;
  imageSrc?: string; // opcional, por si usas imagen
};

export default function WelcomeModal({
  open,
  onClose,
  title,
  subtitle,
  body,
  imageSrc = "/welcome-star.png",
}: Props) {
  if (!open) return null;

  return (
    <div className="wm-overlay" role="dialog" aria-modal="true">
      <div className="wm-modal wm-anim-pop">
        <button className="wm-close" onClick={onClose} aria-label="Cerrar">×</button>

        <div className="wm-hero">
          <span className="wm-star wm-anim-left">⭐</span>
        </div>

        {/* TEXTOS: suben desde abajo, con ‘stagger’ mediante delay */}
        <h3 className="wm-title wm-anim-up delay-1">{title}</h3>
        {subtitle && <p className="wm-sub wm-anim-up delay-2">{subtitle}</p>}
        {body && <p className="wm-body wm-anim-up delay-3">{body}</p>}
      </div>
    </div>
  );
}

