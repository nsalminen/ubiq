import torch
from PIL import Image
from diffusers import StableDiffusionPipeline
import hashlib
import os
import sys
import json

def recognize_from_stdin():
    print("Start to generate textures...")
    output = "outputs/"
    pipe = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4", revision="fp16", torch_dtype=torch.float16)
    pipe.to("cuda")
    generator = torch.Generator("cuda").manual_seed(1024)
    done = False
    
    # Write stdin to the stream
    while not done:
        try:
            line = sys.stdin.buffer.readline()
            data = bytes(json.loads(line)["data"])
            if len(data) == 0:
                break
            generateTextureFromPrompt(line)
        except KeyboardInterrupt:
            break

recognize_from_stdin()


def generateTextureFromPrompt(prompt):
    image = pipe(prompt, guidance_scale=5.5, num_inference_steps=10, generator=generator).images[0]
    md5_name = hashlib.md5(image)
    image.save(md5_name + ".png")
    
    print(md5_name)
    
    
