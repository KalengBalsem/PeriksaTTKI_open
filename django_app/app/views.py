# django imports
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib import auth
from django.contrib.auth.models import User
from django_ratelimit.decorators import ratelimit

# django database related
from .models import Chat, UserCorrection, Credits, Subscriptions
from django.utils import timezone
from datetime import timedelta

# google outh imports
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests
import os

# inferencing language model api
from .model_inference import call_model
import json
####

# Create your views here.
def index(request):
    # i might need to change this part (hardcoded)
    if request.user.is_authenticated:
        return redirect('main')
    else:
        return render(request, 'index.html')
    ####

# CREDITS COUNTER (for free users)
def check_credits(user, sending_request=False):
    try:
        user_credits = Credits.objects.get(user=user)
    except Credits.DoesNotExist:
        user_credits = Credits.objects.create(user=user)
    now = timezone.now()
    if now - user_credits.last_credit_resets >= timedelta(hours=1):
        user_credits.credits = 50  # Reset credits
        user_credits.last_credit_resets = now  # Update last reset time
        user_credits.save()
    # check subscription
    try:
        subs_history = Subscriptions.objects.get(user=user)
        subs_active = subs_history.active
    except:
        subs_active = False
    # update/return credit
    if subs_active == False and user_credits.credits <= 0:
        user_credits.credits = 0
        user_credits.save()
    elif subs_active == False and sending_request == True:
        # ENABLE THIS TO ACTIVATE CREDIT FEATURE
        # user_credits.credits -= 1  
        # user_credits.save()
        pass
    return user_credits.credits
####

@ratelimit(key='user_or_ip', rate='5/m', method=['POST'], block=False)
def main(request):
    if request.method == 'POST':
        if request.POST.get('data_type') == 'user_input':
            user_input = request.POST.get('user_input')
            response = call_model(user_input)
            typo_words = response['typo_words']  # typo words is not used..
            error_words = response['error_words']
            rules_check = response['rules_check']
            paraphrase = response['paraphrase']
            if getattr(request, 'limited', False):
                return JsonResponse({'typo_words': 'Terlalu Banyak Request (max=5/minute).', 'error_words': '', 'paraphrase': 'Terlalu Banyak Request (max=5/minute).'})
            # registering user input to the database
            chat = Chat(user=request.user, message=user_input, response=response, timestamp=timezone.now())
            chat.save()
            ####
            credits_count = check_credits(request.user)
            decreased_credits = check_credits(request.user, sending_request=True)
            if credits_count <= 0:
                zero_credit_msg = 'Anda telah kehabisan kredit. Kredit akan direset setiap 1 jam (Tingkatkan paket untuk kredit tidak terbatas).'
                typo_words, paraphrase = zero_credit_msg, zero_credit_msg
            return JsonResponse({'typo_words': typo_words, 'error_words': error_words, 'rules_check': rules_check, 'paraphrase': paraphrase, 'credits_count': decreased_credits})
        elif request.POST.get('data_type') == 'user_correction':
            user_correction_data = json.loads(request.POST.get('user_correction'))
            original_word = user_correction_data['original_word']
            user_correction = user_correction_data['user_correction']
            # registering user_correction to the database
            usercorrection = UserCorrection(user=request.user, original_word=original_word, user_correction=user_correction, timestamp=timezone.now())
            usercorrection.save()
            ####
            return HttpResponse(json.dumps('user_correction has successfully stored.'))
    elif request.user.is_authenticated:
        credits_count = check_credits(request.user)
        return render(request, 'main.html', {'credits_count': credits_count})
    else:
        return redirect('index')

def login(request):
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        user = auth.authenticate(request, username=email, password=password)
        if user is not None:
            auth.login(request, user)
            return redirect('main')
        else:
            error_message = 'Invalid username or password'
            return render(request, 'login.html', {'error_message': error_message})
    else:
        return render(request, 'login.html')

def register(request):
    if request.method == 'POST':
        email = request.POST['email']
        password1 = request.POST['password1']
        password2 = request.POST['password2']

        if password1 == password2:
            try:
                user = User.objects.create_user(email, email, password1)
                user.save()
                auth.login(request, user)
                return redirect('main')
            except:
                error_message = 'Error creating account'
                return render(request, 'register.html', {'error_message': error_message})
        else:
            error_message = 'Password don\'t match'
            return render(request, 'register.html', {'error_message': error_message})
    else:
        return render(request, 'register.html')

@csrf_exempt
def auth_receiver(request):
    """
    Google calls this URL after the user has signed in with their Google account.
    """
    token = request.POST['credential']

    try:
        user_data = id_token.verify_oauth2_token(
            token, requests.Request(), os.environ['GOOGLE_OAUTH_CLIENT_ID']
        )
    except ValueError:
        return HttpResponse(status=403)

    # In a real app, I'd also save any new user here to the database. See below for a real example I wrote for Photon Designer.
    # You could also authenticate the user here using the details from Google (https://docs.djangoproject.com/en/4.2/topics/auth/default/#how-to-log-a-user-in)
    request.session['user_data'] = user_data

    # Extract user information from the token
    google_id = user_data.get('sub')
    email = user_data.get('email')
    first_name = user_data.get('given_name')
    last_name = user_data.get('family_name')

    # Check if the user already exists
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # If user does not exist, create a new user
        user = User.objects.create_user(username=email, email=email, password=None)
        user.save()


    auth.login(request, user)
    return redirect('main')


def logout(request):
    auth.logout(request)
    return redirect('index')