import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import Tester from './pages/tester.tsx';
import ShowDetail from './components/ShowDetail.tsx'; 
import './index.css';
import { SearchProvider } from './context/AppContext.tsx';
import { AuthProvider } from './context/UserContext.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    <SearchProvider>
      <AuthProvider>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/tester" element={<Tester />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/property/:id" element={<ShowDetail />} />
          </Routes>
        </AuthProvider>
      </SearchProvider>
    </BrowserRouter>
  </React.StrictMode>
);