# Text-to-3D Training: Quick Start Guide

**Last Updated:** 2025-11-17
**Target:** >90% accuracy, <90 seconds generation time
**Status:** ✅ Both targets achievable

---

## TL;DR - Can We Achieve Project Targets?

| Target | Status | Current SOTA | Recommendation |
|--------|--------|--------------|----------------|
| <90s generation | ✅ YES | 0.4-20 seconds | Use feed-forward architecture (Turbo3D style) |
| >90% accuracy | ✅ YES | F-Score 0.92, CLIP 0.35 | Train on Objaverse-XL + Cap3D with multi-stage pipeline |

**Bottom Line:** Both targets are not just achievable—they're conservative. Modern methods generate in <1 second with >90% geometric accuracy.

---

## 1. Essential Datasets (Start Here)

### Primary Dataset Combination (Recommended)

```
Objaverse-XL (10M 3D objects)
├── Download: Hugging Face + Google Colab tutorial
├── Size: Largest 3D dataset (100x bigger than alternatives)
└── License: ODC-By v1.0

Cap3D (1M captions)
├── Download: Hugging Face (tiange/Cap3D)
├── Includes: 20 rendered views, point clouds, camera data
└── Quality: High-quality descriptive captions

ShapeNet (51K objects)
├── Download: shapenet.org or HuggingFace
├── Use: Pre-training and validation
└── Categories: 55 common objects
```

**Why This Combination?**
- Objaverse-XL: Scale and diversity
- Cap3D: Text-3D alignment quality
- ShapeNet: Standardized pre-training and benchmarking

### Domain-Specific Options

**For Mechanical/CAD Parts:**
- MCB (58K mechanical components): https://github.com/stnoah1/mcb
- Sketchfab API: 1M+ models with mechanical collections
- ABC Dataset: 1M CAD models

**For Indoor Scenes:**
- 3D-FRONT: 18K furnished rooms
- Download: https://tianchi.aliyun.com/specials/promotion/alibaba-3d-scene-dataset

---

## 2. Hardware Requirements

### Minimum Setup
```
Development/Prototyping:
├── GPU: 1x RTX 3090 (24GB) or A100 40GB
├── RAM: 64GB
└── Storage: 2TB SSD

Production Training:
├── GPU: 8x A100 80GB
├── RAM: 512GB
├── Storage: 10TB NVMe SSD
└── Network: 100Gbps (InfiniBand preferred)
```

### Cloud GPU Pricing (2024)

| Provider | GPU | Price/Hour | Best For |
|----------|-----|------------|----------|
| **RunPod** | A100 80GB | $1.19 | Most affordable |
| Lambda Labs | A100 40GB | $1.29 | Consistent availability |
| CoreWeave | A100 40GB | $2.39 | Enterprise workloads |
| Azure | A100 40GB | $3.40 | Integration with Azure |
| GCP | A100 40GB | $3.67 | Integration with GCP |

**Recommendation:** RunPod for cost-effectiveness

### Training Time Estimates

```
Single A100 80GB:
├── Pre-training: 2-4 weeks
├── Main training: 6-12 weeks
└── Fine-tuning: 1 week

8x A100 80GB (Recommended):
├── Pre-training: 3-7 days
├── Main training: 1-3 weeks
├── Fine-tuning: 1-3 days
└── Total: 2-4 weeks
```

### Cost Estimate (Cloud Training)

```
Full Training Pipeline (8x A100 80GB, RunPod):
├── Data prep: $100-200
├── Pre-training: $3,199
├── Main training: $4,799
├── Fine-tuning: $571
├── Distillation: $800
└── Total: ~$9,859

Optimization strategies can reduce by 30-50%
```

---

## 3. Training Architecture (Recommended)

### Feed-Forward Pipeline ⭐ RECOMMENDED

```
Text Input ("a red sports car")
    ↓
CLIP + T5 Text Encoder
    ↓
4-View Latent Diffusion Generator (4 steps)
    ↓
Transformer-based Sparse-View Reconstructor
    ↓
3D Gaussian Splatting / NeRF
    ↓
High-Quality 3D Model (<1 second)
```

**Why Feed-Forward?**
- 100x faster than optimization methods
- Scalable to large datasets
- Consistent quality
- Production-ready

**Avoid:** Optimization-based methods (DreamFusion, Magic3D) - too slow for production

### Key Components

**Text Encoder:**
- CLIP ViT-L/14 (vision-language alignment)
- T5-XXL (rich text understanding)

**Multi-View Generator:**
- 4-view latent diffusion (Turbo3D approach)
- Dual-teacher distillation (multi-view + single-view)
- Latent space processing (eliminates decoding overhead)

**3D Reconstructor:**
- Transformer-based architecture
- Sparse-view reconstruction (4 views sufficient)
- Direct regression to 3D representation

**Representation:**
- 3D Gaussian Splatting (real-time rendering, <1s generation)
- OR NeRF (higher quality, ~20s generation)

---

## 4. Training Pipeline (Step-by-Step)

### Phase 1: Data Preparation (1-2 weeks)

```bash
# 1. Download Objaverse-XL
# Follow: https://github.com/allenai/objaverse-xl
# Use Google Colab tutorial for download

# 2. Download Cap3D
# From: Hugging Face (tiange/Cap3D)

# 3. Download ShapeNet
# From: shapenet.org

# 4. Filter quality
python filter_dataset.py \
  --min_polygons 1000 \
  --max_polygons 100000 \
  --min_texture_res 512 \
  --remove_broken_meshes

# 5. Generate multi-view renderings
python render_multiview.py \
  --num_views 20 \
  --resolution 512 \
  --output_dir ./rendered_views

# 6. Extract CLIP embeddings
python extract_embeddings.py \
  --captions ./cap3d_captions.json \
  --output ./embeddings

# 7. Create splits
python create_splits.py \
  --train 0.8 \
  --val 0.1 \
  --test 0.1
```

### Phase 2: Pre-training (1-2 weeks on 8x A100)

```python
# Use NeRF-MAE or similar self-supervised approach
python train.py \
  --dataset shapenet \
  --model nerf_mae \
  --gpus 8 \
  --batch_size 16 \
  --steps 200000 \
  --checkpoint_every 10000 \
  --validate_every 5000
```

### Phase 3: Main Training (2-3 weeks on 8x A100)

```python
# Feed-forward text-to-3D training
python train.py \
  --dataset objaverse_xl \
  --captions cap3d \
  --model turbo3d \
  --pretrained ./checkpoints/nerf_mae_200k.pt \
  --gpus 8 \
  --batch_size 8 \
  --steps 1000000 \
  --checkpoint_every 10000 \
  --validate_every 2000 \
  --multi_stage \
  --coarse_steps 300000 \
  --fine_steps 700000
```

### Phase 4: Fine-tuning (3-5 days on 4x A100)

```python
# Domain-specific adaptation
python finetune.py \
  --checkpoint ./checkpoints/main_1000k.pt \
  --dataset mcb \
  --gpus 4 \
  --batch_size 16 \
  --steps 100000 \
  --use_lora \
  --lora_rank 8
```

### Phase 5: Distillation (1 week on 4x A100)

```python
# Speed optimization via knowledge distillation
python distill.py \
  --teacher ./checkpoints/main_1000k.pt \
  --student turbo3d_small \
  --dual_teacher \
  --multiview_teacher ./checkpoints/multiview.pt \
  --singleview_teacher ./checkpoints/singleview.pt \
  --target_latency 1.0 \
  --gpus 4 \
  --steps 100000
```

---

## 5. Evaluation Metrics

### Critical Metrics (Track All)

```python
# Geometric Accuracy
chamfer_distance(pred, gt)      # Target: <0.002
f_score(pred, gt, threshold=0.01)  # Target: >0.90
earth_mover_distance(pred, gt)  # Target: <0.005

# Visual Quality
lpips(rendered_views, gt_views)  # Target: <0.10
psnr(rendered_views, gt_views)   # Target: >25 dB
ssim(rendered_views, gt_views)   # Target: >0.85

# Text-3D Alignment
clip_score(rendered_views, text)  # Target: >0.30

# Multi-view Consistency
view_consistency(rendered_views)  # Target: >0.90
```

### Implementation

```python
from pytorch3d.loss import chamfer_distance
from emd import earth_mover_distance
import lpips
import clip

# Geometric
loss_chamfer, _ = chamfer_distance(pred_points, gt_points)
f_score, precision, recall = compute_f_score(pred_points, gt_points)

# Visual
loss_fn_lpips = lpips.LPIPS(net='vgg')
lpips_score = loss_fn_lpips(pred_images, gt_images)

# Alignment
model, preprocess = clip.load("ViT-B/32", device="cuda")
clip_score = compute_clip_score(model, preprocess, rendered_views, text_prompt)
```

### Benchmarking

```python
# Use T³Bench for comprehensive evaluation
python evaluate.py \
  --checkpoint ./checkpoints/final.pt \
  --benchmark t3bench \
  --metrics all \
  --output ./results/evaluation.json

# Human evaluation
python human_eval.py \
  --checkpoint ./checkpoints/final.pt \
  --num_samples 1000 \
  --annotators 3 \
  --output ./results/human_eval.json
```

---

## 6. Implementation Code

### Distributed Training Setup (PyTorch DDP)

```python
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def setup_distributed(rank, world_size):
    """Initialize distributed training"""
    dist.init_process_group(backend='nccl', rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

def train_distributed(rank, world_size, model, dataset):
    setup_distributed(rank, world_size)

    # Move model to GPU
    model = model.to(rank)

    # Convert BatchNorm to SyncBatchNorm
    model = torch.nn.SyncBatchNorm.convert_sync_batchnorm(model)

    # Wrap with DDP
    model = DDP(model, device_ids=[rank])

    # Create distributed sampler
    sampler = torch.utils.data.distributed.DistributedSampler(
        dataset, num_replicas=world_size, rank=rank
    )

    # DataLoader
    loader = torch.utils.data.DataLoader(
        dataset, batch_size=8, sampler=sampler
    )

    # Training loop
    for epoch in range(num_epochs):
        sampler.set_epoch(epoch)
        for batch in loader:
            # Training step
            ...

# Launch with torchrun
# torchrun --nproc_per_node=8 train.py
```

### Evaluation Pipeline

```python
def evaluate_comprehensive(model, test_dataset):
    """Comprehensive evaluation on all metrics"""
    results = {
        'geometric': {'chamfer': [], 'emd': [], 'f_score': []},
        'visual': {'lpips': [], 'psnr': [], 'ssim': []},
        'alignment': {'clip_score': []},
        'consistency': {'view_consistency': []},
        'speed': {'generation_time': []}
    }

    for sample in test_dataset:
        # Generate 3D model
        start_time = time.time()
        pred_3d = model.generate(sample['text'])
        gen_time = time.time() - start_time

        # Geometric metrics
        results['geometric']['chamfer'].append(
            chamfer_distance(pred_3d, sample['gt_3d']).item()
        )
        results['geometric']['emd'].append(
            earth_mover_distance(pred_3d, sample['gt_3d']).item()
        )
        results['geometric']['f_score'].append(
            compute_f_score(pred_3d, sample['gt_3d']).item()
        )

        # Visual metrics
        views = render_multiview(pred_3d, num_views=20)
        gt_views = sample['gt_views']

        results['visual']['lpips'].append(
            lpips_metric(views, gt_views).mean().item()
        )

        # Alignment
        results['alignment']['clip_score'].append(
            clip_similarity(views, sample['text']).mean().item()
        )

        # Speed
        results['speed']['generation_time'].append(gen_time)

    # Aggregate
    return {
        category: {metric: np.mean(values) for metric, values in metrics.items()}
        for category, metrics in results.items()
    }
```

---

## 7. Common Issues & Solutions

### Memory Issues

**Problem:** OOM (Out of Memory) during training

**Solutions:**
```python
# 1. Reduce batch size
--batch_size 4  # Instead of 8

# 2. Gradient accumulation
--batch_size 2
--gradient_accumulation_steps 4  # Effective batch size: 8

# 3. Mixed precision
--mixed_precision fp16

# 4. Gradient checkpointing
--gradient_checkpointing

# 5. For Gaussian Splatting
--densify_grad_threshold 0.0005
--densify_until_iter 10000
--test_iterations -1
```

### Training Instability

**Problem:** NaN losses, exploding gradients

**Solutions:**
```python
# 1. Gradient clipping
--max_grad_norm 1.0

# 2. Lower learning rate
--learning_rate 1e-5  # Instead of 1e-4

# 3. Warmup
--warmup_steps 10000

# 4. Use more stable loss (VSD instead of SDS)
--loss_type vsd
```

### Poor Text Alignment

**Problem:** Generated 3D doesn't match text prompt

**Solutions:**
```python
# 1. Increase CLIP loss weight
--clip_loss_weight 1.0  # Instead of 0.1

# 2. Use stronger text encoder
--text_encoder clip_vit_l_14  # Or T5-XXL

# 3. More training data with high-quality captions
--use_cap3d

# 4. Multi-view CLIP consistency
--multiview_clip_loss
```

### Slow Generation

**Problem:** Generation takes >90 seconds

**Solutions:**
```python
# 1. Use feed-forward architecture (not optimization-based)
--architecture feed_forward

# 2. Reduce number of diffusion steps
--num_diffusion_steps 4  # Instead of 50

# 3. Latent space processing
--latent_space_processing

# 4. Smaller model for inference
--use_distilled_model

# 5. Mixed precision inference
--inference_precision fp16
```

---

## 8. Quick Command Reference

### Complete Training Pipeline

```bash
# 1. Setup environment
conda create -n text2-3d python=3.10
conda activate text2-3d
pip install torch torchvision pytorch3d lpips clip transformers

# 2. Download datasets
python scripts/download_objaverse_xl.py --subset 10M
python scripts/download_cap3d.py
python scripts/download_shapenet.py

# 3. Preprocess
python scripts/preprocess.py \
  --filter_quality \
  --render_multiview \
  --extract_embeddings \
  --create_splits

# 4. Pre-train
torchrun --nproc_per_node=8 train.py \
  --stage pretrain \
  --dataset shapenet \
  --steps 200000

# 5. Main train
torchrun --nproc_per_node=8 train.py \
  --stage main \
  --dataset objaverse_xl \
  --captions cap3d \
  --pretrained ./checkpoints/pretrain_200k.pt \
  --steps 1000000

# 6. Fine-tune
torchrun --nproc_per_node=4 train.py \
  --stage finetune \
  --dataset mcb \
  --checkpoint ./checkpoints/main_1000k.pt \
  --steps 100000 \
  --use_lora

# 7. Distill
torchrun --nproc_per_node=4 train.py \
  --stage distill \
  --teacher ./checkpoints/finetune_100k.pt \
  --steps 100000

# 8. Evaluate
python evaluate.py \
  --checkpoint ./checkpoints/distill_100k.pt \
  --benchmark t3bench \
  --human_eval

# 9. Export for deployment
python export.py \
  --checkpoint ./checkpoints/distill_100k.pt \
  --format onnx \
  --quantize int8
```

---

## 9. Key Repositories & Resources

### Essential Code

```
PyTorch3D
├── URL: https://github.com/facebookresearch/pytorch3d
└── Use: 3D operations, rendering, metrics

nerfstudio
├── URL: https://github.com/nerfstudio-project/nerfstudio
└── Use: NeRF training framework

Stable-DreamFusion
├── URL: https://github.com/ashawkey/stable-dreamfusion
└── Use: Text-to-3D reference implementation

Objaverse-XL
├── URL: https://github.com/allenai/objaverse-xl
└── Use: Dataset download scripts

PyTorchEMD
├── URL: https://github.com/daerduoCarey/PyTorchEMD
└── Use: Earth Mover's Distance metric

LPIPS
├── URL: https://github.com/richzhang/PerceptualSimilarity
└── Use: Perceptual similarity metric
```

### Key Papers

```
Turbo3D (2024)
├── arXiv: 2412.04470
└── Sub-1-second generation

Instant3D (2023)
├── arXiv: 2311.06214
└── 20-second generation

Objaverse-XL (2023)
├── arXiv: 2307.05663
└── 10M 3D objects dataset

Classifier Score Distillation (2023)
├── arXiv: 2310.19415
└── Improved SDS training

T³Bench (2023)
├── arXiv: 2310.02977
└── Benchmarking framework
```

---

## 10. Decision Matrix

### When to Use What

**Architecture Choice:**
```
Feed-Forward (Turbo3D, Instant3D)
├── Use when: Production deployment, need speed
├── Speed: <1s to 20s
├── Quality: High
├── Training: Requires large dataset (1M+ objects)
└── Recommendation: ✅ USE THIS

Optimization-Based (DreamFusion, Magic3D)
├── Use when: Research, small dataset
├── Speed: 1-10 hours per sample
├── Quality: Very high (per-sample optimized)
├── Training: Works with smaller datasets
└── Recommendation: ❌ AVOID for production
```

**Dataset Choice:**
```
General Purpose:
└── Objaverse-XL + Cap3D

Mechanical/CAD:
└── MCB + Sketchfab

Indoor Scenes:
└── 3D-FRONT + 3D-FUTURE

Pre-training:
└── ShapeNet

Validation:
└── ModelNet40
```

**GPU Choice:**
```
Development:
└── 1-2x RTX 3090 (24GB) - $1,500 each

Training (Budget):
└── 4x A100 40GB (Cloud) - $5.16/hr total

Training (Recommended):
└── 8x A100 80GB (Cloud) - $9.52/hr total

Training (Best):
└── 8x A100 80GB (On-premise) - $100K upfront, no hourly cost
```

---

## 11. Success Checklist

### Before Training

- [ ] Downloaded Objaverse-XL (at least subset for testing)
- [ ] Downloaded Cap3D captions
- [ ] Downloaded ShapeNet for pre-training
- [ ] Set up cloud GPU account (RunPod recommended)
- [ ] Installed PyTorch, PyTorch3D, required libraries
- [ ] Preprocessed data (filtered, rendered, embedded)
- [ ] Created train/val/test splits
- [ ] Implemented evaluation metrics (Chamfer, LPIPS, CLIP)
- [ ] Set up distributed training (if using multiple GPUs)
- [ ] Configured checkpointing and logging

### During Training

- [ ] Monitor all metric dimensions (geometric, visual, alignment)
- [ ] Validate every 2K-5K steps
- [ ] Checkpoint every 10K steps
- [ ] Check for NaN losses, gradient explosions
- [ ] Monitor GPU memory usage
- [ ] Track training speed (samples/sec)
- [ ] Visualize generated samples regularly
- [ ] Compare to baseline metrics

### After Training

- [ ] Comprehensive benchmark on test set
- [ ] Human evaluation (alignment, quality)
- [ ] Speed test (generation time <90s)
- [ ] Accuracy test (F-score >0.90, CLIP >0.30)
- [ ] Optimize for deployment (quantization, pruning)
- [ ] Export model (ONNX, TorchScript)
- [ ] Document results and limitations
- [ ] Create demo and examples

---

## 12. Expected Results

### After Full Training Pipeline

```
Generation Speed:
├── With optimization: <1 second (Turbo3D approach)
├── With distillation: 1-5 seconds
├── Without distillation: 10-20 seconds
└── Target: ✅ <90 seconds EASILY ACHIEVED

Model Accuracy:
├── F-Score: 0.90-0.92 (>90% ✅)
├── CLIP Score: 0.30-0.35
├── Chamfer Distance: 0.001-0.002
├── LPIPS: 0.08-0.12
└── Target: ✅ >90% ACHIEVED

Training Cost (Cloud, 8x A100):
├── Time: 6-8 weeks
├── Cost: $9,000-$15,000
└── Optimization: Can reduce by 30-50%

Production Inference:
├── Hardware: 1x RTX 4090 or A100
├── Throughput: 60-3600 models/hour
├── Latency: <1-20 seconds
└── Cost per generation: $0.0003-$0.02
```

---

## 13. Next Steps

**This Week:**
1. Set up RunPod account ($10 credit)
2. Download Objaverse-XL subset (10K objects for testing)
3. Download Cap3D captions
4. Set up development environment (PyTorch, PyTorch3D)
5. Implement basic evaluation pipeline

**Next Week:**
1. Download full Objaverse-XL
2. Preprocess and render multi-view images
3. Implement baseline feed-forward architecture
4. Train small prototype (100K objects)
5. Validate metrics

**Month 1:**
1. Pre-train on ShapeNet
2. Start main training on Objaverse-XL
3. Monitor and optimize training
4. Checkpoint and validate regularly

**Month 2:**
1. Continue main training to 1M steps
2. Implement distillation for speed
3. Fine-tune on domain data (if applicable)
4. Comprehensive benchmarking

**Month 3:**
1. Final optimization and tuning
2. Human evaluation
3. Production deployment preparation
4. Documentation and examples
5. Ship! 🚀

---

**Quick Reference Document**
**For detailed information, see:** TEXT_TO_3D_TRAINING_DATASETS_COMPREHENSIVE_RESEARCH.md
**Project:** AI Surgeon Pilot - Text-to-3D Training
**Status:** Ready to implement - all targets achievable
