import { useProjectStore } from '@/store/projectStore';
import Dashboard from '@/components/Dashboard';
import ProjectEditor from '@/components/ProjectEditor';

function App() {
  const { currentProjectId } = useProjectStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {currentProjectId ? <ProjectEditor /> : <Dashboard />}
    </div>
  );
}

export default App;
