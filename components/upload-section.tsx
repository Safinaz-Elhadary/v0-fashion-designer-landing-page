"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Upload, X, Check, Loader2, Download, Send, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function UploadSection() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showGeneratedImages, setShowGeneratedImages] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [technicalSketch, setTechnicalSketch] = useState<string | null>(null)
  const [render3D, setRender3D] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<string>("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentSubmitted, setCommentSubmitted] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [video360Url, setVideo360Url] = useState<string | null>(null)
  const [videoRunwayUrl, setVideoRunwayUrl] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [veoPrompt, setVeoPrompt] = useState<string | null>(null)
  const [designDescription, setDesignDescription] = useState<string>("")

  const [designPreferences, setDesignPreferences] = useState({
    fabricType: "",
    color: "",
    neckline: "",
    length: "",
    sleeveStyle: "",
    silhouette: "",
  })

  const getCurrentStep = () => {
    if (video360Url && videoRunwayUrl) return 4
    if (technicalSketch && render3D) return 3
    if (showGeneratedImages) return 2
    if (file) return 1
    return 0
  }

  useEffect(() => {
    if (technicalSketch && render3D && !designDescription) {
      const analyzeDesign = async () => {
        try {
          const response = await fetch("/api/analyze-design", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ technicalSketch, render3D }),
          })

          if (response.ok) {
            const data = await response.json()
            setDesignDescription(data.description)
          }
        } catch (error) {
          console.error("[v0] Failed to analyze design:", error)
        }
      }

      analyzeDesign()
    }
  }, [technicalSketch, render3D, designDescription])

  useEffect(() => {
    if (technicalSketch && render3D && designDescription) {
      const basePrompt = `Create a professional 360-degree rotating showcase video of this fashion dress design:

${designDescription}

VIDEO SPECIFICATIONS:
- Camera Movement: Smooth, steady 360-degree rotation around the dress, starting from the front, moving to the right side, then back, then left side, and returning to front
- Display: The dress should be shown on an invisible mannequin or elegant dress form against a clean, minimalist white or cream studio background
- Lighting: Soft, even professional studio lighting that highlights fabric texture, drape, and all construction details
- Pacing: Slow, elegant rotation taking the full duration to complete one full circle
- Angle: Camera at chest/eye level to show the dress from a flattering angle
- Style: High-end fashion editorial presentation, luxury boutique atmosphere`

      const promptWithComments = comments.trim()
        ? `${basePrompt}\n\nDESIGNER'S ADDITIONAL SPECIFICATIONS:\n${comments}\n\nFocus on showing every detail mentioned above as the dress rotates. The video should feel like a premium fashion brand's product showcase.`
        : `${basePrompt}\n\nFocus on showing every detail as the dress rotates. The video should feel like a premium fashion brand's product showcase.`

      setVeoPrompt(promptWithComments)
    }
  }, [technicalSketch, render3D, designDescription, comments])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type.startsWith("image/")) {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      setShowGeneratedImages(false)
      setTechnicalSketch(null)
      setRender3D(null)
      setError(null)
      setDesignDescription("") // Reset design description
      setDesignPreferences({
        fabricType: "",
        color: "",
        neckline: "",
        length: "",
        sleeveStyle: "",
        silhouette: "",
      })
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleGenerate = async () => {
    if (!file) return

    setShowGeneratedImages(true)
    setIsGenerating(true)
    setError(null)

    try {
      const base64Image = await fileToBase64(file)

      const preferencesText = Object.entries(designPreferences)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${value}`)
        .join(", ")

      const technicalResponse = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          imageType: "technical",
          preferences: preferencesText,
        }),
      })

      if (!technicalResponse.ok) {
        throw new Error("Failed to generate technical sketch")
      }

      const technicalData = await technicalResponse.json()
      setTechnicalSketch(technicalData.image)

      const render3DResponse = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          imageType: "3d",
          preferences: preferencesText,
        }),
      })

      if (!render3DResponse.ok) {
        throw new Error("Failed to generate 3D render")
      }

      const render3DData = await render3DResponse.json()
      setRender3D(render3DData.image)
    } catch (err) {
      console.error("[v0] Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate images")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!technicalSketch) return

    setIsGeneratingVideo(true)
    setVideoError(null)

    try {
      console.log("[v0] Starting dual video generation request...")

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicalSketch,
          render3D,
          comments,
        }),
      })

      console.log("[v0] Response received, status:", response.status)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.log("[v0] Non-JSON response:", textResponse)
        throw new Error("Server returned an invalid response. Please try again.")
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate videos")
      }

      const data = await response.json()
      console.log("[v0] Video data received successfully")

      if (data.success && data.video360Url && data.videoRunwayUrl) {
        setVideo360Url(data.video360Url)
        setVideoRunwayUrl(data.videoRunwayUrl)
      } else {
        throw new Error("Missing video URLs in response")
      }
    } catch (err) {
      console.error("[v0] Video generation error:", err)
      setVideoError(err instanceof Error ? err.message : "Failed to generate videos")
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreviewUrl(null)
    // Reset showGeneratedImages state
    setShowGeneratedImages(false)
    setTechnicalSketch(null)
    setRender3D(null)
    setError(null)
    setIsGenerating(false)
    setComments("")
    setIsSubmittingComment(false)
    setCommentSubmitted(false)
    setVideo360Url(null)
    setVideoRunwayUrl(null)
    setVideoError(null)
    setIsGeneratingVideo(false)
    setVeoPrompt(null)
    setDesignDescription("") // Reset design description
    setDesignPreferences({
      fabricType: "",
      color: "",
      neckline: "",
      length: "",
      sleeveStyle: "",
      silhouette: "",
    })
  }

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = filename
    if (imageUrl.startsWith("http")) {
      link.target = "_blank"
    }
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSubmitComment = async () => {
    if (!comments.trim()) return

    setIsSubmittingComment(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmittingComment(false)
    setCommentSubmitted(true)

    setTimeout(() => {
      setCommentSubmitted(false)
    }, 3000)
  }

  return (
    <section id="upload-section" className="py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 border border-primary/20 rotate-12" />
        <div className="absolute bottom-40 right-20 w-40 h-40 border border-primary/20 -rotate-6" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-primary/20 rotate-45" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {file && (
          <div className="mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Progress bar background */}
                <div className="absolute top-5 left-0 right-0 h-px bg-border/30" />
                {/* Progress bar fill */}
                <div
                  className="absolute top-5 left-0 h-px bg-primary transition-all duration-700"
                  style={{ width: `${(getCurrentStep() / 4) * 100}%` }}
                />

                {/* Steps */}
                <div className="relative flex justify-between">
                  {/* Step 1: Upload Sketch */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300",
                        getCurrentStep() >= 1
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground",
                      )}
                    >
                      {getCurrentStep() >= 1 ? <Check className="w-5 h-5" strokeWidth={2.5} /> : "1"}
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-xs tracking-wider uppercase text-center max-w-[100px]",
                        getCurrentStep() >= 1 ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      Upload Sketch
                    </p>
                  </div>

                  {/* Step 2: Technical Design */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300",
                        getCurrentStep() >= 2
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground",
                      )}
                    >
                      {getCurrentStep() >= 2 ? <Check className="w-5 h-5" strokeWidth={2.5} /> : "2"}
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-xs tracking-wider uppercase text-center max-w-[100px]",
                        getCurrentStep() >= 2 ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      Technical Design
                    </p>
                  </div>

                  {/* Step 3: 3D Render */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300",
                        getCurrentStep() >= 3
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground",
                      )}
                    >
                      {getCurrentStep() >= 3 ? <Check className="w-5 h-5" strokeWidth={2.5} /> : "3"}
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-xs tracking-wider uppercase text-center max-w-[100px]",
                        getCurrentStep() >= 3 ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      3D Render
                    </p>
                  </div>

                  {/* Step 4: Motion Studies */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300",
                        getCurrentStep() >= 4
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground",
                      )}
                    >
                      {getCurrentStep() >= 4 ? <Check className="w-5 h-5" strokeWidth={2.5} /> : "4"}
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-xs tracking-wider uppercase text-center max-w-[100px]",
                        getCurrentStep() >= 4 ? "text-foreground font-medium" : "text-muted-foreground",
                      )}
                    >
                      Motion Studies
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <div className="w-16 h-px bg-foreground/30 mx-auto mb-6" />
            <h2 className="font-serif text-xs tracking-[0.4em] text-muted-foreground uppercase">Atelier</h2>
          </div>
          <h2 className="font-serif text-5xl md:text-7xl mb-6 text-balance leading-[1] tracking-tighter text-foreground">
            Sketch to Couture
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto italic">
            Transform your design vision into a technical masterpiece through AI-powered artistry
          </p>
        </div>

        <div className="relative">
          {!previewUrl ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-sm transition-all duration-300 p-20 text-center bg-card/30 backdrop-blur-sm",
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.98]"
                  : "border-border/30 hover:border-primary/50 hover:bg-muted/20",
              )}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20">
                  <Upload className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-serif text-2xl mb-3 text-foreground tracking-tight">Drop your sketch here</p>
                  <p className="text-muted-foreground mb-6 leading-relaxed">or click to browse your files</p>
                </div>
                <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileInput} />
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent h-12 px-8 tracking-wide"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  Select File
                </Button>
                <p className="text-xs text-muted-foreground mt-4 tracking-wide">
                  SUPPORTS: JPG, PNG, HEIC • MAXIMUM SIZE: 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="relative min-h-[800px]">
                {!showGeneratedImages ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
                      {/* Left: Uploaded Sketch */}
                      <div className="flex justify-center lg:justify-end">
                        <div className="w-full max-w-sm">
                          <div className="relative group">
                            {/* Decorative tape effect at top */}
                            <div className="absolute -top-4 left-1/4 w-20 h-8 bg-muted/40 backdrop-blur-sm border border-border/30 -rotate-3 z-20" />
                            <div className="absolute -top-4 right-1/4 w-20 h-8 bg-muted/40 backdrop-blur-sm border border-border/30 rotate-2 z-20" />

                            <div className="relative bg-white p-4 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-300">
                              <img
                                src={previewUrl || "/placeholder.svg"}
                                alt="Original sketch"
                                className="w-full h-auto aspect-[3/4] object-cover"
                              />
                              <div className="mt-3 text-center">
                                <p className="text-xs text-muted-foreground tracking-widest uppercase">
                                  Original Sketch
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={handleReset}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-background hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-all z-30"
                              aria-label="Remove file"
                            >
                              <X className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>

                          {/* Annotation-style label */}
                          <div className="mt-6 flex items-center justify-center gap-3">
                            <div className="h-px flex-1 bg-border/50" />
                            <span className="text-xs text-muted-foreground tracking-wider font-medium">
                              {file?.name}
                            </span>
                            <div className="h-px flex-1 bg-border/50" />
                          </div>
                        </div>
                      </div>

                      {/* Right: Design Details Form */}
                      <div className="flex justify-center lg:justify-start">
                        <div className="w-full max-w-lg">
                          <div className="bg-card/40 backdrop-blur-sm border border-border/30 p-8 shadow-xl">
                            <div className="text-center mb-8">
                              <div className="w-12 h-px bg-foreground/30 mx-auto mb-4" />
                              <h3 className="font-serif text-2xl text-foreground mb-2 tracking-tight">
                                Design Details
                              </h3>
                              <p className="text-xs text-muted-foreground italic tracking-wide">
                                Optional refinements to guide the AI generation
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                              {/* Fabric Type */}
                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                  Fabric Type
                                </label>
                                <p className="text-xs text-muted-foreground/70 italic mb-2">
                                  What primary fabric would bring this design to life?
                                </p>
                                <Select
                                  value={designPreferences.fabricType}
                                  onValueChange={(value) =>
                                    setDesignPreferences((prev) => ({ ...prev, fabricType: value }))
                                  }
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-background/50 h-11">
                                    <SelectValue placeholder="Select fabric..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="satin">Satin</SelectItem>
                                    <SelectItem value="silk">Silk</SelectItem>
                                    <SelectItem value="chiffon">Chiffon</SelectItem>
                                    <SelectItem value="organza">Organza</SelectItem>
                                    <SelectItem value="tulle">Tulle</SelectItem>
                                    <SelectItem value="crepe">Crepe</SelectItem>
                                    <SelectItem value="brocade">Brocade / Jacquard</SelectItem>
                                    <SelectItem value="velvet">Velvet</SelectItem>
                                    <SelectItem value="cotton-linen">Cotton / Linen</SelectItem>
                                    <SelectItem value="mixed">Mixed Materials</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Color */}
                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                  Primary Color
                                </label>
                                <p className="text-xs text-muted-foreground/70 italic mb-2">
                                  What color palette defines this piece?
                                </p>
                                <Select
                                  value={designPreferences.color}
                                  onValueChange={(value) => setDesignPreferences((prev) => ({ ...prev, color: value }))}
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-background/50 h-11">
                                    <SelectValue placeholder="Select color..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="white-ivory">White / Ivory</SelectItem>
                                    <SelectItem value="black">Black</SelectItem>
                                    <SelectItem value="red">Red</SelectItem>
                                    <SelectItem value="blue-navy">Blue / Navy</SelectItem>
                                    <SelectItem value="pink-blush">Pink / Blush</SelectItem>
                                    <SelectItem value="green-emerald">Green / Emerald</SelectItem>
                                    <SelectItem value="gold-champagne">Gold / Champagne</SelectItem>
                                    <SelectItem value="silver-gray">Silver / Gray</SelectItem>
                                    <SelectItem value="purple-lavender">Purple / Lavender</SelectItem>
                                    <SelectItem value="multicolor">Multicolor / Print</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Neckline */}
                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                  Neckline Style
                                </label>
                                <p className="text-xs text-muted-foreground/70 italic mb-2">
                                  How should the neckline frame the design?
                                </p>
                                <Select
                                  value={designPreferences.neckline}
                                  onValueChange={(value) =>
                                    setDesignPreferences((prev) => ({ ...prev, neckline: value }))
                                  }
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-background/50 h-11">
                                    <SelectValue placeholder="Select neckline..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="v-neck">V-Neck</SelectItem>
                                    <SelectItem value="round">Round / Jewel</SelectItem>
                                    <SelectItem value="sweetheart">Sweetheart</SelectItem>
                                    <SelectItem value="off-shoulder">Off-Shoulder</SelectItem>
                                    <SelectItem value="halter">Halter</SelectItem>
                                    <SelectItem value="square">Square</SelectItem>
                                    <SelectItem value="boat">Boat / Bateau</SelectItem>
                                    <SelectItem value="high-neck">High Neck / Collar</SelectItem>
                                    <SelectItem value="asymmetric">Asymmetric</SelectItem>
                                    <SelectItem value="strapless">Strapless</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Length */}
                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                  Dress Length
                                </label>
                                <p className="text-xs text-muted-foreground/70 italic mb-2">
                                  What length best suits this silhouette?
                                </p>
                                <Select
                                  value={designPreferences.length}
                                  onValueChange={(value) =>
                                    setDesignPreferences((prev) => ({ ...prev, length: value }))
                                  }
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-background/50 h-11">
                                    <SelectValue placeholder="Select length..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mini">Mini (Above Knee)</SelectItem>
                                    <SelectItem value="knee">Knee Length</SelectItem>
                                    <SelectItem value="midi">Midi (Below Knee)</SelectItem>
                                    <SelectItem value="tea">Tea Length (Mid-Calf)</SelectItem>
                                    <SelectItem value="ankle">Ankle Length</SelectItem>
                                    <SelectItem value="floor">Floor Length</SelectItem>
                                    <SelectItem value="cathedral">Cathedral Train</SelectItem>
                                    <SelectItem value="asymmetric-length">Asymmetric / High-Low</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Sleeve Style */}
                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                  Sleeve Style
                                </label>
                                <p className="text-xs text-muted-foreground/70 italic mb-2">
                                  How should the sleeves complement the design?
                                </p>
                                <Select
                                  value={designPreferences.sleeveStyle}
                                  onValueChange={(value) =>
                                    setDesignPreferences((prev) => ({ ...prev, sleeveStyle: value }))
                                  }
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-background/50 h-11">
                                    <SelectValue placeholder="Select sleeve..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sleeveless">Sleeveless</SelectItem>
                                    <SelectItem value="cap">Cap Sleeve</SelectItem>
                                    <SelectItem value="short">Short Sleeve</SelectItem>
                                    <SelectItem value="three-quarter">3/4 Sleeve</SelectItem>
                                    <SelectItem value="long">Long Sleeve</SelectItem>
                                    <SelectItem value="bell">Bell Sleeve</SelectItem>
                                    <SelectItem value="bishop">Bishop Sleeve</SelectItem>
                                    <SelectItem value="puff">Puff Sleeve</SelectItem>
                                    <SelectItem value="flutter">Flutter Sleeve</SelectItem>
                                    <SelectItem value="cold-shoulder">Cold Shoulder</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Silhouette */}
                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                                  Silhouette
                                </label>
                                <p className="text-xs text-muted-foreground/70 italic mb-2">
                                  What overall shape defines this dress?
                                </p>
                                <Select
                                  value={designPreferences.silhouette}
                                  onValueChange={(value) =>
                                    setDesignPreferences((prev) => ({ ...prev, silhouette: value }))
                                  }
                                >
                                  <SelectTrigger className="w-full border-border/30 bg-background/50 h-11">
                                    <SelectValue placeholder="Select silhouette..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="a-line">A-Line</SelectItem>
                                    <SelectItem value="ball-gown">Ball Gown</SelectItem>
                                    <SelectItem value="mermaid">Mermaid / Trumpet</SelectItem>
                                    <SelectItem value="sheath">Sheath / Column</SelectItem>
                                    <SelectItem value="empire">Empire Waist</SelectItem>
                                    <SelectItem value="fit-flare">Fit & Flare</SelectItem>
                                    <SelectItem value="shift">Shift</SelectItem>
                                    <SelectItem value="wrap">Wrap</SelectItem>
                                    <SelectItem value="bodycon">Bodycon</SelectItem>
                                    <SelectItem value="asymmetric">Asymmetric</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="mt-6 text-center">
                              <p className="text-xs text-muted-foreground/60 italic">
                                Leave any field blank to let AI interpret from your sketch
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                      <Button
                        size="lg"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-12 tracking-[0.2em] uppercase text-xs font-medium"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                      >
                        {isGenerating ? "Transforming..." : "Transform Design"}
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        onClick={handleReset}
                        className="text-muted-foreground hover:text-foreground h-12 px-8 tracking-wide"
                      >
                        Upload New
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Collage layout with all three images
                  <>
                    {/* Original Sketch - Left positioned, slightly rotated */}
                    <div className="absolute top-0 left-4 md:left-12 w-64 md:w-80 z-10">
                      <div className="relative group">
                        <div className="absolute -top-3 left-8 w-16 h-6 bg-muted/40 backdrop-blur-sm border border-border/30 rotate-2 z-20" />
                        <div className="bg-white p-3 shadow-xl -rotate-2 hover:rotate-0 transition-transform duration-300">
                          <img
                            src={previewUrl || "/placeholder.svg"}
                            alt="Original sketch"
                            className="w-full h-auto aspect-[3/4] object-cover"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Original</p>
                          </div>
                        </div>
                        <button
                          onClick={handleReset}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-background hover:bg-destructive hover:text-destructive-foreground rounded-full flex items-center justify-center border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-all z-30"
                          aria-label="Remove file"
                        >
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    {/* Technical Sketch - Center top, largest */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 md:w-96 z-20">
                      <div className="relative group">
                        <div className="absolute -top-4 left-1/4 w-20 h-8 bg-muted/40 backdrop-blur-sm border border-border/30 -rotate-3 z-20" />
                        <div className="absolute -top-4 right-1/4 w-20 h-8 bg-muted/40 backdrop-blur-sm border border-border/30 rotate-2 z-20" />

                        <div className="bg-white p-4 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-300">
                          {technicalSketch ? (
                            <>
                              <img
                                src={technicalSketch || "/placeholder.svg"}
                                alt="Technical sketch"
                                className="w-full h-auto aspect-[3/4] object-cover"
                              />
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">
                                    Technical Sketch
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDownload(technicalSketch, "technical-sketch.png")}
                                  className="w-7 h-7 bg-muted/80 hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors"
                                  aria-label="Download technical sketch"
                                >
                                  <Download className="w-3 h-3" strokeWidth={2} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full aspect-[3/4] bg-muted/20 flex items-center justify-center overflow-hidden relative">
                              {isGenerating ? (
                                <>
                                  <video
                                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/grok-video-d43fc362-a3f3-45a2-afd5-658229a1f510-2-mHMNkgjQdRIeH1XWt1EH3xO00Bes6q.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-white/25 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="text-center bg-white/90 px-6 py-4 rounded-sm shadow-lg">
                                      <Loader2
                                        className="w-8 h-8 animate-spin text-primary mx-auto mb-3"
                                        strokeWidth={1.5}
                                      />
                                      <span className="text-xs font-medium text-foreground tracking-widest uppercase">
                                        Generating
                                      </span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground tracking-wide">Awaiting generation</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3D Render - Right positioned, slightly rotated opposite */}
                    <div className="absolute top-32 right-4 md:right-12 w-64 md:w-80 z-15">
                      <div className="relative group">
                        <div className="absolute -top-3 right-8 w-16 h-6 bg-muted/40 backdrop-blur-sm border border-border/30 -rotate-2 z-20" />
                        <div className="bg-white p-3 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                          {render3D ? (
                            <>
                              <img
                                src={render3D || "/placeholder.svg"}
                                alt="3D render"
                                className="w-full h-auto aspect-[3/4] object-cover"
                              />
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                                    3D Render
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDownload(render3D, "3d-render.png")}
                                  className="w-7 h-7 bg-muted/80 hover:bg-primary hover:text-primary-foreground rounded-full flex items-center justify-center transition-colors"
                                  aria-label="Download 3D render"
                                >
                                  <Download className="w-3 h-3" strokeWidth={2} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full aspect-[3/4] bg-muted/20 flex items-center justify-center overflow-hidden relative">
                              {isGenerating ? (
                                <>
                                  <video
                                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/grok-video-b534a4f9-fabf-4007-a154-92bc0152c850-3-HDawnKSeDAiRiCCCTAgfnIf2yYAzny.mp4"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-white/25 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="text-center bg-white/90 px-6 py-4 rounded-sm shadow-lg">
                                      <Loader2
                                        className="w-8 h-8 animate-spin text-primary mx-auto mb-3"
                                        strokeWidth={1.5}
                                      />
                                      <span className="text-xs font-medium text-foreground tracking-widest uppercase">
                                        Generating
                                      </span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground tracking-wide">Awaiting generation</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Decorative annotation arrows and notes */}
                    {technicalSketch && render3D && (
                      <>
                        <div className="absolute bottom-8 left-24 md:left-32 text-xs text-muted-foreground italic tracking-wide max-w-[120px] rotate-3">
                          <div className="h-px w-12 bg-border mb-2" />
                          sketch analysis
                        </div>
                        <div className="absolute bottom-16 right-24 md:right-32 text-xs text-muted-foreground italic tracking-wide max-w-[120px] -rotate-2 text-right">
                          <div className="h-px w-12 bg-border mb-2 ml-auto" />
                          photorealistic render
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Status message */}
              {error && (
                <div className="p-5 bg-destructive/5 border border-destructive/20 rounded-sm">
                  <p className="text-sm text-destructive leading-relaxed">{error}</p>
                </div>
              )}

              {showGeneratedImages && (
                <>
                  {/* Success message with artistic styling */}
                  {technicalSketch && render3D && (
                    <div className="relative p-6 bg-gradient-to-br from-primary/5 to-transparent border-l-2 border-primary/30 backdrop-blur-sm">
                      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-primary animate-pulse" />
                      <p className="text-sm text-foreground leading-relaxed tracking-wide pl-4">
                        <span className="font-serif text-lg font-medium">Transformation Complete.</span>
                        <br />
                        Your design has been analyzed and rendered through AI. Download your assets or continue to video
                        generation.
                      </p>
                    </div>
                  )}

                  {/* Feedback section with editorial styling */}
                  {technicalSketch && render3D && (
                    <div className="space-y-4 pt-8 border-t border-border/30">
                      <div className="text-center">
                        <div className="inline-block">
                          <div className="w-12 h-px bg-foreground/30 mx-auto mb-3" />
                          <h3 className="font-serif text-2xl text-foreground mb-1 tracking-tight">Design Notes</h3>
                          <p className="text-xs text-muted-foreground italic tracking-wide">
                            Refine your vision with specific material and detail adjustments
                          </p>
                        </div>
                      </div>

                      <div className="max-w-2xl mx-auto space-y-3">
                        <Textarea
                          placeholder="Cotton fabric with matte finish • Adjust sleeve length to 3/4 • Add pearl embellishments to neckline • Soften the waistline..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="min-h-32 resize-none border-border/30 bg-card/30 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/60 rounded-none font-light tracking-wide"
                          disabled={isSubmittingComment}
                        />

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground tracking-wider italic">
                            Updates VEO3 prompt in real-time
                          </p>
                          <Button
                            onClick={handleSubmitComment}
                            disabled={!comments.trim() || isSubmittingComment || commentSubmitted}
                            className="bg-foreground text-background hover:bg-foreground/90 h-10 px-8 tracking-[0.2em] uppercase text-xs font-medium"
                          >
                            {isSubmittingComment ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" strokeWidth={2} />
                                Processing
                              </>
                            ) : commentSubmitted ? (
                              <>
                                <Check className="w-3 h-3 mr-2" strokeWidth={2} />
                                Noted
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3 mr-2" strokeWidth={2} />
                                Submit
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {commentSubmitted && (
                        <div className="max-w-2xl mx-auto p-4 bg-primary/5 border-l-2 border-primary/30">
                          <p className="text-sm text-foreground leading-relaxed tracking-wide italic">
                            Your design notes have been incorporated into the generation parameters.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video section with editorial styling */}
                  {technicalSketch && render3D && (
                    <div className="space-y-6 pt-8 border-t border-border/30">
                      <div className="text-center">
                        <div className="inline-block">
                          <div className="w-12 h-px bg-foreground/30 mx-auto mb-3" />
                          <h3 className="font-serif text-2xl text-foreground mb-1 tracking-tight">Motion Studies</h3>
                          <p className="text-xs text-muted-foreground italic tracking-wide">
                            Generate cinematic presentations of your design
                          </p>
                        </div>
                      </div>

                      {video360Url && videoRunwayUrl ? (
                        <div className="space-y-10 max-w-5xl mx-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* 360° Video */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-px bg-border" />
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.3em]">
                                  360° Study
                                </h4>
                              </div>
                              <div className="relative bg-black border border-border/30 overflow-hidden shadow-lg">
                                <video
                                  src={video360Url}
                                  controls
                                  className="w-full h-auto object-contain"
                                  autoPlay
                                  loop
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                              <Button
                                onClick={() => handleDownload(video360Url, `fashion-360-${Date.now()}.mp4`)}
                                className="w-full bg-transparent border border-border hover:bg-muted/50 text-foreground h-11 tracking-[0.15em] uppercase text-xs"
                              >
                                <Download className="w-3 h-3 mr-2" strokeWidth={2} />
                                Download
                              </Button>
                            </div>

                            {/* Runway Video */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-px bg-border" />
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.3em]">
                                  Runway Presentation
                                </h4>
                              </div>
                              <div className="relative bg-black border border-border/30 overflow-hidden shadow-lg">
                                <video
                                  src={videoRunwayUrl}
                                  controls
                                  className="w-full h-auto object-contain"
                                  autoPlay
                                  loop
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                              <Button
                                onClick={() => handleDownload(videoRunwayUrl, `fashion-runway-${Date.now()}.mp4`)}
                                className="w-full bg-transparent border border-border hover:bg-muted/50 text-foreground h-11 tracking-[0.15em] uppercase text-xs"
                              >
                                <Download className="w-3 h-3 mr-2" strokeWidth={2} />
                                Download
                              </Button>
                            </div>
                          </div>

                          <div className="text-center">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setVideo360Url(null)
                                setVideoRunwayUrl(null)
                              }}
                              className="text-muted-foreground hover:text-foreground tracking-wider"
                            >
                              Generate New Videos
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-xl mx-auto space-y-4">
                          {videoError && (
                            <div className="p-6 bg-destructive/5 border-l-2 border-destructive/30">
                              <p className="text-sm text-destructive leading-relaxed tracking-wide">{videoError}</p>
                            </div>
                          )}
                          <Button
                            size="lg"
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo}
                            className="w-full bg-foreground text-background hover:bg-foreground/90 h-14 tracking-[0.2em] uppercase text-xs font-medium"
                          >
                            {isGeneratingVideo ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-3 animate-spin" strokeWidth={2} />
                                Generating (up to 2 minutes)
                              </>
                            ) : (
                              <>
                                <Video className="w-4 h-4 mr-3" strokeWidth={2} />
                                Generate Motion Studies
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground tracking-wider italic">
                            Two cinematic presentations: 360° rotation + runway model
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reset button */}
                  <div className="flex justify-center pt-8">
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={handleReset}
                      className="text-muted-foreground hover:text-foreground tracking-wider"
                    >
                      Begin New Transformation
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom note with editorial styling */}
        <div className="mt-16 text-center">
          <div className="inline-block max-w-md">
            <div className="h-px bg-border/30 mb-4" />
            <p className="text-xs text-muted-foreground leading-relaxed tracking-wider italic">
              All designs remain confidential under our atelier agreement. Your creative vision is protected.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
