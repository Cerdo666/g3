import QueryCard from './QueryCard';
import BubbleAnimation from './BubbleAnimation';
import { X } from 'lucide-react';

type SidebarProps = {
  onQuerySelect: (query: string) => void;
  onCollapse?: () => void;
  onOpenPrivacy?: () => void;      // ← Nuevo
  onOpenTerms?: () => void;        // ← Nuevo
};

export default function Sidebar({ 
  onQuerySelect, 
  onCollapse, 
  onOpenPrivacy, 
  onOpenTerms 
}: SidebarProps) {
  
  return (
    <aside className="relative w-80 h-full bg-white border-r border-gray-200 p-6 overflow-y-auto flex flex-col">
      <BubbleAnimation />

      {onCollapse && (
        <button
          className="relative z-10 self-end -mt-2 -mr-2 mb-2 p-1 text-[#662d3a] hover:bg-gray-100 rounded transition-colors"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="relative mb-8 z-10 flex-1">
        <h3 className="text-xs tracking-wide text-[#8b4f5a] mb-4">EXAMPLE QUERIES</h3>
        <div className="space-y-3">
          <QueryCard 
            description="List the biological functions and pathways associated with BRCA1" 
            onClick={onQuerySelect} 
          />
          <QueryCard 
            description="Extracts altered pathways in luminal breast cancer A" 
            onClick={onQuerySelect} 
          />
          <QueryCard 
            description="Identifies binding pockets in HER2 structures and suggests possible (repositioned) compounds with potential affinity" 
            onClick={onQuerySelect} 
          />
        </div>
      </div>

      {/* Footer con enlaces legales */}
      <div className="relative z-10 border-t border-gray-200 pt-4 mt-auto">
        <div className="flex flex-col items-center gap-1.5 text-xs text-[#6b7280]">
          <span>© 2026 OncoQuery. All rights reserved.</span>
          
          <div className="flex gap-2">
            <button 
              onClick={onOpenPrivacy}
              className="hover:text-[#662d3a] transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={onOpenTerms}
              className="hover:text-[#662d3a] transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}