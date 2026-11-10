from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'resources', views.ResourceViewSet)
router.register(r'ratings', views.RatingViewSet)
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'downloads', views.DownloadViewSet, basename='download')

urlpatterns = [
    path('', include(router.urls)),
    path('resources/<int:resource_pk>/comments/', 
         views.CommentViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='resource-comments'),
    path('resources/<int:resource_pk>/comments/<int:pk>/',
         views.CommentViewSet.as_view({'get': 'retrieve', 'put': 'update', 
                                      'patch': 'partial_update', 'delete': 'destroy'}),
         name='resource-comment-detail'),
]
