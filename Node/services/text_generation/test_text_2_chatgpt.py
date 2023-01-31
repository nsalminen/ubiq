# from https://github.com/acheong08/ChatGPT-lite
# go here install and put the token you got from your browser session

import sys

def printTestResponse():
    # Define multi-line test string
    text = ">{'answer': 'Agent -> Dizzy Monkey: Imagine that you have a special mask that you can put on your face, just like a superhero. This mask will help you see things that aren't really there. You can look around and see a whole new world, just like in your dreams. But instead of just dreaming, you can actually interact with this world, just like you can interact with the real world. Does that sound fun?', 'messageId': '24359495459'"
    print(text)

done = False
def recognize_from_stdin():    
    # Write stdin to the stream
    while not done:
        try:
            print("going")
            line = sys.stdin.buffer.readline()
            printTestResponse()
            if len(line) == 0:
                continue
        except KeyboardInterrupt:
            break

recognize_from_stdin()