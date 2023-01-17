import torch
from PIL import Image
from diffusers import StableDiffusionPipeline
import hashlib
import os
import sys
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--model", type=str, default="stabilityai/stable-diffusion-2")
parser.add_argument("--output_folder", type=str, default="./output")
args = parser.parse_args()

queue = []
pipe = None
generator = None
busy = False
done = False


def generateTextureFromPrompt(pipe, generator, prompt):
    global busy
    prompt = prompt.decode()
    if prompt != "" and busy == False:
        busy = True

        image = pipe(
            prompt, guidance_scale=5.5, num_inference_steps=15, generator=generator
        ).images[0]
        md5_name = hashlib.md5(image.tobytes()).hexdigest()
        # folder = os.path.dirname(os.path.abspath(__file__))
        file_name = md5_name + ".png"
        fullpath = os.path.join(args.output_folder, file_name)
        image.save(fullpath)
        print(file_name)
        busy = False


def recognize_from_stdin():
    global pipe, generator, done, busy

    if pipe == None:
        print(
            "Initializing texture generation model "
            + args.model
            + " (output folder: "
            + args.output_folder
            + "."
        )
        pipe = StableDiffusionPipeline.from_pretrained(
            args.model, revision="fp16", torch_dtype=torch.float16
        )
        pipe.to("cuda")
        generator = torch.Generator("cuda").manual_seed(1024)

    # Write stdin to the stream
    while not done:
        try:
            line = sys.stdin.buffer.readline()
            if len(line) == 0:
                continue
            generateTextureFromPrompt(pipe, generator, line)
        except KeyboardInterrupt:
            break


recognize_from_stdin()
