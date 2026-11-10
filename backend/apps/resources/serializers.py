import re
from rest_framework import serializers
from .models import Resource, Rating, Comment, Notification, Download
from apps.accounts.serializers import UserProfileSerializer

def format_download_url(external_url, file_obj, request=None):
    """
    Returns an accessible download/view URL.
    Converts Google Drive view links to direct view or download URLs when possible.
    """
    if external_url:
        # Check if Google Drive link
        gd_match = re.search(r'/d/([a-zA-Z0-9_-]+)', external_url) or re.search(r'id=([a-zA-Z0-9_-]+)', external_url)
        if gd_match:
            file_id = gd_match.group(1)
            # Both direct download and Google viewer work well
            return f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
        return external_url
    if file_obj:
        return request.build_absolute_uri(file_obj.url) if request else file_obj.url
    return None

class ResourceSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.SerializerMethodField()
    uploaded_by_full_name = serializers.SerializerMethodField()
    uploaded_by_student_id = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    university_name = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    course_code = serializers.CharField(source='course.code', read_only=True, default='')
    file_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    rating_count = serializers.IntegerField(source='ratings.count', read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'file_type', 'file_size', 'downloads', 
                           'views', 'average_rating', 'uploaded_at']
    
    def get_uploaded_by_username(self, obj):
        if obj.uploaded_by:
            if not getattr(obj.uploaded_by, 'show_name_on_publish', True):
                return 'Anonymous'
            return obj.uploaded_by.username
        return 'Anonymous'

    def get_uploaded_by_full_name(self, obj):
        if obj.uploaded_by:
            if not getattr(obj.uploaded_by, 'show_name_on_publish', True):
                return 'Anonymous Student'
            name = obj.uploaded_by.get_full_name().strip()
            return name if name else obj.uploaded_by.username
        return 'Student Contributor'

    def get_uploaded_by_student_id(self, obj):
        if obj.uploaded_by and not getattr(obj.uploaded_by, 'show_name_on_publish', True):
            return ''
        if obj.student_id:
            return obj.student_id
        if obj.uploaded_by and obj.uploaded_by.student_id:
            return obj.uploaded_by.student_id
        return ''

    def get_university_name(self, obj):
        if obj.university_name:
            return obj.university_name
        if obj.department and obj.department.university:
            return obj.department.university.name
        return ''

    def get_department_name(self, obj):
        if obj.department_name:
            return obj.department_name
        if obj.department:
            return obj.department.name
        return ''

    def get_course_name(self, obj):
        if obj.course_name:
            return obj.course_name
        if obj.course:
            return obj.course.name
        return ''
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        return format_download_url(obj.external_url, obj.file, request)

    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.external_url:
            gd_match = re.search(r'/d/([a-zA-Z0-9_-]+)', obj.external_url) or re.search(r'id=([a-zA-Z0-9_-]+)', obj.external_url)
            if gd_match:
                file_id = gd_match.group(1)
                return f"https://drive.google.com/uc?export=download&id={file_id}"
            return obj.external_url
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

class ResourceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'course_name', 'university_name', 'department_name', 'description',
            'external_url', 'department', 'course', 'tags',
            'year', 'semester', 'file_type'
        ]
        extra_kwargs = {
            'title': {'required': False, 'allow_blank': True},
            'course_name': {'required': True},
            'university_name': {'required': True},
            'department_name': {'required': True},
            'description': {'required': True},
            'external_url': {'required': True},
        }

    def validate(self, attrs):
        external_url = attrs.get('external_url')

        if not external_url:
            raise serializers.ValidationError({
                'external_url': 'File URL is required. Please provide a Google Drive or cloud document link.'
            })

        # Validate URL format
        url_str = external_url.strip()
        if not (url_str.startswith('http://') or url_str.startswith('https://')):
            raise serializers.ValidationError({
                'external_url': 'URL must start with http:// or https://'
            })
        # Normalize Google Drive links if needed
        if 'drive.google.com' in url_str:
            gd_match = re.search(r'/d/([a-zA-Z0-9_-]+)', url_str) or re.search(r'id=([a-zA-Z0-9_-]+)', url_str)
            if not gd_match:
                raise serializers.ValidationError({
                    'external_url': 'Invalid Google Drive URL. Please make sure the link includes the file ID and is shared as "Anyone with the link can view".'
                })
            attrs['external_url'] = f"https://drive.google.com/file/d/{gd_match.group(1)}/view?usp=sharing"

        if not attrs.get('title'):
            course = attrs.get('course_name', '').strip()
            attrs['title'] = f"{course} Study Material"

        return attrs
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['uploaded_by'] = user
        if user and hasattr(user, 'student_id') and user.student_id:
            validated_data['student_id'] = user.student_id
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    resource_title = serializers.CharField(source='resource.title', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'actor_name', 'resource', 'resource_title',
                  'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'recipient', 'actor', 'created_at']

    def get_actor_name(self, obj):
        if obj.actor:
            name = obj.actor.get_full_name().strip()
            return name if name else obj.actor.username
        return 'Student'

class RatingSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Rating
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CommentSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ['user', 'resource', 'created_at', 'updated_at', 'is_active']
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return 'Student'
    
    def create(self, validated_data):
        if 'user' not in validated_data and 'request' in self.context:
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class DownloadSerializer(serializers.ModelSerializer):
    resource_details = ResourceSerializer(source='resource', read_only=True)
    resource_title = serializers.CharField(source='resource.title', read_only=True)
    file_type = serializers.CharField(source='resource.file_type', read_only=True)
    file_size = serializers.IntegerField(source='resource.file_size', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Download
        fields = ['id', 'user', 'resource', 'resource_title', 'resource_details', 'file_type', 'file_size', 'download_url', 'downloaded_at']
        read_only_fields = ['id', 'user', 'downloaded_at']

    def get_download_url(self, obj):
        if obj.resource:
            return format_download_url(obj.resource.external_url, obj.resource.file, self.context.get('request'))
        return ''
