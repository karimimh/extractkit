from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, LayerViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'layers', LayerViewSet, basename='layer')

urlpatterns = [
    path('', include(router.urls)),
]
