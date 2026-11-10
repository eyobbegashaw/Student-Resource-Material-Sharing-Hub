from django.contrib import admin
from .models import Resource, Rating, Comment

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'department', 'course', 'uploaded_by', 'file_type', 'file_size', 'downloads', 'views', 'average_rating', 'is_active', 'uploaded_at')
    list_filter = ('file_type', 'is_active', 'department__university', 'department')
    search_fields = ('title', 'description', 'tags', 'uploaded_by__email')
    readonly_fields = ('file_type', 'file_size', 'downloads', 'views', 'average_rating', 'uploaded_at', 'updated_at')

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('resource', 'user', 'value', 'created_at')
    list_filter = ('value', 'created_at')
    search_fields = ('resource__title', 'user__email')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('resource', 'user', 'text', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('resource__title', 'user__email', 'text')
