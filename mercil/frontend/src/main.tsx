import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import ShowDetail from './components/ShowDetail.tsx'; 
import './index.css';
import { SearchProvider } from './context/AppContext.tsx';
import { AuthProvider } from './context/UserContext.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Favorite from './pages/Favorite.tsx';
import Aboutpage from './pages/Aboutpage.tsx';
import ContactPage from './pages/ContactPage.tsx';
import Qpage from './pages/Questionspage.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
    <SearchProvider>
      <AuthProvider>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/favorite" element={<Favorite />} />
            <Route path="/about" element={<Aboutpage />} />
            <Route path="/contact" element={<ContactPage/>} />
            <Route path="/question" element={<Qpage />} />
            <Route path="/property/:id" element={<ShowDetail />} />
            <Route path="/property/:id" element={<ShowDetail />} />
          </Routes>
        </AuthProvider>
      </SearchProvider>
    </BrowserRouter>
  </React.StrictMode>
);