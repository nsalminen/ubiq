# from https://github.com/acheong08/ChatGPT
# go here https://chat.openai.com/api/auth/session , in cookies and get the value of __Secure-next-auth.session-token

import selenium.webdriver 
from revChatGPT.ChatGPT import Chatbot
import sys



# {
#   "message": message,
#   "conversation_id": self.conversation_id,
#   "parent_id": self.parent_id,
# }


import selenium.webdriver 
from revChatGPT.ChatGPT import Chatbot

queue = []
chatbot = None
busy = False
done = False

def generateTextFromPrompt(chatbot, prompt):
    global busy
    prompt = prompt.decode()
    if(prompt != "" and busy == False):
        #print("-------", prompt)
        busy = True
        response = chatbot.ask(prompt, conversation_id=None, parent_id=None) # You can specify custom conversation and parent ids. Otherwise it uses the saved conversation (yes. conversations are automatically saved)
        print("{RESPONSE}:", response)
        
        busy = False

def recognize_from_stdin():
    global chatbot, done, busy
    
    if(chatbot == None):
        chatbot = Chatbot({
          "session_token": "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0.._zIMaJdVQbtSHDzh.kkyJo4ati-sH7aOh2k2YBAX6-RDLKg81h0oWweGHyezmLPKPanyRszM1JhkhtbhLIZvLIFsbGeJsrGe47kf0GJ39QuDh-5ZYXA4zCCpmqqjzz43y-wL1MwP7ClZSmNUFejrynGioTX5OQWAlfgW1itzfKEqNsvPpk13cT6QaKP9bxpWo9HfBFn7lQNjN7bJUXBdoBY1x42MQb4zUm3yLsxxFlq6xsu5m1vYEsBfXBbUyn_BjjuUs-l3aRnHirw2cldBaZoT9bTqOvw23Bz-QDiaS4ACKS_MfevcnxIACLhQnKAplxR4p8MpapJrRBjBz8P_zaRnZKNg_q-9DzQG2MX6k5VusoucPmkkJOw4LNKFlshpLziilCNOw-I65HVDCmG0WGqKOP2ZdynNXH7j3qEFgy1PHVWGT2e94q63ublSIL1TnrDIpyo4Xy_KtgVHVAPorKwJ0EsPEWGmHcZBGJbONcxn1DiAE-CB9PMXEyFJZ8psK-o39g-HoVNXiXS69bqAVLpYqf4rwPpkmEKf-tps_voMaJ5rL22Kwj4RZ6L3sUk4rRHDG-oTWXR8ZwZdRsVfuOYAswtybJ3zuOV3M_fMOg0OPFo7Eap48su9t1r64EH4TyoxN5MIOusaMfOx5OwBQZ7cF2UHPUIXgOVUoAxAnmgdd1P6P3Rs7obcsZXCX9t2SYANsKu5JQnHwyueMUVQlDDiF5eBU1cwmeZUxRiz1Te7_WoBVTKBQYwjYTvnkpBwtrP3tFQkKttT0sn2wFPkmCEi8dDSgqRSx8Gz2Mym7-PtfwCyOZLswyMRLWc6HYmNFl4cX4UjwCL8IRKXIV7gkeuE98D32pHvQp6P160grYOeKa369NZrXLRfkVzA4wYslxWfbOzRvtNaQfMyMuSAJXRr0Jdm2sh8vcVlLVfVkgoFSAHSzF1autHxBuVJ2ljWUsaylzNUBJwOjM6reg1W10ZAvL-MyQrF3-EIFaYVrjvEjRrpeFJHncEA5F6dbN-27viju-tRrnfn7APaKT6PQ3EgAzUi3YdZh_BvV5TeZzcx1djF3MesviimSRJ5uycmkpxmdT4I31GTJ_qqMQhU8b2dgvysp3UHERl97WkkphvbG8iUydgOCATeOHuCnkvqRwhJ_c3idjLsUekeghFO7W8puTEeCBE5UxYrwEQU2DLGM52Ssr5HdFTqLLF4W-NdtXQi0bJa5HnEjYdGTfIsfDpmVSw5mOG-HPwlbXcBhciXG1LBm5xRApWFfc8SnM9eI5-UtX16wueOZbc6ucD-HlHHxnPAghUy4WiHv0MX_Ut6zYEkf3EKCvtKov-5YKTH7m7aCF4RVds-jR86ycUc1-3OTXuzS6F1LSOIjLxzOfvEKfUdeADwCSCmjnNY_xgj4phrdD8DjP6ZEIqIc1IsCjMnc7DQ_CUAuhZB8PMeTbh6RuAFZGsnMPzGEVdPfEaLCjvh3ZQMQjTPWW9VV_2qxmbvB3sfKDMvmquzcPpXL2p7Q1ZiGdhXcnP4y3obuDkB9lT7TUo_oHxmy7gU9ZMTkAUfUOvkf1glKo8kS0fd8emeH_TetLF0NxVuLUI1_BoTDfPdxkeGxsn6drhihEcKU8hOZL_LeQ0lWpm4AyIAHxWlHfm3I92McCUln-0E81c-iToRO9maXxzXsCSsjYTsVsYIE00vc6fzHwT8xPlcQ9eA_J9PqW8d7uMV-Ca47WnzZWTG-v6lcWrl3TzMHujbJVf-bKzUYe9eD9TpHofJLLHXprYGG3Lb_sPscPVVcKH_zPMAUH0roK6cePk41Bf2gJ0Dwlvuc3VJt3DnVlf8bo6y5phxF-FZZus1av6CxmG9vAMk3jkrS4y5jWIkNVLahULxO6amy-NtwH0FeHJcweHvTV6zARwZXD2pCqwIFkaTv7dmO5-eA1HgZs1wvsgcdAEzqYnKUIVaCrWcLfbY__BsX5DCDJoqSUd25W8gyOQlyTcq0l9BF5LexXtUB3OtkqMTUqodW2WFeQsolNCsl_YXyewYSvcBj6usn_fc8Vh3rFtJsBxvezyiALiEWc2jq-T5Fhqu3hmfNue19CMibxGZEsijL6Vn6I4x-9nZ1XtKwmv8g5kGG_vjoilWxn20JD7H6hlQ-rwVCAnd7_mZMKKuOAHI7DVEJ3H8h9bCU65QtDvXoZ_lgf2ADZk6NhE-7A4O6FZtwUgKv6QXF-ZhQa7t1YDQi4AlUdugc_IILE2u-r2a4ZlOmF1FxE9-o3FU7uK6LVf43A-bbA6aq8ASdBVtIemN-gAn1diJY.2MnTx31giguW-Nss4KsyAg"
        }, conversation_id=None, parent_id=None) # You can start a custom conversation
    
    # Write stdin to the stream
    while not done:
        try:
            line = sys.stdin.buffer.readline()
            if len(line) == 0:
                continue
            generateTextFromPrompt(chatbot, line)
        except KeyboardInterrupt:
            break

recognize_from_stdin()



    
    
