import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EdtDiagram from './projects/edt-diagram/EdtDiagram';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edt" element={<EdtDiagram />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
