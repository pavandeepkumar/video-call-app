import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home';
import Room from './pages/room/Room';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/room/:roomId' element={<Room />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
