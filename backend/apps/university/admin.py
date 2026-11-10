from django.contrib import admin
from .models import University, Department, Course

@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'website', 'is_active', 'created_at')
    search_fields = ('name', 'code')
    list_filter = ('is_active',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'university', 'is_active')
    search_fields = ('name', 'code', 'university__name')
    list_filter = ('university', 'is_active')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'department', 'year', 'semester', 'credits', 'is_active')
    search_fields = ('code', 'name', 'department__name')
    list_filter = ('department__university', 'year', 'semester', 'is_active')
