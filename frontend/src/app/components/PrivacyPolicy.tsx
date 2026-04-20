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
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#662d3a] mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: Abril 2026</p>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">
          <p>
            OncoQuery es un proyecto de Trabajo de Fin de Carrera desarrollado en Hospitalet de Llobregat (Catalunya). 
            Se trata de un agente conversacional de IA enfocado en investigación biomédica y oncología.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">1. Información que recopilamos</h2>
          <p>
            OncoQuery está diseñado con un fuerte enfoque en la privacidad. 
            <strong>No recopilamos datos personales identificables</strong> de forma predeterminada.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Las consultas que introduces se procesan de forma temporal para generar respuestas.</li>
            <li>Si utilizas Ollama de forma local, tus consultas nunca abandonan tu entorno.</li>
            <li>No usamos cookies de seguimiento ni herramientas de analytics que identifiquen usuarios.</li>
            <li>No almacenamos historial de conversaciones de forma persistente (salvo que guardes sesiones manualmente).</li>
          </ul>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">2. Uso de la información</h2>
          <p>
            Tus consultas se utilizan exclusivamente para generar respuestas relevantes en el contexto de investigación biomédica, 
            oncología y áreas BIO relacionadas.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">3. Compartición de datos</h2>
          <p>
            No vendemos ni compartimos tus consultas con terceros. 
            Cuando se consultan fuentes externas (PubMed, PDB, ClinicalTrials, etc.), solo se envían los términos de búsqueda necesarios.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-4">4. Seguridad y RGPD</h2>
          <p>
            Cumplimos con el Reglamento General de Protección de Datos (RGPD). 
            Las consultas se procesan de forma segura y, en modo local con Ollama, los datos no salen de tu máquina.
          </p>

          <p className="mt-10 text-sm text-gray-500">
            Si tienes cualquier duda sobre esta política, contacta con el autor del TFC.
          </p>
        </div>
      </div>
    </div>
  );
}