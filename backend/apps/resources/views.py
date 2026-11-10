from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from .models import Resource, Rating, Comment, Notification, Download
from .serializers import (
    ResourceSerializer, ResourceCreateUpdateSerializer,
    RatingSerializer, CommentSerializer, NotificationSerializer, DownloadSerializer
)
from apps.api.permissions import IsOwnerOrReadOnly

User = get_user_model()

class ResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for Resource model"""
    queryset = Resource.objects.filter(is_active=True).select_related(
        'uploaded_by', 'department', 'department__university', 'course'
    ).prefetch_related('ratings', 'comments')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['year', 'semester', 'file_type', 'uploaded_by', 'university_name', 'course_name', 'department_name']
    search_fields = ['title', 'description', 'tags', 'course_name', 'university_name', 'department_name']
    ordering_fields = ['title', 'uploaded_at', 'downloads', 'views', 'average_rating']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ResourceCreateUpdateSerializer
        return ResourceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Support flexible university filter (by name, code, or id)
        university = self.request.query_params.get('university')
        if university:
            uni_q = (
                Q(university_name__iexact=university) |
                Q(department__university__name__iexact=university) |
                Q(department__university__code__iexact=university)
            )
            if university.isdigit():
                uni_q |= Q(department__university_id=int(university))
            qs = qs.filter(uni_q)
            
        # Support flexible department filter (by name, code, or id)
        department = self.request.query_params.get('department')
        if department:
            dept_q = (
                Q(department_name__iexact=department) |
                Q(department__name__iexact=department) |
                Q(department__code__iexact=department)
            )
            if department.isdigit():
                dept_q |= Q(department_id=int(department))
            qs = qs.filter(dept_q)

        # Support flexible course filter (by name, code, or id)
        course = self.request.query_params.get('course')
        if course:
            course_q = (
                Q(course_name__iexact=course) |
                Q(course__name__iexact=course) |
                Q(course__code__iexact=course)
            )
            if course.isdigit():
                course_q |= Q(course_id=int(course))
            qs = qs.filter(course_q)

        # Support sort query parameter matching frontend convention (e.g. ?sort=-uploaded_at)
        sort_param = self.request.query_params.get('sort')
        if sort_param and not self.request.query_params.get('ordering'):
            valid_sorts = {
                'title': 'title',
                '-title': '-title',
                'uploaded_at': 'uploaded_at',
                '-uploaded_at': '-uploaded_at',
                'downloads': 'downloads',
                '-downloads': '-downloads',
                'views': 'views',
                '-views': '-views',
                'average_rating': 'average_rating',
                '-average_rating': '-average_rating',
                'rating': '-average_rating',
                '-rating': 'average_rating',
                'newest': '-uploaded_at',
                'oldest': 'uploaded_at',
                'popular': '-downloads',
            }
            order_field = valid_sorts.get(sort_param.strip())
            if order_field:
                qs = qs.order_by(order_field)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        resource = serializer.save(
            uploaded_by=user,
            student_id=getattr(user, 'student_id', '') or ''
        )

        # Dispatch notifications to active students who opted in to new resource notifications
        try:
            author_name = user.get_full_name().strip() or user.username
            course_label = resource.course_name or (resource.course.name if resource.course else 'Course')
            uni_label = resource.university_name or (resource.department.university.name if (resource.department and resource.department.university) else 'University')
            dept_label = resource.department_name or (resource.department.name if resource.department else '')
            location_info = f"at {uni_label}" + (f" ({dept_label})" if dept_label else "")
            
            recipients = User.objects.filter(
                is_active=True,
                notify_new_resources=True
            ).exclude(id=user.id)

            notifications = [
                Notification(
                    recipient=u,
                    actor=user,
                    resource=resource,
                    title=f"New Study Material: {resource.title}",
                    message=f"{author_name} posted new learning material for '{course_label}' {location_info}."
                )
                for u in recipients
            ]
            if notifications:
                Notification.objects.bulk_create(notifications)
        except Exception as e:
            # Notifications are best-effort and should never block resource creation
            print(f"Error dispatching notifications: {e}")
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.AllowAny])
    def download(self, request, pk=None):
        """Increment download count and log download history"""
        resource = self.get_object()
        resource.downloads += 1
        resource.save(update_fields=['downloads'])
        user = request.user if request.user.is_authenticated else None
        Download.objects.create(
            user=user,
            resource=resource,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        if request.method == 'GET' and (resource.external_url or resource.file):
            target_url = resource.external_url or (resource.file.url if resource.file else None)
            if target_url:
                from django.shortcuts import redirect
                return redirect(target_url)
        return Response({'downloads': resource.downloads, 'url': resource.external_url or (resource.file.url if resource.file else '')})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
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

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def stats(self, request):
        """Aggregate real statistics from database - strictly from student registrations and uploads"""
        from django.db.models import Sum, Avg
        from django.contrib.auth import get_user_model

        UserModel = get_user_model()

        total_resources = Resource.objects.filter(is_active=True).count()

        # Count distinct universities strictly from registered students and published resources
        user_unis = [
            u.strip().lower() for u in UserModel.objects.exclude(university_name='').values_list('university_name', flat=True) if u.strip()
        ]
        res_unis = [
            u.strip().lower() for u in Resource.objects.filter(is_active=True).exclude(university_name='').values_list('university_name', flat=True) if u.strip()
        ]
        total_universities = len(set(user_unis + res_unis))

        total_downloads = Resource.objects.filter(is_active=True).aggregate(total=Sum('downloads'))['total'] or 0
        dl_records = Download.objects.count()
        if dl_records > total_downloads:
            total_downloads = dl_records

        rated_qs = Resource.objects.filter(is_active=True, average_rating__gt=0)
        if rated_qs.exists():
            avg_rating = rated_qs.aggregate(avg=Avg('average_rating'))['avg'] or 5.0
        else:
            rating_records = Rating.objects.all()
            if rating_records.exists():
                avg_rating = rating_records.aggregate(avg=Avg('value'))['avg'] or 5.0
            else:
                avg_rating = 5.0

        return Response({
            'total_resources': total_resources,
            'total_universities': total_universities,
            'total_downloads': total_downloads,
            'average_rating': round(float(avg_rating), 1),
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def filter_options(self, request):
        """
        Get distinct universities and departments from student registration time and published resources.
        No hardcoded or mock data.
        """
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()

        # Distinct universities
        seen_unis = {}
        for name in UserModel.objects.exclude(university_name='').values_list('university_name', flat=True):
            clean = name.strip()
            if clean and clean.lower() not in seen_unis:
                seen_unis[clean.lower()] = clean

        for name in Resource.objects.filter(is_active=True).exclude(university_name='').values_list('university_name', flat=True):
            clean = name.strip()
            if clean and clean.lower() not in seen_unis:
                seen_unis[clean.lower()] = clean

        unis = [{'name': v, 'value': v} for v in sorted(seen_unis.values(), key=lambda x: x.lower())]

        # Distinct departments
        seen_depts = {}
        for name in UserModel.objects.exclude(department_name='').values_list('department_name', flat=True):
            clean = name.strip()
            if clean and clean.lower() not in seen_depts:
                seen_depts[clean.lower()] = clean

        for name in Resource.objects.filter(is_active=True).exclude(department_name='').values_list('department_name', flat=True):
            clean = name.strip()
            if clean and clean.lower() not in seen_depts:
                seen_depts[clean.lower()] = clean

        depts = [{'name': v, 'value': v} for v in sorted(seen_depts.values(), key=lambda x: x.lower())]

        return Response({
            'universities': unis,
            'departments': depts,
        })

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Student Notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'marked_as_read', 'id': notification.id})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all_marked_as_read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})

class RatingViewSet(viewsets.ModelViewSet):
    """ViewSet for Rating model with upsert support"""
    queryset = Rating.objects.all().select_related('user', 'resource')
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resource', 'value']
    
    def get_queryset(self):
        queryset = Rating.objects.all().select_related('user', 'resource')
        resource_id = self.request.query_params.get('resource')
        if resource_id:
            return queryset.filter(resource_id=resource_id, user=self.request.user)
        return queryset.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        resource_id = request.data.get('resource')
        value = request.data.get('value')
        if not resource_id or value is None:
            return Response({'error': 'Resource and value are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            value = int(value)
            if value < 1 or value > 5:
                return Response({'error': 'Value must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid rating value.'}, status=status.HTTP_400_BAD_REQUEST)

        resource = Resource.objects.filter(pk=resource_id).first()
        if not resource:
            return Response({'error': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)

        rating, created = Rating.objects.update_or_create(
            user=request.user,
            resource=resource,
            defaults={'value': value}
        )
        resource.update_average_rating()
        serializer = self.get_serializer(rating)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Comment model"""
    queryset = Comment.objects.filter(is_active=True).select_related('user', 'resource')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['resource']
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        resource_id = self.kwargs.get('resource_pk')
        if resource_id:
            return self.queryset.filter(resource_id=resource_id)
        return self.queryset
    
    def perform_create(self, serializer):
        resource_id = self.kwargs.get('resource_pk') or self.request.data.get('resource')
        resource = Resource.objects.get(pk=resource_id)
        comment = serializer.save(user=self.request.user, resource=resource)

        # Notify resource author if a different student comments
        if resource.uploaded_by and resource.uploaded_by != self.request.user:
            if getattr(resource.uploaded_by, 'notify_comments', True):
                try:
                    author_display = self.request.user.get_full_name() or self.request.user.username
                    Notification.objects.create(
                        recipient=resource.uploaded_by,
                        actor=self.request.user,
                        resource=resource,
                        title="New Comment on Your Material",
                        message=f"{author_display} commented on your material '{resource.title}'."
                    )
                except Exception as e:
                    print(f"Error creating comment notification: {e}")

class DownloadViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for students to view their download history"""
    serializer_class = DownloadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Download.objects.filter(user=self.request.user).select_related(
            'resource', 'resource__uploaded_by', 'resource__department', 'resource__course'
        ).order_by('-downloaded_at')

    @action(detail=False, methods=['delete'])
    def clear_history(self, request):
        """Allow a student to clear their download history"""
        Download.objects.filter(user=request.user).delete()
        return Response({'message': 'Download history cleared successfully.'}, status=status.HTTP_200_OK)
