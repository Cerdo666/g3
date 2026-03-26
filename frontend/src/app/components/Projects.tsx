import { useState } from 'react';
import { FolderOpen, Plus, X, FileUp, Layers, Trash2 } from 'lucide-react';
import logoImage from '../../assets/LogoOncoQuery.png';

interface Project {
  id: number;
  name: string;
  files: string[];
  sessions: string[];
  createdAt: string;
}

interface ProjectsProps {
  onClose: () => void;
}

export default function Projects({ onClose }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: 'Breast Cancer Study', files: ['data.csv'], sessions: ['Session A'], createdAt: '2026-03-20' },
    { id: 2, name: 'Lung Tumor Research', files: [], sessions: [], createdAt: '2026-03-24' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [addedFiles, setAddedFiles] = useState<string[]>([]);
  const [addedSessions, setAddedSessions] = useState<string[]>([]);

  const handleAddFiles = () => {
    const name = `File ${addedFiles.length + 1}`;
    setAddedFiles(prev => [...prev, name]);
  };

  const handleAddSession = () => {
    const name = `Session ${addedSessions.length + 1}`;
    setAddedSessions(prev => [...prev, name]);
  };

  const handleCreate = () => {
    if (!projectName.trim()) return;
    const newProject: Project = {
      id: Date.now(),
      name: projectName.trim(),
      files: addedFiles,
      sessions: addedSessions,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects(prev => [...prev, newProject]);
    setProjectName('');
    setAddedFiles([]);
    setAddedSessions([]);
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleCancel = () => {
    setProjectName('');
    setAddedFiles([]);
    setAddedSessions([]);
    setShowModal(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="bg-[#662d3a] text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* OncoQuery branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-md flex items-center justify-center overflow-hidden">
              <img src={logoImage} alt="OncoQuery Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ fontFamily: 'Comfortaa' }}>OncoQuery</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">BETA</span>
            </div>
          </div>
          {/* Divider + page label */}
          <div className="w-px h-6 bg-white/30 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <FolderOpen className="w-4 h-4 opacity-80" />
            <span className="text-sm font-medium opacity-90">Projects</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#662d3a]">List of Projects</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#662d3a] text-white rounded hover:bg-[#7a3544] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Project list */}
        {projects.length === 0 ? (
          <p className="text-gray-400 text-sm mt-10 text-center">No projects yet. Create one to get started.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project, index) => (
              <li
                key={project.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg px-5 py-4 hover:border-[#662d3a]/40 hover:bg-[#662d3a]/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[#662d3a]/10 rounded-md flex items-center justify-center text-[#662d3a] font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{project.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {project.files.length} file{project.files.length !== 1 ? 's' : ''} &bull;{' '}
                      {project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''} &bull; Created {project.createdAt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  aria-label="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="bg-[#662d3a] text-white px-6 py-4 flex items-center justify-between">
              <span className="font-semibold">Create Project</span>
              <button onClick={handleCancel} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6 space-y-5">
              {/* Project name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Breast Cancer Biomarkers"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#662d3a] focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Add Files */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Files</span>
                  <button
                    onClick={handleAddFiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#662d3a] text-[#662d3a] rounded hover:bg-[#662d3a]/5 transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Add Files
                  </button>
                </div>
                {addedFiles.length > 0 ? (
                  <ul className="space-y-1">
                    {addedFiles.map((f, i) => (
                      <li key={i} className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5 flex items-center gap-2">
                        <FileUp className="w-3 h-3 text-gray-400" /> {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No files added yet.</p>
                )}
              </div>

              {/* Add Sessions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Sessions</span>
                  <button
                    onClick={handleAddSession}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#662d3a] text-[#662d3a] rounded hover:bg-[#662d3a]/5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Add Sessions
                  </button>
                </div>
                {addedSessions.length > 0 ? (
                  <ul className="space-y-1">
                    {addedSessions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5 flex items-center gap-2">
                        <Layers className="w-3 h-3 text-gray-400" /> {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No sessions added yet.</p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!projectName.trim()}
                className="px-4 py-2 text-sm bg-[#662d3a] text-white rounded hover:bg-[#7a3544] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
