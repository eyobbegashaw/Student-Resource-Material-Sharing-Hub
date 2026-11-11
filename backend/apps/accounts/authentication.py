from rest_framework.authentication import SessionAuthentication, TokenAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication without CSRF enforcement for REST API SPA requests.
    """
    def enforce_csrf(self, request):
        return


class FlexibleTokenAuthentication(TokenAuthentication):
    """
    Accepts both 'Token <key>' and 'Bearer <key>' Authorization headers
    for seamless cross-origin SPA authentication between Vercel and Render.
    """
    def authenticate(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if auth.startswith('Bearer '):
            token_key = auth.split(' ', 1)[1].strip()
            if not token_key:
                return None
            return self.authenticate_credentials(token_key)
        return super().authenticate(request)
