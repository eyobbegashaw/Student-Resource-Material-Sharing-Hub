from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'universities', views.UniversityViewSet)
router.register(r'departments', views.DepartmentViewSet)
router.register(r'courses', views.CourseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]