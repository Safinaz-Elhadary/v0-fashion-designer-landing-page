"use client"

import { Scissors, Sparkles, Clock, Shield } from "lucide-react"

const features = [
  {
    icon: Scissors,
    title: "Technical Patterns",
    description: "Convert sketches into production-ready patterns with precise measurements and grading.",
  },
  {
    icon: Sparkles,
    title: "Fabric Recommendations",
    description: "Get AI-powered fabric suggestions based on your design style and intended drape.",
  },
  {
    icon: Clock,
    title: "Rapid Turnaround",
    description: "Receive detailed specifications within 24-48 hours, ready for sampling.",
  },
  {
    icon: Shield,
    title: "Design Protection",
    description: "Your designs are confidential and protected. We never share or use your work.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-balance text-foreground">
            Everything you need to bring designs to life
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From concept to production, we provide the technical foundation for your creative vision
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-card border border-border hover:border-primary/50 transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-card-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center p-12 bg-primary text-primary-foreground">
          <h3 className="font-serif text-3xl md:text-4xl mb-4 text-balance">Ready to transform your sketches?</h3>
          <p className="text-lg mb-8 opacity-90 leading-relaxed">
            Join hundreds of designers who trust Atelier with their creative vision
          </p>
          <button
            onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-primary-foreground text-primary px-8 py-3 text-base tracking-wide hover:bg-primary-foreground/90 transition-colors font-medium"
          >
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  )
}
