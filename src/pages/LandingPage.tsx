import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-6 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">ACSE</h1>
        <div>
          {user ? (
            <Link to="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">Dashboard</Link>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">Login</Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
          Autonomous Contract <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Scope Evaluator</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-12">
          AI-powered continuous scope monitoring for contract-driven projects.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full text-left">
          {[
            { title: "Contract Scope Understanding", desc: "Extract precise baseline items from Engagement Letters." },
            { title: "Continuous Monitoring", desc: "Track Status Reports and MoMs continuously." },
            { title: "Hybrid RAG Evidence Retrieval", desc: "Reciprocal Rank Fusion with Dense and Sparse search." },
            { title: "Scope Creep Detection", desc: "Identify out of scope work automatically." },
            { title: "Evidence-Backed Decisions", desc: "Reflexion-verified reasoning linked to documents." },
            { title: "Automated Email Alerts", desc: "Role-based SMTP alerts for risks." },
          ].map((feature, idx) => (
            <div key={idx} className="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <h3 className="text-lg font-bold mb-2 text-blue-300">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-6 text-center text-gray-600 border-t border-gray-800">
        &copy; {new Date().getFullYear()} ACSE Proof of Concept
      </footer>
    </div>
  );
};
