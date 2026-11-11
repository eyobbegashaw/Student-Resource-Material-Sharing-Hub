from django.test import TestCase
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, EmailOTP

class AccountsEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='teststudent',
            email='teststudent@example.com',
            password='Password123!',
            first_name='Test',
            last_name='Student',
            student_id='ETS/1001/14'
        )

    def test_login_success_and_bearer_token_auth(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'teststudent@example.com',
            'password': 'Password123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('user', res.data)
        self.assertIn('token', res.data)
        self.assertIsNotNone(res.data['token'])
        self.assertEqual(res.data['user']['email'], 'teststudent@example.com')

        # Verify Bearer token authentication works without cookies
        anon_client = APIClient()
        profile_res = anon_client.get(
            '/api/auth/profile/',
            HTTP_AUTHORIZATION=f"Bearer {res.data['token']}"
        )
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['email'], 'teststudent@example.com')

    def test_health_endpoints(self):
        for url in ['/', '/health/', '/api/health/']:
            res = self.client.get(url)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res.json()['status'], 'ok')

    def test_login_invalid_password(self):
        res = self.client.post('/api/auth/login/', {
            'email': 'teststudent@example.com',
            'password': 'WrongPassword!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_empty_student_id_normalization(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.patch('/api/auth/profile/', {
            'student_id': '   ',
            'university_name': 'Addis Ababa University'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.student_id)
        self.assertEqual(self.user.university_name, 'Addis Ababa University')

    def test_duplicate_student_id_returns_400(self):
        other_user = User.objects.create_user(
            username='otherstudent',
            email='other@example.com',
            password='Password123!',
            student_id='UNIQUE/999'
        )
        self.client.force_authenticate(user=self.user)
        res = self.client.patch('/api/auth/profile/', {
            'student_id': 'UNIQUE/999'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contact_form_delivery(self):
        res = self.client.post('/api/contact/', {
            'name': 'Abebe Bikila',
            'email': 'abebe@aau.edu.et',
            'subject': 'Resource Inquiry',
            'message': 'Hello, I would like to request past exams for CS.'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[-1]
        self.assertIn('eyobbegashaw075@gmail.com', sent_email.to)
        self.assertIn('Abebe Bikila', sent_email.body)
