import torch
from PIL import Image
from diffusers import StableDiffusionPipeline

pipe = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4", revision="fp16", torch_dtype=torch.float16)
pipe.to("cuda")

prompt = "a photograph of an astronaut riding a horse"


generator = torch.Generator("cuda").manual_seed(1024)
image = pipe(prompt, guidance_scale=5.5, num_inference_steps=10, generator=generator).images[0]
image.save("test.png")