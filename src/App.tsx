import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Main } from './pages/Main';

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/main" element={<Main />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;