
import React, { useEffect, useRef } from 'react';

const StepCard = ({ number, title, description, delay }: { number: number; title: string; description: string; delay: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className="relative opacity-0" style={{ transitionDelay: `${delay * 0.1}s` }}>
      <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
        {number}
      </div>
      <div className="feature-card ml-4 mt-4 pl-8">
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const steps = [
    {
      title: "Sign Up for Free",
      description: "Create your account with your email or social media credentials.",
      delay: 1
    },
    {
      title: "Browse or Search Notes",
      description: "Find notes by semester, branch, subject, or using the search feature.",
      delay: 2
    },
    {
      title: "Download or Read Online",
      description: "Access notes directly in your browser or download for offline use.",
      delay: 3
    },
    {
      title: "Rate and Review",
      description: "Help other students by rating and reviewing the materials you use.",
      delay: 4
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div ref={sectionRef} className="text-center mb-16 opacity-0">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient inline-block">
            How SemNotes Works
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Getting started is easy. Follow these simple steps to access and contribute to our knowledge base.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={index + 1}
              title={step.title}
              description={step.description}
              delay={step.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
