# from https://github.com/acheong08/ChatGPT-lite
# go here install and put the token you got from your browser session

import sys

def printTestResponse():
    # Define multi-line test string
    text = "> Agent -> Dizzy Monkey: Imagine that you have a special mask that you can put on your face, just like a superhero."
    print(text)

done = False
def recognize_from_stdin():    
    # Write stdin to the stream
    while not done:
        try:
            line = sys.stdin.buffer.readline()
            printTestResponse()
            if len(line) == 0:
                continue
        except KeyboardInterrupt:
            break

recognize_from_stdin()