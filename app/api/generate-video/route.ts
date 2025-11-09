import { type NextRequest, NextResponse } from "next/server"

export const maxDuration = 60 // seconds

export async function POST(request: NextRequest) {
  try {
    const { technicalSketch, render3D, comments } = await request.json()

    if (!technicalSketch) {
      return NextResponse.json({ error: "Technical sketch is required" }, { status: 400 })
    }

    const apiKey = process.env.VEO3_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "VEO3_API_KEY or GEMINI_API_KEY not configured" }, { status: 500 })
    }

    const usingVeo3Key = !!process.env.VEO3_API_KEY
    console.log(`[v0] Using ${usingVeo3Key ? "VEO3_API_KEY" : "GEMINI_API_KEY"} for video generation`)
    console.log(`[v0] API key starts with: ${apiKey.substring(0, 8)}...`)

    console.log("[v0] Analyzing design details with structured extraction...")
    const analysisResponse = await fetch(new URL("/api/analyze-design", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicalSketch, render3D }),
    })

    let detailedDescription = ""
    let metadata = null
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json()
      detailedDescription = analysisData.description
      metadata = analysisData.metadata
      console.log("[v0] Structured design analysis complete")
      console.log("[v0] Extracted metadata:", JSON.stringify(metadata, null, 2))
    } else {
      console.log("[v0] Design analysis failed, using generic description")
    }

    if (comments && metadata) {
      console.log("[v0] Processing user comments to update design specifications...")

      const commentsLower = comments.toLowerCase()

      // Extract fabric/material changes
      const fabricKeywords = [
        "cotton",
        "silk",
        "linen",
        "velvet",
        "satin",
        "chiffon",
        "lace",
        "denim",
        "wool",
        "polyester",
        "leather",
        "suede",
      ]
      for (const fabric of fabricKeywords) {
        if (commentsLower.includes(fabric)) {
          metadata.fabric_and_texture.primary_material = fabric
          console.log(`[v0] Updated fabric to: ${fabric}`)
        }
      }

      // Extract color changes
      const colorKeywords = [
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "pink",
        "orange",
        "black",
        "white",
        "gray",
        "grey",
        "brown",
        "beige",
        "cream",
        "ivory",
        "navy",
        "maroon",
        "teal",
        "turquoise",
        "gold",
        "silver",
        "bronze",
        "emerald",
        "sapphire",
        "ruby",
        "linen",
        "champagne",
        "burgundy",
        "coral",
        "lavender",
        "mint",
        "peach",
      ]
      const foundColors = colorKeywords.filter((color) => commentsLower.includes(color))
      if (foundColors.length > 0) {
        metadata.pattern_and_color.primary_colors = foundColors
        console.log(`[v0] Updated colors to: ${foundColors.join(", ")}`)
      }

      // Extract sheen/texture changes
      if (commentsLower.includes("matte")) {
        metadata.fabric_and_texture.sheen_level = "matte"
        console.log("[v0] Updated sheen to: matte")
      } else if (commentsLower.includes("glossy") || commentsLower.includes("shiny")) {
        metadata.fabric_and_texture.sheen_level = "high gloss"
        console.log("[v0] Updated sheen to: high gloss")
      } else if (commentsLower.includes("satin")) {
        metadata.fabric_and_texture.sheen_level = "satin sheen"
        console.log("[v0] Updated sheen to: satin sheen")
      }

      // Extract pattern changes
      if (commentsLower.includes("floral")) {
        metadata.pattern_and_color.pattern = "floral"
        console.log("[v0] Updated pattern to: floral")
      } else if (commentsLower.includes("striped") || commentsLower.includes("stripes")) {
        metadata.pattern_and_color.pattern = "striped"
        console.log("[v0] Updated pattern to: striped")
      } else if (commentsLower.includes("polka dot")) {
        metadata.pattern_and_color.pattern = "polka dot"
        console.log("[v0] Updated pattern to: polka dot")
      } else if (commentsLower.includes("solid")) {
        metadata.pattern_and_color.pattern = "solid color"
        console.log("[v0] Updated pattern to: solid color")
      }

      // Extract embellishment changes
      const embellishmentKeywords = [
        "sequins",
        "beads",
        "crystals",
        "rhinestones",
        "pearls",
        "embroidery",
        "applique",
        "lace",
        "ruffles",
        "bows",
        "ribbons",
        "fringe",
      ]
      const foundEmbellishments = embellishmentKeywords.filter((emb) => commentsLower.includes(emb))
      if (foundEmbellishments.length > 0) {
        metadata.embellishments.details = foundEmbellishments.join(", ")
        console.log(`[v0] Updated embellishments to: ${foundEmbellishments.join(", ")}`)
      }

      // Extract length changes
      if (commentsLower.includes("mini") || commentsLower.includes("short")) {
        metadata.silhouette.length = "mini/short length"
        console.log("[v0] Updated length to: mini/short")
      } else if (commentsLower.includes("midi")) {
        metadata.silhouette.length = "midi length"
        console.log("[v0] Updated length to: midi")
      } else if (
        commentsLower.includes("maxi") ||
        commentsLower.includes("floor-length") ||
        commentsLower.includes("long")
      ) {
        metadata.silhouette.length = "maxi/floor-length"
        console.log("[v0] Updated length to: maxi/floor-length")
      }
    }

    const designElements = metadata
      ? `- Silhouette: ${metadata.silhouette?.type || "elegant dress"} with ${metadata.silhouette?.overall_shape || "sophisticated silhouette"} and ${metadata.silhouette?.length || "full length"} with ${metadata.silhouette?.garment_separation || "seamless construction"} and ${metadata.silhouette?.proportions || "balanced proportions"}
- Fabric: ${metadata.fabric_and_texture?.primary_material || "quality fabric"} with ${metadata.fabric_and_texture?.texture_type || "smooth"} texture, ${metadata.fabric_and_texture?.sheen_level || "subtle sheen"} sheen, ${metadata.fabric_and_texture?.layering || "single layer"} layering, and ${metadata.fabric_and_texture?.drape_behavior || "elegant drape"} drape behavior
- Neckline: ${metadata.design_features?.neckline || "classic neckline"} - MUST BE EXACTLY THIS
- Sleeves: ${metadata.design_features?.sleeves || "sleeveless"} - MUST BE EXACTLY THIS
${metadata?.design_features?.cape_or_train && metadata.design_features.cape_or_train !== "none" ? `- Cape/Train: ${metadata.design_features.cape_or_train} - MUST BE EXACTLY THIS` : ""}
${metadata?.design_features?.cutouts && metadata.design_features.cutouts !== "none" ? `- Cutouts: ${metadata.design_features.cutouts} - MUST BE EXACTLY THIS` : ""}
- Waistline: ${metadata?.design_features?.waistline || "natural waist"}
- Colors: ${metadata?.pattern_and_color?.primary_colors?.join(" and ") || "as shown in design"} with ${metadata?.pattern_and_color?.color_zones || "throughout design"} placement${metadata?.pattern_and_color?.contrast_areas && metadata.pattern_and_color.contrast_areas !== "none" ? ` and ${metadata.pattern_and_color.contrast_areas} contrast areas` : ""}
- Pattern: ${metadata?.pattern_and_color?.patterns || "solid"}${metadata?.pattern_and_color?.pattern_layout ? ` with ${metadata.pattern_and_color.pattern_layout} layout` : ""}
- Embellishments: ${metadata?.embellishments?.details && metadata.embellishments.details !== "none" ? `${metadata.embellishments.details} placed ${metadata.embellishments.placement} with ${metadata.embellishments.density} density` : "No embellishments"}
`
      : "Elegant fashion design with sophisticated details"

    const commentsSection = comments ? `\nDESIGNER'S ADDITIONAL NOTES:\n${comments}\n` : ""

    const video360Prompt = `Create a professional 360-degree rotating showcase video of this EXACT fashion dress design with THESE SPECIFIC FEATURES:

CRITICAL: The dress MUST match ALL these exact design specifications:

EXACT SILHOUETTE & STRUCTURE:
- Type: ${metadata?.silhouette?.type || "elegant dress"}
- Overall Shape: ${metadata?.silhouette?.overall_shape || "sophisticated silhouette"}
- Length: ${metadata?.silhouette?.length || "full length"}
- Construction: ${metadata?.silhouette?.garment_separation || "seamless construction"}
- Proportions: ${metadata?.silhouette?.proportions || "balanced proportions"}

EXACT FABRIC & MATERIAL:
- Primary Material: ${metadata?.fabric_and_texture?.primary_material || "quality fabric"} - THIS IS MANDATORY
- Texture: ${metadata?.fabric_and_texture?.texture_type || "smooth"}
- Sheen: ${metadata?.fabric_and_texture?.sheen_level || "subtle sheen"}
- Layering: ${metadata?.fabric_and_texture?.layering || "single layer"}
- Draping: ${metadata?.fabric_and_texture?.drape_behavior || "elegant drape"}

EXACT DESIGN FEATURES:
- Neckline: ${metadata?.design_features?.neckline || "classic neckline"} - MUST BE EXACTLY THIS
- Sleeves: ${metadata?.design_features?.sleeves || "sleeveless"} - MUST BE EXACTLY THIS
${metadata?.design_features?.cape_or_train && metadata.design_features.cape_or_train !== "none" ? `- Cape/Train: ${metadata.design_features.cape_or_train} - MUST BE EXACTLY THIS` : ""}
${metadata?.design_features?.cutouts && metadata.design_features.cutouts !== "none" ? `- Cutouts: ${metadata.design_features.cutouts} - MUST BE EXACTLY THIS` : ""}
- Waistline: ${metadata?.design_features?.waistline || "natural waist"}

EXACT COLORS (MANDATORY - DO NOT SUBSTITUTE):
- Primary Colors: ${metadata?.pattern_and_color?.primary_colors?.join(" and ") || "as shown in design"}
- Color Placement: ${metadata?.pattern_and_color?.color_zones || "throughout design"}
${metadata?.pattern_and_color?.contrast_areas && metadata.pattern_and_color.contrast_areas !== "none" ? `- Contrast Areas: ${metadata.pattern_and_color.contrast_areas}` : ""}

EXACT PATTERNS & DETAILS:
- Pattern Type: ${metadata?.pattern_and_color?.patterns || "solid"}
${metadata?.pattern_and_color?.pattern_layout ? `- Pattern Layout: ${metadata.pattern_and_color.pattern_layout}` : ""}

EXACT EMBELLISHMENTS:
${
  metadata?.embellishments?.details && metadata.embellishments.details !== "none"
    ? `- Details: ${metadata.embellishments.details}
- Placement: ${metadata.embellishments.placement}
- Density: ${metadata.embellishments.density}`
    : "- No embellishments"
}

DIMENSIONAL CHARACTERISTICS:
- Volume Areas: ${metadata?.dimensional_cues?.volume_areas || "fitted through body"}
- Fabric Folds: ${metadata?.dimensional_cues?.fold_patterns || "natural drape"}
${commentsSection}

VIDEO EXECUTION REQUIREMENTS:
- Display Method: Dress on an invisible mannequin/dress form against clean neutral studio background (soft white or cream)
- Camera Movement: Smooth 360-degree clockwise rotation completing one full circle: Front → Right → Back → Left → Front
- Rotation Speed: Slow, elegant, continuous motion allowing all details to be clearly visible
- Camera Position: Eye-level at dress mid-chest height, maintaining consistent distance throughout rotation
- Lighting: Professional three-point studio lighting highlighting fabric texture, sheen, construction details, and all embellishments
- Focus: Sharp focus throughout with ALL design elements clearly visible
- Atmosphere: Luxury fashion boutique product showcase

ABSOLUTE REQUIREMENT: The dress in the video MUST exactly match the colors, fabric type, silhouette, neckline, sleeves, length, and all other specifications listed above. Do not substitute or change any design elements.`

    const runwayPrompt = `Create a professional fashion runway video featuring a model wearing this EXACT dress design with THESE SPECIFIC FEATURES:

CRITICAL: The dress MUST match ALL these exact design specifications:

EXACT SILHOUETTE & STRUCTURE:
- Type: ${metadata?.silhouette?.type || "elegant dress"}
- Overall Shape: ${metadata?.silhouette?.overall_shape || "sophisticated silhouette"}
- Length: ${metadata?.silhouette?.length || "full length"}
- Construction: ${metadata?.silhouette?.garment_separation || "seamless construction"}

EXACT FABRIC & MATERIAL:
- Primary Material: ${metadata?.fabric_and_texture?.primary_material || "quality fabric"} - THIS IS MANDATORY
- Texture: ${metadata?.fabric_and_texture?.texture_type || "smooth"}
- Sheen: ${metadata?.fabric_and_texture?.sheen_level || "subtle sheen"}
- Movement Behavior: ${metadata?.fabric_and_texture?.drape_behavior || "elegant movement"}

EXACT DESIGN FEATURES:
- Neckline: ${metadata?.design_features?.neckline || "classic neckline"} - MUST BE EXACTLY THIS
- Sleeves: ${metadata?.design_features?.sleeves || "sleeveless"} - MUST BE EXACTLY THIS
${metadata?.design_features?.cape_or_train && metadata.design_features.cape_or_train !== "none" ? `- Cape/Train: ${metadata.design_features.cape_or_train} - MUST BE EXACTLY THIS` : ""}
${metadata?.design_features?.cutouts && metadata.design_features.cutouts !== "none" ? `- Cutouts: ${metadata.design_features.cutouts} - MUST BE EXACTLY THIS` : ""}
- Waistline: ${metadata?.design_features?.waistline || "natural waist"}

EXACT COLORS (MANDATORY - DO NOT SUBSTITUTE):
- Primary Colors: ${metadata?.pattern_and_color?.primary_colors?.join(" and ") || "as shown in design"}
- Color Placement: ${metadata?.pattern_and_color?.color_zones || "throughout design"}

EXACT PATTERNS & EMBELLISHMENTS:
- Pattern: ${metadata?.pattern_and_color?.patterns || "solid"}
${metadata?.embellishments?.details && metadata.embellishments.details !== "none" ? `- Embellishments: ${metadata.embellishments.details} ${metadata.embellishments.placement}` : ""}
${commentsSection}

VIDEO EXECUTION REQUIREMENTS:
- Scene: Professional high-fashion runway show with dramatic lighting
- Model: Professional adult fashion model with confident, elegant runway walk
- Camera: Following model from front as she walks toward camera down the runway
- Walk Style: Confident runway stride showing natural fabric movement and draping
- Background: Stylish runway with spotlights, professional fashion show atmosphere with audience
- Lighting: Dramatic runway spotlights highlighting the dress details and fabric movement
- Focus: Clear focus on model and dress, capturing how fabric moves, flows, and drapes during walking
- Pacing: Professional runway walk speed showing dress movement naturally

ABSOLUTE REQUIREMENT: The dress worn by the model MUST exactly match the colors, fabric type, silhouette, neckline, sleeves, length, and all other specifications listed above. The video should show how THIS SPECIFIC DRESS moves and looks on a professional runway. Do not substitute or change any design elements.`

    console.log("[v0] Starting VEO3 dual video generation")
    console.log("[v0] 360° video prompt length:", video360Prompt.length, "characters")
    console.log("[v0] Runway video prompt length:", runwayPrompt.length, "characters")

    const { GoogleGenAI, PersonGeneration } = await import("@google/genai")

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    })

    console.log("[v0] Starting parallel video generation...")
    const [operation360, operationRunway] = await Promise.all([
      ai.models.generateVideos({
        model: "veo-3.0-fast-generate-001",
        prompt: video360Prompt,
        config: {
          numberOfVideos: 1,
          aspectRatio: "9:16",
          durationSeconds: 8,
          resolution: "720p",
        },
      }),
      ai.models.generateVideos({
        model: "veo-3.0-fast-generate-001",
        prompt: runwayPrompt,
        config: {
          numberOfVideos: 1,
          aspectRatio: "9:16",
          durationSeconds: 8,
          personGeneration: PersonGeneration.ALLOW_ALL,
          resolution: "720p",
        },
      }),
    ])

    console.log(`[v0] Both video generation operations started`)
    console.log(`[v0] 360° video operation: ${operation360.name}`)
    console.log(`[v0] Runway video operation: ${operationRunway.name}`)

    const startTime = Date.now()
    let op360 = operation360
    let opRunway = operationRunway

    while (!op360.done || !opRunway.done) {
      console.log(
        `[v0] Polling status - 360°: ${op360.done ? "DONE" : "IN_PROGRESS"}, Runway: ${opRunway.done ? "DONE" : "IN_PROGRESS"}`,
      )

      await new Promise((resolve) => setTimeout(resolve, 10000))

      // Poll both operations
      const [updated360, updatedRunway] = await Promise.all([
        op360.done ? op360 : ai.operations.getVideosOperation({ operation: op360 }),
        opRunway.done ? opRunway : ai.operations.getVideosOperation({ operation: opRunway }),
      ])

      op360 = updated360
      opRunway = updatedRunway

      if (Date.now() - startTime > maxDuration * 1000) {
        return NextResponse.json({ error: "Video generation timed out" }, { status: 408 })
      }
    }

    console.log(`[v0] Both videos generated successfully!`)
    console.log(`[v0] 360° video count: ${op360.response?.generatedVideos?.length ?? 0}`)
    console.log(`[v0] Runway video count: ${opRunway.response?.generatedVideos?.length ?? 0}`)

    const video360Uri = op360.response?.generatedVideos?.[0]?.video?.uri
    const videoRunwayUri = opRunway.response?.generatedVideos?.[0]?.video?.uri

    if (video360Uri && videoRunwayUri) {
      const video360Url = `${video360Uri}&key=${apiKey}`
      const videoRunwayUrl = `${videoRunwayUri}&key=${apiKey}`

      console.log("[v0] Both videos generated successfully!")

      return NextResponse.json({
        success: true,
        video360Url: video360Url,
        videoRunwayUrl: videoRunwayUrl,
        video360Filename: `fashion-360-${Date.now()}.mp4`,
        videoRunwayFilename: `fashion-runway-${Date.now()}.mp4`,
        prompt360: video360Prompt,
        promptRunway: runwayPrompt,
      })
    }

    return NextResponse.json({ error: "One or both videos failed to generate" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error generating fashion videos:", error)

    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = error.message as string

      if (
        errorMessage.includes("quota") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("429")
      ) {
        return NextResponse.json(
          {
            error: "Video generation quota exceeded. Please try again later.",
            isQuotaError: true,
          },
          { status: 429 },
        )
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
