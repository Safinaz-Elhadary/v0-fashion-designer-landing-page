import { Hero } from "@/components/hero"
import { UploadSection } from "@/components/upload-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <UploadSection />
      <FeaturesSection />
      <Footer />
    </main>
  )
}
