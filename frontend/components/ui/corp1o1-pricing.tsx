"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, Building } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  icon: React.ElementType;
  gradient: string;
}

interface Corp1o1PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Corp1o1Pricing({
  plans,
  title = "The Skills Revolution",
  description = "Transform your career with our AI assessment solutions\nAll plans include platform access, AI analysis, and dedicated support.",
}: Corp1o1PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 80,
        spread: 70,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "#22d3ee", // cyan-400
          "#3b82f6", // blue-500
          "#8b5cf6", // purple-500
          "#f59e0b", // amber-500
          "#ec4899", // pink-500
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle", "square"],
      });
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto whitespace-pre-line">
              {description}
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center items-center space-x-4"
          >
            <span className={`font-semibold transition-colors ${isMonthly ? 'text-white' : 'text-gray-400'}`}>
              Monthly Billing
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <Switch
                ref={switchRef as any}
                checked={!isMonthly}
                onCheckedChange={handleToggle}
                className="relative data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-600"
              />
            </label>
            <span className={`font-semibold transition-colors ${!isMonthly ? 'text-white' : 'text-gray-400'}`}>
              Annual Billing
              <span className="text-cyan-400 ml-2 text-sm font-bold">(Save 20%)</span>
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      x: index === 2 ? -15 : index === 0 ? 15 : 0,
                      scale: index === 0 || index === 2 ? 0.96 : 1.0,
                    }
                  : { y: 0, opacity: 1 }
              }
              viewport={{ once: true }}
              transition={{
                duration: 1.2,
                type: "spring",
                stiffness: 100,
                damping: 25,
                delay: index * 0.1 + 0.3,
              }}
              className={cn(
                "relative rounded-3xl border p-8 bg-gradient-to-br backdrop-blur-sm text-center flex flex-col",
                plan.isPopular 
                  ? "border-cyan-400/50 from-slate-800/90 to-slate-700/90 shadow-2xl shadow-cyan-500/20" 
                  : "border-slate-600/30 from-slate-800/60 to-slate-700/60",
                "hover:transform hover:scale-105 transition-all duration-300",
                index === 0 && "origin-right",
                index === 2 && "origin-left"
              )}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-sm">RECOMMENDED</span>
                  </div>
                </div>
              )}

              {/* Plan Icon & Name */}
              <div className="mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.gradient} mb-4`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center justify-center">
                  <NumberFlow
                    value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    className="text-5xl font-bold text-white"
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                  />
                  {plan.period !== "lifetime" && (
                    <span className="text-gray-400 ml-2">/ {plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {isMonthly ? "billed monthly" : "billed annually"}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-left">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="space-y-4">
                <Link
                  href={plan.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full text-lg font-bold rounded-xl transition-all duration-300",
                    plan.isPopular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-1"
                      : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-slate-500"
                  )}
                >
                  {plan.buttonText}
                </Link>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {plan.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-2xl p-8 border border-slate-600/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to revolutionize skills assessment?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join companies that have already transformed their recruitment approach with Corp1o1
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
              >
                View Demo
              </Link>
              <Link
                href="/contact"
                className="border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Contact us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}