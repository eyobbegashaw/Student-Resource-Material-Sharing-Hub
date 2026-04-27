from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from .models import Resource, Rating, Comment
from .serializers import (
    ResourceSerializer, ResourceCreateUpdateSerializer,
    RatingSerializer, CommentSerializer
)
from apps.api.permissions import IsOwnerOrReadOnly

class ResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for Resource model"""
    queryset = Resource.objects.filter(is_active=True).select_related(
        'uploaded_by', 'department', 'department__university', 'course'
    ).prefetch_related('ratings', 'comments')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'course', 'year', 'semester', 'file_type', 'uploaded_by']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['title', 'uploaded_at', 'downloads', 'views', 'average_rating']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ResourceCreateUpdateSerializer
        return ResourceSerializer
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Increment download count"""
        resource = self.get_object()
        resource.downloads += 1
        resource.save(update_fields=['downloads'])
        return Response({'downloads': resource.downloads})
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """Increment view count"""
        resource = self.get_object()
        resource.views += 1
        resource.save(update_fields=['views'])
        return Response({'views': resource.views})
    
    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top rated resources"""
        resources = self.get_queryset().order_by('-average_rating')[:10]
        serializer = self.get_serializer(resources, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def most_downloaded(self, request):
        """Get most downloaded resources"""
        resources = self.get_queryset().order_by('-downloads')[:10]
        serializer = self.get_serializer(resources, many=True)
        return Response(serializer.data)

class RatingViewSet(viewsets.ModelViewSet):
    """ViewSet for Rating model"""
    queryset = Rating.objects.all().select_related('user', 'resource')
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resource', 'value']
    
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Comment model"""
    queryset = Comment.objects.filter(is_active=True).select_related('user', 'resource')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['resource']
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        return self.queryset.filter(resource_id=self.kwargs.get('resource_pk'))
    
    def perform_create(self, serializer):
        resource = Resource.objects.get(pk=self.kwargs.get('resource_pk'))
        serializer.save(user=self.request.user, resource=resource)
