import { motion } from "framer-motion";

interface StackedBooksProps {
  className?: string;
  variants?: any;
}

const defaultVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const StackedBooks = ({ className = "", variants = defaultVariants }: StackedBooksProps) => {
  return (
    <motion.div 
      className={`flex-1 relative h-[400px] w-full max-w-md mx-auto ${className}`}
      variants={variants}
    >
      {/* Main book */}
      <motion.div 
        className="absolute top-0 right-[10%] w-64 h-80 rounded-lg shadow-xl overflow-hidden z-30"
        initial={{ rotate: -5 }}
        animate={{ rotate: 0 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 5,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 p-4 flex flex-col">
          <div className="text-white font-bold text-xl mb-2">Engineering Mathematics</div>
          <div className="text-blue-100 text-sm mb-4">Complete Notes</div>
          <div className="flex-1 bg-white/10 rounded flex flex-col items-center justify-center p-3 backdrop-blur-sm">
            {/* Math formulas and diagrams */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="bg-white/20 rounded-lg p-2 text-white text-center backdrop-blur-sm shadow-inner border border-white/10 hover:bg-white/30 transition-colors">
                <div className="font-serif text-sm tracking-wide">∫<sub>a</sub><sup>b</sup> f(x) dx</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-white text-center backdrop-blur-sm shadow-inner border border-white/10 hover:bg-white/30 transition-colors">
                <div className="font-serif text-sm tracking-wide">∑<sub>i=1</sub><sup>n</sup> i<sup>2</sup></div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-white text-center backdrop-blur-sm shadow-inner border border-white/10 hover:bg-white/30 transition-colors">
                <div className="font-serif text-sm tracking-wide">lim<sub>x→∞</sub> f(x)</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-white text-center backdrop-blur-sm shadow-inner border border-white/10 hover:bg-white/30 transition-colors">
                <div className="font-serif text-sm tracking-wide">e<sup>iπ</sup> + 1 = 0</div>
              </div>
            </div>
            <div className="mt-3 w-full bg-gradient-to-r from-blue-400/30 to-indigo-400/30 h-12 rounded-lg flex items-center justify-center shadow-inner border border-white/10">
              <div className="text-white font-serif text-sm tracking-wide">y = ax<sup>2</sup> + bx + c</div>
            </div>
          </div>
          <div className="h-4 w-12 bg-white/20 rounded mt-2"></div>
        </div>
      </motion.div>

      {/* Second book */}
      <motion.div 
        className="absolute top-10 right-[25%] w-64 h-80 rounded-lg shadow-xl overflow-hidden z-20"
        initial={{ rotate: 5 }}
        animate={{ rotate: 0 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 6,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 p-4 flex flex-col">
          <div className="text-white font-bold text-xl mb-2">Data Structures</div>
          <div className="text-purple-100 text-sm mb-4">Algorithms & Examples</div>
          <div className="flex-1 bg-white/10 rounded-lg flex flex-col items-center justify-center p-3 backdrop-blur-sm">
            {/* Data structure visualization */}
            <div className="flex justify-center items-center mb-2">
              <div className="bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full w-10 h-10 flex items-center justify-center text-white font-mono text-sm border border-white/20 shadow-lg">A</div>
              <div className="w-6 h-0.5 bg-white/60"></div>
              <div className="bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full w-10 h-10 flex items-center justify-center text-white font-mono text-sm border border-white/20 shadow-lg">B</div>
            </div>
            <div className="flex justify-center items-center w-full">
              <div className="w-0.5 h-4 bg-white/60"></div>
              <div className="w-0.5 h-4 bg-white/60 mx-10"></div>
            </div>
            <div className="flex justify-between items-center w-full px-6">
              <div className="bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full w-10 h-10 flex items-center justify-center text-white font-mono text-sm border border-white/20 shadow-lg">C</div>
              <div className="bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full w-10 h-10 flex items-center justify-center text-white font-mono text-sm border border-white/20 shadow-lg">D</div>
              <div className="bg-gradient-to-br from-purple-400/40 to-pink-400/40 rounded-full w-10 h-10 flex items-center justify-center text-white font-mono text-sm border border-white/20 shadow-lg">E</div>
            </div>
            <div className="mt-4 w-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 h-8 rounded-lg flex items-center justify-center shadow-inner border border-white/10">
              <div className="text-white font-mono text-xs tracking-wide">Binary Tree</div>
            </div>
          </div>
          <div className="h-4 w-12 bg-white/20 rounded mt-2"></div>
        </div>
      </motion.div>

      {/* Third book */}
      <motion.div 
        className="absolute top-20 right-[40%] w-64 h-80 rounded-lg shadow-xl overflow-hidden z-10"
        initial={{ rotate: -3 }}
        animate={{ rotate: 0 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: "reverse", 
          duration: 7,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 p-4 flex flex-col">
          <div className="text-white font-bold text-xl mb-2">Computer Networks</div>
          <div className="text-emerald-100 text-sm mb-4">Illustrated Guide</div>
          <div className="flex-1 bg-white/10 rounded-lg flex flex-col items-center justify-center p-3 backdrop-blur-sm">
            {/* Network diagram */}
            <div className="flex justify-between items-center w-full mb-3">
              <div className="bg-gradient-to-br from-emerald-400/40 to-teal-400/40 rounded-lg w-12 h-8 flex items-center justify-center border border-white/20 shadow-md">
                <div className="text-white font-mono text-xs">PC-1</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-400/40 to-teal-400/40 rounded-lg w-12 h-8 flex items-center justify-center border border-white/20 shadow-md">
                <div className="text-white font-mono text-xs">PC-2</div>
              </div>
            </div>
            <div className="flex justify-center items-center w-full mb-3">
              <div className="w-12 h-0.5 bg-white/60"></div>
              <div className="bg-gradient-to-br from-emerald-400/60 to-teal-400/60 rounded-full w-12 h-12 flex items-center justify-center mx-2 border border-white/20 shadow-lg">
                <div className="text-white font-mono text-xs">Router</div>
              </div>
              <div className="w-12 h-0.5 bg-white/60"></div>
            </div>
            <div className="flex justify-between items-center w-full">
              <div className="bg-gradient-to-br from-emerald-400/40 to-teal-400/40 rounded-lg w-12 h-8 flex items-center justify-center border border-white/20 shadow-md">
                <div className="text-white font-mono text-xs">PC-3</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-400/40 to-teal-400/40 rounded-lg w-14 h-8 flex items-center justify-center border border-white/20 shadow-md">
                <div className="text-white font-mono text-xs">Server</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-gradient-to-r from-emerald-400/30 to-teal-400/30 h-8 rounded-lg flex items-center justify-center shadow-inner border border-white/10">
              <div className="text-white font-mono text-xs tracking-wide">LAN Topology</div>
            </div>
          </div>
          <div className="h-4 w-12 bg-white/20 rounded mt-2"></div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StackedBooks; 