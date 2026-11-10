from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name',
                  'university', 'university_name', 'department', 'department_name', 'year_of_study')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'university_name': {'required': False, 'allow_blank': True},
            'department_name': {'required': False, 'allow_blank': True},
            'year_of_study': {'required': False},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        if 'email' in validated_data:
            validated_data['email'] = validated_data['email'].strip().lower()
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
        else:
            raise serializers.ValidationError('Must include email and password.')
        
        attrs['user'] = user
        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name',
                  'university', 'university_name', 'department', 'department_name',
                  'year_of_study', 'student_id', 'profile_picture', 'is_email_verified',
                  'theme_preference', 'notify_new_resources', 'notify_comments', 'email_notifications',
                  'show_name_on_publish', 'date_joined')
        read_only_fields = ('id', 'email', 'date_joined', 'is_email_verified')
    
    def validate_student_id(self, value):
        if not value or not str(value).strip():
            return None
        cleaned_id = str(value).strip()
        qs = User.objects.filter(student_id=cleaned_id)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("User with this Student id already exists.")
        return cleaned_id

    def get_full_name(self, obj):
        name = obj.get_full_name().strip()
        return name if name else obj.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data.get('university_name') and instance.university:
            data['university_name'] = instance.university.name
        if not data.get('department_name') and instance.department:
            data['department_name'] = instance.department.name
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        return attrs
