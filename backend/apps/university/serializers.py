from rest_framework import serializers
from .models import University, Department, Course

class UniversitySerializer(serializers.ModelSerializer):
    departments_count = serializers.IntegerField(source='departments.count', read_only=True)
    
    class Meta:
        model = University
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    courses_count = serializers.IntegerField(source='courses.count', read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    university_name = serializers.CharField(source='department.university.name', read_only=True)
    
    class Meta:
        model = Course
        fields = '__all__'