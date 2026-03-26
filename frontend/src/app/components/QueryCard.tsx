interface QueryCardProps {
  icon?: string;
  title?: string;
  description?: string;
}

export default function QueryCard({ icon, title, description }: QueryCardProps) {
  return (
    <button className="w-full text-left p-4 bg-[#f9f3f4] hover:bg-[#f3e9eb] transition-colors rounded-lg">
      <div className="flex items-start gap-3">
        {icon && <span className="text-[#662d3a] mt-0.5">{icon}</span>}
        <div>
          {title && <div className="text-[#662d3a] mb-1">{title}</div>}
          {description && <div className="text-sm text-[#5a2830]">{description}</div>}
        </div>
      </div>
    </button>
  );
}
