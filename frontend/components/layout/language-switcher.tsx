'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/components/providers/language-provider'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

interface LanguageSwitcherProps {
  position?: 'top' | 'bottom'
}

export function LanguageSwitcher({ position = 'bottom' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en' as const, label: 'English', flag: '/flags/uk-flag.jpg' },
    { code: 'vi' as const, label: 'Tiếng Việt', flag: '/flags/vietnam-flag.jpg' },
  ]

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg glass hover:bg-secondary/50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={t('language')}
      >
        <Globe className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`absolute ${position === 'top' ? 'top-12' : 'bottom-12'} right-0 z-50 min-w-[180px] p-2 rounded-xl glass border border-border/50 shadow-xl`}
            >
              <div className="space-y-2">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      language === lang.code
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative w-8 h-6 rounded overflow-hidden flex-shrink-0 border border-border/30">
                      <Image
                        src={lang.flag}
                        alt={lang.label}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <span className="text-sm font-medium">{lang.label}</span>
                    {language === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 rounded-full bg-primary"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
