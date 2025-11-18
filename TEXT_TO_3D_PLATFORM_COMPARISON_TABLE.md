# Text-to-3D Platform Quick Comparison Table

**Last Updated:** November 17, 2025
**Purpose:** Quick reference for platform selection decisions

---

## Top 10 Commercial Platforms - Complete Comparison

| Platform | Generation Speed | Quality Rating | Price (Entry) | API Available | Free Tier | Best For | Key Limitation |
|----------|------------------|----------------|---------------|---------------|-----------|----------|----------------|
| **Hunyuan 3D 3.0** | 7s | ⭐⭐⭐⭐⭐ | FREE | ✓ | ✓ | Production quality, medical use | Tencent Cloud required |
| **Tripo AI 3.0** | 8s | ⭐⭐⭐⭐⭐ | $0 (600 pts) | ✓ | ✓ | Speed, ease of use, animation | Free tier limited |
| **Meshy AI-5** | <60s | ⭐⭐⭐⭐⭐ | $0 (200 cr) | ✓ | ✓ | Game dev, animation library | Organic shapes need refinement |
| **Rodin AI** | <60s | ⭐⭐⭐⭐ | No free tier | Roadmap | ✗ | Professional topology, PBR | Animation in roadmap |
| **Luma AI** | 30-60s | ⭐⭐⭐⭐ | $0 (limited) | ✓ | ✓ | Video-to-3D, editing | API pricing separate |
| **CSM Cube** | ~30s | ⭐⭐⭐⭐ | 10-100 cr/mo | ✓ | ✗ | 3D worlds, product design | Less user reviews |
| **Spline AI** | ~30s | ⭐⭐⭐ | $20 + add-on | ✗ | ✓ (limited) | Web/mobile, beginners | AI is paid add-on |
| **Kaedim3D** | ~30s | ⭐⭐⭐ | Custom | ✓ | ✗ | Game studios, quality assurance | Variable mesh quality |
| **Alpha3D** | Variable | ⭐⭐⭐⭐ | 50 assets | ✓ | ✗ | Enterprise scale, e-commerce | Pricing not public |
| **Modelslab** | Variable | ⭐⭐⭐ | Developer tier | ✓ | ✗ | Developer API integration | Less feature detail |

**Legend:** ✓ = Yes, ✗ = No, cr = credits, pts = points, mo = month

---

## Feature-by-Feature Comparison

### Input Methods

| Platform | Text-to-3D | Image-to-3D | Sketch-to-3D | Video-to-3D | Multi-View |
|----------|------------|-------------|--------------|-------------|------------|
| Hunyuan 3D 3.0 | ✓ | ✓ | ✗ | ✗ | ✓ |
| Tripo AI 3.0 | ✓ | ✓ | ✓ | ✗ | ✓ |
| Meshy AI-5 | ✓ | ✓ | ✗ | ✗ | ✓ |
| Rodin AI | ✓ | ✓ | ✓ | ✗ | ✗ |
| Luma AI | ✓ | ✓ | ✗ | ✓ | ✗ |
| CSM Cube | ✓ | ✓ | ✓ | ✗ | ✗ |
| Spline AI | ✓ | ✓ | ✗ | ✗ | ✗ |
| Kaedim3D | ✗ | ✓ | ✓ | ✗ | ✗ |

---

### Output Features

| Platform | Auto-Rig | Animation | PBR Materials | Quad Mesh | Export Formats |
|----------|----------|-----------|---------------|-----------|----------------|
| Hunyuan 3D 3.0 | ✓ | ✓ | ✓ | ✓ | GLB, FBX, OBJ, USD |
| Tripo AI 3.0 | ✓ (T-pose) | ✓ | ✓ | ✓ | GLB, FBX, OBJ |
| Meshy AI-5 | ✓ | ✓ (500+) | ✓ | ✓ | GLB, FBX, OBJ |
| Rodin AI | Roadmap | Roadmap | ✓ | ✓ (clean) | Multiple |
| Luma AI | ✗ | ✗ | ✓ | ✗ | GLB, OBJ |
| CSM Cube | ✓ | ✓ | ✓ | ✓ | Multiple |
| Spline AI | ✗ | ✗ | ✓ | ✗ | Web, iOS, Android |
| Kaedim3D | ✗ | ✗ | ✓ | Variable | Multiple |

---

### Integration Capabilities

| Platform | Unity Plugin | Blender Plugin | Unreal Engine | API Documentation | Batch Processing |
|----------|--------------|----------------|---------------|-------------------|------------------|
| Hunyuan 3D 3.0 | ✗ | ✗ | ✗ | ✓ | ✓ |
| Tripo AI 3.0 | ✓ | ✓ | ✗ | ✓ | ✓ |
| Meshy AI-5 | ✓ | ✓ | ✗ | ✓ | ✓ |
| Rodin AI | ✗ | ✗ | ✗ | Roadmap | ✗ |
| Luma AI | ✗ | ✗ | ✗ | ✓ | ✓ |
| CSM Cube | ✓ | ✓ | ✗ | ✓ | ✓ |
| Spline AI | ✗ | ✗ | ✗ | ✗ | ✗ |
| Kaedim3D | ✓ | ✓ | ✓ | ✓ | ✗ |

---

## Open-Source Implementations Comparison

| Project | Maturity | Setup Difficulty | GPU Required | Quality | Speed | Best For |
|---------|----------|------------------|--------------|---------|-------|----------|
| **threestudio** | ⭐⭐⭐⭐ | Medium | High | High | Slow | Research, customization |
| **Shap-E** | ⭐⭐⭐⭐ | Easy | Low | Medium | 13s | Quick generation, learning |
| **Point-E** | ⭐⭐⭐ | Easy | Medium | Medium | 1-2min | Point clouds, prototyping |
| **Stable-DreamFusion** | ⭐⭐⭐ | Hard | Very High | High | Hours | Research, high quality |
| **Magic3D** | ⭐⭐ | Hard | Very High | Very High | 40min | Research only |
| **DreamFusion** | ⭐⭐ | N/A | Very High | High | 1.5hr | Reference only (not public) |

**GPU Requirements:**
- Low: 8GB VRAM (RTX 3060)
- Medium: 12GB VRAM (RTX 3080)
- High: 24GB VRAM (RTX 3090/4090)
- Very High: 40GB+ VRAM (A100)

---

## Pricing Tiers - Detailed Breakdown

### Hunyuan 3D 3.0 (Tencent)
| Tier | Price | Generations | Commercial | API | Notes |
|------|-------|-------------|------------|-----|-------|
| Free | $0 | Unlimited | ✓ | ✓ | Requires Tencent Cloud account |

### Tripo AI 3.0
| Tier | Price | Points/Month | Gens (Text) | Gens (Image) | Commercial |
|------|-------|--------------|-------------|--------------|------------|
| Free | $0 | 600 | 10 | 30 | ✗ |
| Basic | ~$20 | 2,000 | 33 | 100 | ✓ |
| Pro | ~$40 | 5,000 | 83 | 250 | ✓ |
| Enterprise | Custom | Custom | Unlimited | Unlimited | ✓ |

### Meshy AI-5
| Tier | Price | Credits/Month | Initial Gens | Refined Gens | Commercial |
|------|-------|---------------|--------------|--------------|------------|
| Free | $0 | 200 | 40 | 10 | ✗ |
| Starter | ~$20 | 1,000 | 200 | 50 | ✓ |
| Pro | ~$40 | 2,500 | 500 | 125 | ✓ |
| Enterprise | Custom | Custom | Unlimited | Unlimited | ✓ |

### Luma AI
| Tier | Price | Credits | Resolution | Watermark | Commercial |
|------|-------|---------|------------|-----------|------------|
| Free | $0 | Limited | 720p | ✓ | ✗ |
| Lite | $9.99 | 3,200 | 1080p | ✓ | ✗ |
| Plus | $29.99 | 10,000 | 1080p | ✗ | ✓ |
| Unlimited | $94.99 | 10,000 fast + unlimited relaxed | 1080p | ✗ | ✓ |
| Enterprise | Custom | Custom | 1080p | ✗ | ✓ |

**Note:** Luma API pricing is separate from web subscription

### Spline AI
| Tier | Price | AI Generation | Exports | Watermark | Notes |
|------|-------|---------------|---------|-----------|-------|
| Free | $0 | ✗ | Web (watermark) | ✓ | Limited files |
| Professional | $20 + add-on | ✓ (credit-based) | All platforms | ✗ | Requires AI add-on |
| Team | $36 + add-on | ✓ (credit-based) | All platforms | ✗ | Requires AI add-on |

---

## API Pricing Comparison (Cost per Generation)

| Platform | Image-to-3D | Text-to-3D | Batch Discount | Free Tier API |
|----------|-------------|------------|----------------|---------------|
| Hunyuan 3D | $0 | $0 | N/A | Unlimited |
| Tripo AI | $0.10 | $0.30 | ✗ | ✓ (600 pts) |
| Meshy AI | $0.05 | $0.10 | ✗ | ✓ (200 cr) |
| Luma AI | Varies | Varies | ✗ | Limited |
| PiAPI (Trellis) | $0.20 | $0.20 | ✗ | ✗ |
| Modelslab | Variable | Variable | ✓ | ✗ |
| Alpha3D | Subscription | Subscription | ✓ | ✗ |

**Best Value:**
- Free: Hunyuan 3D (unlimited)
- Low Volume: Meshy AI ($0.05/gen)
- High Volume: Hunyuan 3D (unlimited)

---

## Quality Assessment Matrix

### Geometric Quality

| Platform | Topology | Manifold | Quad Mesh | Triangle Count | UV Unwrap |
|----------|----------|----------|-----------|----------------|-----------|
| Hunyuan 3D 3.0 | Excellent | ✓ | ✓ | Optimized | Auto |
| Tripo AI 3.0 | Excellent | ✓ | ✓ | Optimized | Auto |
| Meshy AI-5 | Excellent | ✓ | ✓ | Optimized | Auto |
| Rodin AI | Outstanding | ✓ | ✓ (clean) | Optimized | Auto |
| Luma AI | Good | ✓ | ✗ | Variable | Auto |
| Kaedim3D | Variable | Sometimes | ✗ | Variable | Auto |

### Texture Quality

| Platform | Resolution | PBR Maps | Normal Maps | Roughness | Metallic | AO |
|----------|------------|----------|-------------|-----------|----------|-----|
| Hunyuan 3D 3.0 | Up to 4K | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tripo AI 3.0 | 2K-4K | ✓ | ✓ | ✓ | ✓ | ✓ |
| Meshy AI-5 | 2K-4K | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rodin AI | 2K-4K | ✓ | ✓ | ✓ | ✓ | ✓ |
| Luma AI | 1K-2K | ✓ | ✓ | ✗ | ✗ | ✗ |

### Consistency Ratings

| Platform | Multi-View | Prompt Accuracy | Detail Level | Edge Quality |
|----------|------------|-----------------|--------------|--------------|
| Hunyuan 3D 3.0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Tripo AI 3.0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Meshy AI-5 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Rodin AI | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Luma AI | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## Use Case Recommendations

### Medical/Anatomical Models (AI Surgeon Pilot)
**Recommended:**
1. Hunyuan 3D 3.0 (FREE, best quality)
2. Tripo AI 3.0 (fast, good quality)
3. threestudio (custom training)

**Why:** Accuracy critical, need validation, medical-specific training

---

### Game Development
**Recommended:**
1. Meshy AI-5 (Unity/Blender plugins, 500+ animations)
2. Tripo AI 3.0 (T-pose, auto-rig, fast iteration)
3. Kaedim3D (game studio focused)

**Why:** Animation, rigging, game engine integration

---

### Product Visualization (E-commerce)
**Recommended:**
1. Alpha3D (scale, product focus)
2. Hunyuan 3D 3.0 (quality, PBR)
3. Luma AI (photo-to-3D, editing)

**Why:** Photo-realistic, PBR materials, batch processing

---

### Rapid Prototyping
**Recommended:**
1. Tripo AI 3.0 (8 seconds)
2. Shap-E (13 seconds, free)
3. Hunyuan 3D 3.0 (7 seconds)

**Why:** Speed is priority, iterate quickly

---

### Research & Customization
**Recommended:**
1. threestudio (modular, customizable)
2. Stable-DreamFusion (high quality, customizable)
3. Shap-E (easy to modify)

**Why:** Need custom training, algorithm research

---

### Education & Learning
**Recommended:**
1. Tripo AI Free (600 points/month)
2. Meshy AI Free (200 credits)
3. Shap-E (completely free, open-source)

**Why:** Free tiers, easy to use, good for learning

---

### Professional Production (Film/VFX)
**Recommended:**
1. Rodin AI (clean topology, PBR)
2. Hunyuan 3D 3.0 (ultra-high res, quality)
3. Luma AI (editing features)

**Why:** Production-ready topology, professional pipelines

---

### Web/Mobile 3D Experiences
**Recommended:**
1. Spline AI (web/mobile export)
2. Luma AI (web-optimized GLB)
3. Tripo AI (lightweight exports)

**Why:** Web formats, optimization, performance

---

## Selection Decision Tree

```
Start Here
│
├─ Need FREE solution?
│  ├─ Yes → Hunyuan 3D 3.0 (unlimited, best quality)
│  └─ No → Continue
│
├─ Need FASTEST generation?
│  ├─ Yes → Tripo AI 3.0 (8s) or Hunyuan 3D (7s)
│  └─ No → Continue
│
├─ Need ANIMATION & RIGGING?
│  ├─ Yes → Meshy AI-5 (500+ animations) or Tripo AI (T-pose)
│  └─ No → Continue
│
├─ Need MEDICAL/DOMAIN-SPECIFIC?
│  ├─ Yes → Hunyuan 3D + threestudio (fine-tune)
│  └─ No → Continue
│
├─ Need GAME DEVELOPMENT?
│  ├─ Yes → Meshy AI-5 (Unity/Blender) or Tripo AI
│  └─ No → Continue
│
├─ Need ENTERPRISE SCALE?
│  ├─ Yes → Alpha3D or Hunyuan 3D API
│  └─ No → Continue
│
├─ Need CUSTOMIZATION?
│  ├─ Yes → threestudio (open-source)
│  └─ No → Hunyuan 3D 3.0 (best overall)
```

---

## Technology Stack Recommendations by Project Type

### Medical Education Platform (like AI Surgeon Pilot)
**Primary:** Hunyuan 3D 3.0
**Backup:** Tripo AI 3.0
**Custom:** threestudio (fine-tuning)
**Viewer:** Three.js or Babylon.js
**Estimated Cost:** $0-500/month

---

### Indie Game Studio
**Primary:** Meshy AI-5 or Tripo AI 3.0
**Backup:** Kaedim3D
**Tools:** Unity/Blender plugins
**Estimated Cost:** $40-200/month

---

### E-commerce Platform
**Primary:** Alpha3D or Hunyuan 3D
**Backup:** Luma AI
**Integration:** REST API
**Estimated Cost:** $300-1,000/month

---

### Research Lab
**Primary:** threestudio
**Secondary:** Stable-DreamFusion
**Tools:** Custom training pipeline
**Infrastructure:** Cloud GPU ($500-2,000/month)

---

### Educational Institution
**Primary:** Tripo AI Free + Meshy AI Free
**Paid:** Institutional licenses
**Estimated Cost:** $0-100/month per department

---

## Quick Decision Matrix

| Your Need | Top Choice | Runner-Up | Budget Option |
|-----------|------------|-----------|---------------|
| **Best Quality** | Hunyuan 3D 3.0 | Rodin AI | Meshy AI Free |
| **Fastest Speed** | Hunyuan 3D (7s) | Tripo AI (8s) | Shap-E (13s) |
| **Lowest Cost** | Hunyuan 3D (FREE) | Tripo AI Free | Shap-E (FREE) |
| **Animation** | Meshy AI-5 | Tripo AI 3.0 | N/A |
| **Medical Use** | Hunyuan 3D | threestudio | Tripo AI |
| **Game Dev** | Meshy AI-5 | Tripo AI 3.0 | Kaedim3D |
| **E-commerce** | Alpha3D | Hunyuan 3D | Luma AI |
| **Learning** | Tripo AI Free | Shap-E | Meshy AI Free |
| **Research** | threestudio | Stable-DreamFusion | Shap-E |
| **Web/Mobile** | Spline AI | Luma AI | Tripo AI |

---

## Platform Availability & Status (November 2025)

| Platform | Status | Availability | API Status | Last Update |
|----------|--------|--------------|------------|-------------|
| Hunyuan 3D 3.0 | ✅ Active | Global | ✅ Available | September 2025 |
| Tripo AI 3.0 | ✅ Active | Global | ✅ Available | September 2025 |
| Meshy AI-5 | ✅ Active | Global | ✅ Available | July 2025 |
| Rodin AI | ✅ Active | Global | 🔄 Roadmap | Active development |
| Luma AI | ✅ Active | Global | ✅ Available | Active |
| CSM Cube | ✅ Active | Global | ✅ Available | Active |
| Spline AI | ✅ Active | Global | ❌ No API | Active |
| Kaedim3D | ✅ Active | Global | ✅ Available | Active |
| Alpha3D | ✅ Active | Global | ✅ Available | Active |
| Modelslab | ✅ Active | Global | ✅ Available | Active |
| threestudio | ✅ Active | Open-source | N/A | Active development |
| Shap-E | ✅ Stable | Open-source | N/A | Maintained |
| Point-E | ⚠️ Superseded | Open-source | N/A | Stable (use Shap-E) |

**Legend:**
- ✅ = Fully available
- 🔄 = In development
- ❌ = Not available
- ⚠️ = Deprecated/superseded

---

## Final Recommendation for AI Surgeon Pilot

### Immediate Implementation (Week 1-2)

**Setup:**
1. Hunyuan 3D 3.0 (Primary) - FREE, best quality
2. Tripo AI 3.0 (Backup) - Free tier testing

**Cost:** $0/month

**Actions:**
- Sign up for both platforms
- Test 20+ medical anatomy prompts
- Compare quality and accuracy
- Document findings

---

### Short-Term (Months 1-3)

**Production Stack:**
- Primary: Hunyuan 3D 3.0 API
- Viewer: Three.js
- Backend: Supabase (current)
- Frontend: React + TypeScript (current)

**Cost:** $0-100/month

---

### Long-Term (Months 6-12)

**Add:**
- Custom fine-tuning with threestudio
- Medical dataset training
- DICOM integration
- Mobile app

**Cost:** $500-2,000/month (includes GPU infrastructure)

---

**Created:** November 17, 2025
**For:** AI Surgeon Pilot Platform Selection
**Status:** Ready for implementation
