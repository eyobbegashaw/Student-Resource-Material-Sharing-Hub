import json
import base64
import random
from datetime import timedelta
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout, update_session_auth_hash
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.core.cache import cache
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    ChangePasswordSerializer
)
from .models import User, EmailOTP
from .authentication import CsrfExemptSessionAuthentication, FlexibleTokenAuthentication


def _get_auth_token(user):
    """Get or create DRF auth token for cross-origin SPA requests."""
    try:
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return token.key
    except Exception:
        return None

def send_otp_email(email, otp_code):
    subject = f"{otp_code} is your StudentHub verification code"
    message = (
        f"Hello,\n\n"
        f"Thank you for registering with StudentHub Ethiopian Academic Sharing Platform.\n\n"
        f"Your 6-digit verification code is:\n\n"
        f"    {otp_code}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"Enter this code on the registration page to activate your account and access your student dashboard.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Best regards,\n"
        f"StudentHub Team"
    )
    html_message = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 22px; font-weight: 800;">StudentHub Ethiopia</h2>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Academic Resource Sharing Platform</p>
      </div>
      <div style="padding: 24px 20px; background: #f0f7ff; border-radius: 12px; text-align: center; margin-bottom: 20px; border: 1px solid #dbeafe;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">Your 6-digit email verification code:</p>
        <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; font-family: monospace; padding: 10px 0;">
          {otp_code}
        </div>
        <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">Expires in 10 minutes</p>
      </div>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
        Enter this verification code on the registration screen to verify your email address and unlock access to the Student Dashboard, lecture notes, and university library.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
        If you did not initiate this registration, please ignore this message.
      </p>
    </div>
    """
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None) or 'StudentHub <noreply@studenthub.et>'
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[OTP Email] Successfully delivered 6-digit OTP to {email} via {settings.EMAIL_BACKEND}")
        return True
    except Exception as e:
        print(f"[OTP Email Error] Failed to send email to {email}: {e}")
        return False

def store_otp(email, code, user_id=None, validity_minutes=10):
    email = email.strip().lower()
    code = str(code).strip()
    cache_key = f"reg_otp_{email}"
    expires_at = timezone.now() + timedelta(minutes=validity_minutes)
    
    # Cache layer
    cache.set(cache_key, {
        'otp': code,
        'user_id': user_id,
        'expires_at': expires_at.isoformat()
    }, timeout=validity_minutes * 60)
    
    # DB layer
    try:
        user = User.objects.filter(id=user_id).first() if user_id else None
        EmailOTP.objects.filter(email__iexact=email, is_used=False).update(is_used=True)
        EmailOTP.objects.create(
            user=user,
            email=email,
            otp=code,
            expires_at=expires_at
        )
    except Exception as e:
        print(f"[store_otp DB notice] {e}")

def verify_stored_otp(email, code):
    email = email.strip().lower()
    code = str(code).strip()

    # 1. Check DB first
    try:
        now = timezone.now()
        otp_obj = EmailOTP.objects.filter(
            email__iexact=email,
            otp=code,
            is_used=False,
            expires_at__gte=now
        ).order_by('-created_at').first()
        if otp_obj:
            otp_obj.is_used = True
            otp_obj.save(update_fields=['is_used'])
            cache.delete(f"reg_otp_{email}")
            return True, otp_obj.user
    except Exception as e:
        print(f"[verify_stored_otp DB check] {e}")

    # 2. Check Cache fallback
    cache_key = f"reg_otp_{email}"
    cached = cache.get(cache_key)
    if cached and cached.get('otp') == code:
        cache.delete(cache_key)
        user_id = cached.get('user_id')
        user = User.objects.filter(id=user_id).first() if user_id else None
        return True, user

    return False, None

class RegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()

        has_smtp = bool(getattr(settings, 'EMAIL_HOST_USER', '') and getattr(settings, 'EMAIL_HOST_PASSWORD', ''))
        # If user exists but is NOT verified, resend OTP
        existing_unverified = User.objects.filter(email__iexact=email, is_email_verified=False).first()
        if existing_unverified:
            code = f"{random.randint(100000, 999999)}"
            store_otp(email, code, user_id=existing_unverified.id)
            sent = send_otp_email(email, code)
            return Response({
                'require_otp': True,
                'email': email,
                'message': f'Verification code sent to {email}. Please enter the 6-digit code to access your dashboard.',
                'email_sent': sent
            }, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_email_verified = False
        user.save(update_fields=['is_email_verified'])

        # Generate 6-digit OTP and send via email
        code = f"{random.randint(100000, 999999)}"
        store_otp(email, code, user_id=user.id)
        sent = send_otp_email(email, code)

        return Response({
            'require_otp': True,
            'email': user.email,
            'message': f'Registration successful! A 6-digit verification code has been sent to {user.email}.',
            'email_sent': sent
        }, status=status.HTTP_201_CREATED)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = str(request.data.get('otp', '')).strip()

        if not email or not otp:
            return Response(
                {'message': 'Both email and 6-digit verification code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(otp) != 6 or not otp.isdigit():
            return Response(
                {'message': 'Please enter a valid 6-digit code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, user = verify_stored_otp(email, otp)
        if not is_valid:
            return Response(
                {'message': 'Invalid or expired 6-digit verification code. Please check your email or request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user:
            user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response(
                {'message': 'User account not found for this email address.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Mark user as verified and active
        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=['is_email_verified', 'is_active'])

        # Log into session
        login(request, user)

        # Get or create auth token
        token_key = None
        try:
            from rest_framework.authtoken.models import Token
            token, _ = Token.objects.get_or_create(user=user)
            token_key = token.key
        except Exception:
            pass

        return Response({
            'user': UserProfileSerializer(user).data,
            'token': token_key,
            'message': 'Email verified successfully! Welcome to StudentHub.'
        }, status=status.HTTP_200_OK)

class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'message': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'message': 'No registered account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({'message': 'This account is already verified. You can log in directly.'}, status=status.HTTP_400_BAD_REQUEST)

        code = f"{random.randint(100000, 999999)}"
        store_otp(email, code, user_id=user.id)
        sent = send_otp_email(email, code)

        return Response({
            'message': f'A new 6-digit verification code has been sent to {email}.',
            'email_sent': sent
        }, status=status.HTTP_200_OK)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = UserLoginSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': _get_auth_token(user),
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)

class GoogleOAuthView(APIView):
    """
    Google OAuth login/signup handler.
    Supports both direct browser redirect callback (GET with ?code=...)
    and frontend SPA API authentication requests (POST).
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        code = request.GET.get('code')
        error = request.GET.get('error')
        from django.shortcuts import redirect
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')

        if error:
            return redirect(f'{frontend_url}/login?error=' + error)
        if not code:
            return redirect(f'{frontend_url}/login')

        token_data = self._exchange_code(code)
        if not token_data:
            return redirect(f'{frontend_url}/login?error=token_exchange_failed')

        user, is_new = self._process_google_auth(
            request=request,
            token=token_data.get('id_token') or token_data.get('access_token'),
            email=None
        )
        if user:
            return redirect(f'{frontend_url}/dashboard')
        return redirect(f'{frontend_url}/login?error=auth_failed')

    def post(self, request):
        code = request.data.get('code')
        token = request.data.get('credential') or request.data.get('token') or request.data.get('access_token')
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        picture = request.data.get('picture')

        if code and not token:
            token_data = self._exchange_code(code)
            if token_data:
                token = token_data.get('id_token') or token_data.get('access_token')

        user, is_new = self._process_google_auth(
            request=request,
            token=token,
            email=email,
            first_name=first_name,
            last_name=last_name,
            picture=picture
        )

        if not user:
            return Response({'message': 'Unable to complete Google authentication.'}, status=status.HTTP_400_BAD_REQUEST)

        requires_onboarding = not bool(user.university_name or user.university) or not bool(user.department_name or user.department) or not bool(user.year_of_study)
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': _get_auth_token(user),
            'is_new_user': is_new,
            'requires_onboarding': requires_onboarding,
            'message': 'Google authentication successful'
        }, status=status.HTTP_200_OK)

    def _exchange_code(self, code):
        from django.conf import settings
        import urllib.request
        import urllib.parse

        token_url = 'https://oauth2.googleapis.com/token'
        data = urllib.parse.urlencode({
            'code': code,
            'client_id': getattr(settings, 'GOOGLE_CLIENT_ID', ''),
            'client_secret': getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
            'redirect_uri': getattr(settings, 'GOOGLE_CALLBACK_URL', 'http://localhost:8000/api/auth/google/'),
            'grant_type': 'authorization_code',
        }).encode('utf-8')

        try:
            req = urllib.request.Request(token_url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception:
            return None

    def _process_google_auth(self, request, token=None, email=None, first_name='', last_name='', picture=None):
        if token:
            try:
                if '.' in token:
                    parts = token.split('.')
                    if len(parts) >= 2:
                        padded = parts[1] + '=' * (-len(parts[1]) % 4)
                        payload = json.loads(base64.urlsafe_b64decode(padded).decode('utf-8'))
                        email = payload.get('email', email)
                        first_name = payload.get('given_name', payload.get('name', first_name))
                        last_name = payload.get('family_name', last_name)
                        picture = payload.get('picture', picture)
                else:
                    import urllib.request
                    req = urllib.request.Request(
                        'https://www.googleapis.com/oauth2/v3/userinfo',
                        headers={'Authorization': f'Bearer {token}'}
                    )
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        user_info = json.loads(resp.read().decode('utf-8'))
                        email = user_info.get('email', email)
                        first_name = user_info.get('given_name', user_info.get('name', first_name))
                        last_name = user_info.get('family_name', last_name)
                        picture = user_info.get('picture', picture)
            except Exception:
                pass

        if not email:
            return None, False

        email = email.lower().strip()
        user = User.objects.filter(email=email).first()
        is_new = False

        if not user:
            is_new = True
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_email_verified=True,
            )
            user.set_unusable_password()
            try:
                user.save()
            except Exception:
                return None, False

        login(request, user)
        return user, is_new

class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [FlexibleTokenAuthentication, CsrfExemptSessionAuthentication]
    
    def post(self, request):
        return self._do_logout(request)

    def get(self, request):
        return self._do_logout(request)

    def _do_logout(self, request):
        # 1. Delete DRF auth token if one exists
        try:
            from rest_framework.authtoken.models import Token
            if request.user and request.user.is_authenticated:
                Token.objects.filter(user=request.user).delete()
        except Exception:
            pass

        # 2. Flush Django server session
        try:
            if hasattr(request, 'session') and request.session:
                request.session.flush()
            if hasattr(request, '_request') and hasattr(request._request, 'session') and request._request.session:
                request._request.session.flush()
        except Exception:
            pass

        # 3. Log out user from Django auth backend
        try:
            if hasattr(request, '_request'):
                logout(request._request)
            logout(request)
        except Exception:
            pass

        # 4. Return response and explicitly delete session & csrf cookies from browser
        from django.conf import settings
        response = Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        response.delete_cookie('sessionid', path='/')
        response.delete_cookie('csrftoken', path='/')
        if getattr(settings, 'SESSION_COOKIE_DOMAIN', None):
            response.delete_cookie('sessionid', domain=settings.SESSION_COOKIE_DOMAIN, path='/')
        if getattr(settings, 'CSRF_COOKIE_DOMAIN', None):
            response.delete_cookie('csrftoken', domain=settings.CSRF_COOKIE_DOMAIN, path='/')

        return response

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [FlexibleTokenAuthentication, CsrfExemptSessionAuthentication]
    
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(None, status=status.HTTP_200_OK)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'message': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            return super().patch(request, *args, **kwargs)
        except DjangoValidationError as e:
            return Response(
                e.message_dict if hasattr(e, 'message_dict') else {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'message': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            return super().put(request, *args, **kwargs)
        except DjangoValidationError as e:
            return Response(
                e.message_dict if hasattr(e, 'message_dict') else {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    """
    Secure password change endpoint for authenticated students.
    Validates current password and updates to new password.
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [FlexibleTokenAuthentication, CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(old_password):
            return Response(
                {'old_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        update_session_auth_hash(request, user)

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class ContactMessageView(APIView):
    """
    Public Contact Form View: receives inquiries from students/visitors
    and sends full message details directly to eyobbegashaw075@gmail.com inbox with reply-to.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        sender_email = (request.data.get('email') or '').strip()
        subject = (request.data.get('subject') or '').strip() or 'General Inquiry'
        message_body = (request.data.get('message') or '').strip()

        if not name or not sender_email or not message_body:
            return Response(
                {'error': 'Name, email, and message are required fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin_recipient = 'eyobbegashaw075@gmail.com'
        email_subject = f"[StudentHub Contact] {subject} (from {name})"

        text_content = (
            f"You received a new inquiry from the StudentHub platform:\n\n"
            f"Sender Name: {name}\n"
            f"Sender Email: {sender_email}\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message_body}\n\n"
            f"---\n"
            f"Click Reply in your email client to respond directly to {sender_email}."
        )

        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">🎓 StudentHub Ethiopia • New Message</h2>
            <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Public Home Page Contact Form</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #4b5563; font-weight: 600; width: 80px;">From:</td>
              <td style="padding: 6px 0; color: #111827;"><strong>{name}</strong> (&lt;<a href="mailto:{sender_email}">{sender_email}</a>&gt;)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Subject:</td>
              <td style="padding: 6px 0; color: #111827;">{subject}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
            <div style="color: #1f2937; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{message_body}</div>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <a href="mailto:{sender_email}?subject=Re: {subject}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block;">
              Reply directly to {name} ({sender_email})
            </a>
          </div>
        </div>
        """

        try:
            from_email = (
                getattr(settings, 'DEFAULT_FROM_EMAIL', None)
                or getattr(settings, 'EMAIL_HOST_USER', None)
                or 'eyobbegashaw075@gmail.com'
            )
            msg = EmailMultiAlternatives(
                subject=email_subject,
                body=text_content,
                from_email=from_email,
                to=[admin_recipient],
                reply_to=[sender_email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            print(f"[Contact Form] Successfully delivered message from {sender_email} to {admin_recipient}")
            return Response(
                {
                    'message': f'Thank you, {name}! Your message has been sent directly to {admin_recipient}. We will get back to you shortly.'
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"[Contact Form Error] Failed to send email to {admin_recipient}: {e}")
            return Response(
                {'error': 'Unable to deliver your message at this time. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
