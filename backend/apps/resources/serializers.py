from rest_framework import serializers
from .models import Resource, Rating, Comment
from apps.accounts.serializers import UserProfileSerializer

class ResourceSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    uploaded_by_full_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    university_name = serializers.CharField(source='department.university.name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    file_url = serializers.SerializerMethodField()
    rating_count = serializers.IntegerField(source='ratings.count', read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = Resource
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'file_type', 'file_size', 'downloads', 
                           'views', 'average_rating', 'uploaded_at']
    
    def get_uploaded_by_full_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name()
        return 'Unknown User'
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class ResourceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['title', 'description', 'file', 'department', 'course', 'tags', 'year', 'semester']
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)

class RatingSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Rating
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        # Check if user already rated this resource
        request = self.context.get('request')
        if request and request.method == 'POST':
            resource = attrs.get('resource')
            if Rating.objects.filter(user=request.user, resource=resource).exists():
                raise serializers.ValidationError('You have already rated this resource.')
        return attrs
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CommentSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'is_active']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
