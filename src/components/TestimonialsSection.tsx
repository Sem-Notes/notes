
import React from 'react';

type TestimonialCardProps = {
  content: string;
  name: string;
  role: string;
  image: string;
  delay: number;
};

const TestimonialCard = ({ content, name, role, image, delay }: TestimonialCardProps) => {
  return (
    <div className={`fade-in-delay-${delay} glass-effect p-6 rounded-xl`}>
      <div className="flex gap-4 items-center mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-white font-medium">{name}</h4>
          <p className="text-gray-400 text-sm">{role}</p>
        </div>
      </div>
      <p className="text-gray-300">{content}</p>
      <div className="mt-4 flex text-primary text-xl">
        {'★'.repeat(5)}
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const testimonials = [
    {
      content: "SemNotes completely changed how I study. Being able to access quality notes from top performers in my class has saved me countless hours of work.",
      name: "Alex Johnson",
      role: "Computer Science, Year 3",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&h=250&fit=crop",
      delay: 1
    },
    {
      content: "As a contributor, I love how SemNotes has given me recognition for my notes. Plus, helping others understand difficult concepts feels incredibly rewarding.",
      name: "Sophia Chen",
      role: "Electrical Engineering, Year 4",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&h=250&fit=crop",
      delay: 2
    },
    {
      content: "The rating system ensures I'm always studying from the best materials. SemNotes has become an essential part of my academic success strategy.",
      name: "Michael Rodriguez",
      role: "Biology, Year 2",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=250&fit=crop",
      delay: 3
    }
  ];

  return (
    <section id="testimonials" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient inline-block">
            What Students Say
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied students who have improved their grades with SemNotes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              content={testimonial.content}
              name={testimonial.name}
              role={testimonial.role}
              image={testimonial.image}
              delay={testimonial.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
