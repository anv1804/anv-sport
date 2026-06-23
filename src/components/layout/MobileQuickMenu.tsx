"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Database, Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileQuickMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 left-6 z-50 md:hidden font-client-ui">
      {/* Floating Buttons Group */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-3 mb-3 items-start"
          >
            {/* AI Prediction Button */}
            <Link href="/du-doan" prefetch={false} onClick={() => setIsOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2.5 bg-slate-900 text-white pl-3 pr-4 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-slate-800"
              >
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Dự đoán AI</span>
              </motion.div>
            </Link>

            {/* Data Center Button */}
            <Link href="/trung-tam-du-lieu" prefetch={false} onClick={() => setIsOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2.5 bg-slate-900 text-white pl-3 pr-4 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-slate-800"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Dữ liệu</span>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        onClick={toggleMenu}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border transition-colors duration-300 focus:outline-none
          ${isOpen 
            ? "bg-slate-800 border-slate-700 hover:bg-slate-700" 
            : "bg-[var(--color-accent-main)] border-[var(--color-accent-main)] hover:bg-[var(--color-accent-hover)]"
          }`}
        aria-label="Quick Actions"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Compass className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}
