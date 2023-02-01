import asyncio
from revChatGPT.Official import Chatbot
import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--preprompt", type=str, default="")
parser.add_argument("--prompt_suffix", type=str, default="")
args = parser.parse_args()

queue = []
chatbot = None
loop = None
busy = False
done = False

# {
#   "message": message,
#   "conversation_id": self.conversation_id,
#   "parent_id": self.parent_id,
# }

# This is the cookie that needs to be replaced when expired.
# To do this, take it from the browser in Chrome by pressing F12, go to Application Cookies, and grab the value of the cookie "__Secure-next-auth.session-token"
cookie = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..gi477Xn3xNV4hv8Z.RqCfUwe9uZ2FLktZqG6ABgpDKflzvnrVPYkCRp0w7OleYemLI0NBbBACVT-c1czBou5rC6s3EV-UuRV3iyCaaiBzi21gfqc0O4ZMDYEBgjV86igZV5L9O0BpQobBCvEA_hBLbsjQxBDjRJTV__dyYoGdS4qpKeeoljX1PHwB7-KiqwC-VFFHmWJyR72E1kwzRb8-_G1uOM80xzHJVwNz9vgCqLh72vV8J7mS0t8yYZg4WNDoz2d-_AcTDQPFcLsRXOf2Xve59fzWKtScmegG7NSyqHwVGiU1STFOiLqh9WKncnCfxorw3Q3yyEQoszsQpHbCq5xX8A3gfrVcgvQDG59gyX_XSIg_fpD-KzqN1A5sVHm3YUt_4VsdhIyIGdqbrg9okyezFY7yf0VwBSM8x8BjWSECbegHP0tStQWIix-SlZvsq5VZNUFFhOwEhGOsJmWC8yYh2xcfB0HVB5xx9jfCLbJT0LjaJf6IGYYPsHea5pHMIWUxUzmaC-IV6bkK_R_gXT91M0fDJxxwMQ1Wp38S2la81Fx49jy-31JmTtQagdnTr7xFX9IXII-paE8-CjaFE4mO1_YkL4JzNYeorzuu7Xvjnd3SJWRIYCUz8ueeLz1w_BS5jCsnOBgoxe3O9JxHdtCAL3sHK_MZeEFCO7p1qUFHKl52ypZyYOFy7z8pzwvUcwC_agjgOOsJIkZLS4ubC3o3o4jIDnOHsBD1xEW6opQZVlRACsbSB9nNrnHZWnrqb3MzicQ7XEZZjDzvbscbFnVU-sKJepfCC9xH-DSnMf0RLXzd9rICiJvY8R62FXyYzQ8j2aZI5gdf3oqVACCmNFSNxuEIPQWdrODh6xIGY9_Tp6qM2sS3CKFcA6pbt3fEc6dcxEsyqe6Sk85ku-6NL9ZViU_hEnE1gGcgpvpQhTMPD0XxQiGdE20VXOXF-Jhw6SoTLA9O1KvzMGTjIRN4Rfn8Db-Ds8CbsOCOv496NBV4UhmfOEuBAO3IWTTR2yB6jbcXCNjYsBEODBTcXZdmkugmfKxAhLAaq5-GZl0UqST4Um0jpFaa1eA-mTf0e4JEacYUYP0MWZU0rGcrr12hc2732v_H0eoAswvppZTGYB4KEt7ME17VhuzZeDMN1vwLgXWL0bLG6b6wfbavtfD-1_T-bpfeqVQK7amNSdzvjHOYWomgCVyurXCKjuHLKYxjMyHQxTalcqSZoNL2ip1xCgG-0lVL3Qjk53ogAvfIL2kvZbZfoGpslVf1NK263FbEZaiiogtH7iDVrYnHvCav_kLwaUY9YJlJdFtkliD7ysOtcT9bK5b1l3amKy-1w-dFNOlB4OuRh9_1euhU3IgvhinZxxmLGD8cyIvU3ugvBcmLZkF1v4Y12O37wlYWN3X5Lw4bsSwLfCEtlYKaNSp8cZAexmjU4GQj0FESpSRPCQB-K2LUIS7HtqtUhb9WCx9roA8g_HCWrurptbV7NEoCbYnIQCFJjeIBS_fEwuhn3plLGBOnOwHovLBB5KKhb0NFEj7PJb4vuIJSILCX2BLUMKDOE_0KFDCUPW1XdFkvxmufLevHonRwCm-ltqgKOzt1MQs7S-F__JKHkg6bnT3uvoGr1Q7fnT3eGZdVUlMHYU0m5q2dzGyzonEwZIBsXpvUeI-1wxI0i2CpfOlOVlEtgaaHaOSj4l46vA7vpREg_HsLR2z_l73HIT-ckmaTE8IZCtj6AGFXRhX6Q_sxncOP8f1iRT6QYwKpEbkY50gsbl8kYLs44IoBd0KbMb6yOQyIZe1vMDX1VughNmMKdGFr1cpJp4_PaID6cDLvwxru6UbA6J05Y5fAlwpEm2QwiS4w17wPm6pRYL_Q_WNlbUQ9oKNNwBYW0REexIKHxmbGo1NZFRL_KH8n2RVVOiv8UYWwLRn-8SoD7r37ePmVAoM-bdbbUsyngFMaMoQl4_iOM4lOySgc7QtuCcRMWPqzKR7T_nIDqY-2-DnAa63CH_SD2KuEo_HGStoCjvr3TCiNzdqeQ6WH8dnxeFtshzUsyuuyOTWO06RUix1a7BKyUAUo-0t4syas4HRZja29af8p8it9GaFZpuMVdgeQ1RlHUquFfX33mPx5pvgNCNuVvEs0nMvuoI_5dDY8DU6138VI5wg2RohZ_2XV-rXRv2GUci2XmF2pmQiBHEFbmiBFzCTSvUPHhTVNKnq-NqlXuswuU72PVW4XaHJ844Hq40sFk3cP4xhjZ9oGkyrdy2hH_gt8L1zVOVgnOD5eALz6VqEDtM1-j22XFD_6DicUTYvt3vXXy0QSwKKh2JBB1p5y-eFI_EmrcMPUXeaNlRnQdfk3albvJRYHU57Tfdgy4hHQiFcgyDQfy77Ps9qfpizBt7l84QQxw8zMgmjEWdfBrFV8v6u0SS9g8U7PdebzM4HmnJIVs1MCfvX9H1Lej_0U5LnoOv-z-DaHORrJFnlMaQWnVa6T1regZXnbjCCdrUecNLumBSmnqrpRL_7mCUhmnhiQZEavkrdY-UkNhvgtRq5hRDcnbqp7hVEEfIftf4a_LI9KW2lQLth2skCyuaS4YL_5bybDyuqnsNBrDevIhLpMMyt1_D3izE-abCaiNNqDDTBqkJqsdiYAPGOEE5iKucR4OxdfXQ0GqpMZwsmrhr8aOEO_GwjIxcxzUAB_rqbJ0d8YKWkLX34DDeh1haw4CHv4Uj2PFyJHfMjTyA.sodo9tuZgOK61KKjBextKg"

def generateTextFromPrompt(chatbot, prompt):
    global busy, loop
    prompt = prompt.decode()
    if(prompt != "" and busy == False):
        busy = True
        # response = loop.run_until_complete(chatbot.ask(prompt))
        response = chatbot.ask(prompt + args.prompt_suffix)
        # Trim any whitespace from start of response and print
        print(">", response["choices"][0]["text"].lstrip())
        
        busy = False

def recognize_from_stdin():
    global chatbot, done, busy, loop
    
    if(chatbot == None):
        print("Initializing ChatGPT...")
        chatbot = Chatbot(api_key="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")
        print("ChatGPT initialized.")
        # # Create a new event loop
        # loop = asyncio.new_event_loop()
        # # Set the event loop as the default
        # asyncio.set_event_loop(loop)
        # # Wait for chatbot to be ready
        # loop.run_until_complete(chatbot.wait_for_ready())

        # If we have a preprompt, tell ChatGPT now, before we start receiving input
        if args.preprompt:
            print("Sending preprompt...")
            response = chatbot.ask(args.preprompt)
            print("Prepromt response received: ", response["choices"][0]["text"].lstrip(), " Ready to receive input.")
            print("Response received. Ready to receive input.")
            # print("> Agent -> Everyone: ", response["choices"][0]["text"].lstrip())
    
    # Write stdin to the stream
    while not done:
        try:
            line = sys.stdin.buffer.readline()
            # Check if line is empty or only whitespace
            if len(line) == 0 or line.isspace():
                continue
            generateTextFromPrompt(chatbot, line)
        except KeyboardInterrupt:
            break

recognize_from_stdin()



    
    
