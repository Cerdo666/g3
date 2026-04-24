import { X } from 'lucide-react';

interface TermsOfServiceProps {
  onClose: () => void;
}

export default function TermsOfService({ onClose }: TermsOfServiceProps) {
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
        <h1 className="text-3xl font-semibold text-[#662d3a] mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2026</p>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">
          <h2 className="text-2xl font-medium text-[#662d3a] mb-6">Agreement to Terms</h2>
          <p>
            These Terms of Service constitute a legally binding agreement between you (whether as an individual or on behalf of an entity) 
            and the developer of <strong>OncoQuery</strong> regarding your access to and use of this platform.
          </p>
          <p className="mt-4">
            By accessing or using OncoQuery, you acknowledge that you have read, understood, and agreed to these Terms. 
            <strong>If you do not agree, you must immediately cease using the service.</strong>
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Description of the Service</h2>
          <p>
            OncoQuery is a conversational artificial intelligence agent developed to assist our main stakeholders in biomedical and oncological research tasks. 
            Its purpose is to assist with biomedical research tasks, with a special focus on oncology due to the project context and relevance, 
            although it is not limited to this area. It is open to other types of cancer, diseases, and content ranging from basic to expert level in the BIO field.
          </p>
          <p className="mt-4 font-medium">
            <strong>Important:</strong> OncoQuery is an experimental research support tool. 
            It does not replace clinical judgment, medical diagnosis, or professional advice. 
            AI-generated responses may contain inaccuracies or hallucinations.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Permitted Use and Restrictions</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>It is permitted to use OncoQuery for educational, research, or legitimate professional purposes.</li>
            <li><strong>Prohibited:</strong> Using it for direct diagnosis or treatment of patients without the supervision of a qualified professional.</li>
            <li>Prohibited to upload sensitive patient personal data that would violate GDPR.</li>
            <li>Any extraction or commercial use of the system without express authorization is strictly prohibited.</li>
          </ul>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Limitation of Liability</h2>
          <p>
            The service is provided “as is”. The developer makes no warranties regarding the accuracy, completeness, or reliability of the responses. 
            In no event shall the developer be liable for any damages arising from the use of the platform.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Intellectual Property</h2>
          <p>
            All content and code of OncoQuery belong to the author, except for third-party licenses.
          </p>

        </div>
      </div>
    </div>
  );
}