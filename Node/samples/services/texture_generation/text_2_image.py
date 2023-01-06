import torch
from PIL import Image
from diffusers import StableDiffusionPipeline
import hashlib
import os
import sys
import json


def generateTextureFromPrompt(pipe, generator, prompt):
    image = pipe(prompt, guidance_scale=5.5, num_inference_steps=15, generator=generator).images[0]
    md5_name = hashlib.md5(image.tobytes()).hexdigest()
    image.save(os.path.join("outputs", md5_name + ".png"))
    
    print(md5_name)

def recognize_from_stdin():
    print("Start to generate textures...")
    pipe = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4", revision="fp16", torch_dtype=torch.float16)
    pipe.to("cuda")
    generator = torch.Generator("cuda").manual_seed(1024)
    done = False
    
    # Write stdin to the stream
    while not done:
        try:
            line = sys.stdin.buffer.readline()
            if len(line) == 0:
                continue
            generateTextureFromPrompt(pipe, generator, str(line))
        except KeyboardInterrupt:
            break

recognize_from_stdin()



    
    
