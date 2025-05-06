import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Book3D from './Book3D';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';

const HeroSection = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.classList.add('fade-in');
    }
  }, []);

  return (
    <section className="min-h-[100vh] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564')] bg-cover bg-center opacity-10 bg-fixed" />
      
      {/* Floating orbs with glow effect */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}/>
      
      <div className="container mx-auto px-4 relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="w-full md:w-1/2 text-center md:text-left md:pl-16">
          <motion.h1 
            ref={titleRef} 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold mb-6 tracking-tight flex flex-wrap items-center justify-center md:justify-start gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span 
              className="text-[#8B5CF6] drop-shadow-sm"
              // whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              SemNotes
            </motion.span>
            <TypeAnimation
              sequence={[
                'Smart Study',
                1000,
                'Study Buddy',
                1000,
                'Share Notes',
                1000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              className="text-white inline-block"
            />
          </motion.h1>
          
          <p className="text-gray-300 mb-8 text-lg max-w-xl fade-in-delay-1">
            The smart way to organize, share, and collaborate on your academic journey. Join the future of student collaboration.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start fade-in-delay-2">
            <Link to="/auth">
              <motion.button 
                className="cta-button bg-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </Link>
            <motion.a 
              href="#features"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="px-6 py-3 border border-white/10 hover:border-white/30 text-white rounded-full transition-all backdrop-blur-sm">
                Learn More
              </button>
            </motion.a>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 flex justify-center">
          <motion.div 
            className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center perspective-1000"
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 1 }}
          >
            <Book3D />
          </motion.div>
        </div>
      </div>
      
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 fade-in-delay-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <a href="#features" className="flex flex-col items-center text-gray-400 hover:text-white transition-colors">
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="animate-bounce"
            initial={{ y: 0 }}
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </motion.svg>
        </a>
      </motion.div>
    </section>
  );
};

export default HeroSection;
