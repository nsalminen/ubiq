# from https://github.com/acheong08/ChatGPT-lite
# go here install and put the token you got from your browser session

import asyncio
from ChatGPT_lite.ChatGPT import Chatbot
import sys



# {
#   "message": message,
#   "conversation_id": self.conversation_id,
#   "parent_id": self.parent_id,
# }


queue = []
chatbot = None
loop = None
busy = False
done = False

#that is the cooke to replace if expired , take it from the browser In Chrome is F12 , go to Application Cookies , name of the cookie"__Secure-next-auth.session-token"
cookie = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..UFRXK6MfQHxfl48I.dv7aGbY_AcUNAVgox_onOJW7zRUFYEBp5oy2MhLA-SqrjMSOpzyzb4Dg5rBG3VDPAq4vnV-ODap-D4sIDIhuu6cnksjV9-FoZj4zobRPd-5Q9QcO_2C34Ms7Yl4DBbXBAaIcbRFFLZFpQk5X0NKq5UsJlWt9NSd2fQmVZdX8p22qbDyKmCXBlLBgBJl4gIDroUgcFH_zh5mEcouQUVDYD7cPh4bxSVWEnzZ4N8J_9sRW8KSCUFCBtC2t3iWZZNFMZzwtXM6zFqd-MMsbyzpxROmDajHkJDFPNAHud4GaBOWTvVGOHjC-59eljG92lunsM1A-PH3ms7SnRu4d00pr0GN7-YyS3B-uCsssHcDRefAvenfb1lSSmp8fw7nMaO3UertwDV-pGb7Wv0Uvc7DHu3mRlFNhIaZR2g23B52RVX1mfYBr1R78E7CRPK7d0xlsRpeYZGphivuAUam9At-EarEcBuxgWWMq7TqCob5Hq3NN6pF-VAK3WGWlyVqrJav3j18391CnwCwliBLNyWSroEVkr_8lHYGyPpPzG7VdGwOt5zC9SlAtJyfowzkt0jMS0ibMzrY9eLK_SLp1TQjg-eZwT8oXIY2Do3qUIbA4SVooIOQBEWFOY-knWLUbnJ2mYIrLZ9w2AjAjQds1cTxrk0mwIW-KNDeh8nDA_7rwv-AZUKK1TM1vlnPVK2iM3d7v5AnGw9-D9pDYlif99Nnz23DSqOv0XYwXexIF-APO1zAcmZ8DlEMrmAQAtsDLdDJlIyd3l3iV5kAWDR2KWZSWkHjgeS5QnupNahZcu20TKX-i5ZDnurmQ2tlR06wVzyk483WdMpFgs14jXr373yOL4ZWRdT6PFnYF4I133rfY9D8tVYDIvN0g0Npl35f1HKeQF2vY4xNilZEl6Vp4igUW7I0kKcodHOlCXm-0VRZtoZpcY7nWHD0waB7nRmRyUWEYN176xHZclrlc0uN6VHeXacBPteE9adeyclBIOdZW6yYQDL-BKRjfomHlv0Ittx1ua3c1VrdgOOPqeG-FrXNSTAuvUtWoNG5f5moFtwYiRSVbyBZMlkvKUQ-CRVwzKaAoirueS7axN-jpkp_-bFxDJ_ld2fLe7keOKc_tR8Z5gLES8l8czKJVJfigTnJqKG5o6rcCT6YkgT70EuBMp5efIVL3yxdaPKXja_JTQUwCqPKbLYuJP7QcFiZ3LFzYtJItJy4jVirdXO7X9TxuHF32LrdFJr9q8yAYnknUGMCqUXayH2cSEDwDhJtNdUc0sb-A3XiZte7ndjKMHkNSfEhsDvsIDLNQCbkfd1SpUVy6qx6C8FxjicZJmzvl-tar3CichB-E9oanV6pW-flJgaDbH87oIxLahGLfw2KedLxc12BXrlNHGStJdRk3TNHGiHKSb0cX3nby6h5yyBTmX8sRVcsTDcJCSHE3T410YqPPdCdLZFcX-SsiQco6yvZJ3gSB-rXkiSs9HaOt3E_WIIlTc9BUPCLQ7kJ9abIzsFil3-Iv_BE05ILo3Fmyxp9yC0HdGD8bk9DgIRGIXiEdvpWQZFKSnnphD4IZEIAuEH6TelDPYNwJvZqpLAd1yX53-uNnYRWQFOs2ojpYsA81jg_lxnrqbaBQcXMzOwbS10jDBuRcEGQgVA3FbvU4uKi0I7fs58rTaT4RLYmKXwMfrfS91AnxGBmES5wYKsvZsNCISxXFfsX_tB0Gork5ZrZ8OqM6rJZElHko7IY410mvIe7sMz1LsRukVe_LREd9_YQpkDRQfBefzxSr4s58agTu_lwjdv1N-70TwapSG1xVrKao1t133OL9OWz0VKMmr2U8_TlGoiD-q-XGjTK9kTxPVCpkK4sbKr49j6ST5Vu9McV0-AL0ED4N2fMT0dfmE8aUf151CozvNKG-wU68dHNrU4YYpk7CIUJxK3lA69fF9pL4jbE2s0WG6qhSrj3ga1bH9Fm2FGp0P7awFPI3iylrNExi2gWSSzLdpLXkvNtCjamGRS1hPrSRUBww4CTOk5d_w5jV06LXFagwvIKlQ4L_JuMD1Ftsh6S6L43KdCxYfRYPbDzf1Hch_BX-jxs0UIksf8KZHpk5GjOmz0tzRbDa5A3DWig4-cJbPkryreRxHCmjdoAbVFrch0rbniXBynCnMTR0xRSNEcSAbd_ascyNMWFc-z6m8RRFS_Cowy3p2cGPXPduifipYLeoKreQVWdbkOalsLWdvjPJLGQoO3j9gWLZfbqPf2-_zjlX4cmR9XcjwwnzGM0E_eySKKsDLay0D0a23sYpWA8Ox99421hL_d3eJSrbQ-kRwMyFTtbf2y4lt-hHHfQMgOxTUQGKzAmtrvCyd8Gu-JqhDkObXLme7IMFyrBSA28g0AqU7L2ncztLlxBlCKiaiL-eitGeYAVDyBL5hTL-jtGOXHxnciTeBURKGSMKdSUgIpOEiN5ngqsEMx42_Lqq7DDavBP_62cZ5E59IZa8nKk5ajcCCiSxgV6S2duXialJLEnwA26urcJ7x-1NOvt1IRhgOKkE91PSmaHBdKMGsM0ku_oK-nM_OqCXtdl9qjf674b0tRv7AV_fOuXAqQol5WFHICcJQ-TOMSH2zLyEjEq6bC0uWZiyWwg1FcFbFcUGi5PV55QvL-0T2BW30AaR-1nkM3INib7qyFQdquFOmwtHelADrU7e9NdC.ncDVSfewHGv_FEtZyP8Z6Q"

def generateTextFromPrompt(chatbot, prompt):
    global busy, loop
    prompt = prompt.decode()
    if(prompt != "" and busy == False):
        #print("-------", prompt)
        busy = True
        response = loop.run_until_complete(chatbot.ask(prompt))
        print(">", response)
        
        busy = False

def recognize_from_stdin():
    global chatbot, done, busy, loop
    
    if(chatbot == None):
        chatbot = Chatbot(cookie, "https://gpt.pawan.krd")
        # Create loop
        loop = asyncio.new_event_loop()
        # Set
        asyncio.set_event_loop(loop)
        # Run
        loop.run_until_complete(chatbot.wait_for_ready())
    
    # Write stdin to the stream
    while not done:
        try:
            print("going")
            line = sys.stdin.buffer.readline()
            if len(line) == 0:
                continue
            generateTextFromPrompt(chatbot, line)
        except KeyboardInterrupt:
            break

recognize_from_stdin()



    
    
