import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { image, imageType, preferences } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "")

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        responseModalities: ["Text", "Image"],
      },
    })

    const preferenceContext = preferences
      ? `\n\nDESIGNER SPECIFICATIONS:\n${preferences}\n\nEnsure these specific details are accurately reflected in the output.`
      : ""

    let prompt = ""
    if (imageType === "technical") {
      prompt = `Transform this fashion design sketch into a highly detailed technical fashion sketch with:
- Clean, precise line work showing construction details
- Flat technical drawing style (front and back views if possible)
- Detailed seam lines, darts, and construction elements
- Professional technical illustration quality
- Measurements and proportions clearly indicated
- Black and white or minimal color technical drawing style
Keep the original design but make it look like a professional technical specification drawing.${preferenceContext}`
    } else if (imageType === "3d") {
      prompt = `Transform this fashion design sketch into a realistic 3D rendered image with:
- Photorealistic fabric textures and materials
- Professional fashion photography lighting
- Model wearing the garment in a studio setting
- High-end fashion campaign aesthetic
- Detailed fabric draping and movement
- Professional color grading and finish
Make it look like a high-quality fashion editorial photograph.${preferenceContext}`
    }

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
    ]

    console.log("[v0] Generating image with Nano Banana for type:", imageType)
    if (preferences) {
      console.log("[v0] Design preferences:", preferences)
    }
    const result = await model.generateContent(contents)
    const response = result.response
    console.log("[v0] Response received, extracting image data")

    // Extract generated image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedImage = part.inlineData.data
          console.log("[v0] Image successfully generated")
          return NextResponse.json({
            image: `data:${part.inlineData.mimeType};base64,${generatedImage}`,
            success: true,
          })
        }
      }
    }

    console.error("[v0] No image found in response")
    return NextResponse.json({ error: "No image generated" }, { status: 500 })
  } catch (error) {
    console.error("[v0] Error generating image:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    )
  }
}
