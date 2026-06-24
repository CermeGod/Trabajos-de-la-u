import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, GitBranch } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 mt-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-full mb-6 text-blue-400">
            <Briefcase size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text mb-4">
            Trabajos de la U
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Repositorio centralizado de proyectos universitarios. Cada proyecto se encuentra en su propia ruta, optimizado para su despliegue en GitHub Pages.
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Link to="/edt" className="group block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
            <div className="h-32 bg-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity" 
                   style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px'}}>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <GitBranch size={48} className="text-blue-500/50 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
            <div className="p-6 relative">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-between">
                EDT Interactiva
                <ArrowRight size={18} className="text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Herramienta interactiva para la creación y gestión visual de la Estructura de Desglose del Trabajo (WBS/EDT) para gerencia de proyectos.
              </p>
              <div className="mt-6 flex gap-2">
                <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">React</span>
                <span className="text-xs font-medium bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20">SVG Canvas</span>
              </div>
            </div>
          </Link>

          {/* Placeholders for future projects */}
          <div className="border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-900/50">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <span className="text-xl font-bold">+</span>
            </div>
            <h3 className="font-semibold text-slate-400 mb-1">Próximo Proyecto</h3>
            <p className="text-sm">Disponible en el futuro</p>
          </div>

        </main>
      </div>
    </div>
  );
}
