interface QueryCardProps {
  icon?: string;
  title?: string;
  description?: string;
  onClick?: (query: string) => void;
}

export default function QueryCard({ 
  icon, 
  title, 
  description, 
  onClick 
}: QueryCardProps) {
  return (
    <button
      onClick={() => description && onClick?.(description)}
      className="w-full text-left p-4 bg-[#f9f3f4] hover:bg-[#f3e9eb] 
                 transition-colors rounded-lg min-h-[100px] flex flex-col"
    >
      <div className="flex items-start gap-3 flex-1">
        {icon && (
          <span className="text-[#662d3a] mt-0.5 flex-shrink-0">
            {icon}
          </span>
        )}
        
        <div className="flex-1 min-w-0"> {/* ← clave para que el texto no desborde */}
          {title && (
            <div className="text-[#662d3a] font-medium mb-1 break-words">
              {title}
            </div>
          )}
          
          {description && (
            <div className="text-sm text-[#5a2830] break-words leading-relaxed">
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}