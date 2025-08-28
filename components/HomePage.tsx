"use client";
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Brain, 
  MessageSquare, 
  ArrowRight,
  Users,
  Globe,
  Shield,
  Star
} from "lucide-react";

interface HomePageProps {
  onGetStarted: () => void;
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Weeble Chat</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Compare Multiple AI Models
            <br />
            <span className="text-primary">Side by Side</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get diverse perspectives from multiple AI models in one conversation. 
            Compare responses from Gemini, DeepSeek, Llama, and more to find the best answers.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Weeble Chat?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multiple AI Models</h3>
              <p className="text-muted-foreground">
                Chat with up to 5 different AI models simultaneously including Gemini, DeepSeek, Llama, and more.
              </p>
            </div>

            <div className="bg-card p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Comparison</h3>
              <p className="text-muted-foreground">
                See responses from all selected models in real-time, making it easy to compare different perspectives.
              </p>
            </div>

            <div className="bg-card p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Privacy First</h3>
              <p className="text-muted-foreground">
                Your API keys are stored locally in your browser. We never see or store your conversations.
              </p>
            </div>

            <div className="bg-card p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy to Use</h3>
              <p className="text-muted-foreground">
                Simple, clean interface inspired by ChatGPT. No learning curve - just start chatting.
              </p>
            </div>

            <div className="bg-card p-6 border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Free to Use</h3>
              <p className="text-muted-foreground">
                No subscription fees. Just bring your own API keys and start comparing AI models today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Models */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Supported AI Models</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Gemini</h3>
                <p className="text-sm text-muted-foreground">Google</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">DeepSeek</h3>
                <p className="text-sm text-muted-foreground">DeepSeek AI</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Llama</h3>
                <p className="text-sm text-muted-foreground">Meta</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Moonshot</h3>
                <p className="text-sm text-muted-foreground">Kimi</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Qwen</h3>
                <p className="text-sm text-muted-foreground">Alibaba</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Compare AI Models?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your first conversation and see how different AI models respond to your questions.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Chatting Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Weeble Chat. Open source AI model comparison tool.</p>
        </div>
      </footer>
    </div>
  );
}
