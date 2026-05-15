import React from 'react';
import Header from '../components/layout/Header';
import Hero from './home/Hero';
import Mission from './home/Mission';
import Features from './home/Features';
import Partners from './home/Partners';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  return (
    <div className="bg-gray-50">
      <Header />
      <main>
        <Hero />
        <Mission />
        <Features />
        <Partners />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;