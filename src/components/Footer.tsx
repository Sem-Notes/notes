import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer id="contact" className="py-12 border-t border-white/10 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              
              <span className="font-bold text-xl text-white">SemNotes</span>
            </Link>
            
            <p className="text-gray-400 mb-4">
              Your one-stop platform for semester-wise lecture notes, study materials, and academic resources.
            </p>
            
            <div className="flex gap-4">
              <SocialLink icon="twitter" href="https://x.com/AkshayChadala" target="_blank" rel="noopener noreferrer" />
              <SocialLink icon="instagram" href="https://www.instagram.com/akshaypatel__02" target="_blank" rel="noopener noreferrer" />
              <SocialLink icon="linkedin" href="https://www.linkedin.com/in/akshay-chadala-844587290" target="_blank" rel="noopener noreferrer" />
              <SocialLink icon="github" href="https://github.com/AkshayPatel-02" target="_blank" rel="noopener noreferrer" />
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink label="Home" href="#" />
              <FooterLink label="Features" href="#features" />
              <FooterLink label="How It Works" href="#how-it-works" />
              <FooterLink label="Contact" href="#contact" />
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <FooterLink label="Browse Notes" href="#" />
              <FooterLink label="Upload Notes" href="#" />
              <FooterLink label="Terms of Service" href="#" />
              <FooterLink label="Privacy Policy" href="#" />
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 text-primary">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=akshaypatelchadal@gmail.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">akshaypatelchadal@gmail.com</a>
              </li>
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 text-primary">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=contactsemnotes@gmail.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">contactsemnotes@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} SemNotes. All rights reserved.
          </p>
          
          <p className="text-[#9978e8] text-base flex items-center">
            Built with 
            <span className="text-red-500 mx-1">❤️</span>
            <span className="text-[#9978e8] text-base">
              <a href="https://wa.me/917989884992?text=Hello%2C%20I%20found%20you%20via%20your%20SemNotes" target="_blank" rel="noopener noreferrer">
                 Students &nbsp;
              </a>
            </span>
            {/* <span className="text-[#9978e8] text-base">
              <a href="https://wa.me/9866856291?text=Hello%2C%20I%20found%20you%20via%20your%20SemNotes" target="_blank" rel="noopener noreferrer">
                    | &nbsp; AmarNath
              </a>
            </span> */}
          </p>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ icon, href, ...props }: { icon: string; href: string; [key: string]: any }) => {
  return (
    <a 
      href={href} 
      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-purple-600/20 text-gray-400 hover:text-purple-500 transition-colors"
      {...props}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon === 'twitter' && <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />}
        {icon === 'facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
        {icon === 'instagram' && <rect x="2" y="2" width="20" height="20" rx="5" />}
        {icon === 'instagram' && <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />}
        {icon === 'instagram' && <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />}
        {icon === 'linkedin' && <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />}
        {icon === 'linkedin' && <rect x="2" y="9" width="4" height="12" />}
        {icon === 'linkedin' && <circle cx="4" cy="4" r="2" />}
        {icon === 'github' && <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />}
      </svg>
    </a>
  );
};

const FooterLink = ({ label, href }: { label: string; href: string }) => {
  return (
    <li>
      <a 
        href={href} 
        className="text-gray-400 hover:text-purple-500 transition-colors"
      >
        {label}
      </a>
    </li>
  );
};

export default Footer;
