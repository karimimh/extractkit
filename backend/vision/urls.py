"""
URL configuration for vision app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('auto-brightness/',
         views.auto_brightness_view,
         name='auto-brightness'),
    path('auto-white-balance/',
         views.auto_white_balance_view,
         name='auto-white-balance'),
    path('super-resolution/',
         views.super_resolution_view,
         name='super-resolution'),
]
