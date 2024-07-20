from django.contrib import admin
from .models import Chat, UserCorrection, Credits, Subscriptions

# Register your models here.
admin.site.register(Chat)
admin.site.register(UserCorrection)
admin.site.register(Credits)
admin.site.register(Subscriptions)