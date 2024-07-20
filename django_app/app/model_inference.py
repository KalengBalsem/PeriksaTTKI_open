import requests

def call_model(user_input):
    request_body = {
        'user_input': user_input
    }
    try:
        unparsed_response = requests.post("https://promising-paulita-balsem-23bd1b73.koyeb.app/run_model", json=request_body)
        parsed_response = unparsed_response.json()
        typo_words = parsed_response['typo_words']
        error_words = parsed_response['error_words']
        rules_check = parsed_response['rules_check']
        paraphrase = parsed_response['paraphrase_output']
    except:
        typo_words = f'This is your typo words: {user_input}'
        error_words = []
        rules_check = []
        paraphrase = f'This is your paraphrased text: {user_input}'
    return {'typo_words': typo_words, 'error_words': error_words, 'rules_check': rules_check, 'paraphrase': paraphrase}