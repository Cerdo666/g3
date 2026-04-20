import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header reutilizado pero simplificado para modal */}
      <div className="bg-[#662d3a] text-white px-6 py-4 flex items-center justify-between border-b border-white/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold" style={{ fontFamily: 'Comfortaa' }}>OncoQuery</span>
          <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">BETA</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#662d3a] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">
          <p>
            OncoQuery complies with European Union data protection regulations. 
            It is a conversational AI agent focused on oncological and biomedical research.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">1. Information We Collect</h2>
          <p>
            OncoQuery is designed with a strong focus on privacy. 
            <strong>We do not collect personally identifiable data</strong> by default.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>The queries you enter are processed temporarily to generate responses.</li>
          </ul>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">2. Use of Information</h2>
          <p>
            Your queries are used exclusively to generate relevant responses in the context of biomedical research, 
            oncology, and related BIO fields.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">3. Data Sharing</h2>
          <p>
            We do not sell or share your queries with third parties. 
            When consulting external sources (PubMed, PDB, ClinicalTrials, etc.), only the necessary search terms are sent.
          </p>

        </div>
      </div>
    </div>
  );
}