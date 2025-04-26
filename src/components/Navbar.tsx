
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Upload as UploadIcon, User, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isLandingPage = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || !isLandingPage ? 'py-2 glass-effect' : 'py-4 bg-transparent'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-xl text-white">SemNotes</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          {!isLandingPage && (
            <>
              <NavLink to="/home" label="Home" icon={<Home className="h-4 w-4" />} />
              <NavLink to="/explore" label="Explore" icon={<BookOpen className="h-4 w-4" />} />
              <NavLink to="/upload" label="Upload" icon={<UploadIcon className="h-4 w-4" />} />
              <NavLink to="/profile" label="Profile" icon={<User className="h-4 w-4" />} />
            </>
          )}
          
          {isLandingPage && (
            <>
              <NavLink label="Features" href="#features" />
              <NavLink label="How It Works" href="#how-it-works" />
              <NavLink label="About" href="#about" />
              <NavLink label="Contact" href="#contact" />
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isLandingPage ? (
            <>
              {user ? (
                <>
                  <Link to="/home">
                    <button className="hidden md:block px-4 py-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition-all">
                      Dashboard
                    </button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      <UserAvatar />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-background border border-white/10">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <button className="hidden md:block px-4 py-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition-all">
                      Login
                    </button>
                  </Link>
                  <Link to="/auth">
                    <button className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </>
          ) : (
            <div className="hidden md:flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <UserAvatar />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border border-white/10">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          <button className="md:hidden text-white" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-t border-white/10 backdrop-blur-xl">
          <div className="container mx-auto p-4 flex flex-col gap-4">
            {isLandingPage ? (
              <>
                <a href="#features" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>Features</a>
                <a href="#how-it-works" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>How It Works</a>
                <a href="#about" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>About</a>
                <a href="#contact" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>Contact</a>
                <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                  {user ? (
                    <>
                      <Link to="/home" onClick={toggleMobileMenu}>
                        <button className="py-2 w-full text-center text-primary">Dashboard</button>
                      </Link>
                      <button 
                        onClick={() => {
                          handleSignOut();
                          toggleMobileMenu();
                        }}
                        className="py-2 w-full text-center bg-secondary rounded-md text-white flex items-center justify-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" onClick={toggleMobileMenu}>
                        <button className="py-2 w-full text-center text-primary">Login</button>
                      </Link>
                      <Link to="/auth" onClick={toggleMobileMenu}>
                        <button className="py-2 w-full text-center bg-primary rounded-md text-white">Get Started</button>
                      </Link>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/home" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                  <Home className="h-5 w-5" /> Home
                </Link>
                <Link to="/explore" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                  <BookOpen className="h-5 w-5" /> Explore
                </Link>
                <Link to="/upload" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                  <UploadIcon className="h-5 w-5" /> Upload
                </Link>
                <Link to="/profile" className="py-2 flex items-center gap-2" onClick={toggleMobileMenu}>
                  <User className="h-5 w-5" /> Profile
                </Link>
                {user && (
                  <button 
                    onClick={() => {
                      handleSignOut();
                      toggleMobileMenu();
                    }}
                    className="py-2 flex items-center gap-2 text-red-400"
                  >
                    <LogOut className="h-5 w-5" /> Sign Out
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ 
  to, 
  href, 
  label, 
  icon 
}: { 
  to?: string; 
  href?: string; 
  label: string; 
  icon?: React.ReactNode;
}) => {
  if (to) {
    return (
      <Link 
        to={to} 
        className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
      >
        {icon}
        {label}
      </Link>
    );
  }
  
  return (
    <a 
      href={href} 
      className="text-gray-300 hover:text-white transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
    >
      {label}
    </a>
  );
};

export default Navbar;
