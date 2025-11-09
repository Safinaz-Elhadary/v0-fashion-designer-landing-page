import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { technicalSketch, render3D } = await request.json()

    if (!technicalSketch || !render3D) {
      return NextResponse.json({ error: "Both technical sketch and 3D render are required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
    })

    // Extract base64 data from data URLs
    const technicalBase64 = technicalSketch.split(",")[1]
    const renderBase64 = render3D.split(",")[1]

    const prompt = `You are a professional fashion design analyst. Analyze these two images of the same dress design (technical sketch and 3D render) and extract STRUCTURED design metadata.

Extract the following information in JSON format:

{
  "silhouette": {
    "type": "A-line | mermaid | sheath | ball gown | fit-and-flare | empire | bodycon | etc",
    "overall_shape": "detailed description of the outline shape",
    "garment_separation": "description of how pieces connect (e.g., 'fitted bodice with flowing skirt')",
    "proportions": "bust-waist-hip balance description",
    "length": "mini | midi | maxi | floor-length | train"
  },
  "fabric_and_texture": {
    "primary_material": "silk | satin | chiffon | tulle | lace | velvet | cotton | brocade | etc",
    "texture_type": "smooth | textured | embroidered | patterned | plain",
    "sheen_level": "matte | subtle sheen | glossy | metallic",
    "layering": "description of any overlays, linings, or multiple fabric layers",
    "drape_behavior": "how fabric falls and moves"
  },
  "design_features": {
    "neckline": "V-neck | scoop | square | boat | off-shoulder | halter | sweetheart | mock neck | etc",
    "sleeves": "sleeveless | cap sleeve | short | 3/4 | long | bell | puff | bishop | sheer | etc",
    "cape_or_train": "description of any cape, train, or flowing elements with attachment points",
    "cutouts": "description of any cutout sections, exposed midriff, or two-piece design",
    "waistline": "natural | empire | dropped | belted | seamed",
    "closures": "zipper | buttons | lace-up | hook-and-eye | invisible"
  },
  "pattern_and_color": {
    "primary_colors": ["color1", "color2"],
    "color_zones": "description of where each color appears",
    "patterns": "geometric | floral | damask | embroidered motifs | solid | etc",
    "pattern_layout": "description of pattern placement and symmetry",
    "contrast_areas": "borders, trims, or contrasting sections"
  },
  "dimensional_cues": {
    "volume_areas": "where the dress has volume (skirt, sleeves, train)",
    "shading_analysis": "how light and shadow define shape",
    "fold_patterns": "natural fabric folds and draping",
    "depth_elements": "3D elements like ruffles, tiers, or dimensional embellishments"
  },
  "pose_and_dynamics": {
    "dress_fall_direction": "how gravity affects the dress",
    "fabric_flow": "movement pattern of flowing elements",
    "rotation_anchor": "center point for 360° rotation (usually waist/torso center)",
    "movement_potential": "how fabric would move during rotation"
  },
  "embellishments": {
    "details": "beading | sequins | embroidery | appliqués | rhinestones | pearls | etc",
    "placement": "where embellishments are located",
    "density": "sparse | moderate | heavily embellished",
    "special_features": "any unique decorative elements"
  }
}

Return ONLY valid JSON. Be extremely specific and detailed. If something is not present, use null or "none".`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/png",
          data: technicalBase64,
        },
      },
      {
        inlineData: {
          mimeType: "image/png",
          data: renderBase64,
        },
      },
      { text: prompt },
    ])

    const responseText = result.response.text()
    console.log("[v0] Raw analysis response:", responseText)

    let metadata
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText
      metadata = JSON.parse(jsonString)
    } catch (e) {
      console.error("[v0] Failed to parse JSON, using fallback", e)
      // Create a basic structure if parsing fails
      metadata = {
        silhouette: { type: "elegant dress", overall_shape: "fashion design" },
        fabric_and_texture: { primary_material: "quality fabric" },
      }
    }

    const naturalDescription = generateNaturalDescription(metadata)

    console.log("[v0] Structured metadata extracted:", JSON.stringify(metadata, null, 2))
    console.log("[v0] Natural description:", naturalDescription)

    return NextResponse.json({
      success: true,
      metadata: metadata,
      description: naturalDescription,
    })
  } catch (error) {
    console.error("[v0] Error analyzing design:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze design",
      },
      { status: 500 },
    )
  }
}

function generateNaturalDescription(metadata: any): string {
  const parts: string[] = []

  // Silhouette
  if (metadata.silhouette) {
    const sil = metadata.silhouette
    parts.push(
      `This is a ${sil.type || "elegant"} ${sil.length || "full-length"} dress with ${sil.overall_shape || "a sophisticated silhouette"}.`,
    )
    if (sil.garment_separation) {
      parts.push(`The design features ${sil.garment_separation}.`)
    }
  }

  // Fabric & Texture
  if (metadata.fabric_and_texture) {
    const fabric = metadata.fabric_and_texture
    const fabricDesc = `The dress is crafted from ${fabric.primary_material || "luxurious fabric"} with a ${fabric.sheen_level || "subtle"} finish and ${fabric.texture_type || "smooth"} texture.`
    parts.push(fabricDesc)
    if (fabric.layering) {
      parts.push(`It incorporates ${fabric.layering}.`)
    }
    if (fabric.drape_behavior) {
      parts.push(`The fabric ${fabric.drape_behavior}.`)
    }
  }

  // Design Features
  if (metadata.design_features) {
    const design = metadata.design_features
    if (design.neckline) {
      parts.push(`The neckline is ${design.neckline}.`)
    }
    if (design.sleeves && design.sleeves !== "none") {
      parts.push(`It has ${design.sleeves} sleeves.`)
    }
    if (design.cape_or_train && design.cape_or_train !== "none") {
      parts.push(`The design includes ${design.cape_or_train}.`)
    }
    if (design.cutouts && design.cutouts !== "none") {
      parts.push(`Notable features include ${design.cutouts}.`)
    }
    if (design.waistline) {
      parts.push(`The waistline is ${design.waistline}.`)
    }
  }

  // Color & Pattern
  if (metadata.pattern_and_color) {
    const color = metadata.pattern_and_color
    if (color.primary_colors && color.primary_colors.length > 0) {
      parts.push(`The color palette features ${color.primary_colors.join(" and ")}.`)
    }
    if (color.patterns && color.patterns !== "solid" && color.patterns !== "none") {
      parts.push(
        `The dress showcases ${color.patterns} patterns${color.pattern_layout ? ` with ${color.pattern_layout}` : ""}.`,
      )
    }
    if (color.contrast_areas && color.contrast_areas !== "none") {
      parts.push(`Contrast details include ${color.contrast_areas}.`)
    }
  }

  // Embellishments
  if (metadata.embellishments && metadata.embellishments.details && metadata.embellishments.details !== "none") {
    const emb = metadata.embellishments
    parts.push(
      `The dress is adorned with ${emb.details}${emb.placement ? ` ${emb.placement}` : ""}${emb.density ? `, creating a ${emb.density} embellished effect` : ""}.`,
    )
  }

  // Dimensional & Movement
  if (metadata.dimensional_cues) {
    const dim = metadata.dimensional_cues
    if (dim.volume_areas) {
      parts.push(`Volume and dimension are emphasized in ${dim.volume_areas}.`)
    }
    if (dim.fold_patterns) {
      parts.push(`The fabric creates ${dim.fold_patterns}.`)
    }
  }

  // Movement dynamics for video
  if (metadata.pose_and_dynamics) {
    const pose = metadata.pose_and_dynamics
    if (pose.fabric_flow) {
      parts.push(`As the dress rotates, expect ${pose.fabric_flow}.`)
    }
  }

  return parts.join(" ")
}
