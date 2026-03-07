from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Student Resource Hub API",
        default_version='v1',
        description="API for Student Resource & Material Sharing Hub",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('auth/', include('apps.accounts.urls')),
    path('', include('apps.university.urls')),
    path('', include('apps.resources.urls')),
]