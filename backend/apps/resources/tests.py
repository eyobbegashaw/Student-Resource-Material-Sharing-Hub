from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.resources.models import Resource
from apps.university.models import University, Department, Course

class ResourcesEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='uploader',
            email='uploader@example.com',
            password='Password123!',
            student_id='ETS/2002/14'
        )
        self.uni = University.objects.create(name='Debre Brihan University', code='DBU')
        self.dept = Department.objects.create(university=self.uni, name='Computer Science', code='CS')
        self.course = Course.objects.create(
            department=self.dept,
            name='Data Structures',
            code='CoSc2041',
            year=2,
            semester=1,
            credits=3.0
        )

        self.resource = Resource.objects.create(
            title='Data Structures Midterm Exam 2024',
            description='Complete solved midterm exam',
            file_type='PDF',
            external_url='https://drive.google.com/test-exam.pdf',
            department=self.dept,
            course=self.course,
            university_name='Debre Brihan University',
            department_name='Computer Science',
            course_name='Data Structures',
            year=2,
            semester=1,
            uploaded_by=self.user,
            student_id=self.user.student_id,
            is_active=True
        )

    def test_filter_by_department_string(self):
        res = self.client.get('/api/resources/?department=Computer+Science&sort=-uploaded_at&page=1')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Data Structures Midterm Exam 2024')

    def test_filter_by_university_and_department(self):
        res = self.client.get(
            '/api/resources/?university=Debre+Brihan+University&department=Computer+Science&sort=-uploaded_at&page=1'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 1)

    def test_filter_options_endpoint(self):
        res = self.client.get('/api/resources/filter_options/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('universities', res.data)
        self.assertIn('departments', res.data)

    def test_stats_endpoint(self):
        res = self.client.get('/api/resources/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_resources', res.data)
        self.assertGreaterEqual(res.data['total_resources'], 1)

    def test_download_counter_and_redirect(self):
        res = self.client.get(f'/api/resources/{self.resource.id}/download/')
        self.assertIn(res.status_code, [status.HTTP_302_FOUND, status.HTTP_200_OK])
        self.resource.refresh_from_db()
        self.assertEqual(self.resource.downloads, 1)
