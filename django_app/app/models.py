import uuid
from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Chat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class UserCorrection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    original_word = models.TextField()
    user_correction = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class Credits(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    credits = models.IntegerField(default=50)  # infinity if active == True else 20
    last_credit_resets = models.DateTimeField(auto_now_add=True)
    
class Subscriptions(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    times_subscribed = models.IntegerField(default=0)
    subscription_info = models.TextField(default='')
    amount_paid = models.IntegerField(default=0)
    start_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=False)