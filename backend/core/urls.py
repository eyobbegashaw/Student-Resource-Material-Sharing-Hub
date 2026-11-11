"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


def health_check(request):
    """Lightweight root and health endpoint for Render health probes."""
    return JsonResponse({
        "status": "ok",
        "service": "Student Resource & Material Sharing Hub API",
        "endpoints": {
            "api": "/api/",
            "swagger": "/swagger/",
            "redoc": "/redoc/",
            "admin": "/admin/",
        },
    })


schema_view = get_schema_view(
    openapi.Info(
        title="Student Resource Hub API",
        default_version='v1',
        description="API for Student Resource & Material Sharing Hub",
        contact=openapi.Contact(email="eyobbegashaw075@gmail.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('', health_check, name='root-health'),
    path('health/', health_check, name='health-check'),
    path('api/health/', health_check, name='api-health-check'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.api.urls')),
    
    # API documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
