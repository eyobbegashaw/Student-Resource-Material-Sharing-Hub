 

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# 'basename' መጨመር ስህተቱን ይፈታዋል
router.register(r'universities', views.UniversityViewSet, basename='university')
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'courses', views.CourseViewSet, basename='course')

urlpatterns = [
    path('', include(router.urls)),
]