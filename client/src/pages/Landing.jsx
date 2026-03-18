"use client"

import { Link } from "react-router-dom"
import Button from "../components/UI/Button"
import { Zap, Brain, BarChart3, MessageSquare, TrendingUp, Sparkles } from 'lucide-react'

export default function Landing() {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Chatbots",
      description: "Create intelligent chatbots with natural conversations powered by advanced AI"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Business Analytics",
      description: "Gain insights into your business performance with comprehensive analytics"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Ad Campaign Management",
      description: "Plan, launch, and optimize your ad campaigns across multiple platforms"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Business Predictions",
      description: "Predict future business outcomes with AI-driven analysis and forecasting"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Real-time Conversations",
      description: "Engage with customers through interactive chatbot conversations"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Advanced Insights",
      description: "Extract meaningful insights from your chat data and business metrics"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            MarketMind AI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block mb-4 px-4 py-2 bg-teal-100 rounded-full">
              <span className="text-sm font-semibold text-teal-700">✨ Welcome to MarketMind AI</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Transform Your Business with <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">AI Intelligence</span>
            </h2>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Harness the power of artificial intelligence to build intelligent chatbots, predict business trends, manage campaigns, and unlock actionable insights from your data.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/register">
                <Button className="w-full sm:w-auto px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
              <button className="px-8 py-3 border-2 border-slate-300 hover:border-teal-600 hover:text-teal-600 rounded-lg font-semibold transition-all">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-12 text-sm">
              <div>
                <div className="font-bold text-2xl text-slate-900">10K+</div>
                <div className="text-slate-600">Active Users</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-slate-900">99.9%</div>
                <div className="text-slate-600">Uptime</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-slate-900">24/7</div>
                <div className="text-slate-600">Support</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-cyan-600/20 rounded-2xl blur-2xl"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white shadow-2xl">
              <div className="aspect-video bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-teal-600 mx-auto mb-4" />
                  <p className="text-slate-600 font-semibold">AI-Powered Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need to Succeed
          </h3>
          <p className="text-xl text-slate-600">
            Comprehensive tools designed to help you build, manage, and optimize your AI-powered business solutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center text-teal-600 group-hover:from-teal-200 group-hover:to-cyan-200 transition-all mb-4">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-12 text-white">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-4xl font-bold mb-6">Why Choose MarketMind AI?</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-lg">Easy-to-use interface for all skill levels</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-lg">Powerful AI models with proven results</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-lg">Seamless integration with your workflows</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">✓</span>
                  </div>
                  <span className="text-lg">Real-time analytics and insights</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20">
              <h4 className="text-2xl font-bold mb-6">Ready to Get Started?</h4>
              <p className="text-white/90 mb-8 leading-relaxed">
                Join thousands of businesses already using MarketMind AI to transform their operations and drive growth.
              </p>
              <Link to="/register">
                <Button className="w-full bg-white text-teal-600 hover:bg-slate-100 font-semibold">
                  Create Your Free Account
                </Button>
              </Link>
              <p className="text-white/70 text-sm mt-4 text-center">
                No credit card required. Start free today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-xl mt-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h5 className="font-bold text-slate-900">MarketMind AI</h5>
              </div>
              <p className="text-sm text-slate-600">AI-powered business intelligence platform</p>
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-4">Product</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-teal-600 transition">Features</a></li>
                <li><a href="#" className="hover:text-teal-600 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-600 transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-4">Company</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-teal-600 transition">About</a></li>
                <li><a href="#" className="hover:text-teal-600 transition">Blog</a></li>
                <li><a href="#" className="hover:text-teal-600 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-slate-900 mb-4">Legal</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-teal-600 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-teal-600 transition">Terms</a></li>
                <li><a href="#" className="hover:text-teal-600 transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
            <p>&copy; 2026 MarketMind AI. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-teal-600 transition">Twitter</a>
              <a href="#" className="hover:text-teal-600 transition">LinkedIn</a>
              <a href="#" className="hover:text-teal-600 transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
