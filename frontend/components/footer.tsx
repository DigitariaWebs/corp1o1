"use client"
import { motion } from "framer-motion"
import { Brain, Github, Twitter, MessageCircle, Mail, MapPin, Phone, Heart } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export function Footer() {
  const { t, locale, toggleLocale } = useTranslation()

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#technology" },
        { label: "Pricing", href: "#pricing" },
        { label: "API", href: "/api" },
        { label: "Documentation", href: "/docs" }
      ]
    },
    {
      title: "Company", 
      links: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Partners", href: "/partners" },
        { label: "Press", href: "/press" }
      ]
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Contact", href: "/contact" },
        { label: "Status", href: "/status" },
        { label: "Community", href: "/community" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Security", href: "/security" },
        { label: "Compliance", href: "/compliance" }
      ]
    }
  ]

  const socialLinks = [
    {
      name: "Twitter",
      href: "https://twitter.com/corp1o1",
      icon: Twitter
    },
    {
      name: "GitHub", 
      href: "https://github.com/corp1o1",
      icon: Github
    },
    {
      name: "Discord",
      href: "https://discord.gg/corp1o1",
      icon: MessageCircle
    }
  ]

  return (
    <footer className="bg-gradient-to-b from-background to-revolutionary-blue/2 border-t border-revolutionary-cyan/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
            
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-revolutionary-cyan flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Corp1o1</h1>
                  <p className="text-xs text-muted-foreground">Skills that matter</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-sm">
                Transforming talent recognition worldwide through AI-powered skills assessment and blockchain certification.
              </p>

              {/* Contact Info */}
              <div className="space-y-2 mb-8">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Paris, France</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href="mailto:hello@corp1o1.com" className="text-sm text-muted-foreground hover:text-revolutionary-cyan transition-colors">
                    hello@corp1o1.com
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg glass border border-revolutionary-cyan/10 flex items-center justify-center text-muted-foreground hover:text-revolutionary-cyan hover:border-revolutionary-cyan/20 transition-all duration-300"
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="lg:col-span-1"
              >
                <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-white transition-colors duration-300 text-sm"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Impact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="py-8 border-t border-revolutionary-cyan/5"
        >
          <div className="glass rounded-2xl p-6 border border-revolutionary-cyan/10">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-revolutionary-cyan/20 rounded-2xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-revolutionary-cyan" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">
                    1% for Education
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Every purchase helps fund free education programs worldwide
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-revolutionary-cyan">$350K+</p>
                <p className="text-muted-foreground text-xs">2024 target</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="py-6 border-t border-revolutionary-cyan/5"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-6">
              <p className="text-muted-foreground text-sm">
                © 2025 Corp1o1. All rights reserved.
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-500 text-xs font-medium">Open-source coming soon</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Language Switcher */}
              <button
                onClick={toggleLocale}
                className="text-muted-foreground hover:text-white transition-colors duration-300 text-sm flex items-center space-x-2"
              >
                <span>{locale === 'fr' ? '🇫🇷' : '🇺🇸'}</span>
                <span>{locale === 'fr' ? 'Français' : 'English'}</span>
              </button>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground text-xs">All systems operational</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}