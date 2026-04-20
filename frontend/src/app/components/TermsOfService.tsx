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
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#662d3a] mb-2">Términos de Uso</h1>
        <p className="text-sm text-gray-500 mb-10">Última actualización: Abril 2026</p>

        <div className="prose prose-gray max-w-none text-[15px] leading-relaxed">
          <h2 className="text-2xl font-medium text-[#662d3a] mb-6">Acuerdo con los Términos</h2>
          <p>
            Estos Términos de Uso constituyen un acuerdo legalmente vinculante entre tú (ya sea como persona física o en representación de una entidad) 
            y el desarrollador de <strong>OncoQuery</strong> respecto al acceso y uso de esta plataforma.
          </p>
          <p className="mt-4">
            Al acceder o utilizar OncoQuery, reconoces haber leído, comprendido y aceptado estos Términos. 
            <strong>Si no estás de acuerdo, debes dejar de usar el servicio inmediatamente.</strong>
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Descripción del Servicio</h2>
          <p>
            OncoQuery es un agente conversacional basado en inteligencia artificial desarrollado como Trabajo de Fin de Carrera. 
            Su objetivo es asistir en tareas de investigación biomédica, con especial enfoque en oncología (cáncer de mama como referencia principal en Catalunya), 
            aunque está abierto a otros tipos de cáncer, enfermedades y niveles desde básico hasta experto en el ámbito BIO.
          </p>
          <p className="mt-4 font-medium">
            <strong>Importante:</strong> OncoQuery es una herramienta experimental de apoyo a la investigación. 
            No sustituye el juicio clínico, diagnóstico médico ni consejo profesional. Las respuestas generadas por IA pueden contener inexactitudes.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Uso Permitido y Restricciones</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>Está permitido usar OncoQuery con fines educativos, de investigación o profesionales legítimos.</li>
            <li><strong>Prohibido</strong> utilizarlo para diagnóstico o tratamiento directo de pacientes sin supervisión de un profesional cualificado.</li>
            <li>Prohibido subir datos personales sensibles de pacientes que violen el RGPD.</li>
            <li>Queda prohibida cualquier extracción o uso comercial del sistema sin autorización expresa.</li>
          </ul>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Limitación de Responsabilidad</h2>
          <p>
            El servicio se proporciona “tal cual”. El desarrollador no ofrece ninguna garantía sobre la exactitud, completitud o fiabilidad de las respuestas. 
            En ningún caso será responsable de daños derivados del uso de la plataforma.
          </p>

          <h2 className="text-2xl font-medium text-[#662d3a] mt-12 mb-6">Propiedad Intelectual</h2>
          <p>
            Todo el contenido y código de OncoQuery pertenece al autor del TFC, salvo las licencias de terceros (Ollama, iconos, etc.).
          </p>

          <p className="mt-12 text-sm text-gray-500">
            Estos Términos se rigen por la legislación española. Cualquier duda puedes contactar al autor del proyecto.
          </p>
        </div>
      </div>
    </div>
  );
}