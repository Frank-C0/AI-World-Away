import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Filter,
  Table,
  Link2,
  LineChart,
  Rocket,
  HelpCircle,
  X,
} from "lucide-react";

const steps = [
  {
    title: "Upload your data",
    icon: <Upload className="w-10 h-10 text-cyan-400" />,
    description: (
      <>
        <p>
          📁 Upload a <strong>.csv file</strong> with your astronomical data, or use a default NASA dataset.
        </p>
        <p>
          The system will verify the format and prepare it for analysis.
        </p>
      </>
    ),
  },
  {
    title: "Clean and prepare your data",
    icon: <Filter className="w-10 h-10 text-green-400" />,
    description: (
      <>
        <p>
          🧹 Select irrelevant columns and choose how to handle missing or noisy values.
        </p>
        <p>
          Make sure your Machine Learning model works with clean, high-quality data.
        </p>
      </>
    ),
  },
  {
    title: "Explore the data table",
    icon: <Table className="w-10 h-10 text-yellow-400" />,
    description: (
      <>
        <p>
          📊 View your dataset (or NASA’s) in an interactive table. Filter by value ranges and toggle visible columns.
        </p>
        <p>
          Each column includes a short description of its scientific importance.
        </p>
      </>
    ),
  },
  {
    title: "Analyze correlations",
    icon: <Link2 className="w-10 h-10 text-purple-400" />,
    description: (
      <>
        <p>
          🔗 Experiment with <strong>Pearson, Spearman</strong> or <strong>Kendall</strong> correlation methods.
        </p>
        <p>
          Discover which parameters most influence exoplanet detection.
        </p>
      </>
    ),
  },
  {
    title: "Visualize your results",
    icon: <LineChart className="w-10 h-10 text-pink-400" />,
    description: (
      <>
        <p>
          📈 Generate visual comparisons, detect trends, and highlight patterns in your data.
        </p>
        <p>
          Your creativity is the only limit.
        </p>
      </>
    ),
  },
];

const HelpAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] bg-cyan-700 hover:bg-cyan-500 text-white rounded-full p-3 shadow-lg transition-all duration-300"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-gray-900/95 border border-cyan-600/30 rounded-2xl shadow-2xl w-[90%] max-w-[650px] p-8 text-white"
              initial={{ scale: 0.8, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-2xl font-bold mb-1 text-cyan-300">
                  NASA Exoplanet Analyzer Assistant 🚀
                </h1>
                <p className="text-gray-300 text-sm">
                  Discover how to explore, clean, and analyze data to detect exoplanets.
                </p>
              </motion.div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="flex flex-col items-center text-center bg-gray-800/60 p-6 rounded-2xl shadow-md"
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -30 }}
                  transition={{ duration: 0.4 }}
                >
                  {steps[step].icon}
                  <h2 className="text-xl font-semibold mt-4 mb-2 text-cyan-200">
                    {steps[step].title}
                  </h2>
                  <div className="text-gray-200 text-sm space-y-2">
                    {steps[step].description}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                  disabled={step === 0}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  ← Back
                </button>
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}
                    className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-sm"
                  >
                    Next →
                  </button>
                ) : (
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Rocket className="text-cyan-400 w-8 h-8 animate-bounce mt-2" />
                    <p className="mt-2 text-cyan-300 text-sm">You’re ready to explore!</p>
                  </motion.div>
                )}
              </div>

              {/* Footer / Flow summary */}
              <div className="mt-8 text-gray-400 text-xs text-center">
                <p>🚀 Typical workflow:</p>
                <p>[Upload CSV] → [Clean Data] → [View Table] → [Correlation] → [Charts]</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpAssistant;

