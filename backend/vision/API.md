# Vision API Documentation

This API provides AI-powered image enhancement capabilities using state-of-the-art deep learning models.

## Table of Contents

1. [Auto Brightness Enhancement](#auto-brightness-enhancement)
2. [Auto White Balance Correction](#auto-white-balance-correction)
3. [Super-Resolution Enhancement](#super-resolution-enhancement)

---

## Auto Brightness Enhancement

### Endpoint

`POST /api/vision/auto-brightness/`

### Description

Automatically adjusts the brightness of an image using the Zero-DCE (Zero-Reference Deep Curve Estimation) deep learning model. This model is particularly effective for enhancing low-light images without requiring paired training data.

### Request

**Content-Type:** `application/json`

**Body:**

```json
{
  "image": "base64_encoded_image_string"
}
```

**Parameters:**

- `image` (string, required): Base64-encoded image data. Can include the data URL prefix (e.g., `data:image/png;base64,`) or just the base64 string.

### Response

**Success Response (200 OK):**

```json
{
  "enhanced_image": "data:image/png;base64,enhanced_image_base64_string",
  "success": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "No image provided",
  "success": false
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Error message details",
  "success": false
}
```

### Example Usage

#### JavaScript/Fetch

```javascript
const imageFile = document.getElementById("imageInput").files[0];
const reader = new FileReader();

reader.onload = async (e) => {
  const base64Image = e.target.result;

  const response = await fetch(
    "http://localhost:8000/api/vision/auto-brightness/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    }
  );

  const data = await response.json();
  if (data.success) {
    document.getElementById("outputImage").src = data.enhanced_image;
  }
};

reader.readAsDataURL(imageFile);
```

#### Python/Requests

```python
import requests
import base64

# Read image file
with open('input.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# Make API request
response = requests.post(
    'http://localhost:8000/api/vision/auto-brightness/',
    json={'image': f'data:image/jpeg;base64,{image_data}'}
)

result = response.json()
if result['success']:
    # Decode and save enhanced image
    enhanced_data = result['enhanced_image'].split(',')[1]
    with open('output.png', 'wb') as f:
        f.write(base64.b64decode(enhanced_data))
```

### Technical Details

- **Model:** Zero-DCE (Zero-Reference Deep Curve Estimation)
- **Model File:** `models/zero_dce.pth`
- **Device:** Automatically uses CUDA if available, otherwise CPU
- **Input Format:** Any image format supported by PIL (JPEG, PNG, etc.)
- **Output Format:** PNG encoded as base64
- **Processing:** The model applies learned curve adjustments iteratively to enhance brightness while preserving image details

---

## Auto White Balance Correction

### Endpoint

`POST /api/vision/auto-white-balance/`

### Description

Automatically corrects the white balance of an image using the DeepWB (Deep White-Balance Editing) model from CVPR 2020. This model performs automatic white balance correction to remove color casts and restore natural colors in images with incorrect white balance.

### Request

**Content-Type:** `application/json`

**Body:**

```json
{
  "image": "base64_encoded_image_string"
}
```

**Parameters:**

- `image` (string, required): Base64-encoded image data. Can include the data URL prefix (e.g., `data:image/png;base64,`) or just the base64 string.

### Response

**Success Response (200 OK):**

```json
{
  "corrected_image": "data:image/png;base64,corrected_image_base64_string",
  "success": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "No image provided",
  "success": false
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Error message details",
  "success": false
}
```

### Example Usage

#### JavaScript/Fetch

```javascript
const imageFile = document.getElementById("imageInput").files[0];
const reader = new FileReader();

reader.onload = async (e) => {
  const base64Image = e.target.result;

  const response = await fetch(
    "http://localhost:8000/api/vision/auto-white-balance/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    }
  );

  const data = await response.json();
  if (data.success) {
    document.getElementById("outputImage").src = data.corrected_image;
  }
};

reader.readAsDataURL(imageFile);
```

#### Python/Requests

```python
import requests
import base64

# Read image file
with open('input.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# Make API request
response = requests.post(
    'http://localhost:8000/api/vision/auto-white-balance/',
    json={'image': f'data:image/jpeg;base64,{image_data}'}
)

result = response.json()
if result['success']:
    # Decode and save corrected image
    corrected_data = result['corrected_image'].split(',')[1]
    with open('output_wb.png', 'wb') as f:
        f.write(base64.b64decode(corrected_data))
```

#### cURL

```bash
# First, convert image to base64
BASE64_IMAGE=$(base64 -i input.jpg)

# Make API request
curl -X POST http://localhost:8000/api/vision/auto-white-balance/ \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"data:image/jpeg;base64,$BASE64_IMAGE\"}"
```

### Technical Details

- **Model:** DeepWB (Deep White-Balance Editing)
- **Paper:** [Deep White-Balance Editing, CVPR 2020](https://github.com/mahmoudnafifi/Deep_White_Balance)
- **Model File:** `models/net_awb.pth` (you need to download this)
- **Device:** Automatically uses CUDA if available, otherwise CPU
- **Input Format:** Any image format supported by PIL (JPEG, PNG, etc.)
- **Output Format:** PNG encoded as base64
- **Processing:** The model uses a U-Net-like encoder-decoder architecture to learn pixel-wise color mappings for white balance correction

### Model Download Instructions

The DeepWB model weights are not included in this repository. To use the white balance API:

1. Download the pre-trained AWB model from the [official repository](https://github.com/mahmoudnafifi/Deep_White_Balance/tree/master/PyTorch/models)
2. Save the model file as `net_awb.pth` in the `backend/models/` directory

Alternatively, you can train your own model following the instructions in the [DeepWB repository](https://github.com/mahmoudnafifi/Deep_White_Balance).

---

## Performance Notes

- **First Request:** May be slower due to model loading (1-3 seconds)
- **Subsequent Requests:** Use cached models for faster processing
- **GPU Acceleration:** Automatically used when NVIDIA GPU with CUDA is available
- **Typical Processing Time:**
  - CPU: 200-1000ms depending on image size
  - GPU: 50-200ms depending on image size and GPU model
- **Image Size:** Images are automatically resized for processing while maintaining aspect ratio. Output is saved in original resolution.

## Error Handling

Both endpoints include comprehensive error handling:

- Invalid base64 data
- Missing image parameter
- Model loading failures
- Out of memory errors
- Invalid image formats

All errors return appropriate HTTP status codes and descriptive error messages in the response.

## Dependencies

Required Python packages:

- `torch>=2.0.0`
- `torchvision>=0.15.0`
- `opencv-python>=4.8.0`
- `Pillow>=10.0.0`
- `numpy>=1.24.0`
- `scipy>=1.10.0`
- `djangorestframework>=3.14.0`

Install with: `pip install -r requirements.txt`

---

## Super-Resolution Enhancement

### Endpoint

`POST /api/vision/super-resolution/`

### Description

Enhances image resolution using the Real-ESRGAN (Real-Enhanced Super-Resolution GAN) model. This model can upscale images by 2x or 4x while adding realistic details and reducing artifacts. Models are automatically downloaded on first use.

### Request

**Content-Type:** `application/json`

**Body:**

```json
{
  "image": "base64_encoded_image_string",
  "scale": 4,
  "model": "RealESRGAN_x4plus"
}
```

**Parameters:**

- `image` (string, required): Base64-encoded image data. Can include the data URL prefix or just the base64 string.
- `scale` (integer, optional): Upscaling factor. Valid values: `2`, `4`. Default: `4`
- `model` (string, optional): Model variant to use. Default: `"RealESRGAN_x4plus"`
  - `"RealESRGAN_x4plus"`: General 4x upscaling (default)
  - `"RealESRGAN_x2plus"`: General 2x upscaling
  - `"RealESRGAN_x4plus_anime_6B"`: Optimized for anime images

### Response

**Success Response (200 OK):**

```json
{
  "enhanced_image": "data:image/png;base64,enhanced_image_base64_string",
  "success": true,
  "scale": 4,
  "model": "RealESRGAN_x4plus"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "No image provided",
  "success": false
}
```

```json
{
  "error": "Scale must be 2 or 4",
  "success": false
}
```

```json
{
  "error": "Model must be one of: RealESRGAN_x4plus, RealESRGAN_x2plus, RealESRGAN_x4plus_anime_6B",
  "success": false
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Error message details",
  "success": false
}
```

### Example Usage

#### JavaScript/Fetch

```javascript
const imageFile = document.getElementById("imageInput").files[0];
const reader = new FileReader();

reader.onload = async (e) => {
  const base64Image = e.target.result;

  const response = await fetch(
    "http://localhost:8000/api/vision/super-resolution/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        scale: 4,
        model: "RealESRGAN_x4plus",
      }),
    }
  );

  const data = await response.json();
  if (data.success) {
    document.getElementById("outputImage").src = data.enhanced_image;
    console.log(`Enhanced with ${data.model} at ${data.scale}x scale`);
  }
};

reader.readAsDataURL(imageFile);
```

#### Python/Requests

```python
import requests
import base64

# Read image file
with open('input.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# Make API request
response = requests.post(
    'http://localhost:8000/api/vision/super-resolution/',
    json={
        'image': f'data:image/jpeg;base64,{image_data}',
        'scale': 4,
        'model': 'RealESRGAN_x4plus'
    }
)

result = response.json()
if result['success']:
    # Decode and save enhanced image
    enhanced_data = result['enhanced_image'].split(',')[1]
    with open('output_4x.png', 'wb') as f:
        f.write(base64.b64decode(enhanced_data))
    print(f"Enhanced with {result['model']} at {result['scale']}x scale")
```

#### cURL

```bash
# First, convert image to base64
BASE64_IMAGE=$(base64 -i input.jpg)

# Make API request with 4x upscaling
curl -X POST http://localhost:8000/api/vision/super-resolution/ \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"data:image/jpeg;base64,$BASE64_IMAGE\", \"scale\": 4, \"model\": \"RealESRGAN_x4plus\"}"
```

### Technical Details

- **Model:** Real-ESRGAN (Real-Enhanced Super-Resolution GAN)
- **Paper:** [Real-ESRGAN: Training Real-World Blind Super-Resolution with Pure Synthetic Data](https://github.com/xinntao/Real-ESRGAN)
- **Model Files:** Auto-downloaded to `backend/ai_models/weights/` on first use
- **Device:** Automatically uses CUDA if available, otherwise CPU
- **Input Format:** Any image format supported by PIL (JPEG, PNG, etc.)
- **Output Format:** PNG encoded as base64
- **Processing:** Uses GAN-based architecture to upscale images while adding realistic details

### Model Variants

| Model                      | Scale | Best For                     | Size  |
| -------------------------- | ----- | ---------------------------- | ----- |
| RealESRGAN_x4plus          | 4x    | General photos, natural      | ~17MB |
| RealESRGAN_x2plus          | 2x    | General photos, less extreme | ~16MB |
| RealESRGAN_x4plus_anime_6B | 4x    | Anime, illustrations         | ~17MB |

### Performance Considerations

- **First Use:** Models are downloaded automatically (~17MB per model)
- **GPU Recommended:** Super-resolution is computationally intensive
- **Memory Usage:** Large images may require significant GPU/CPU memory
- **Typical Processing Time:**
  - CPU: 5-20 seconds (varies greatly with image size)
  - GPU: 500-2000ms (depends on image size and GPU)
- **Tile Processing:** For very large images, tiling can be enabled to reduce memory usage

### Recommendations

- For large images (>2000px), expect longer processing times
- Use `scale: 2` for faster processing if 4x is not necessary
- Use anime model variant for better results on anime/cartoon images
- GPU acceleration is highly recommended for production use
