"""
Vision API views for image processing operations.
"""
import os
import sys
import base64
import io

from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from PIL import Image

# Heavy ML dependencies (torch, opencv, numpy) and the bundled AI model packages
# are imported lazily on first request so the rest of the application can boot
# without the image-processing stack installed.
MODELS_DIR = os.path.join(settings.BASE_DIR, 'ai_models')
DEVICE = None
BRIGHTNESS_MODEL = None
WB_MODEL = None
SR_MODEL = None  # Super-resolution model
BRIGHTNESS_MODEL_PATH = os.path.join(MODELS_DIR, 'zero_dce.pth')
WB_MODEL_PATH = os.path.join(MODELS_DIR, 'net_awb.pth')

_DEPS_LOADED = False


def _load_vision_deps():
    """Import the heavy ML dependencies on demand and cache them as globals."""
    global _DEPS_LOADED, cv2, np, torch, DEVICE
    global enhance_net_nopool, deepWBnet
    global get_mapping_func, apply_mapping_func, outOfGamutClipping, resize_with_padding
    if _DEPS_LOADED:
        return
    import cv2 as _cv2
    import numpy as _np
    import torch as _torch
    if MODELS_DIR not in sys.path:
        sys.path.insert(0, MODELS_DIR)
    from ai_models.zero_dce import enhance_net_nopool as _enhance_net_nopool
    from ai_models.deep_wb_single_task import deepWBnet as _deepWBnet
    from ai_models.deepwb_utils import (
        get_mapping_func as _get_mapping_func,
        apply_mapping_func as _apply_mapping_func,
        outOfGamutClipping as _outOfGamutClipping,
        resize_with_padding as _resize_with_padding,
    )
    cv2 = _cv2
    np = _np
    torch = _torch
    DEVICE = _torch.device('cuda' if _torch.cuda.is_available() else 'cpu')
    enhance_net_nopool = _enhance_net_nopool
    deepWBnet = _deepWBnet
    get_mapping_func = _get_mapping_func
    apply_mapping_func = _apply_mapping_func
    outOfGamutClipping = _outOfGamutClipping
    resize_with_padding = _resize_with_padding
    _DEPS_LOADED = True


def load_brightness_model():
    """Load the Zero-DCE model if not already loaded."""
    global BRIGHTNESS_MODEL
    if BRIGHTNESS_MODEL is None:
        BRIGHTNESS_MODEL = enhance_net_nopool().to(DEVICE)
        BRIGHTNESS_MODEL.load_state_dict(
            torch.load(BRIGHTNESS_MODEL_PATH, map_location=DEVICE))
        BRIGHTNESS_MODEL.eval()
    return BRIGHTNESS_MODEL


def load_wb_model():
    """Load the DeepWB model if not already loaded."""
    global WB_MODEL
    if WB_MODEL is None:
        WB_MODEL = deepWBnet().to(DEVICE)
        WB_MODEL.load_state_dict(torch.load(WB_MODEL_PATH,
                                            map_location=DEVICE))
        WB_MODEL.eval()
    return WB_MODEL


def load_sr_model(scale=4, model_name='RealESRGAN_x4plus'):
    """
    Load the Real-ESRGAN super-resolution model if not already loaded.
    
    Args:
        scale: Upscaling factor (2 or 4)
        model_name: Model variant to use
    
    Returns:
        RealESRGANModel instance
    """
    global SR_MODEL
    if SR_MODEL is None:
        from ai_models.real_esrgan import RealESRGANModel
        SR_MODEL = RealESRGANModel(scale=scale, model_name=model_name)
        SR_MODEL.load_model()
    return SR_MODEL


def decode_base64_image(base64_string):
    """
    Decode base64 image string to numpy array.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        numpy array in BGR format
    """
    _load_vision_deps()
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]

    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_string)

    # Convert to PIL Image
    image = Image.open(io.BytesIO(image_bytes))

    # Convert to numpy array (RGB)
    image_np = np.array(image)

    # Convert RGB to BGR for OpenCV
    if len(image_np.shape) == 3 and image_np.shape[2] == 3:
        image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    else:
        image_bgr = image_np

    return image_bgr


def encode_image_to_base64(image_bgr):
    """
    Encode BGR image to base64 string.
    
    Args:
        image_bgr: numpy array in BGR format
        
    Returns:
        Base64 encoded string
    """
    # Convert BGR to RGB
    if len(image_bgr.shape) == 3 and image_bgr.shape[2] == 3:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    else:
        image_rgb = image_bgr

    # Convert to PIL Image
    pil_image = Image.fromarray(image_rgb)

    # Save to bytes buffer
    buffer = io.BytesIO()
    pil_image.save(buffer, format='PNG')
    buffer.seek(0)

    # Encode to base64
    base64_string = base64.b64encode(buffer.read()).decode('utf-8')

    return f"data:image/png;base64,{base64_string}"


def enhance_image_brightness(image_bgr):
    """
    Enhance image brightness using Zero-DCE model.
    
    Args:
        image_bgr: Input image in BGR format (numpy array)
        
    Returns:
        Enhanced image in BGR format (numpy array)
    """
    model = load_brightness_model()

    # Convert BGR to RGB
    img = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    # Normalize to [0, 1]
    img = img.astype(np.float32) / 255.0

    # Convert to tensor [1, 3, H, W]
    img_tensor = torch.from_numpy(img).permute(2, 0, 1).unsqueeze(0).to(DEVICE)

    # Run inference
    with torch.no_grad():
        enhanced_tensor, _ = model(img_tensor)

    # Convert back to numpy
    enhanced = enhanced_tensor.squeeze(0).permute(1, 2, 0).cpu().numpy()
    enhanced = np.clip(enhanced * 255.0, 0, 255).astype(np.uint8)

    # Convert RGB back to BGR
    enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_RGB2BGR)

    return enhanced_bgr


def correct_white_balance(image_bgr):
    """
    Correct white balance using DeepWB model.
    
    Args:
        image_bgr: Input image in BGR format (numpy array)
        
    Returns:
        White balance corrected image in BGR format (numpy array)
    """
    model = load_wb_model()

    # Convert BGR to RGB
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    # Resize image for network input (ensure divisible by 16)
    image_resized, original_size = resize_with_padding(image_rgb,
                                                       target_size=656)

    # Normalize to [0, 1] and convert to tensor
    img_tensor = image_resized.transpose((2, 0, 1)).astype(np.float32) / 255.0
    img_tensor = torch.from_numpy(img_tensor).unsqueeze(0).to(DEVICE)

    # Run inference
    with torch.no_grad():
        output = model(img_tensor)

    # Convert output back to numpy
    output = output.squeeze(0).cpu().numpy()
    output = output.transpose((1, 2, 0))
    output = np.clip(output, 0, 1)

    # Get mapping function from resized input to output
    image_resized_norm = image_resized.astype(np.float32) / 255.0
    mapping_func = get_mapping_func(image_resized_norm, output)

    # Apply mapping to original size image
    corrected = apply_mapping_func(image_rgb, mapping_func)
    corrected = outOfGamutClipping(corrected)

    # Convert back to BGR
    corrected_bgr = cv2.cvtColor(corrected, cv2.COLOR_RGB2BGR)

    return corrected_bgr


def enhance_super_resolution(image_bgr,
                             scale=4,
                             model_name='RealESRGAN_x4plus'):
    """
    Enhance image resolution using Real-ESRGAN model.
    
    Args:
        image_bgr: Input image in BGR format (numpy array)
        scale: Upscaling factor (2 or 4)
        model_name: Model variant to use
            - 'RealESRGAN_x4plus' (default): General 4x upscaling
            - 'RealESRGAN_x2plus': General 2x upscaling
            - 'RealESRGAN_x4plus_anime_6B': Optimized for anime images
        
    Returns:
        Super-resolved image in BGR format (numpy array)
    """
    model = load_sr_model(scale=scale, model_name=model_name)

    # Perform super-resolution
    enhanced_bgr = model.enhance(image_bgr, outscale=scale)

    return enhanced_bgr


@api_view(['POST'])
def auto_brightness_view(request):
    """
    API endpoint to automatically adjust image brightness using Zero-DCE model.
    
    Request body:
        {
            "image": "base64_encoded_image_string"
        }
    
    Response:
        {
            "enhanced_image": "base64_encoded_enhanced_image",
            "success": true
        }
    """
    try:
        # Get image from request
        image_data = request.data.get('image')

        if not image_data:
            return Response({
                'error': 'No image provided',
                'success': False
            },
                            status=status.HTTP_400_BAD_REQUEST)

        # Decode base64 image
        image_bgr = decode_base64_image(image_data)

        # Enhance brightness
        enhanced_bgr = enhance_image_brightness(image_bgr)

        # Encode result to base64
        enhanced_base64 = encode_image_to_base64(enhanced_bgr)

        return Response({'enhanced_image': enhanced_base64, 'success': True})

    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def auto_white_balance_view(request):
    """
    API endpoint to automatically correct white balance using DeepWB model.
    
    Request body:
        {
            "image": "base64_encoded_image_string"
        }
    
    Response:
        {
            "corrected_image": "base64_encoded_corrected_image",
            "success": true
        }
    """
    try:
        # Get image from request
        image_data = request.data.get('image')

        if not image_data:
            return Response({
                'error': 'No image provided',
                'success': False
            },
                            status=status.HTTP_400_BAD_REQUEST)

        # Decode base64 image
        image_bgr = decode_base64_image(image_data)

        # Correct white balance
        corrected_bgr = correct_white_balance(image_bgr)

        # Encode result to base64
        corrected_base64 = encode_image_to_base64(corrected_bgr)

        return Response({'corrected_image': corrected_base64, 'success': True})

    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def super_resolution_view(request):
    """
    API endpoint to enhance image resolution using Real-ESRGAN model.
    
    Request body:
        {
            "image": "base64_encoded_image_string",
            "scale": 4,  // optional, default: 4 (can be 2 or 4)
            "model": "RealESRGAN_x4plus"  // optional, default: "RealESRGAN_x4plus"
        }
    
    Available models:
        - "RealESRGAN_x4plus" (default): General 4x upscaling
        - "RealESRGAN_x2plus": General 2x upscaling
        - "RealESRGAN_x4plus_anime_6B": Optimized for anime images
    
    Response:
        {
            "enhanced_image": "base64_encoded_enhanced_image",
            "success": true,
            "scale": 4,
            "model": "RealESRGAN_x4plus"
        }
    """
    try:
        # Get image from request
        image_data = request.data.get('image')

        if not image_data:
            return Response({
                'error': 'No image provided',
                'success': False
            },
                            status=status.HTTP_400_BAD_REQUEST)

        # Get optional parameters
        scale = request.data.get('scale', 4)
        model_name = request.data.get('model', 'RealESRGAN_x4plus')

        # Validate scale
        if scale not in [2, 4]:
            return Response({
                'error': 'Scale must be 2 or 4',
                'success': False
            },
                            status=status.HTTP_400_BAD_REQUEST)

        # Validate model name
        valid_models = [
            'RealESRGAN_x4plus', 'RealESRGAN_x2plus',
            'RealESRGAN_x4plus_anime_6B'
        ]
        if model_name not in valid_models:
            return Response(
                {
                    'error':
                    f'Model must be one of: {", ".join(valid_models)}',
                    'success': False
                },
                status=status.HTTP_400_BAD_REQUEST)

        # Decode base64 image
        image_bgr = decode_base64_image(image_data)

        # Enhance resolution
        enhanced_bgr = enhance_super_resolution(image_bgr,
                                                scale=scale,
                                                model_name=model_name)

        # Encode result to base64
        enhanced_base64 = encode_image_to_base64(enhanced_bgr)

        return Response({
            'enhanced_image': enhanced_base64,
            'success': True,
            'scale': scale,
            'model': model_name
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
