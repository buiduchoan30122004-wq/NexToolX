import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { API_URL } from './config';

// Import pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import Categories from './pages/Categories';
import Collections from './pages/Collections';
import Deals from './pages/Deals';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import ToolDetail from './pages/ToolDetail';
import Search from './pages/Search';
import SubmitTool from './pages/SubmitTool';
import { About, Contact, Privacy, Terms } from './pages/InfoPages';
import NotFound from './pages/NotFound';

// Import Header and Footer
import Header from './components/Header';
import Footer from './components/Footer';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [headerMenu, setHeaderMenu] = useState([]);
  const [footerMenu, setFooterMenu] = useState([]);

  // Fetch dynamic navigation menus from backend
  useEffect(() => {
    async function fetchMenus() {
      try {
        const headerRes = await fetch(`${API_URL}/menus/header`);
        if (headerRes.ok) {
          const data = await headerRes.json();
          setHeaderMenu(data.sort((a, b) => a.order - b.order));
        }
        
        const footerRes = await fetch(`${API_URL}/menus/footer`);
        if (footerRes.ok) {
          const data = await footerRes.json();
          setFooterMenu(data.sort((a, b) => a.order - b.order));
        }
      } catch (err) {
        console.error('Error fetching dynamic menus:', err);
        // Fallbacks in case backend isn't running yet
        setHeaderMenu([
          { id: 1, label: 'Home', path: '/', order: 1 },
          { id: 2, label: 'Browse', path: '/browse', order: 2 },
          { id: 3, label: 'Categories', path: '/categories', order: 3 },
          { id: 4, label: 'Collections', path: '/collections', order: 4 },
          { id: 5, label: 'Deals', path: '/deals', order: 5 },
          { id: 6, label: 'Blog', path: '/blog', order: 6 },
          { id: 7, label: 'Submit Tool', path: '/submit-tool', order: 7 }
        ]);
        setFooterMenu([
          { id: 1, label: 'About Us', path: '/about', order: 1 },
          { id: 2, label: 'Contact', path: '/contact', order: 2 },
          { id: 3, label: 'Privacy Policy', path: '/privacy', order: 3 },
          { id: 4, label: 'Terms of Service', path: '/terms', order: 4 }
        ]);
      }
    }
    fetchMenus();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Header menuItems={headerMenu} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/tool/:slug" element={<ToolDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/submit-tool" element={<SubmitTool />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer menuItems={footerMenu} />
      </div>
    </Router>
  );
}

export default App;
