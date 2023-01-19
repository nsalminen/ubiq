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
cookie = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..KOhhwEVmbqrVabKd.8optlteTo8oWqqtRv4_uewSxTab9jZFpiztmzl_yOt6ksZXF_vpQQDrnZNPBbuhL8HhstNyf-0zS12k86x02Laf_2flWbO0t5Zg08YpQ7VEkWA3k1e_2X8bv1HpGNGZZtBFKqkQ4Uu_Mq3Gr4SF1-muGEkRKxY8nPsYgX5-Mn1bSoMUH6A3yQgC9ccy0Yfz30_JGwzXFWThQl58_f9Vs7nT-69TGF7f08c-yfd-4plZ4bk-HKnxO26xleyaB7lb5R9R7DV9xZyUgYsP24Gt_nvuK2XYvIlUUqXnhRF6OzCwzGMxo3Ww684dQ8aEeGUTaw2gRBxwd9_J18sYcbeJ9H5bujVn3URAfl8JslM_GZCiWfzLRBU_Eo9XbnEJx8UUOIHbBC51jaqXS9NNmtwf17EMWzLaZ7bkaMBKUsbElMqoQsHbv9KhT1QKTrl8mfoIh7FBR3MNXSai71E19BQ9vS9nLSjuCCBH2CUd4TahOMCi8-G4vxNd0XOvYbLTb8Tw6fDwxwsRCq5sehab0i9d4Bc3-y-THutC8qN44p2QAK1riPpJ8C9KtE7iMswZjwsV_nuOQg7wPy8-oar1vV71UJq40nbV1khQHfW8WcYt56wlu7iCZJlASEYVpsYBbs4gBDDCnEPUtcqLT9jpMqMD9zKNYQdAySz3Qu1ya3OLBjr3i3AHzxfrKInRrmJluucSY_l9_ls1jEOjuhwRpP5Uye7RGvHLZsnwXgIKZh-4bcyk1LQDws7dXNgYEcpCtPVNBGc9XTOOlKqxZk_YuvFF6_rqI87V58bgaZVuAOy6XyfmsGY2iTU5eCCBr8LVHZYDzL68qnxVbUTHNWDAhpRfohwuKmnylOrjNBqHD8fz69cnyZ4yyPSSOp-aBS6SxFihgfewjfCxlmh-JlwvRNoSz-QNTh0pBliH-0BcXWTdJSMe3TpWCRZT5ecIgy5knU74XgC2i7wxJzhzX863Psoh3HjzYOcWF0r6gmgfTUbFizw9s2h0xD3lOst3ZDIja7JCDEKbVYMLkKFqnyXp083lRb1vVP-iEgf6YeVgUQE0s03nG-YVDMKQBMZ52JTSWkWiz64cqe8_n0g-7vZvXYYi2umE7lGBcWrvyfReIzm867hbV5_25FjYweILWDkLqeE6jJCZX7ZZIlR9tuQat-XQ8z8Fw9mYVdu4pZ7wNupK7D1vY5J897MdWI6i2pHJHeptqfmxDddtMSjauy7sGZkEw8K38MCcLAhPBCn30-qryrmsKo_80KJQw_8CFzK4TDPFKy61cFCUsE1Jbtiql-buN6B8N7asWOEFhmj082sPTN1hmnsw5BJ8RNWF2SmNCb5ODD-RHOzMBZABUrVSt05hqVi5ySgqBOYVNc_GwL6pIi3S-zB1-SgsfH7OG6Iz50A7yfoIU6Tdbk49vBVU3WmorKyFxEmkBHncHwz_wJJHaxS02lfgcgQTm5Uq_eqHhZWuR8qIu4WjmK5jHaHGUv1-k_0INxvyWGs7QtsSNwQODzeuRZ4xq94s6WkBlwqGVqDoq_WulDn4WKxqZ0Vc-h_N6cwNh1iSiefANHm6aN4rFcS59hw6PsuGKEjhQ7n2_jluA_rwXDlhfbmr_H8zgemWfxjoYIyBYONsGDogw7r4qr0WP4U840bmihPvvw98ZtMxyNghLBJMIwD_vSiGQ9IWcxdyPKvdE_4KyH8HwbXZdu26z3z4CNtHSFJfB0JpnQi2CIVIacppBIJn3Cf2CPHc4eX4FE-ioGbsnZpxHa65xWlFs4c8OSTAbyTe6GujO1JUHTk3ImQgt4Hv0vCEkAjzSUCwtWLmxETkC7lWRtInymlayW0qr_GF4vGI4cnFFZp--GNOse2FMPcGzl3L0ZXTpQ6dTkzDylrS-yp947F7qGA_4DZVgvKgrRk3TV7q84C4VevY2ee_jTjRDlRvkATs7-sRx8ycu2pqCKvtbfwW8qbFc2IQ92LiUa9r2pkCUwcOOLLEAmaZvUxP21TmpMtgT7_g0xaRjhIvNPp4MHIr6UwjCuLAly7OeEEIUVLd7SHNPkirn-o2J9knJAdJnnfKnGr4EKrbppNs9-nmwKnNrhm4m89VZA6fpWHBMESJDwi__5hH4fDogCU5XY8QauHpoA6QBS1-eGmOhuPujjsCrr6AtmkrgnKGssO8ZMiJmByuZgfBylauMtZ3BEHx8rl3y7OPoCRndLgBoMR3NYtH6x_ouJ0r_avE7jz_MgltMmRIWeIL8EtSkbb9CUU75meo7HXDxbSPYAwMvuaT3JRCt.gN76xwd8HfLvmI5M35VPMA"

def generateTextFromPrompt(chatbot, prompt):
    global busy, loop
    prompt = prompt.decode()
    if(prompt != "" and busy == False):
        #print("-------", prompt)
        busy = True
        response = loop.run_until_complete(chatbot.ask(prompt))
        print("{RESPONSE}:", response)
        
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



    
    
