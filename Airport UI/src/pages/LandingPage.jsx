import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FaSatellite, FaPlane, FaMapMarkedAlt, FaExclamationTriangle, FaFileAlt, FaDownload, FaChevronDown, FaGithub, FaArrowRight, FaBrain } from 'react-icons/fa';
import { MdFlightLand, MdSatelliteAlt, MdOutlineRadar, MdAnalytics, MdOutlineChangeHistory, MdChangeHistory } from 'react-icons/md';
import { HiChip } from 'react-icons/hi';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    variants={fadeInUp}
    className="bg-[#0a1929]/70 backdrop-blur-md border border-[#00f5ff]/20 p-6 rounded-xl hover:border-[#00f5ff]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,245,255,0.2)] flex flex-col items-center text-center group"
  >
    <div className="w-16 h-16 rounded-full bg-[#08131F] flex items-center justify-center mb-4 border border-[#00f5ff]/30 group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-3xl text-[#00f5ff]" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-300 text-sm">{description}</p>
  </motion.div>
);

const WorkflowStep = ({ title, icon: Icon, isLast }) => (
  <div className="flex flex-col items-center">
    <motion.div 
      variants={fadeInUp}
      className="w-20 h-20 rounded-2xl bg-[#0a1929] border border-[#0080ff]/40 flex items-center justify-center shadow-lg relative z-10 hover:border-[#00f5ff] transition-colors"
    >
      <Icon className="text-3xl text-[#0080ff]" />
    </motion.div>
    <div className="text-center mt-4 w-32">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
    </div>
    {!isLast && (
      <div className="hidden md:flex flex-col items-center absolute -right-6 top-10">
        <FaArrowRight className="text-slate-500" />
      </div>
    )}
  </div>
);

const TechBadge = ({ name }) => (
  <motion.div 
    variants={fadeInUp}
    className="px-4 py-2 bg-[#0a1929] border border-slate-700 rounded-full flex items-center gap-2 hover:border-[#00f5ff]/50 transition-colors"
  >
    <HiChip className="text-[#0080ff]" />
    <span className="text-slate-200 text-sm font-medium">{name}</span>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const features = [
    { icon: FaSatellite, title: "Satellite Image Monitoring", description: "Continuous ingest of high-resolution satellite imagery for designated airport areas." },
    { icon: FaBrain, title: "Automatic Change Detection", description: "AI-driven identification of new structures or terrain changes in the airport vicinity." },
    { icon: MdFlightLand, title: "OLS Surface Analysis", description: "Mathematical modeling of Obstacle Limitation Surfaces for precise compliance checks." },
    { icon: FaExclamationTriangle, title: "Risk Classification", description: "Automated threat level assignment based on penetration depth and proximity." },
    { icon: FaMapMarkedAlt, title: "Interactive GIS Dashboard", description: "Rich, interactive 3D/2D mapping interface for visualization of obstacles." },
    { icon: FaFileAlt, title: "Report Generation", description: "Automated generation of compliance and incident reports for aviation authorities." },
    { icon: FaDownload, title: "GeoJSON Export", description: "Export capabilities to standard geospatial formats for external tool integration." }
  ];

  const workflowSteps = [
    { title: "Airport Selection", icon: FaPlane },
    { title: "Satellite Download", icon: MdSatelliteAlt },
    { title: "Change Detection", icon: MdOutlineChangeHistory },
    { title: "Spatial Analytics", icon: MdAnalytics },
    { title: "Risk Assessment", icon: FaExclamationTriangle },
    { title: "Report Generation", icon: FaFileAlt },
    { title: "Export Results", icon: FaDownload }
  ];

  const technologies = [
    "FastAPI", "React", "Google Maps", "Sentinel-2", "GeoJSON", "Rasterio", "PyTorch", "GDAL", "UNet"
  ];

  return (
    <div className="min-h-screen bg-[#08131F] text-slate-200 font-sans selection:bg-[#00f5ff]/30">
      {/* Sticky Navbar */}
      <nav className="fixed w-full z-50 bg-[#08131F]/90 backdrop-blur-md border-b border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f5ff] to-[#0080ff] flex items-center justify-center">
                <FaPlane className="text-white text-xl" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">Airport<span className="text-[#00f5ff]">OLS</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => window.scrollTo(0,0)} className="text-sm font-medium hover:text-[#00f5ff] transition-colors">Home</button>
              <button onClick={scrollToFeatures} className="text-sm font-medium hover:text-[#00f5ff] transition-colors">Features</button>
              <button className="text-sm font-medium hover:text-[#00f5ff] transition-colors">About</button>
              <button className="text-sm font-medium hover:text-[#00f5ff] transition-colors">Contact</button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleLogin}
                className="px-6 py-2.5 rounded-lg bg-[#0080ff] hover:bg-[#00f5ff] text-white hover:text-[#08131F] font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(0,128,255,0.4)] hover:shadow-[0_0_20px_rgba(0,245,255,0.6)]"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[#08131F] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[#00f5ff] opacity-20 blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a1929] border border-[#00f5ff]/30 text-[#00f5ff] text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f5ff]"></span>
              </span>
              System Version 3.0 Live
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
              Airport Obstacle Limitation Surface <br className="hidden md:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-[#0080ff]">Monitoring System</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              AI-Powered Satellite-Based Airport Obstacle Detection & OLS Compliance Platform. Safeguard your airspace with real-time analytics and automated risk assessment.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleLogin}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#0080ff] to-[#00f5ff] text-[#08131F] font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(0,245,255,0.4)] flex items-center justify-center gap-2"
              >
                Get Started <FaArrowRight />
              </button>
              <button 
                onClick={scrollToFeatures}
                className="px-8 py-4 rounded-xl bg-[#0a1929] border border-slate-700 text-white font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Learn More <FaChevronDown className="animate-bounce mt-1"/>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-24 bg-[#0a1929] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Analytics Core</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Comprehensive suite of tools for monitoring, analyzing, and reporting on airport airspace compliance.</p>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center"
          >
            {features.map((feature, idx) => (
              <div key={idx} className={idx === 6 ? "md:col-span-2 lg:col-span-3 xl:col-span-1" : ""}>
                 <FeatureCard {...feature} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-[#08131F] border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Automated Workflow</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">End-to-end processing pipeline from satellite ingestion to compliance reporting.</p>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row justify-between items-center relative py-10"
          >
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-slate-800 -z-10 -translate-y-6"></div>
            
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="relative mb-12 md:mb-0">
                <WorkflowStep 
                  title={step.title} 
                  icon={step.icon} 
                  isLast={idx === workflowSteps.length - 1} 
                />
                {/* Mobile connecting line */}
                {idx !== workflowSteps.length - 1 && (
                  <div className="md:hidden absolute -bottom-8 left-1/2 w-0.5 h-6 bg-slate-800 -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Powered by Modern Technologies</h2>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto"
          >
            {technologies.map((tech, idx) => (
              <TechBadge key={idx} name={tech} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#08131F] border-t border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00f5ff] to-[#0080ff] flex items-center justify-center">
                  <FaPlane className="text-white text-sm" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Airport<span className="text-[#00f5ff]">OLS</span></span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Advanced AI-powered satellite imagery analysis for monitoring airport Obstacle Limitation Surfaces and ensuring aviation safety compliance.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#0080ff] transition-colors">
                  <FaGithub className="text-white text-xl" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">API Reference</a></li>
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">Version 3.0 Notes</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-[#00f5ff] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} AirportOLS System. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm">
              Designed for Enterprise Aviation Safety
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
