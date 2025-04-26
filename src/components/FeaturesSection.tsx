
import React, { useEffect, useRef } from 'react';
import { BookOpen, Search, Upload, Star, Award, Smartphone } from 'lucide-react';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
};

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
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
    <div ref={cardRef} className="feature-card opacity-0" style={{ transitionDelay: `${delay * 0.1}s` }}>
      <div className="text-primary mb-4 flex justify-center items-center h-12 w-12 rounded-full bg-primary/10 mx-auto">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white text-center">{title}</h3>
      <p className="text-gray-400 text-center">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
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

  const features = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Browse by Subject & Semester",
      description: "Easily navigate through notes organized by branch, semester, and subject for quick access.",
      delay: 1
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Search & Filter",
      description: "Find exactly what you need with powerful search and filter options for specific content.",
      delay: 2
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Upload & Contribute",
      description: "Share your knowledge by uploading and contributing your own notes to help others.",
      delay: 3
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Rate & Review",
      description: "Evaluate the quality of materials and read reviews to find the best resources.",
      delay: 4
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Earn Recognition",
      description: "Get recognized for your contributions and build your academic reputation.",
      delay: 1
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile Friendly",
      description: "Access your notes on any device with our responsive design optimized for mobile.",
      delay: 2
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div ref={sectionRef} className="text-center mb-16 opacity-0">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient inline-block">
            Powerful Features for Students
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to excel in your academic journey, organized in one place.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
