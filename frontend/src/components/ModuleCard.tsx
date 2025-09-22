type Props = {
  icon?: string;     // puedes cambiar por un SVG
  title: string;
  description?: string;
  onClick?: () => void;
};

export default function ModuleCard({ icon = "📦", title, description, onClick }: Props) {
  return (
    <button className="vcm-card-module" onClick={onClick}>
      <div className="vcm-card-module-icon">{icon}</div>
      <div className="vcm-card-module-title">{title}</div>
      {description && <div className="vcm-card-module-desc">{description}</div>}
    </button>
  );
}
