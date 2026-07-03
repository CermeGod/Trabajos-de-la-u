import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EdtDiagram from './projects/edt-diagram/EdtDiagram';
import EdrDiagram from './projects/edr-diagram/EdrDiagram';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edt" element={<EdtDiagram />} />
        <Route path="/edr" element={<EdrDiagram />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
