"use client"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A_poetic_cinematic_202511081505-Yo1Xez57NIV0wOH9NZbvzO0Vaoctde.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-background/40" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl tracking-[0.3em] mb-2 text-foreground">ATELIER</h1>
          <div className="w-16 h-px bg-foreground mx-auto" />
        </div>

        {/* Main Headline */}
        <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 text-balance leading-[1.1] tracking-tight text-foreground">
          From sketch to couture in moments
        </h2>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          Transform your fashion sketches into production-ready designs. Our digital atelier brings your creative vision
          to life with precision and elegance.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base tracking-wide"
            onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Upload Your Sketch
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary/10 px-8 h-12 text-base tracking-wide bg-transparent"
          >
            View Gallery
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 pt-12 border-t border-border">
          <p className="text-sm tracking-widest text-muted-foreground mb-6 uppercase">Trusted by leading designers</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-muted-foreground/60">
            <span className="text-lg tracking-wider font-light">VOGUE</span>
            <span className="text-lg tracking-wider font-light">HARPER'S BAZAAR</span>
            <span className="text-lg tracking-wider font-light">WWD</span>
            <span className="text-lg tracking-wider font-light">PARSONS</span>
          </div>
        </div>
      </div>
    </section>
  )
}
