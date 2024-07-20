from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("main", views.main, name="main"),
    path("login", views.login, name="login"),
    path("register", views.register, name="register"),
    path("logout", views.logout, name="logout"),
    path('auth-receiver', views.auth_receiver, name='auth_receiver'),
]