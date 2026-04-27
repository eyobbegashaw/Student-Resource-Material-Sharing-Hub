from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import University, Department, Course
from .serializers import UniversitySerializer, DepartmentSerializer, CourseSerializer

class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing universities"""
    queryset = University.objects.filter(is_active=True)
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing departments"""
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['university']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    
    def get_queryset(self):
        queryset = Department.objects.filter(is_active=True)
        university_id = self.request.query_params.get('university', None)
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        return queryset

class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing courses"""
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'year', 'semester']
    search_fields = ['code', 'name']
    ordering_fields = ['year', 'semester', 'code', 'name']
    
    def get_queryset(self):
        queryset = Course.objects.filter(is_active=True)
        department_id = self.request.query_params.get('department', None)
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        return queryset
