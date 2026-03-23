import QueryCard from './QueryCard';
import BubbleAnimation from './BubbleAnimation';

export default function Sidebar() {
  return (
    <aside className="relative w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <BubbleAnimation />

      {/* Example Queries Section */}
      <div className="relative mb-8 z-10">
        <h3 className="text-xs tracking-wide text-[#8b4f5a] mb-4">EXAMPLE QUERIES</h3>
        <div className="space-y-3">
          <QueryCard description="Prompt 1" />
          <QueryCard description="Prompt 2" />
          <QueryCard description="Prompt 3" />
        </div>
      </div>

      {/* Example Prompt AND Result Section */}
      <div className="relative mb-8 z-10">
        <h3 className="text-xs tracking-wide text-[#8b4f5a] mb-4">EXAMPLE RESULT - BREAST CANCER</h3>
        <div className="text-xs tracking-wide text-[#8b4f5a] mb-4">Prompt 1</div> 
        <div className="border-l-4 border-[#8b4f5a] pl-4 py-2 bg-[#f9f3f4]">
          <div className="text-[#662d3a] italic text-sm"> Here you can download articles from 2026</div>
          <button>DOWNLOAD</button>
           {/* Key Proteins Section */}
          <div>
            <h3 className="text-xs tracking-wide text-[#8b4f5a] mb-4">KEY PROTEINS</h3>
            <button>DOWNLOAD FASTA</button>
          </div>
        </div>
      </div>
     
    </aside>
  );
}
