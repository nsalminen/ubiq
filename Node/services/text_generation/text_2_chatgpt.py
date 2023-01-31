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
cookie = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..-vLiF3NtZyY8GJO-.GhekkDgeCqP2Q_ktRz3tRevxf_tX2PgwVe4L2QDRTAi99bHh24Ibh4oz7eIEqMZtaibwIY2xTGy9leUkcE7-ipG5XL9tPvtNvoL8qsUNUBJnEyU3s81fRJSN69xk-etHFQFVuA-gkhNsdQuZg861B2sboZqpWbG8tdmAcKdC8AIcT2DXokoY3niLWcqHA9w03nNMQo7QmVojIX6LwziFe7Hia4pXmtUd38D1m0FYU6It8ID4buEfYewSJLqBBF6JY5eVaOpgjUBf5xT0LnTDa1Z6j4DcGbQOsF7fnjnl1ZxAufBnQCtO49HLUpT8acL4VUEuQxVS-aeOoCQQwiVCdhAXpHfDW6NaLxkZTifzJbRmyK3_WIGZSnOZCvsc5gCpkajJ0HOAzvvmwrF56xKlnCI-GCoHlYRRxcmvuqZV6ppugd1MPC4xT3KrVRw_mEG1NqyT2BAvK3Zt2EYtuVoVnilzQvcTAdUdpS9rsZM1Uk0rEDuM6rFwTdAHPqHWrJ3KVGK125qvc8IY6aN9G-snYWTPl0NTVaQMx1jAynzU_BYnI__xIbSyJmFV7P1DjdzKwQRu0kh4kvS45b6unCQNYKakL6BHfs2_RVHgDhA8b3IV72OVu8AQHea02slKNCPEibcPMhFdrDDFVuVEFPMli7FsRNAh0ouKOiysUkzDiHv0LjzNYQCQXehSLCPKMfIRW7vFbvXoDV675okc_SV_Dea0R4AC1GDxJdY27wL3pDk7oIqzknUJ_9VJWHDiT-tN5rp9DYsINj1tfWUjlXgxvX2hBUUcqfcol0Hq8EyP5wSeV5sv5hcIcLz9xhJWihx9KZew0ziL_u18NR0BJUD-hXaI_IitB7-t-II7hLbqR--DMenuXOXfDKCSVwN6AROH_--TEsox-htSRMrOpEPv64-_dOzZ1oZugtyaUsgIzQxKvaOqAAvos9RIYzaadEIlxKVgdKHU41Fnkp1AwKqJ41VksTPtkQrPlS26sY0EEf264QC_dFk4UE-l184rJYQT01sXRKjc9xFoZXmEjGvXDnZdyxCyI-9nduyTHgJ9K6waiRMfP4NiM1ZKPbAWUob5C7WBC-SlRJ--kn1JMxpvk5a8hndpZepQDNW4Zl6QkYB-dQ-ciyQWNAbi0XSB66Dium-6BXtoGNJROClFt22YgsoipkM78i774fE75ALn3mXEyzOQdi3pdELV9V_bDYBtIgLYhVqUW_dDm0gDUl105S9kmnkTGSOdjphRJ59LWyZovU8pKhTFvUaOLboGOJ5wzk9LMEPNVMA6izIZf4SKLw9MklUL9Q8RUV2pyB1bdOcu1V5CitFv-phtddNTtjlc8vNiUur4evgOb3Cyp85IKiTVvJIj5gNDZJZA_ZZZEJmnagUf5cEqdDkZOZlfDA7UHdoIQC5nNwxZ87ULJFxDY4bCReMlRHeyEZDC7oe_J56WCUV17bxGIfPvmmnO9jrAo-5nBOSfTVaQ5aIRCzbW6_ocjb1BClLYe5AtxIe-ypM7GT-cUieYms0i0R2gJ1in7ncmHpEGjosbGbnLfG65UDIjjYghj9Oo35bALAyZ0vzQW-b3F_2T61X659tsvshS5vqJWL5mb21TkWJF18THhFooxi4ye7HbwtCHDR_9W7Bxz1AgPX791Zktxcib80r-e6z_wEe4GReZqQnYZKQtOz8sbpYD8oUzgkGmABrmpUBhMkbhwXC7xdmgVvNT9Xp3DQWIIZbaDoRwV19dua8HjNcxjRCKppQZ5a7Cu8JoyJ9ZTzo8yOPhudc9O6YE67HZANVU8Zj4Z5qRByCjkqzN3Rn0Ts4lGYlfFdoDqqM_lVIeyE-2IN65JGZyDjisNqQKPFpiMIqZQAqK8vYTGrUAfXMl3VcpVKGheP9RMq2bP5-wZNSp-x3H65PIJN4lHuOaaGwhTVhnpWhYK73K8cW8kvUHvBrLYdnfgNFVhlq0H9WoDGC61sh_wcytUkZwtK0T6yPpnvtKhjoIuVhCxv9oLfKCCVKiI4gBE3gUGQDBuiKU0GbNrv9AqmrkFFfNPHAEm5TtK5UB7QwMkKK6G7TOJnSGONzSy8VKgyccK0xeDmPZj6UzeC2QzGAAUz5xLyZa4JvrlIam4imIKwCry4iWq8syxbUv4Ym7BMvinbu37crPKpbquW_ZA_qWoaXooe3l9gkS4q9cPERgBPsfowhekAlH2BD5sM7jJoX5XibpP3kkvmZ0ALQSpttUwoHx1sdZKKopeFDQmLk8bN9COmRZN_hfMjwGoY67JyjJg3HMQsMWLFjVqSabYCkd3x0WU_6nFTJ0Za8GLRuEfUY7HT0NPGvRMNrN_8X1HYu-0B5rlspQCv8QUtb0BQp5V05hY3B_SmNHoBALyCgRraVSgSE80m5u7XT4ibkRhfYvDpoSh3VO_Q47R8tyJXhJJNWZsY8MNzHnYfIStoL3zE07Lr6kqJDEZ6DI-5hMw7gnG-TnwIJHfbFlyFO5N10PlEMkxnnfrsc6owlU9VNnsZ-kuOzIQ93yJ-5UCqMLWnFarSekiv2hPpHgUatU10tT4bO1emrLcOCITq_tzElI6k2JOfAy6fkgHmzviS1jDGCQck04mlwpVtX-nL1jSUkyUj-1DFuoQe3qnmyudrO499DKpyEupLTha4NziPqlZ-3RYeJyrweFWR5tPfQiSX7YpcO6fPC1.6nwv3jTRyL_XCw3pyX1Eow"

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



    
    
